const pool = require('../config/database');
const bcrypt = require('bcrypt');
const { validatePassword } = require('../utils/passwordValidator');

// Listar todos los usuarios
const getAll = async (req, res) => {
  try {
    const { estado, buscar } = req.query;
    
    let query = `
      SELECT 
        u.id_usuario,
        u.nombre,
        u.email,
        u.estado,
        u.intentos_fallidos,
        u.bloqueado,
        u.ultimo_acceso,
        u.fecha_creacion,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id_rol', r.id_rol, 'nombre', r.nombre)
          ) FILTER (WHERE r.id_rol IS NOT NULL), 
          '[]'
        ) as roles,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id_permiso', p.id_permiso, 'nombre', p.nombre)
          ) FILTER (WHERE p.id_permiso IS NOT NULL),
          '[]'
        ) as permisos
      FROM usuarios u
      LEFT JOIN usuarios_roles_permisos urp ON u.id_usuario = urp.id_usuario
      LEFT JOIN roles r ON urp.id_rol = r.id_rol
      LEFT JOIN permisos p ON urp.id_permiso = p.id_permiso
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (estado !== undefined) {
      query += ` AND u.estado = $${paramIndex}`;
      params.push(estado === 'true');
      paramIndex++;
    }

    if (buscar) {
      query += ` AND (u.nombre ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      params.push(`%${buscar}%`);
      paramIndex++;
    }

    query += ` GROUP BY u.id_usuario ORDER BY u.nombre ASC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      usuarios: result.rows
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

    const query = `
      SELECT 
        u.id_usuario,
        u.nombre,
        u.email,
        u.estado,
        u.intentos_fallidos,
        u.bloqueado,
        u.ultimo_acceso,
        u.fecha_creacion,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id_rol', r.id_rol, 'nombre', r.nombre)
          ) FILTER (WHERE r.id_rol IS NOT NULL),
          '[]'
        ) as roles,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id_permiso', p.id_permiso, 'nombre', p.nombre)
          ) FILTER (WHERE p.id_permiso IS NOT NULL),
          '[]'
        ) as permisos
      FROM usuarios u
      LEFT JOIN usuarios_roles_permisos urp ON u.id_usuario = urp.id_usuario
      LEFT JOIN roles r ON urp.id_rol = r.id_rol
      LEFT JOIN permisos p ON urp.id_permiso = p.id_permiso
      WHERE u.id_usuario = $1
      GROUP BY u.id_usuario
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      usuario: result.rows[0]
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

    await client.query('BEGIN');

    // Verificar si email existe
    const userExists = await client.query(
      'SELECT id_usuario FROM usuarios WHERE email = $1',
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
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS));

    // Insertar usuario
    const userResult = await client.query(
      'INSERT INTO usuarios (nombre, email, password, estado) VALUES ($1, $2, $3, $4) RETURNING id_usuario, nombre, email, estado',
      [nombre, email, hashedPassword, estado !== undefined ? estado : true]
    );

    const usuario = userResult.rows[0];

    // Asignar roles y permisos
    if (roles && roles.length > 0) {
      for (const id_rol of roles) {
        // Obtener permisos del rol
        const rolesPermisos = await client.query(
          'SELECT id_permiso FROM roles_permisos WHERE id_rol = $1',
          [id_rol]
        );

        // Insertar usuario-rol-permisos
        for (const rp of rolesPermisos.rows) {
          await client.query(
            'INSERT INTO usuarios_roles_permisos (id_usuario, id_rol, id_permiso) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [usuario.id_usuario, id_rol, rp.id_permiso]
          );
        }
      }
    }

    // Asignar permisos adicionales
    if (permisos && permisos.length > 0) {
      for (const id_permiso of permisos) {
        await client.query(
          'INSERT INTO usuarios_roles_permisos (id_usuario, id_permiso) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [usuario.id_usuario, id_permiso]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      usuario
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

    await client.query('BEGIN');

    // Verificar que usuario existe
    const userCheck = await client.query(
      'SELECT id_usuario FROM usuarios WHERE id_usuario = $1',
      [id]
    );

    if (userCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar email único
    if (email) {
      const emailCheck = await client.query(
        'SELECT id_usuario FROM usuarios WHERE email = $1 AND id_usuario != $2',
        [email, id]
      );

      if (emailCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }
    }

    // Construir query de actualización
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (nombre) {
      updates.push(`nombre = $${paramIndex}`);
      values.push(nombre);
      paramIndex++;
    }

    if (email) {
      updates.push(`email = $${paramIndex}`);
      values.push(email);
      paramIndex++;
    }

    if (password) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Contraseña no cumple requisitos',
          errors: passwordValidation.errors
        });
      }
      
      const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS));
      updates.push(`password = $${paramIndex}`);
      values.push(hashedPassword);
      paramIndex++;
    }

    if (estado !== undefined) {
      updates.push(`estado = $${paramIndex}`);
      values.push(estado);
      paramIndex++;
    }

    updates.push(`fecha_actualizacion = CURRENT_TIMESTAMP`);
    values.push(id);

    if (updates.length > 0) {
      const query = `UPDATE usuarios SET ${updates.join(', ')} WHERE id_usuario = $${paramIndex} RETURNING id_usuario, nombre, email, estado`;
      await client.query(query, values);
    }

    // Actualizar roles y permisos si se proporcionan
    if (roles !== undefined) {
      // Eliminar asignaciones anteriores
      await client.query('DELETE FROM usuarios_roles_permisos WHERE id_usuario = $1', [id]);

      // Insertar nuevos roles y sus permisos
      if (roles.length > 0) {
        for (const id_rol of roles) {
          const rolesPermisos = await client.query(
            'SELECT id_permiso FROM roles_permisos WHERE id_rol = $1',
            [id_rol]
          );

          for (const rp of rolesPermisos.rows) {
            await client.query(
              'INSERT INTO usuarios_roles_permisos (id_usuario, id_rol, id_permiso) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
              [id, id_rol, rp.id_permiso]
            );
          }
        }
      }

      // Agregar permisos adicionales
      if (permisos && permisos.length > 0) {
        for (const id_permiso of permisos) {
          await client.query(
            'INSERT INTO usuarios_roles_permisos (id_usuario, id_permiso) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [id, id_permiso]
          );
        }
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente'
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

    const result = await pool.query(
      'UPDATE usuarios SET estado = false WHERE id_usuario = $1 RETURNING id_usuario',
      [id]
    );

    if (result.rows.length === 0) {
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