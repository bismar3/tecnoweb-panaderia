const DeliveryModel = require('../models/deliveryModel');

const getAllDeliveries = async (req, res) => {
  try {
    const { estado } = req.query;
    const filtros = {};
    if (estado !== undefined) filtros.estado = estado === 'true';
    
    const deliveries = await DeliveryModel.getAll(filtros);
    res.json({ success: true, count: deliveries.length, data: deliveries });
  } catch (error) {
    console.error('Error en getAllDeliveries:', error);
    res.status(500).json({ success: false, message: 'Error al obtener deliveries', error: error.message });
  }
};

const getDeliveryById = async (req, res) => {
  try {
    const { id } = req.params;
    const delivery = await DeliveryModel.getById(id);
    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery no encontrado' });
    }
    res.json({ success: true, data: delivery });
  } catch (error) {
    console.error('Error en getDeliveryById:', error);
    res.status(500).json({ success: false, message: 'Error al obtener delivery', error: error.message });
  }
};

const createDelivery = async (req, res) => {
  try {
    const { nombre, telefono, vehiculo, placa } = req.body;
    if (!nombre) {
      return res.status(400).json({ success: false, message: 'El nombre es requerido' });
    }
    const deliveryData = { nombre, telefono, vehiculo, placa };
    const nuevoDelivery = await DeliveryModel.create(deliveryData);
    res.status(201).json({ success: true, message: 'Delivery creado exitosamente', data: nuevoDelivery });
  } catch (error) {
    console.error('Error en createDelivery:', error);
    res.status(500).json({ success: false, message: 'Error al crear delivery', error: error.message });
  }
};

const updateDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const deliveryData = req.body;
    const deliveryExistente = await DeliveryModel.getById(id);
    if (!deliveryExistente) {
      return res.status(404).json({ success: false, message: 'Delivery no encontrado' });
    }
    const deliveryActualizado = await DeliveryModel.update(id, deliveryData);
    res.json({ success: true, message: 'Delivery actualizado exitosamente', data: deliveryActualizado });
  } catch (error) {
    console.error('Error en updateDelivery:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar delivery', error: error.message });
  }
};

const deleteDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const deliveryExistente = await DeliveryModel.getById(id);
    if (!deliveryExistente) {
      return res.status(404).json({ success: false, message: 'Delivery no encontrado' });
    }
    await DeliveryModel.delete(id);
    res.json({ success: true, message: 'Delivery desactivado exitosamente' });
  } catch (error) {
    console.error('Error en deleteDelivery:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar delivery', error: error.message });
  }
};

module.exports = {
  getAllDeliveries,
  getDeliveryById,
  createDelivery,
  updateDelivery,
  deleteDelivery
};