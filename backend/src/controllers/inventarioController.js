const InventarioModel = require('../models/inventarioModel');

const getAllInventarios = async (req, res) => {
  try {
    const { id_almacen, id_producto, stock_bajo } = req.query;
    const filtros = {};
    if (id_almacen) filtros.id_almacen = parseInt(id_almacen);
    if (id_producto) filtros.id_producto = parseInt(id_producto);
    if (stock_bajo === 'true') filtros.stock_bajo = true;
    
    const inventarios = await InventarioModel.getAll(filtros);
    res.json({ success: true, count: inventarios.length, data: inventarios });
  } catch (error) {
    console.error('Error en getAllInventarios:', error);
    res.status(500).json({ success: false, message: 'Error al obtener inventarios', error: error.message });
  }
};

const getInventarioById = async (req, res) => {
  try {
    const { id } = req.params;
    const inventario = await InventarioModel.getById(id);
    if (!inventario) {
      return res.status(404).json({ success: false, message: 'Inventario no encontrado' });
    }
    res.json({ success: true, data: inventario });
  } catch (error) {
    console.error('Error en getInventarioById:', error);
    res.status(500).json({ success: false, message: 'Error al obtener inventario', error: error.message });
  }
};

const createInventario = async (req, res) => {
  try {
    const { id_producto, id_almacen, cantidad, stock_minimo, stock_maximo } = req.body;
    
    if (!id_producto || !id_almacen) {
      return res.status(400).json({ success: false, message: 'id_producto e id_almacen son requeridos' });
    }

    const existe = await InventarioModel.getByProductoAlmacen(id_producto, id_almacen);
    if (existe) {
      return res.status(400).json({ success: false, message: 'El producto ya existe en este almacén' });
    }

    const inventarioData = { id_producto, id_almacen, cantidad, stock_minimo, stock_maximo };
    const nuevoInventario = await InventarioModel.create(inventarioData);
    
    res.status(201).json({ success: true, message: 'Inventario creado exitosamente', data: nuevoInventario });
  } catch (error) {
    console.error('Error en createInventario:', error);
    res.status(500).json({ success: false, message: 'Error al crear inventario', error: error.message });
  }
};

const updateInventario = async (req, res) => {
  try {
    const { id } = req.params;
    const inventarioData = req.body;
    
    const inventarioExistente = await InventarioModel.getById(id);
    if (!inventarioExistente) {
      return res.status(404).json({ success: false, message: 'Inventario no encontrado' });
    }

    const inventarioActualizado = await InventarioModel.update(id, inventarioData);
    res.json({ success: true, message: 'Inventario actualizado exitosamente', data: inventarioActualizado });
  } catch (error) {
    console.error('Error en updateInventario:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar inventario', error: error.message });
  }
};

const ajustarStock = async (req, res) => {
  try {
    const { id_producto, id_almacen, cantidad, operacion } = req.body;

    if (!id_producto || !id_almacen || !cantidad || !operacion) {
      return res.status(400).json({ 
        success: false, 
        message: 'id_producto, id_almacen, cantidad y operacion son requeridos' 
      });
    }

    if (!['suma', 'resta'].includes(operacion)) {
      return res.status(400).json({ success: false, message: 'Operación debe ser "suma" o "resta"' });
    }

    if (cantidad <= 0) {
      return res.status(400).json({ success: false, message: 'La cantidad debe ser mayor a 0' });
    }

    const inventarioExistente = await InventarioModel.getByProductoAlmacen(id_producto, id_almacen);
    if (!inventarioExistente) {
      return res.status(404).json({ success: false, message: 'Producto no existe en este almacén' });
    }

    if (operacion === 'resta' && inventarioExistente.cantidad < cantidad) {
      return res.status(400).json({ success: false, message: 'Stock insuficiente' });
    }

    const inventarioActualizado = await InventarioModel.ajustarStock(id_producto, id_almacen, cantidad, operacion);
    res.json({ success: true, message: 'Stock ajustado exitosamente', data: inventarioActualizado });
  } catch (error) {
    console.error('Error en ajustarStock:', error);
    res.status(500).json({ success: false, message: 'Error al ajustar stock', error: error.message });
  }
};

