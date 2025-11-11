const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { validatePassword } = require('../utils/passwordValidator');

// ============================================
// REGISTRO PÚBLICO (Crea usuario + cliente automático)
// ============================================
const register = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { nombre, email, password, telefono, nit, direccion } = req.body;

    // Validar que vengan los campos obligatorios
    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, email y contraseña son requeridos'
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

    await client.query('BEGIN');

    // Verificar si email existe
    const userExists = await client.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || 10));

    // 1. CREAR USUARIO con rol 'cliente'
    const usuarioResult = await client.query(
      `INSERT INTO usuarios (nombre, email, password, estado) 
       VALUES ($1, $2, $3, true) 
       RETURNING id_usuario, nombre, email, estado`,
      [nombre, email, hashedPassword]
    );

    const usuario = usuarioResult.rows[0];

    // 2. CREAR CLIENTE automáticamente vinculado
    const clienteResult = await client.query(
      `INSERT INTO clientes (nombre, email, telefono, nit, direccion, id_usuario, tipo, estado)
       VALUES ($1, $2, $3, $4, $5, $6, 'regular', true)
       RETURNING id_cliente`,
      [nombre, email, telefono || null, nit || null, direccion || null, usuario.id_usuario]
    );

    const id_cliente = clienteResult.rows[0].id_cliente;

    // 3. ASIGNAR ROL "cliente" y sus permisos automáticamente
    const rolClienteResult = await client.query(
      `SELECT id_rol FROM roles WHERE nombre = 'cliente'`
    );

    if (rolClienteResult.rows.length > 0) {
      const id_rol_cliente = rolClienteResult.rows[0].id_rol;

      // Obtener permisos del rol cliente
      const permisosRol = await client.query(
        `SELECT id_permiso FROM roles_permisos WHERE id_rol = $1`,
        [id_rol_cliente]
      );

      // Asignar rol y sus permisos al usuario
      for (const permiso of permisosRol.rows) {
        await client.query(
          `INSERT INTO usuarios_roles_permisos (id_usuario, id_rol, id_permiso)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [usuario.id_usuario, id_rol_cliente, permiso.id_permiso]
        );
      }
    }

    await client.query('COMMIT');

    // 4. GENERAR TOKEN con id_cliente incluido
    const permisos = await pool.query(`
      SELECT DISTINCT p.nombre
      FROM usuarios_roles_permisos urp
      JOIN permisos p ON urp.id_permiso = p.id_permiso
      WHERE urp.id_usuario = $1
    `, [usuario.id_usuario]);

    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        id_cliente: id_cliente,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: 'cliente',
        permisos: permisos.rows.map(p => p.nombre)
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente como cliente',
      token,
      user: {
        id_usuario: usuario.id_usuario,
        id_cliente: id_cliente,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: 'cliente'
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en register:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// ============================================
// LOGIN (Actualizado para incluir id_cliente)
// ============================================
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

    // Buscar usuario y su cliente asociado
    const result = await pool.query(
      `SELECT 
        u.*,
        c.id_cliente,
        r.nombre as rol_nombre
      FROM usuarios u
      LEFT JOIN clientes c ON u.id_usuario = c.id_usuario
      LEFT JOIN usuarios_roles_permisos urp ON u.id_usuario = urp.id_usuario
      LEFT JOIN roles r ON urp.id_rol = r.id_rol
      WHERE u.email = $1
      LIMIT 1`,
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

    // Verificar si está inactivo
    if (!user.estado) {
      return res.status(403).json({
        success: false,
        message: 'Usuario inactivo. Contacte al administrador'
      });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      // Incrementar intentos fallidos
      const newAttempts = user.intentos_fallidos + 1;
      const shouldBlock = newAttempts >= parseInt(process.env.MAX_LOGIN_ATTEMPTS || 5);

      await pool.query(
        'UPDATE usuarios SET intentos_fallidos = $1, bloqueado = $2, fecha_bloqueo = $3 WHERE id_usuario = $4',
        [newAttempts, shouldBlock, shouldBlock ? new Date() : null, user.id_usuario]
      );

      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        intentos_restantes: Math.max(0, parseInt(process.env.MAX_LOGIN_ATTEMPTS || 5) - newAttempts)
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

    // Generar token JWT con id_cliente incluido
    const token = jwt.sign(
      {
        id_usuario: user.id_usuario,
        id_cliente: user.id_cliente || null,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol_nombre || 'usuario',
        permisos: permisos.rows.map(p => p.nombre)
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id_usuario: user.id_usuario,
        id_cliente: user.id_cliente,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol_nombre || 'usuario',
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