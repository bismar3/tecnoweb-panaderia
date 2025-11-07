const RolModel = require('../models/rolModel');
const pool = require('../config/database');

// Listar todos los roles
const getAll = async (req, res) => {
  try {
    const { estado } = req.query;
    
    const filtros = {};
    if (estado !== undefined) filtros.estado = estado === 'true';

    const roles = await RolModel.getAll(filtros);

    res.json({
      success: true,
      count: roles.length,
      data : roles
    });

  } catch (error) {
    console.error('Error en getAll roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener roles',
      error: error.message
    });
  }
};

// Obtener rol por ID
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const rol = await RolModel.getById(id);

    if (!rol) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    res.json({
      success: true,
      data: rol
    });

  } catch (error) {
    console.error('Error en getById rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener rol',
      error: error.message
    });
  }
};

// Crear rol
const create = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { nombre, descripcion, permisos, estado } = req.body;

    // Validaciones
    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido'
      });
    }

    // Verificar si el nombre ya existe
    const rolExists = await RolModel.getByNombre(nombre);
    if (rolExists) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un rol con ese nombre'
      });
    }

    await client.query('BEGIN');

    // Crear rol
    const rol = await RolModel.create({ nombre, descripcion, estado });

    // Asignar permisos
    if (permisos && permisos.length > 0) {
      await RolModel.assignPermisos(client, rol.id_rol, permisos);
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Rol creado exitosamente',
      data: rol
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en create rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear rol',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Actualizar rol
const update = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { nombre, descripcion, permisos, estado } = req.body;

    // Verificar que rol existe
    const rolCheck = await RolModel.getById(id);
    if (!rolCheck) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    // Verificar nombre único
    if (nombre && nombre !== rolCheck.nombre) {
      const nombreCheck = await RolModel.getByNombre(nombre);
      if (nombreCheck) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un rol con ese nombre'
        });
      }
    }

    await client.query('BEGIN');

    // Actualizar rol
    const rolActualizado = await RolModel.update(id, { nombre, descripcion, estado });

    // Actualizar permisos si se proporcionan
    if (permisos !== undefined) {
      await RolModel.assignPermisos(client, id, permisos);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Rol actualizado exitosamente',
      data: rolActualizado
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en update rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar rol',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Eliminar rol (soft delete)
const deleteRol = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que no haya usuarios con este rol
    const hasUsers = await RolModel.hasUsers(id);
    if (hasUsers) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el rol porque tiene usuarios asignados'
      });
    }

    const rol = await RolModel.delete(id);

    if (!rol) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Rol eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error en delete rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar rol',
      error: error.message
    });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  deleteRol
};