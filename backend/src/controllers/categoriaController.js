const CategoriaModel = require('../models/categoriaModel');

// Obtener todas las categorías
const getAllCategorias = async (req, res) => {
  try {
    const { estado, buscar } = req.query;
    
    const filtros = {};
    if (estado !== undefined) filtros.estado = estado === 'true';
    if (buscar) filtros.buscar = buscar;

    const categorias = await CategoriaModel.getAll(filtros);

    res.json({
      success: true,
      count: categorias.length,
      data: categorias
    });
  } catch (error) {
    console.error('Error en getAllCategorias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías',
      error: error.message
    });
  }
};

// Obtener categoría por ID
const getCategoriaById = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await CategoriaModel.getById(id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    res.json({
      success: true,
      data: categoria
    });
  } catch (error) {
    console.error('Error en getCategoriaById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categoría',
      error: error.message
    });
  }
};

// Crear categoría
const createCategoria = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    // Validación
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la categoría es requerido'
      });
    }

    // Verificar si ya existe
    const nombreExiste = await CategoriaModel.getByNombre(nombre);
    if (nombreExiste) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una categoría con ese nombre'
      });
    }

    const categoriaData = {
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null
    };

    const nuevaCategoria = await CategoriaModel.create(categoriaData);

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: nuevaCategoria
    });
  } catch (error) {
    console.error('Error en createCategoria:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear categoría',
      error: error.message
    });
  }
};

// Actualizar categoría
const updateCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const categoriaData = req.body;

    // Verificar existencia
    const categoriaExistente = await CategoriaModel.getById(id);
    if (!categoriaExistente) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    // Verificar nombre duplicado
    if (categoriaData.nombre && categoriaData.nombre !== categoriaExistente.nombre) {
      const nombreExiste = await CategoriaModel.getByNombre(categoriaData.nombre);
      if (nombreExiste) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una categoría con ese nombre'
        });
      }
    }

    // Limpiar datos
    if (categoriaData.nombre) categoriaData.nombre = categoriaData.nombre.trim();
    if (categoriaData.descripcion) categoriaData.descripcion = categoriaData.descripcion.trim();

    const categoriaActualizada = await CategoriaModel.update(id, categoriaData);

    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: categoriaActualizada
    });
  } catch (error) {
    console.error('Error en updateCategoria:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar categoría',
      error: error.message
    });
  }
};

// Eliminar categoría (soft delete)
const deleteCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    const categoriaExistente = await CategoriaModel.getById(id);
    if (!categoriaExistente) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    // Verificar productos asociados
    const tieneProductos = await CategoriaModel.hasProducts(id);
    if (tieneProductos) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar la categoría porque tiene productos asociados'
      });
    }

    await CategoriaModel.delete(id);

    res.json({
      success: true,
      message: 'Categoría desactivada exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteCategoria:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar categoría',
      error: error.message
    });
  }
};

module.exports = {
  getAllCategorias,
  getCategoriaById,
  createCategoria,
  updateCategoria,
  deleteCategoria
};