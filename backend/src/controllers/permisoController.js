const PermisoModel = require('../models/permisoModel');

// Listar todos los permisos
const getAll = async (req, res) => {
  try {
    const { estado, modulo } = req.query;
    
    const filtros = {};
    if (estado !== undefined) filtros.estado = estado === 'true';
    if (modulo) filtros.modulo = modulo;

    const permisos = await PermisoModel.getAll(filtros);

    res.json({
      success: true,
      count: permisos.length,
      data : permisos 
    });

  } catch (error) {
    console.error('Error en getAll permisos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener permisos',
      error: error.message
    });
  }
};

// Obtener permiso por ID
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const permiso = await PermisoModel.getById(id);

    if (!permiso) {
      return res.status(404).json({
        success: false,
        message: 'Permiso no encontrado'
      });
    }

    res.json({
      success: true,
      data: permiso
    });

  } catch (error) {
    console.error('Error en getById permiso:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener permiso',
      error: error.message
    });
  }
};

// Crear permiso
const create = async (req, res) => {
  try {
    const { nombre, descripcion, modulo, estado } = req.body;

    // Validaciones
    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido'
      });
    }

    // Verificar si el nombre ya existe
    const permisoExists = await PermisoModel.getByNombre(nombre);
    if (permisoExists) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un permiso con ese nombre'
      });
    }

    const permiso = await PermisoModel.create({ nombre, descripcion, modulo, estado });

    res.status(201).json({
      success: true,
      message: 'Permiso creado exitosamente',
      data: permiso
    });

  } catch (error) {
    console.error('Error en create permiso:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear permiso',
      error: error.message
    });
  }
};

// Actualizar permiso
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, modulo, estado } = req.body;

    // Verificar que permiso existe
    const permisoCheck = await PermisoModel.getById(id);
    if (!permisoCheck) {
      return res.status(404).json({
        success: false,
        message: 'Permiso no encontrado'
      });
    }

    // Verificar nombre único
    if (nombre && nombre !== permisoCheck.nombre) {
      const nombreCheck = await PermisoModel.getByNombre(nombre);
      if (nombreCheck) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un permiso con ese nombre'
        });
      }
    }

    const permisoActualizado = await PermisoModel.update(id, { nombre, descripcion, modulo, estado });

    res.json({
      success: true,
      message: 'Permiso actualizado exitosamente',
      data: permisoActualizado
    });

  } catch (error) {
    console.error('Error en update permiso:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar permiso',
      error: error.message
    });
  }
};

// Eliminar permiso (soft delete)
const deletePermiso = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que no haya roles o usuarios con este permiso
    const hasRoles = await PermisoModel.hasRoles(id);
    const hasUsers = await PermisoModel.hasUsers(id);

    if (hasRoles || hasUsers) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el permiso porque está asignado a roles o usuarios'
      });
    }

    const permiso = await PermisoModel.delete(id);

    if (!permiso) {
      return res.status(404).json({
        success: false,
        message: 'Permiso no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Permiso eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error en delete permiso:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar permiso',
      error: error.message
    });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  deletePermiso
};