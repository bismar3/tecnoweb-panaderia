const MetodoPagoModel = require('../models/metodoPagoModel');

const getAllMetodosPago = async (req, res) => {
  try {
    const { estado } = req.query;
    const filtros = {};
    if (estado !== undefined) filtros.estado = estado === 'true';
    
    const metodos = await MetodoPagoModel.getAll(filtros);
    res.json({ success: true, count: metodos.length, data: metodos });
  } catch (error) {
    console.error('Error en getAllMetodosPago:', error);
    res.status(500).json({ success: false, message: 'Error al obtener métodos de pago', error: error.message });
  }
};

const getMetodoPagoById = async (req, res) => {
  try {
    const { id } = req.params;
    const metodo = await MetodoPagoModel.getById(id);
    if (!metodo) {
      return res.status(404).json({ success: false, message: 'Método de pago no encontrado' });
    }
    res.json({ success: true, data: metodo });
  } catch (error) {
    console.error('Error en getMetodoPagoById:', error);
    res.status(500).json({ success: false, message: 'Error al obtener método de pago', error: error.message });
  }
};

const createMetodoPago = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre) {
      return res.status(400).json({ success: false, message: 'El nombre es requerido' });
    }
    const metodoData = { nombre, descripcion };
    const nuevoMetodo = await MetodoPagoModel.create(metodoData);
    res.status(201).json({ success: true, message: 'Método de pago creado exitosamente', data: nuevoMetodo });
  } catch (error) {
    console.error('Error en createMetodoPago:', error);
    res.status(500).json({ success: false, message: 'Error al crear método de pago', error: error.message });
  }
};

const updateMetodoPago = async (req, res) => {
  try {
    const { id } = req.params;
    const metodoData = req.body;
    const metodoExistente = await MetodoPagoModel.getById(id);
    if (!metodoExistente) {
      return res.status(404).json({ success: false, message: 'Método de pago no encontrado' });
    }
    const metodoActualizado = await MetodoPagoModel.update(id, metodoData);
    res.json({ success: true, message: 'Método de pago actualizado exitosamente', data: metodoActualizado });
  } catch (error) {
    console.error('Error en updateMetodoPago:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar método de pago', error: error.message });
  }
};

const deleteMetodoPago = async (req, res) => {
  try {
    const { id } = req.params;
    const metodoExistente = await MetodoPagoModel.getById(id);
    if (!metodoExistente) {
      return res.status(404).json({ success: false, message: 'Método de pago no encontrado' });
    }
    await MetodoPagoModel.delete(id);
    res.json({ success: true, message: 'Método de pago desactivado exitosamente' });
  } catch (error) {
    console.error('Error en deleteMetodoPago:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar método de pago', error: error.message });
  }
};

module.exports = {
  getAllMetodosPago,
  getMetodoPagoById,
  createMetodoPago,
  updateMetodoPago,
  deleteMetodoPago
};