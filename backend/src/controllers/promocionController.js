const PromocionModel = require('../models/promocionModel');

const getAllPromociones = async (req, res) => {
  try {
    const { estado, activa } = req.query;
    const filtros = {};
    if (estado !== undefined) filtros.estado = estado === 'true';
    if (activa === 'true') filtros.activa = true;
    
    const promociones = await PromocionModel.getAll(filtros);
    res.json({ success: true, count: promociones.length, data: promociones });
  } catch (error) {
    console.error('Error en getAllPromociones:', error);
    res.status(500).json({ success: false, message: 'Error al obtener promociones', error: error.message });
  }
};

const getPromocionById = async (req, res) => {
  try {
    const { id } = req.params;
    const promocion = await PromocionModel.getById(id);
    if (!promocion) {
      return res.status(404).json({ success: false, message: 'Promoción no encontrada' });
    }
    res.json({ success: true, data: promocion });
  } catch (error) {
    console.error('Error en getPromocionById:', error);
    res.status(500).json({ success: false, message: 'Error al obtener promoción', error: error.message });
  }
};

const createPromocion = async (req, res) => {
  try {
    const { nombre, descripcion, tipo, valor, fecha_inicio, fecha_fin, productos } = req.body;
    
    if (!nombre || !tipo || !valor || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({ 
        success: false, 
        message: 'Campos requeridos: nombre, tipo, valor, fecha_inicio, fecha_fin' 
      });
    }

    const tiposValidos = ['porcentaje', 'monto_fijo'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ 
        success: false, 
        message: `Tipo inválido. Válidos: ${tiposValidos.join(', ')}` 
      });
    }

    if (valor <= 0) {
      return res.status(400).json({ success: false, message: 'El valor debe ser mayor a 0' });
    }

    if (tipo === 'porcentaje' && valor > 100) {
      return res.status(400).json({ success: false, message: 'El porcentaje no puede ser mayor a 100' });
    }

    if (new Date(fecha_inicio) > new Date(fecha_fin)) {
      return res.status(400).json({ 
        success: false, 
        message: 'La fecha de inicio no puede ser posterior a la fecha de fin' 
      });
    }

    const promocionData = { nombre, descripcion, tipo, valor, fecha_inicio, fecha_fin };
    const nuevaPromocion = await PromocionModel.create(promocionData, productos || []);
    
    res.status(201).json({ 
      success: true, 
      message: 'Promoción creada exitosamente', 
      data: nuevaPromocion 
    });
  } catch (error) {
    console.error('Error en createPromocion:', error);
    res.status(500).json({ success: false, message: 'Error al crear promoción', error: error.message });
  }
};

const updatePromocion = async (req, res) => {
  try {
    const { id } = req.params;
    const promocionData = req.body;
    
    const promocionExistente = await PromocionModel.getById(id);
    if (!promocionExistente) {
      return res.status(404).json({ success: false, message: 'Promoción no encontrada' });
    }

    if (promocionData.tipo) {
      const tiposValidos = ['porcentaje', 'monto_fijo'];
      if (!tiposValidos.includes(promocionData.tipo)) {
        return res.status(400).json({ 
          success: false, 
          message: `Tipo inválido. Válidos: ${tiposValidos.join(', ')}` 
        });
      }
    }

    if (promocionData.valor && promocionData.valor <= 0) {
      return res.status(400).json({ success: false, message: 'El valor debe ser mayor a 0' });
    }

    const promocionActualizada = await PromocionModel.update(id, promocionData);
    res.json({ success: true, message: 'Promoción actualizada exitosamente', data: promocionActualizada });
  } catch (error) {
    console.error('Error en updatePromocion:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar promoción', error: error.message });
  }
};

const addProductoPromocion = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_producto } = req.body;
    
    if (!id_producto) {
      return res.status(400).json({ success: false, message: 'id_producto es requerido' });
    }

    await PromocionModel.addProducto(id, id_producto);
    res.json({ success: true, message: 'Producto agregado a la promoción' });
  } catch (error) {
    console.error('Error en addProductoPromocion:', error);
    res.status(500).json({ success: false, message: 'Error al agregar producto', error: error.message });
  }
};

const removeProductoPromocion = async (req, res) => {
  try {
    const { id, id_producto } = req.params;
    
    await PromocionModel.removeProducto(id, id_producto);
    res.json({ success: true, message: 'Producto eliminado de la promoción' });
  } catch (error) {
    console.error('Error en removeProductoPromocion:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar producto', error: error.message });
  }
};

const deletePromocion = async (req, res) => {
  try {
    const { id } = req.params;
    
    const promocionExistente = await PromocionModel.getById(id);
    if (!promocionExistente) {
      return res.status(404).json({ success: false, message: 'Promoción no encontrada' });
    }

    await PromocionModel.delete(id);
    res.json({ success: true, message: 'Promoción desactivada exitosamente' });
  } catch (error) {
    console.error('Error en deletePromocion:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar promoción', error: error.message });
  }
};

const calcularDescuentoProducto = async (req, res) => {
  try {
    const { id_producto } = req.params;
    const { precio_original } = req.body;
    
    if (!precio_original || precio_original <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'precio_original es requerido y debe ser mayor a 0' 
      });
    }

    const resultado = await PromocionModel.calcularDescuento(id_producto, precio_original);
    res.json({ success: true, data: resultado });
  } catch (error) {
    console.error('Error en calcularDescuentoProducto:', error);
    res.status(500).json({ success: false, message: 'Error al calcular descuento', error: error.message });
  }
};

module.exports = {
  getAllPromociones,
  getPromocionById,
  createPromocion,
  updatePromocion,
  addProductoPromocion,
  removeProductoPromocion,
  deletePromocion,
  calcularDescuentoProducto
};