const RecetaModel = require('../models/recetaModel');

// Listar todas las recetas
const getAll = async (req, res) => {
  try {
    const { estado, id_producto, id_categoria, id_tipo, nivel_dificultad } = req.query;
    
    const filtros = {};
    if (estado !== undefined) filtros.estado = estado === 'true';
    if (id_producto) filtros.id_producto = parseInt(id_producto);
    if (id_categoria) filtros.id_categoria = parseInt(id_categoria);
    if (id_tipo) filtros.id_tipo = parseInt(id_tipo);
    if (nivel_dificultad) filtros.nivel_dificultad = nivel_dificultad;

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
    const { 
      id_producto, 
      nombre, 
      descripcion, 
      tiempo_produccion,
      tiempo_preparacion,
      tiempo_fermentacion,
      tiempo_horneado,
      rendimiento,
      unidad_rendimiento,
      porciones,
      temperatura,
      equipo,
      codigo,
      id_categoria,
      id_tipo,
      id_producto_final,
      costo_total,
      costo_unitario,
      merma_porcentaje,
      nivel_dificultad,
      version,
      aprobado_por,
      fecha_aprobacion,
      notas,
      imagen_url,
      ingredientes 
    } = req.body;

    // Validaciones básicas
    if (!nombre || nombre.trim() === '') {
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

    // Validar ingredientes
    for (const ingrediente of ingredientes) {
      if (!ingrediente.id_ingrediente || !ingrediente.cantidad || !ingrediente.unidad) {
        return res.status(400).json({
          success: false,
          message: 'Cada ingrediente debe tener: id_ingrediente, cantidad y unidad'
        });
      }

      if (ingrediente.cantidad <= 0) {
        return res.status(400).json({
          success: false,
          message: 'La cantidad del ingrediente debe ser mayor a 0'
        });
      }
    }

    // Validar nivel de dificultad
    if (nivel_dificultad && !['Fácil', 'Media', 'Difícil'].includes(nivel_dificultad)) {
      return res.status(400).json({
        success: false,
        message: 'El nivel de dificultad debe ser: Fácil, Media o Difícil'
      });
    }

    const recetaData = {
      id_producto,
      nombre: nombre.trim(),
      descripcion: descripcion ? descripcion.trim() : null,
      tiempo_produccion,
      tiempo_preparacion,
      tiempo_fermentacion,
      tiempo_horneado,
      rendimiento,
      unidad_rendimiento: unidad_rendimiento || 'unidades',
      porciones,
      temperatura,
      equipo,
      codigo,
      id_categoria,
      id_tipo,
      id_producto_final,
      costo_total: costo_total || 0,
      costo_unitario: costo_unitario || 0,
      merma_porcentaje: merma_porcentaje || 5.0,
      nivel_dificultad: nivel_dificultad || 'Media',
      version: version || '1.0',
      aprobado_por,
      fecha_aprobacion,
      notas,
      imagen_url
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
    const { 
      nombre, 
      descripcion, 
      tiempo_produccion,
      tiempo_preparacion,
      tiempo_fermentacion,
      tiempo_horneado,
      rendimiento,
      unidad_rendimiento,
      porciones,
      temperatura,
      equipo,
      codigo,
      id_categoria,
      id_tipo,
      id_producto_final,
      costo_total,
      costo_unitario,
      merma_porcentaje,
      nivel_dificultad,
      version,
      aprobado_por,
      fecha_aprobacion,
      notas,
      imagen_url,
      estado, 
      ingredientes 
    } = req.body;

    const recetaExiste = await RecetaModel.getById(id);
    if (!recetaExiste) {
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }

    // Validar nivel de dificultad si se proporciona
    if (nivel_dificultad && !['Fácil', 'Media', 'Difícil'].includes(nivel_dificultad)) {
      return res.status(400).json({
        success: false,
        message: 'El nivel de dificultad debe ser: Fácil, Media o Difícil'
      });
    }

    // Actualizar datos básicos
    const recetaData = {
      nombre: nombre ? nombre.trim() : undefined,
      descripcion: descripcion !== undefined ? (descripcion ? descripcion.trim() : null) : undefined,
      tiempo_produccion,
      tiempo_preparacion,
      tiempo_fermentacion,
      tiempo_horneado,
      rendimiento,
      unidad_rendimiento,
      porciones,
      temperatura,
      equipo,
      codigo,
      id_categoria,
      id_tipo,
      id_producto_final,
      costo_total,
      costo_unitario,
      merma_porcentaje,
      nivel_dificultad,
      version,
      aprobado_por,
      fecha_aprobacion,
      notas,
      imagen_url,
      estado
    };

    const recetaActualizada = await RecetaModel.update(id, recetaData);

    // Si hay ingredientes, actualizarlos
    if (ingredientes && ingredientes.length > 0) {
      for (const ingrediente of ingredientes) {
        if (!ingrediente.id_ingrediente || !ingrediente.cantidad || !ingrediente.unidad) {
          return res.status(400).json({
            success: false,
            message: 'Cada ingrediente debe tener: id_ingrediente, cantidad y unidad'
          });
        }
        
        if (ingrediente.cantidad <= 0) {
          return res.status(400).json({
            success: false,
            message: 'La cantidad del ingrediente debe ser mayor a 0'
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