const AlmacenModel = require('../models/almacenModel');

const getAllAlmacenes = async (req, res) => {
  try {
    const { estado } = req.query;
    const filtros = {};
    if (estado !== undefined) filtros.estado = estado === 'true';
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
    const { nombre, ubicacion, capacidad_maxima } = req.body;
    if (!nombre) {
      return res.status(400).json({ success: false, message: 'El nombre es requerido' });
    }
    const almacenData = { nombre, ubicacion, capacidad_maxima };
    const nuevoAlmacen = await AlmacenModel.create(almacenData);
    res.status(201).json({ success: true, message: 'Almacén creado exitosamente', data: nuevoAlmacen });
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
    res.json({ success: true, message: 'Almacén actualizado exitosamente', data: almacenActualizado });
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

module.exports = {
  getAllAlmacenes,
  getAlmacenById,
  createAlmacen,
  updateAlmacen,
  deleteAlmacen,
  getProductosAlmacen
};