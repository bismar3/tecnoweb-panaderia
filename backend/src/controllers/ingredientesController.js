const IngredienteModel = require('../models/ingredientesModel');

// Listar todos los ingredientes
const getAll = async (req, res) => {
  try {
    const { estado, categoria, buscar, stock_bajo } = req.query;
    
    const filtros = {};
    if (estado !== undefined) filtros.estado = estado === 'true';
    if (categoria) filtros.categoria = categoria;
    if (buscar) filtros.buscar = buscar;
    if (stock_bajo) filtros.stock_bajo = stock_bajo;

    const ingredientes = await IngredienteModel.getAll(filtros);

    res.json({
      success: true,
      count: ingredientes.length,
      data: ingredientes
    });

  } catch (error) {
    console.error('Error en getAll ingredientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ingredientes',
      error: error.message
    });
  }
};

// Obtener ingrediente por ID
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const ingrediente = await IngredienteModel.getById(id);

    if (!ingrediente) {
      return res.status(404).json({
        success: false,
        message: 'Ingrediente no encontrado'
      });
    }

    res.json({
      success: true,
      data: ingrediente
    });

  } catch (error) {
    console.error('Error en getById ingrediente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ingrediente',
      error: error.message
    });
  }
};

// Crear ingrediente
const create = async (req, res) => {
  try {
    const { 
      codigo, 
      nombre, 
      descripcion, 
      id_categoria, 
      unidad_medida, 
      costo_promedio,
      stock_minimo,
      estado 
    } = req.body;

    // Validaciones
    if (!codigo || !nombre || !unidad_medida) {
      return res.status(400).json({
        success: false,
        message: 'Código, nombre y unidad de medida son requeridos'
      });
    }

    // Verificar si el código ya existe
    const existente = await IngredienteModel.getByCodigo(codigo);
    if (existente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un ingrediente con ese código'
      });
    }

    const ingrediente = await IngredienteModel.create({
      codigo,
      nombre,
      descripcion,
      id_categoria,
      unidad_medida,
      costo_promedio,
      stock_minimo,
      estado
    });

    res.status(201).json({
      success: true,
      message: 'Ingrediente creado exitosamente',
      data: ingrediente
    });

  } catch (error) {
    console.error('Error en create ingrediente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear ingrediente',
      error: error.message
    });
  }
};

// Actualizar ingrediente
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      codigo, 
      nombre, 
      descripcion, 
      id_categoria, 
      unidad_medida, 
      costo_promedio,
      stock_minimo,
      estado 
    } = req.body;

    // Verificar que el ingrediente existe
    const ingredienteCheck = await IngredienteModel.getById(id);
    if (!ingredienteCheck) {
      return res.status(404).json({
        success: false,
        message: 'Ingrediente no encontrado'
      });
    }

    // Verificar código único si cambió
    if (codigo && codigo !== ingredienteCheck.codigo) {
      const codigoCheck = await IngredienteModel.getByCodigo(codigo);
      if (codigoCheck) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un ingrediente con ese código'
        });
      }
    }

    const ingredienteActualizado = await IngredienteModel.update(id, {
      codigo,
      nombre,
      descripcion,
      id_categoria,
      unidad_medida,
      costo_promedio,
      stock_minimo,
      estado
    });

    res.json({
      success: true,
      message: 'Ingrediente actualizado exitosamente',
      data: ingredienteActualizado
    });

  } catch (error) {
    console.error('Error en update ingrediente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar ingrediente',
      error: error.message
    });
  }
};

// Eliminar ingrediente
const deleteIngrediente = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si está en uso
    const inUse = await IngredienteModel.isInUse(id);
    if (inUse.inUse) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar el ingrediente porque está siendo usado en ${inUse.module}`
      });
    }

    const ingrediente = await IngredienteModel.delete(id);

    if (!ingrediente) {
      return res.status(404).json({
        success: false,
        message: 'Ingrediente no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Ingrediente eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error en delete ingrediente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar ingrediente',
      error: error.message
    });
  }
};

// Obtener ingredientes con stock bajo
const getStockBajo = async (req, res) => {
  try {
    const ingredientes = await IngredienteModel.getStockBajo();

    res.json({
      success: true,
      count: ingredientes.length,
      data: ingredientes
    });

  } catch (error) {
    console.error('Error en getStockBajo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ingredientes con stock bajo',
      error: error.message
    });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  deleteIngrediente,
  getStockBajo
};
