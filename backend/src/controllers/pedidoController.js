const PedidoModel = require('../models/pedidoModel');
const pool = require('../config/database');

const getAll = async (req, res) => {
  try {
    const { estado, id_cliente, fecha_desde, fecha_hasta } = req.query;
    
    const filtros = {};
    if (estado) filtros.estado = estado;
    if (id_cliente) filtros.id_cliente = id_cliente;
    if (fecha_desde) filtros.fecha_desde = fecha_desde;
    if (fecha_hasta) filtros.fecha_hasta = fecha_hasta;

    const pedidos = await PedidoModel.getAll(filtros);

    res.json({
      success: true,
      count: pedidos.length,
      data: pedidos
    });
  } catch (error) {
    console.error('Error en getAll pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos',
      error: error.message
    });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await PedidoModel.getById(id);

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    res.json({
      success: true,
      data: pedido
    });
  } catch (error) {
    console.error('Error en getById pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedido',
      error: error.message
    });
  }
};

// Nuevo: Obtener items del carrito para preview antes de crear pedido
const getItemsCarrito = async (req, res) => {
  try {
    const { id_usuario } = req.user; // Del token JWT

    const items = await PedidoModel.getItemsCarrito(id_usuario);

    if (items.length === 0) {
      return res.json({
        success: true,
        count: 0,
        total: 0,
        data: [],
        mensaje: 'El carrito está vacío'
      });
    }

    const total = items.reduce((sum, item) => {
      return sum + (parseFloat(item.cantidad) * parseFloat(item.precio_unitario));
    }, 0);

    res.json({
      success: true,
      count: items.length,
      total: total,
      data: items
    });
  } catch (error) {
    console.error('Error en getItemsCarrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener items del carrito',
      error: error.message
    });
  }
};

const create = async (req, res) => {
  try {
    const { 
      id_almacen, 
      fecha_entrega_estimada, 
      observaciones, 
      descuento, 
      detalles,
      latitud,
      longitud,
      direccion_entrega,
      desde_carrito = false 
    } = req.body;
    
    const id_usuario = req.user.id_usuario;
    
    // Obtener id_cliente del token (ya viene incluido desde el login/register)
    let id_cliente = req.user.id_cliente;

    // Si no viene en el token, buscar en la base de datos
    if (!id_cliente) {
      const clienteResult = await pool.query(
        'SELECT id_cliente FROM clientes WHERE id_usuario = $1',
        [id_usuario]
      );

      if (clienteResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Usuario no tiene un perfil de cliente. Contacte al administrador.'
        });
      }

      id_cliente = clienteResult.rows[0].id_cliente;
    }

    // Validación: id_almacen
    if (!id_almacen) {
      return res.status(400).json({
        success: false,
        message: 'El almacén es requerido'
      });
    }

    if (!id_almacen) {
      return res.status(400).json({
        success: false,
        message: 'El almacén es requerido'
      });
    }

    // Si NO viene desde carrito, validar detalles manuales
    if (!desde_carrito) {
      if (!detalles || detalles.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debe incluir al menos un producto o usar el carrito'
        });
      }

      for (const detalle of detalles) {
        if (!detalle.id_producto || !detalle.cantidad || !detalle.precio_unitario) {
          return res.status(400).json({
            success: false,
            message: 'Cada detalle debe tener: id_producto, cantidad y precio_unitario'
          });
        }

        if (detalle.cantidad <= 0) {
          return res.status(400).json({
            success: false,
            message: 'La cantidad debe ser mayor a 0'
          });
        }
      }
    }

    // Validar ubicación
    if (!latitud || !longitud) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar la ubicación de entrega (latitud y longitud)'
      });
    }

    const pedidoData = {
      id_cliente,
      id_almacen,
      id_usuario,
      fecha_entrega_estimada,
      observaciones,
      descuento: descuento || 0,
      detalles: desde_carrito ? [] : detalles,
      latitud,
      longitud,
      direccion_entrega,
      desde_carrito
    };

    const nuevoPedido = await PedidoModel.create(pedidoData);

    res.status(201).json({
      success: true,
      message: desde_carrito 
        ? 'Pedido creado desde carrito. El carrito se vació automáticamente. QR generado para pago.'
        : 'Pedido creado. QR generado para pago.',
      data: nuevoPedido
    });
  } catch (error) {
    console.error('Error en create pedido:', error);
    
    if (error.message.includes('Stock insuficiente') || 
        error.message.includes('no existe en el almacén') ||
        error.message.includes('carrito está vacío')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear pedido',
      error: error.message
    });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      fecha_entrega_estimada, 
      estado, 
      observaciones, 
      descuento, 
      detalles,
      latitud,
      longitud,
      direccion_entrega 
    } = req.body;

    const pedidoExiste = await PedidoModel.getById(id);
    if (!pedidoExiste) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    if (detalles) {
      if (detalles.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debe incluir al menos un producto'
        });
      }

      for (const detalle of detalles) {
        if (!detalle.id_producto || !detalle.cantidad || !detalle.precio_unitario) {
          return res.status(400).json({
            success: false,
            message: 'Cada detalle debe tener: id_producto, cantidad y precio_unitario'
          });
        }

        if (detalle.cantidad <= 0) {
          return res.status(400).json({
            success: false,
            message: 'La cantidad debe ser mayor a 0'
          });
        }
      }
    }

    const pedidoActualizado = await PedidoModel.update(id, {
      fecha_entrega_estimada,
      estado,
      observaciones,
      descuento,
      detalles,
      latitud,
      longitud,
      direccion_entrega
    });

    res.json({
      success: true,
      message: 'Pedido actualizado',
      data: pedidoActualizado
    });
  } catch (error) {
    console.error('Error en update pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar pedido',
      error: error.message
    });
  }
};

const deleteDetalle = async (req, res) => {
  try {
    const { id, id_detalle } = req.params;

    const pedidoExiste = await PedidoModel.getById(id);
    if (!pedidoExiste) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    await PedidoModel.deleteDetalle(id, id_detalle);

    res.json({
      success: true,
      message: 'Detalle eliminado'
    });
  } catch (error) {
    console.error('Error en deleteDetalle:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar detalle',
      error: error.message
    });
  }
};

const cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) {
      return res.status(400).json({
        success: false,
        message: 'El estado es requerido'
      });
    }

    const estadosValidos = ['pendiente', 'pagado', 'confirmado', 'en_preparacion', 'enviado', 'completado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Válidos: ${estadosValidos.join(', ')}`
      });
    }

    const pedidoActualizado = await PedidoModel.cambiarEstado(id, estado);

    res.json({
      success: true,
      message: 'Estado actualizado. El inventario se ajustó automáticamente.',
      data: pedidoActualizado
    });
  } catch (error) {
    console.error('Error en cambiarEstado:', error);
    
    if (error.message.includes('No se puede cambiar') || 
        error.message.includes('Stock insuficiente')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado',
      error: error.message
    });
  }
};

module.exports = {
  getAll,
  getById,
  getItemsCarrito,
  create,
  update,
  deleteDetalle,
  cambiarEstado
};