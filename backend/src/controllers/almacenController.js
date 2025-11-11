// ===== ALMACEN CONTROLLER - VERSIÓN MEJORADA =====
const AlmacenModel = require('../models/almacenModel');

const getAllAlmacenes = async (req, res) => {
  try {
    const { estado, tipo_almacen } = req.query;
    const filtros = {};
    
    if (estado !== undefined) filtros.estado = estado === 'true';
    if (tipo_almacen) filtros.tipo_almacen = tipo_almacen;
    
    const almacenes = await AlmacenModel.getAll(filtros);
    res.json({ success: true, count: almacenes.length, data: almacenes });
  } catch (error) {
    console.error('Error en getAllAlmacenes:', error);
    res.status(500).json({ success: false, message: 'Error al obtener almacenes', error: error.message });
  }
};

const getAlmacenById = async (req, res) => {
  try {
    const { id } = req.params;
    const almacen = await AlmacenModel.getById(id);
    if (!almacen) {
      return res.status(404).json({ success: false, message: 'Almacén no encontrado' });
    }
    res.json({ success: true, data: almacen });
  } catch (error) {
    console.error('Error en getAlmacenById:', error);
    res.status(500).json({ success: false, message: 'Error al obtener almacén', error: error.message });
  }
};

const createAlmacen = async (req, res) => {
  try {
    const { nombre, ubicacion, capacidad_maxima, tipo_almacen, temperatura, unidad_medida, notas } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ success: false, message: 'El nombre es requerido' });
    }

    const almacenData = { 
      nombre, 
      ubicacion, 
      capacidad_maxima, 
      tipo_almacen, 
      temperatura, 
      unidad_medida,
      notas 
    };
    
    const nuevoAlmacen = await AlmacenModel.create(almacenData);
    res.status(201).json({ 
      success: true, 
      message: 'Almacén creado exitosamente', 
      data: nuevoAlmacen 
    });
  } catch (error) {
    console.error('Error en createAlmacen:', error);
    res.status(500).json({ success: false, message: 'Error al crear almacén', error: error.message });
  }
};

const updateAlmacen = async (req, res) => {
  try {
    const { id } = req.params;
    const almacenData = req.body;
    
    const almacenExistente = await AlmacenModel.getById(id);
    if (!almacenExistente) {
      return res.status(404).json({ success: false, message: 'Almacén no encontrado' });
    }
    
    const almacenActualizado = await AlmacenModel.update(id, almacenData);
    res.json({ 
      success: true, 
      message: 'Almacén actualizado exitosamente', 
      data: almacenActualizado 
    });
  } catch (error) {
    console.error('Error en updateAlmacen:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar almacén', error: error.message });
  }
};

const deleteAlmacen = async (req, res) => {
  try {
    const { id } = req.params;
    
    const almacenExistente = await AlmacenModel.getById(id);
    if (!almacenExistente) {
      return res.status(404).json({ success: false, message: 'Almacén no encontrado' });
    }
    
    await AlmacenModel.delete(id);
    res.json({ success: true, message: 'Almacén desactivado exitosamente' });
  } catch (error) {
    console.error('Error en deleteAlmacen:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar almacén', error: error.message });
  }
};

const getProductosAlmacen = async (req, res) => {
  try {
    const { id } = req.params;
    const productos = await AlmacenModel.getProductos(id);
    res.json({ success: true, count: productos.length, data: productos });
  } catch (error) {
    console.error('Error en getProductosAlmacen:', error);
    res.status(500).json({ success: false, message: 'Error al obtener productos del almacén', error: error.message });
  }
};

// NUEVAS FUNCIONES

const getInventarioAlmacen = async (req, res) => {
  try {
    const { id } = req.params;
    const inventario = await AlmacenModel.getInventario(id);
    res.json({ success: true, count: inventario.length, data: inventario });
  } catch (error) {
    console.error('Error en getInventarioAlmacen:', error);
    res.status(500).json({ success: false, message: 'Error al obtener inventario', error: error.message });
  }
};

const getHistorialAlmacen = async (req, res) => {
  try {
    const { id } = req.params;
    const { limite } = req.query;
    const historial = await AlmacenModel.getHistorial(id, limite || 50);
    res.json({ success: true, count: historial.length, data: historial });
  } catch (error) {
    console.error('Error en getHistorialAlmacen:', error);
    res.status(500).json({ success: false, message: 'Error al obtener historial', error: error.message });
  }
};

const bloquearAlmacen = async (req, res) => {
  try {
    const { id } = req.params;
    const { bloquear } = req.body;
    
    const almacenExistente = await AlmacenModel.getById(id);
    if (!almacenExistente) {
      return res.status(404).json({ success: false, message: 'Almacén no encontrado' });
    }
    
    const resultado = await AlmacenModel.toggleBloqueo(id, bloquear !== false);
    res.json({ 
      success: true, 
      message: bloquear !== false ? 'Almacén bloqueado' : 'Almacén desbloqueado',
      data: resultado 
    });
  } catch (error) {
    console.error('Error en bloquearAlmacen:', error);
    res.status(500).json({ success: false, message: 'Error al bloquear/desbloquear almacén', error: error.message });
  }
};

const validarCapacidadAlmacen = async (req, res) => {
  try {
    const { id } = req.params;
    const { volumen } = req.body;
    
    if (!volumen || volumen <= 0) {
      return res.status(400).json({ success: false, message: 'Volumen requerido debe ser mayor a 0' });
    }
    
    const validacion = await AlmacenModel.validarCapacidad(id, volumen);
    res.json({ success: true, data: validacion });
  } catch (error) {
    console.error('Error en validarCapacidadAlmacen:', error);
    res.status(500).json({ success: false, message: 'Error al validar capacidad', error: error.message });
  }
};

const recalcularOcupacion = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await AlmacenModel.recalcularOcupacion(id);
    res.json({ 
      success: true, 
      message: 'Ocupación recalculada',
      data: resultado 
    });
  } catch (error) {
    console.error('Error en recalcularOcupacion:', error);
    res.status(500).json({ success: false, message: 'Error al recalcular ocupación', error: error.message });
  }
};

const getTiposAlmacen = async (req, res) => {
  try {
    const tipos = await AlmacenModel.getTiposAlmacen();
    res.json({ success: true, data: tipos });
  } catch (error) {
    console.error('Error en getTiposAlmacen:', error);
    res.status(500).json({ success: false, message: 'Error al obtener tipos de almacén', error: error.message });
  }
};

const getRangosTemperatura = async (req, res) => {
  try {
    const rangos = await AlmacenModel.getRangosTemperatura();
    res.json({ success: true, data: rangos });
  } catch (error) {
    console.error('Error en getRangosTemperatura:', error);
    res.status(500).json({ success: false, message: 'Error al obtener rangos de temperatura', error: error.message });
  }
};

module.exports = {
  // Funciones existentes
  getAllAlmacenes,
  getAlmacenById,
  createAlmacen,
  updateAlmacen,
  deleteAlmacen,
  getProductosAlmacen,
  
  // Nuevas funciones
  getInventarioAlmacen,
  getHistorialAlmacen,
  bloquearAlmacen,
  validarCapacidadAlmacen,
  recalcularOcupacion,
  getTiposAlmacen,
  getRangosTemperatura
};