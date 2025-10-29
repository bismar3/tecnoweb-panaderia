const EntregaModel = require('../models/entregaModel');

const getAll = async (req, res) => {
  try {
    const { estado, id_delivery } = req.query;
    
    const filtros = {};
    if (estado) filtros.estado = estado;
    if (id_delivery) filtros.id_delivery = id_delivery;

    const entregas = await EntregaModel.getAll(filtros);

    res.json({
      success: true,
      count: entregas.length,
      data: entregas
    });
  } catch (error) {
    console.error('Error en getAll entregas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener entregas',
      error: error.message
    });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const entrega = await EntregaModel.getById(id);

    if (!entrega) {
      return res.status(404).json({
        success: false,
        message: 'Entrega no encontrada'
      });
    }

    res.json({
      success: true,
      data: entrega
    });
  } catch (error) {
    console.error('Error en getById entrega:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener entrega',
      error: error.message
    });
  }
};

const asignarDelivery = async (req, res) => {
  try {
    const { id_pedido, id_delivery, direccion_entrega } = req.body;

    if (!id_pedido || !id_delivery || !direccion_entrega) {
      return res.status(400).json({
        success: false,
        message: 'Pedido, delivery y dirección son requeridos'
      });
    }

    const entrega = await EntregaModel.asignar(id_pedido, id_delivery, direccion_entrega);

    res.status(201).json({
      success: true,
      message: 'Delivery asignado. Pedido confirmado.',
      data: entrega
    });
  } catch (error) {
    console.error('Error en asignarDelivery:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar delivery',
      error: error.message
    });
  }
};

const aceptarEntrega = async (req, res) => {
  try {
    const { id } = req.params;

    const entrega = await EntregaModel.aceptar(id);

    res.json({
      success: true,
      message: 'Entrega aceptada. Pedido en camino.',
      data: entrega
    });
  } catch (error) {
    console.error('Error en aceptarEntrega:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aceptar entrega',
      error: error.message
    });
  }
};

const completarEntrega = async (req, res) => {
  try {
    const { id } = req.params;

    const entrega = await EntregaModel.completar(id);

    res.json({
      success: true,
      message: 'Entrega completada. Pedido finalizado.',
      data: entrega
    });
  } catch (error) {
    console.error('Error en completarEntrega:', error);
    res.status(500).json({
      success: false,
      message: 'Error al completar entrega',
      error: error.message
    });
  }
};

module.exports = {
  getAll,
  getById,
  asignarDelivery,
  aceptarEntrega,
  completarEntrega
};