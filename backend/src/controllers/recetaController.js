const RecetaModel = require('../models/recetaModel');

// Listar todas las recetas
const getAll = async (req, res) => {
  try {
    const { estado, id_producto } = req.query;
    
    const filtros = {};
    if (estado !== undefined) filtros.estado = estado === 'true';
    if (id_producto) filtros.id_producto = parseInt(id_producto);

    const recetas = await RecetaModel.getAll(filtros);

    res.json({
      success: true,
      count: recetas.length,
      data: recetas
    });
  } catch (error) {
    console.error('Error en getAll recetas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener recetas',
      error: error.message
    });
  }
};

// Obtener receta por ID
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const receta = await RecetaModel.getById(id);

    if (!receta) {
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }

    res.json({
      success: true,
      data: receta
    });
  } catch (error) {
    console.error('Error en getById receta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener receta',
      error: error.message
    });
  }
};

// Crear receta
const create = async (req, res) => {
  try {
    const { id_producto, nombre, descripcion, tiempo_produccion, rendimiento, ingredientes } = req.body;

    // Validaciones
    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido'
      });
    }

    if (!rendimiento || rendimiento <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El rendimiento debe ser mayor a 0'
      });
    }

    if (!ingredientes || ingredientes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe incluir al menos un ingrediente'
      });
    }

    for (const ingrediente of ingredientes) {
      if (!ingrediente.id_producto || !ingrediente.cantidad || !ingrediente.unidad) {
        return res.status(400).json({
          success: false,
          message: 'Cada ingrediente debe tener: id_producto, cantidad y unidad'
        });
      }

      if (ingrediente.cantidad <= 0) {
        return res.status(400).json({
          success: false,
          message: 'La cantidad del ingrediente debe ser mayor a 0'
        });
      }
    }

    const recetaData = {
      id_producto,
      nombre,
      descripcion,
      tiempo_produccion,
      rendimiento
    };

    const nuevaReceta = await RecetaModel.create(recetaData, ingredientes);

    res.status(201).json({
      success: true,
      message: 'Receta creada exitosamente',
      data: nuevaReceta
    });
  } catch (error) {
    console.error('Error en create receta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear receta',
      error: error.message
    });
  }
};

// Actualizar receta
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, tiempo_produccion, rendimiento, estado, ingredientes } = req.body;

    const recetaExiste = await RecetaModel.getById(id);
    if (!recetaExiste) {
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }

    // Actualizar datos básicos
    const recetaData = {
      nombre,
      descripcion,
      tiempo_produccion,
      rendimiento,
      estado
    };

    const recetaActualizada = await RecetaModel.update(id, recetaData);

    // Si hay ingredientes, actualizarlos
    if (ingredientes && ingredientes.length > 0) {
      for (const ingrediente of ingredientes) {
        if (!ingrediente.id_producto || !ingrediente.cantidad || !ingrediente.unidad) {
          return res.status(400).json({
            success: false,
            message: 'Cada ingrediente debe tener: id_producto, cantidad y unidad'
          });
        }
      }

      await RecetaModel.updateIngredientes(id, ingredientes);
    }

    res.json({
      success: true,
      message: 'Receta actualizada exitosamente',
      data: recetaActualizada
    });
  } catch (error) {
    console.error('Error en update receta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar receta',
      error: error.message
    });
  }
};

// Eliminar receta
const deleteReceta = async (req, res) => {
  try {
    const { id } = req.params;

    const recetaExiste = await RecetaModel.getById(id);
    if (!recetaExiste) {
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }

    const recetaEliminada = await RecetaModel.delete(id);

    res.json({
      success: true,
      message: 'Receta eliminada exitosamente',
      data: recetaEliminada
    });
  } catch (error) {
    console.error('Error en delete receta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar receta',
      error: error.message
    });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  deleteReceta
};