const deleteInventario = async (req, res) => {
  try {
    const { id } = req.params;
    
    const inventarioExistente = await InventarioModel.getById(id);
    if (!inventarioExistente) {
      return res.status(404).json({ success: false, message: 'Inventario no encontrado' });
    }

    await InventarioModel.delete(id);
    res.json({ success: true, message: 'Inventario eliminado exitosamente' });
  } catch (error) {
    console.error('Error en deleteInventario:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar inventario', error: error.message });
  }
};

const getStockBajo = async (req, res) => {
  try {
    const productos = await InventarioModel.getStockBajo();
    res.json({ success: true, count: productos.length, data: productos });
  } catch (error) {
    console.error('Error en getStockBajo:', error);
    res.status(500).json({ success: false, message: 'Error al obtener productos con stock bajo', error: error.message });
  }
};

// ===== NUEVAS FUNCIONES PARA MOVIMIENTOS MANUALES =====

const registrarMovimientoManual = async (req, res) => {
  try {
    const { tipo, id_producto, id_almacen, cantidad, costo_unitario, motivo } = req.body;
    const id_usuario = req.user.id_usuario;

    // Validaciones
    if (!tipo || !['ingreso', 'egreso'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: 'El tipo debe ser "ingreso" o "egreso"'
      });
    }

    if (!id_producto) {
      return res.status(400).json({
        success: false,
        message: 'El producto es requerido'
      });
    }

    if (!id_almacen) {
      return res.status(400).json({
        success: false,
        message: 'El almacén es requerido'
      });
    }

    if (!cantidad || cantidad <= 0) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad debe ser mayor a 0'
      });
    }

    if (!motivo || motivo.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El motivo es requerido'
      });
    }

    const movimientoData = {
      tipo,
      id_producto,
      id_almacen,
      cantidad,
      costo_unitario: costo_unitario || 0,
      motivo: motivo.trim(),
      id_usuario
    };

    const movimiento = await InventarioModel.registrarMovimientoManual(movimientoData);

    res.status(201).json({
      success: true,
      message: `Movimiento de ${tipo} registrado exitosamente`,
      data: movimiento
    });
  } catch (error) {
    console.error('Error en registrarMovimientoManual:', error);
    
    if (error.message.includes('Stock insuficiente')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al registrar movimiento',
      error: error.message
    });
  }
};

const getMovimientos = async (req, res) => {
  try {
    const { tipo, id_producto, id_almacen, motivo, fecha_desde, fecha_hasta, solo_manuales, limit } = req.query;
    
    const filtros = {};
    if (tipo) filtros.tipo = tipo;
    if (id_producto) filtros.id_producto = id_producto;
    if (id_almacen) filtros.id_almacen = id_almacen;
    if (motivo) filtros.motivo = motivo;
    if (fecha_desde) filtros.fecha_desde = fecha_desde;
    if (fecha_hasta) filtros.fecha_hasta = fecha_hasta;
    if (solo_manuales) filtros.solo_manuales = solo_manuales === 'true';
    if (limit) filtros.limit = parseInt(limit);

    const movimientos = await InventarioModel.getMovimientos(filtros);

    res.json({
      success: true,
      count: movimientos.length,
      data: movimientos
    });
  } catch (error) {
    console.error('Error en getMovimientos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener movimientos',
      error: error.message
    });
  }
};

const getMovimientoById = async (req, res) => {
  try {
    const { id } = req.params;
    const movimiento = await InventarioModel.getMovimientoById(id);

    if (!movimiento) {
      return res.status(404).json({
        success: false,
        message: 'Movimiento no encontrado'
      });
    }

    res.json({
      success: true,
      data: movimiento
    });
  } catch (error) {
    console.error('Error en getMovimientoById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener movimiento',
      error: error.message
    });
  }
};

module.exports = {
  getAllInventarios,
  getInventarioById,
  createInventario,
  updateInventario,
  ajustarStock,
  deleteInventario,
  getStockBajo,
  // Nuevas funciones
  registrarMovimientoManual,
  getMovimientos,
  getMovimientoById
};