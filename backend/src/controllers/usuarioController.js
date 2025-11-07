const UsuarioModel = require('../models/usuarioModel');
const pool = require('../config/database');
const { validatePassword } = require('../utils/passwordValidator');

// Listar todos los usuarios
const getAll = async (req, res) => {
  try {
    const { estado, buscar } = req.query;
    
    const filtros = {};
    if (estado !== undefined) filtros.estado = estado === 'true';
    if (buscar) filtros.buscar = buscar;

    const usuarios = await UsuarioModel.getAll(filtros);

    res.json({
      success: true,
      count: usuarios.length,
      data: usuarios
    });

  } catch (error) {
    console.error('Error en getAll usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
};

// Obtener usuario por ID
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await UsuarioModel.getById(id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: usuario
    });

  } catch (error) {
    console.error('Error en getById usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: error.message
    });
  }
};

// Crear usuario
const create = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { nombre, email, password, roles, permisos, estado } = req.body;

    // Validaciones
    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, email y contraseña son requeridos'
      });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }

    // Validar contraseña
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña no cumple requisitos',
        errors: passwordValidation.errors
      });
    }

    // Verificar si email existe
    const userExists = await UsuarioModel.getByEmail(email);
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    await client.query('BEGIN');

    // Crear usuario
    const usuario = await UsuarioModel.create({ nombre, email, password, estado });

    // Asignar roles y permisos
    await UsuarioModel.assignRolesAndPermissions(client, usuario.id_usuario, roles, permisos);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: usuario
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en create usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Actualizar usuario
const update = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { nombre, email, password, roles, permisos, estado } = req.body;

    // Verificar que usuario existe
    const userCheck = await UsuarioModel.getById(id);
    if (!userCheck) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar email único
    if (email && email !== userCheck.email) {
      const emailCheck = await UsuarioModel.getByEmail(email);
      if (emailCheck) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }
    }

    // Validar contraseña si se proporciona
    if (password) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Contraseña no cumple requisitos',
          errors: passwordValidation.errors
        });
      }
    }

    await client.query('BEGIN');

    // Actualizar usuario
    const usuarioActualizado = await UsuarioModel.update(id, { nombre, email, password, estado });

    // Actualizar roles y permisos si se proporcionan
    if (roles !== undefined) {
      await UsuarioModel.assignRolesAndPermissions(client, id, roles, permisos);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: usuarioActualizado
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en update usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Eliminar usuario (soft delete)
const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await UsuarioModel.delete(id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error en delete usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      error: error.message
    });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  deleteUsuario
};