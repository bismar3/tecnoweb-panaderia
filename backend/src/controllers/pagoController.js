const PagoModel = require('../models/pagoModel');
const pool = require('../config/database');

const getAllPagos = async (req, res) => {
  try {
    const { estado, id_pedido, fecha_desde, fecha_hasta } = req.query;
    
    const filtros = {};
    if (estado) filtros.estado = estado;
    if (id_pedido) filtros.id_pedido = parseInt(id_pedido);
    if (fecha_desde) filtros.fecha_desde = fecha_desde;
    if (fecha_hasta) filtros.fecha_hasta = fecha_hasta;

    const pagos = await PagoModel.getAll(filtros);

    res.json({
      success: true,
      count: pagos.length,
      data: pagos
    });
  } catch (error) {
    console.error('Error en getAllPagos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pagos',
      error: error.message
    });
  }
};

const getPagoById = async (req, res) => {
  try {
    const { id } = req.params;
    const pago = await PagoModel.getById(id);

    if (!pago) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }

    res.json({
      success: true,
      data: pago
    });
  } catch (error) {
    console.error('Error en getPagoById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pago',
      error: error.message
    });
  }
};

const getPagosByPedido = async (req, res) => {
  try {
    const { id_pedido } = req.params;
    const pagos = await PagoModel.getByPedido(id_pedido);

    res.json({
      success: true,
      count: pagos.length,
      data: pagos
    });
  } catch (error) {
    console.error('Error en getPagosByPedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pagos del pedido',
      error: error.message
    });
  }
};

const createPago = async (req, res) => {
  try {
    const { id_pedido, id_metodo_pago, monto, numero_transaccion, observaciones } = req.body;
    
    if (!id_pedido || !monto) {
      return res.status(400).json({
        success: false,
        message: 'El pedido y monto son requeridos'
      });
    }

    if (monto <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser mayor a 0'
      });
    }

    // Verificar que el pedido existe y está pendiente de pago
    const pedidoQuery = await pool.query(
      'SELECT id_pedido, estado, total FROM pedidos WHERE id_pedido = $1',
      [id_pedido]
    );

    if (pedidoQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    const pedido = pedidoQuery.rows[0];

    if (pedido.estado !== 'pendiente') {
      return res.status(400).json({
        success: false,
        message: `El pedido ya está en estado: ${pedido.estado}`
      });
    }

    if (parseFloat(monto) !== parseFloat(pedido.total)) {
      return res.status(400).json({
        success: false,
        message: `El monto (${monto}) no coincide con el total del pedido (${pedido.total})`
      });
    }

    const pagoData = { id_pedido, id_metodo_pago, monto, numero_transaccion, observaciones };
    
    // Crear pago y actualizar pedido + inventario automáticamente
    const nuevoPago = await PagoModel.createConActualizacion(pagoData);
    
    res.status(201).json({
      success: true,
      message: 'Pago registrado exitosamente. Pedido confirmado e inventario descontado.',
      data: nuevoPago
    });
  } catch (error) {
    console.error('Error en createPago:', error);
    
    if (error.message.includes('Stock insuficiente') || error.message.includes('no existe en el almacén')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al registrar pago',
      error: error.message
    });
  }
};

const updateEstadoPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, observaciones } = req.body;
    
    const estadosValidos = ['pendiente', 'completado', 'fallido', 'reembolsado'];
    if (!estado || !estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Válidos: ${estadosValidos.join(', ')}`
      });
    }
    
    const pagoActualizado = await PagoModel.updateEstado(id, estado, observaciones);
    
    if (!pagoActualizado) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Estado del pago actualizado',
      data: pagoActualizado
    });
  } catch (error) {
    console.error('Error en updateEstadoPago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado del pago',
      error: error.message
    });
  }
};

module.exports = {
  getAllPagos,
  getPagoById,
  getPagosByPedido,
  createPago,
  updateEstadoPago
};