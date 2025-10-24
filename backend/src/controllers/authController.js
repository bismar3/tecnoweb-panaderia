const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { validatePassword } = require('../utils/passwordValidator');

// Registrar usuario
const register = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    // Validar que vengan los campos
    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }

    // Validar contraseña (3 protocolos)
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña no cumple requisitos de seguridad',
        errors: passwordValidation.errors
      });
    }

    // Verificar si email existe
    const userExists = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS));

    // Insertar usuario
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password) VALUES ($1, $2, $3) RETURNING id_usuario, nombre, email',
      [nombre, email, hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message
    });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar campos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const user = result.rows[0];

    // Verificar si está bloqueado
    if (user.bloqueado) {
      return res.status(403).json({
        success: false,
        message: 'Usuario bloqueado. Contacte al administrador'
      });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      // Incrementar intentos fallidos
      const newAttempts = user.intentos_fallidos + 1;
      const shouldBlock = newAttempts >= parseInt(process.env.MAX_LOGIN_ATTEMPTS);

      await pool.query(
        'UPDATE usuarios SET intentos_fallidos = $1, bloqueado = $2, fecha_bloqueo = $3 WHERE id_usuario = $4',
        [newAttempts, shouldBlock, shouldBlock ? new Date() : null, user.id_usuario]
      );

      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        intentos_restantes: Math.max(0, parseInt(process.env.MAX_LOGIN_ATTEMPTS) - newAttempts)
      });
    }

    // Login exitoso - resetear intentos
    await pool.query(
      'UPDATE usuarios SET intentos_fallidos = 0, ultimo_acceso = $1 WHERE id_usuario = $2',
      [new Date(), user.id_usuario]
    );

    // Obtener permisos del usuario
    const permisos = await pool.query(`
      SELECT DISTINCT p.nombre
      FROM usuarios_roles_permisos urp
      JOIN permisos p ON urp.id_permiso = p.id_permiso
      WHERE urp.id_usuario = $1
    `, [user.id_usuario]);

    // Generar token JWT
    const token = jwt.sign(
      {
        id_usuario: user.id_usuario,
        email: user.email,
        nombre: user.nombre,
        permisos: permisos.rows.map(p => p.nombre)
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        email: user.email,
        permisos: permisos.rows.map(p => p.nombre)
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

module.exports = { register, login };