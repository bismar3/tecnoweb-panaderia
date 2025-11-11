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

// ============================================
// CREAR USUARIO - CON OPCIÓN DE CREAR CLIENTE
// ============================================
const create = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { 
      nombre, 
      apellido_paterno, 
      apellido_materno, 
      email, 
      password, 
      cedula_identidad, 
      fecha_nacimiento, 
      celular, 
      foto,
      id_rol,
      roles, 
      permisos, 
      estado,
      // ↓ NUEVOS CAMPOS PARA CREAR CLIENTE ↓
      crear_cliente,  // Boolean: true = crear también en tabla clientes
      telefono,       // Para clientes
      nit,            // Para clientes
      direccion       // Para clientes
    } = req.body;

    // Validaciones básicas
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

    // Crear usuario con todos los campos
    const usuario = await UsuarioModel.create({ 
      nombre, 
      apellido_paterno, 
      apellido_materno, 
      email, 
      password, 
      cedula_identidad, 
      fecha_nacimiento, 
      celular, 
      foto_url: foto,
      estado 
    });

    // Asignar roles y permisos
    const rolesArray = id_rol ? [parseInt(id_rol)] : (roles || []);
    await UsuarioModel.assignRolesAndPermissions(client, usuario.id_usuario, rolesArray, permisos);

    // ↓ NUEVO: Si se solicita crear cliente, crearlo y vincularlo ↓
    let id_cliente = null;
    if (crear_cliente) {
      const nombreCompleto = `${nombre} ${apellido_paterno || ''} ${apellido_materno || ''}`.trim();
      
      const clienteResult = await client.query(
        `INSERT INTO clientes (nombre, email, telefono, nit, direccion, id_usuario, tipo, estado)
         VALUES ($1, $2, $3, $4, $5, $6, 'regular', true)
         RETURNING id_cliente`,
        [
          nombreCompleto, 
          email, 
          telefono || celular || null,  // Usa telefono, si no existe usa celular
          nit || null, 
          direccion || null, 
          usuario.id_usuario
        ]
      );
      id_cliente = clienteResult.rows[0].id_cliente;
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: crear_cliente ? 'Usuario y cliente creados exitosamente' : 'Usuario creado exitosamente',
      data: {
        ...usuario,
        id_cliente: id_cliente
      }
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
    const { 
      nombre, 
      apellido_paterno, 
      apellido_materno, 
      email, 
      password, 
      cedula_identidad, 
      fecha_nacimiento, 
      celular, 
      foto,
      id_rol,
      roles, 
      permisos, 
      estado 
    } = req.body;

    console.log('📝 Datos recibidos para actualizar:', {
      id,
      nombre,
      apellido_paterno,
      apellido_materno,
      email,
      cedula_identidad,
      fecha_nacimiento,
      celular,
      foto: foto ? 'Imagen recibida' : 'Sin imagen',
      id_rol,
      permisos,
      estado
    });

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
    if (password && password.trim() !== '') {
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

    // Actualizar usuario con TODOS los campos
    const usuarioActualizado = await UsuarioModel.update(id, { 
      nombre, 
      apellido_paterno, 
      apellido_materno, 
      email, 
      password: password && password.trim() !== '' ? password : undefined, 
      cedula_identidad, 
      fecha_nacimiento, 
      celular, 
      foto_url: foto,
      estado 
    });

    // Actualizar roles y permisos si se proporcionan
    const rolesArray = id_rol ? [parseInt(id_rol)] : (roles || []);
    if (rolesArray.length > 0 || permisos) {
      await UsuarioModel.assignRolesAndPermissions(client, id, rolesArray, permisos);
    }

    await client.query('COMMIT');

    console.log('✅ Usuario actualizado exitosamente');

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: usuarioActualizado
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en update usuario:', error);
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