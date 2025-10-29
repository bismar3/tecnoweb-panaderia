const ProduccionModel = require('../models/produccionModel');

const getAll = async (req, res) => {
  try {
    const { estado, id_almacen, fecha_desde, fecha_hasta } = req.query;
    
    const filtros = {};
    if (estado) filtros.estado = estado;
    if (id_almacen) filtros.id_almacen = id_almacen;
    if (fecha_desde) filtros.fecha_desde = fecha_desde;
    if (fecha_hasta) filtros.fecha_hasta = fecha_hasta;

    const producciones = await ProduccionModel.getAll(filtros);

    res.json({
      success: true,
      count: producciones.length,
      data: producciones
    });
  } catch (error) {
    console.error('Error en getAll producciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener producciones',
      error: error.message
    });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const produccion = await ProduccionModel.getById(id);

    if (!produccion) {
      return res.status(404).json({
        success: false,
        message: 'Producción no encontrada'
      });
    }

    res.json({
      success: true,
      data: produccion
    });
  } catch (error) {
    console.error('Error en getById producción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener producción',
      error: error.message
    });
  }
};

const create = async (req, res) => {
  try {
    const { id_receta, id_almacen, cantidad_producir, fecha_inicio, observaciones } = req.body;
    const id_usuario = req.user.id_usuario;

    if (!id_receta) {
      return res.status(400).json({
        success: false,
        message: 'La receta es requerida'
      });
    }

    if (!id_almacen) {
      return res.status(400).json({
        success: false,
        message: 'El almacén es requerido'
      });
    }

    if (!cantidad_producir || cantidad_producir <= 0) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad a producir debe ser mayor a 0'
      });
    }

    const produccionData = {
      id_receta,
      id_almacen,
      id_usuario,
      cantidad_producir,
      fecha_inicio: fecha_inicio || new Date(),
      observaciones
    };

    const nuevaProduccion = await ProduccionModel.create(produccionData);

    res.status(201).json({
      success: true,
      message: 'Producción creada. Stock de ingredientes validado.',
      data: nuevaProduccion
    });
  } catch (error) {
    console.error('Error en create producción:', error);
    
    if (error.message.includes('Stock insuficiente') || error.message.includes('no encontrada')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear producción',
      error: error.message
    });
  }
};

const iniciar = async (req, res) => {
  try {
    const { id } = req.params;
    const id_usuario = req.user.id_usuario;

    const produccionActualizada = await ProduccionModel.iniciar(id, id_usuario);

    res.json({
      success: true,
      message: 'Producción iniciada. Ingredientes descontados del inventario.',
      data: produccionActualizada
    });
  } catch (error) {
    console.error('Error en iniciar producción:', error);
    
    if (error.message.includes('No se puede iniciar') || error.message.includes('no encontrada')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al iniciar producción',
      error: error.message
    });
  }
};

const completar = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad_producida } = req.body;
    const id_usuario = req.user.id_usuario;

    if (!cantidad_producida || cantidad_producida <= 0) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad producida debe ser mayor a 0'
      });
    }

    const produccionActualizada = await ProduccionModel.completar(id, cantidad_producida, id_usuario);

    res.json({
      success: true,
      message: 'Producción completada. Producto agregado al inventario.',
      data: produccionActualizada
    });
  } catch (error) {
    console.error('Error en completar producción:', error);
    
    if (error.message.includes('No se puede completar') || error.message.includes('no encontrada')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al completar producción',
      error: error.message
    });
  }
};

const cancelar = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    if (!motivo) {
      return res.status(400).json({
        success: false,
        message: 'El motivo de cancelación es requerido'
      });
    }

    const produccionCancelada = await ProduccionModel.cancelar(id, motivo);

    res.json({
      success: true,
      message: 'Producción cancelada',
      data: produccionCancelada
    });
  } catch (error) {
    console.error('Error en cancelar producción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar producción',
      error: error.message
    });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  iniciar,
  completar,
  cancelar
};