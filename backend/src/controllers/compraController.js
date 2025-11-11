const CompraModel = require('../models/compraModel');

// Listar todas las compras con filtros mejorados
const getAll = async (req, res) => {
  try {
    const { estado, id_proveedor, fecha_desde, fecha_hasta, numero_factura } = req.query;
    
    const filtros = {};
    if (estado) filtros.estado = estado;
    if (id_proveedor) filtros.id_proveedor = parseInt(id_proveedor);
    if (fecha_desde) filtros.fecha_desde = fecha_desde;
    if (fecha_hasta) filtros.fecha_hasta = fecha_hasta;
    if (numero_factura) filtros.numero_factura = numero_factura;

    const compras = await CompraModel.getAll(filtros);

    res.json({
      success: true,
      count: compras.length,
      data: compras
    });
  } catch (error) {
    console.error('Error en getAll compras:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener compras',
      error: error.message
    });
  }
};

// Obtener compra por ID
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const compra = await CompraModel.getById(id);

    if (!compra) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    res.json({
      success: true,
      data: compra
    });
  } catch (error) {
    console.error('Error en getById compra:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener compra',
      error: error.message
    });
  }
};

// Crear compra
const create = async (req, res) => {
  try {
    const { 
      id_proveedor, 
      id_almacen, 
      impuestos_adicionales, 
      observaciones, 
      estado, 
      detalles,
      numero_factura,
      fecha_factura,
      serie_factura,
      forma_pago,
      condicion_pago
    } = req.body;
    
    const id_usuario = req.user.id_usuario;

    // Validaciones básicas
    if (!id_almacen) {
      return res.status(400).json({
        success: false,
        message: 'El almacén destino es requerido'
      });
    }

    if (!detalles || detalles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe incluir al menos un ingrediente en la compra'
      });
    }

    // Validar cada detalle
    for (const detalle of detalles) {
      if (!detalle.id_ingrediente || !detalle.cantidad || !detalle.costo_unitario) {
        return res.status(400).json({
          success: false,
          message: 'Cada detalle debe tener: id_ingrediente, cantidad y costo_unitario'
        });
      }

      if (parseFloat(detalle.cantidad) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'La cantidad debe ser mayor a 0'
        });
      }

      if (parseFloat(detalle.costo_unitario) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'El costo unitario debe ser mayor a 0'
        });
      }

      // Validar descuentos si existen
      if (detalle.descuento_porcentaje && (detalle.descuento_porcentaje < 0 || detalle.descuento_porcentaje > 100)) {
        return res.status(400).json({
          success: false,
          message: 'El descuento porcentual debe estar entre 0 y 100'
        });
      }
    }

    // Validar que si hay factura, tenga número
    if (fecha_factura && !numero_factura) {
      return res.status(400).json({
        success: false,
        message: 'Si proporciona fecha de factura, debe incluir el número de factura'
      });
    }

    const compraData = {
      id_proveedor: id_proveedor || null,
      id_almacen: parseInt(id_almacen),
      impuestos_adicionales: parseFloat(impuestos_adicionales) || 0,
      observaciones,
      estado: estado || 'borrador',
      numero_factura,
      fecha_factura,
      serie_factura,
      forma_pago,
      condicion_pago
    };

    const nuevaCompra = await CompraModel.create(compraData, detalles, id_usuario);

    const mensaje = estado === 'recibida' 
      ? 'Compra registrada exitosamente. Inventario actualizado.'
      : 'Compra registrada como borrador. Cambie el estado a "recibida" para actualizar inventario.';

    res.status(201).json({
      success: true,
      message: mensaje,
      data: nuevaCompra
    });
  } catch (error) {
    console.error('Error en create compra:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear compra',
      error: error.message
    });
  }
};

// Actualizar compra
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      estado, 
      observaciones, 
      numero_factura, 
      fecha_factura, 
      serie_factura,
      forma_pago,
      condicion_pago
    } = req.body;

    const compraExiste = await CompraModel.getById(id);
    if (!compraExiste) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    // No permitir editar compras ya pagadas
    if (compraExiste.estado === 'pagada') {
      return res.status(400).json({
        success: false,
        message: 'No se puede modificar una compra ya pagada'
      });
    }

    const compraData = {
      estado,
      observaciones,
      numero_factura,
      fecha_factura,
      serie_factura,
      forma_pago,
      condicion_pago
    };

    const compraActualizada = await CompraModel.update(id, compraData);

    res.json({
      success: true,
      message: 'Compra actualizada exitosamente',
      data: compraActualizada
    });
  } catch (error) {
    console.error('Error en update compra:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar compra',
      error: error.message
    });
  }
};

// Cambiar estado de la compra
const updateEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const id_usuario = req.user.id_usuario;

    if (!estado) {
      return res.status(400).json({
        success: false,
        message: 'El estado es requerido'
      });
    }

    const estadosValidos = ['borrador', 'pendiente', 'recibida', 'facturada', 'pagada', 'cancelada'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Válidos: ${estadosValidos.join(', ')}`
      });
    }

    const compraExiste = await CompraModel.getById(id);
    if (!compraExiste) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    // Validar transiciones de estado
    if (compraExiste.estado === 'cancelada') {
      return res.status(400).json({
        success: false,
        message: 'No se puede cambiar el estado de una compra cancelada'
      });
    }

    if (compraExiste.estado === 'pagada' && estado !== 'pagada') {
      return res.status(400).json({
        success: false,
        message: 'No se puede revertir una compra pagada'
      });
    }

    // Si se está marcando como facturada, verificar que tenga número de factura
    if (estado === 'facturada' && !compraExiste.numero_factura) {
      return res.status(400).json({
        success: false,
        message: 'Debe registrar el número de factura antes de marcar como facturada'
      });
    }

    const compraActualizada = await CompraModel.updateEstado(id, estado, id_usuario);

    let mensaje = 'Estado actualizado exitosamente';
    if (estado === 'recibida') {
      mensaje = 'Compra marcada como recibida. Inventario actualizado.';
    } else if (estado === 'facturada') {
      mensaje = 'Compra marcada como facturada.';
    } else if (estado === 'pagada') {
      mensaje = 'Compra marcada como pagada.';
    }

    res.json({
      success: true,
      message: mensaje,
      data: compraActualizada
    });
  } catch (error) {
    console.error('Error en updateEstado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado',
      error: error.message
    });
  }
};

// Cancelar compra
const deleteCompra = async (req, res) => {
  try {
    const { id } = req.params;

    const compraExiste = await CompraModel.getById(id);
    if (!compraExiste) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    if (compraExiste.estado === 'pagada') {
      return res.status(400).json({
        success: false,
        message: 'No se puede cancelar una compra ya pagada'
      });
    }

    if (compraExiste.estado === 'recibida') {
      return res.status(400).json({
        success: false,
        message: 'No se puede cancelar una compra ya recibida. El inventario ya fue actualizado.'
      });
    }

    const compraCancelada = await CompraModel.delete(id);

    res.json({
      success: true,
      message: 'Compra cancelada exitosamente',
      data: compraCancelada
    });
  } catch (error) {
    console.error('Error en delete compra:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al cancelar compra',
      error: error.message
    });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  updateEstado,
  deleteCompra
};