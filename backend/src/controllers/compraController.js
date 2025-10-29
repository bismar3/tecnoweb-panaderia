const CompraModel = require('../models/compraModel');

// Listar todas las compras
const getAll = async (req, res) => {
  try {
    const { estado, id_proveedor, fecha_desde, fecha_hasta } = req.query;
    
    const filtros = {};
    if (estado) filtros.estado = estado;
    if (id_proveedor) filtros.id_proveedor = parseInt(id_proveedor);
    if (fecha_desde) filtros.fecha_desde = fecha_desde;
    if (fecha_hasta) filtros.fecha_hasta = fecha_hasta;

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
    const { id_proveedor, id_almacen, impuestos, observaciones, estado, detalles } = req.body;
    const id_usuario = req.user.id_usuario;

    // Validaciones
    if (!id_almacen) {
      return res.status(400).json({
        success: false,
        message: 'El almacén es requerido'
      });
    }

    if (!detalles || detalles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe incluir al menos un producto en la compra'
      });
    }

    for (const detalle of detalles) {
      if (!detalle.id_producto || !detalle.cantidad || !detalle.costo_unitario) {
        return res.status(400).json({
          success: false,
          message: 'Cada detalle debe tener: id_producto, cantidad y costo_unitario'
        });
      }

      if (detalle.cantidad <= 0) {
        return res.status(400).json({
          success: false,
          message: 'La cantidad debe ser mayor a 0'
        });
      }

      if (detalle.costo_unitario <= 0) {
        return res.status(400).json({
          success: false,
          message: 'El costo unitario debe ser mayor a 0'
        });
      }
    }

    const compraData = {
      id_proveedor,
      impuestos: impuestos || 0,
      observaciones,
      estado: estado || 'pendiente'
    };

    const nuevaCompra = await CompraModel.create(compraData, detalles, id_usuario, id_almacen);

    res.status(201).json({
      success: true,
      message: 'Compra registrada exitosamente. Inventario actualizado.',
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
    const { estado, observaciones, impuestos } = req.body;

    const compraExiste = await CompraModel.getById(id);
    if (!compraExiste) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    const compraData = {
      estado,
      observaciones,
      impuestos
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

    if (!estado) {
      return res.status(400).json({
        success: false,
        message: 'El estado es requerido'
      });
    }

    const estadosValidos = ['pendiente', 'recibido', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Válidos: ${estadosValidos.join(', ')}`
      });
    }

    const compraActualizada = await CompraModel.updateEstado(id, estado);

    if (!compraActualizada) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
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
      message: 'Error al cancelar compra',
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