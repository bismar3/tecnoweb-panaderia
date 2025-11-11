const pool = require('../config/database');
const bcrypt = require('bcrypt');

const UsuarioModel = {
  // Obtener todos los usuarios
  getAll: async (filtros = {}) => {
    let query = `
      SELECT 
        u.id_usuario,
        u.nombre,
        u.apellido_paterno,
        u.apellido_materno,
        u.email,
        u.cedula_identidad,
        u.fecha_nacimiento,
        u.celular,
        u.foto_url,
        u.estado,
        u.intentos_fallidos,
        u.bloqueado,
        u.fecha_bloqueo,
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

    if (filtros.estado !== undefined) {
      query += ` AND u.estado = $${paramIndex}`;
      params.push(filtros.estado);
      paramIndex++;
    }

    if (filtros.buscar) {
      query += ` AND (u.nombre ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      params.push(`%${filtros.buscar}%`);
      paramIndex++;
    }

    query += ` GROUP BY u.id_usuario ORDER BY u.nombre ASC`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  // Obtener usuario por ID
  getById: async (id) => {
    const query = `
      SELECT 
        u.id_usuario,
        u.nombre,
        u.apellido_paterno,
        u.apellido_materno,
        u.email,
        u.cedula_identidad,
        u.fecha_nacimiento,
        u.celular,
        u.foto_url,
        u.estado,
        u.intentos_fallidos,
        u.bloqueado,
        u.fecha_bloqueo,
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
    return result.rows[0];
  },

  // Obtener usuario por email
  getByEmail: async (email) => {
    const query = `SELECT * FROM usuarios WHERE email = $1`;
    const result = await pool.query(query, [email]);
    return result.rows[0];
  },

  // Crear usuario
  create: async (usuarioData) => {
    const { 
      nombre, 
      apellido_paterno, 
      apellido_materno, 
      email, 
      password, 
      cedula_identidad, 
      fecha_nacimiento, 
      celular, 
      foto_url, 
      estado 
    } = usuarioData;
    
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || 10));

    const query = `
      INSERT INTO usuarios (
        nombre, 
        apellido_paterno, 
        apellido_materno, 
        email, 
        password, 
        cedula_identidad, 
        fecha_nacimiento, 
        celular, 
        foto_url, 
        estado
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id_usuario, nombre, apellido_paterno, apellido_materno, email, cedula_identidad, fecha_nacimiento, celular, foto_url, estado, fecha_creacion
    `;

    const result = await pool.query(query, [
      nombre,
      apellido_paterno || null,
      apellido_materno || null,
      email,
      hashedPassword,
      cedula_identidad || null,
      fecha_nacimiento || null,
      celular || null,
      foto_url || null,
      estado !== undefined ? estado : true
    ]);

    return result.rows[0];
  },

  // Actualizar usuario
  update: async (id, usuarioData) => {
    const { 
      nombre, 
      apellido_paterno, 
      apellido_materno, 
      email, 
      password, 
      cedula_identidad, 
      fecha_nacimiento, 
      celular, 
      foto_url, 
      estado 
    } = usuarioData;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (nombre !== undefined) {
      updates.push(`nombre = $${paramIndex}`);
      values.push(nombre);
      paramIndex++;
    }

    if (apellido_paterno !== undefined) {
      updates.push(`apellido_paterno = $${paramIndex}`);
      values.push(apellido_paterno);
      paramIndex++;
    }

    if (apellido_materno !== undefined) {
      updates.push(`apellido_materno = $${paramIndex}`);
      values.push(apellido_materno);
      paramIndex++;
    }

    if (email !== undefined) {
      updates.push(`email = $${paramIndex}`);
      values.push(email);
      paramIndex++;
    }

    if (cedula_identidad !== undefined) {
      updates.push(`cedula_identidad = $${paramIndex}`);
      values.push(cedula_identidad);
      paramIndex++;
    }

    if (fecha_nacimiento !== undefined) {
      updates.push(`fecha_nacimiento = $${paramIndex}`);
      values.push(fecha_nacimiento);
      paramIndex++;
    }

    if (celular !== undefined) {
      updates.push(`celular = $${paramIndex}`);
      values.push(celular);
      paramIndex++;
    }

    if (foto_url !== undefined) {
      updates.push(`foto_url = $${paramIndex}`);
      values.push(foto_url);
      paramIndex++;
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || 10));
      updates.push(`password = $${paramIndex}`);
      values.push(hashedPassword);
      paramIndex++;
    }

    if (estado !== undefined) {
      updates.push(`estado = $${paramIndex}`);
      values.push(estado);
      paramIndex++;
    }

    if (updates.length === 0) {
      return null;
    }

    updates.push(`fecha_actualizacion = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE usuarios 
      SET ${updates.join(', ')} 
      WHERE id_usuario = $${paramIndex}
      RETURNING id_usuario, nombre, apellido_paterno, apellido_materno, email, cedula_identidad, fecha_nacimiento, celular, foto_url, estado
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Eliminar usuario (soft delete)
  delete: async (id) => {
    const query = `
      UPDATE usuarios 
      SET estado = false, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id_usuario = $1
      RETURNING id_usuario
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Asignar roles y permisos (con cliente de transacción)
  assignRolesAndPermissions: async (client, id_usuario, roles, permisos) => {
    // Eliminar todas las asignaciones anteriores
    await client.query('DELETE FROM usuarios_roles_permisos WHERE id_usuario = $1', [id_usuario]);

    // Obtener permisos que vienen del rol
    let permisosDelRol = [];
    
    if (roles && roles.length > 0) {
      for (const id_rol of roles) {
        const rolesPermisos = await client.query(
          'SELECT id_permiso FROM roles_permisos WHERE id_rol = $1',
          [id_rol]
        );

        // Guardar IDs de permisos que vienen del rol
        permisosDelRol = [...permisosDelRol, ...rolesPermisos.rows.map(rp => rp.id_permiso)];

        // Insertar permisos del rol con id_rol
        for (const rp of rolesPermisos.rows) {
          await client.query(
            'INSERT INTO usuarios_roles_permisos (id_usuario, id_rol, id_permiso) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [id_usuario, id_rol, rp.id_permiso]
          );
        }
      }
    }

    // Insertar solo los permisos ADICIONALES que NO vienen del rol
    if (permisos && permisos.length > 0) {
      const permisosAdicionales = permisos.filter(p => !permisosDelRol.includes(p));
      
      for (const id_permiso of permisosAdicionales) {
        await client.query(
          'INSERT INTO usuarios_roles_permisos (id_usuario, id_permiso) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [id_usuario, id_permiso]
        );
      }
    }
  },

  incrementFailedAttempts: async (id) => {
    const query = `
      UPDATE usuarios 
      SET intentos_fallidos = intentos_fallidos + 1
      WHERE id_usuario = $1
      RETURNING intentos_fallidos
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  blockUser: async (id) => {
    const query = `
      UPDATE usuarios 
      SET bloqueado = true, fecha_bloqueo = CURRENT_TIMESTAMP
      WHERE id_usuario = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  resetFailedAttempts: async (id) => {
    const query = `
      UPDATE usuarios 
      SET intentos_fallidos = 0
      WHERE id_usuario = $1
    `;
    await pool.query(query, [id]);
  },

  updateLastAccess: async (id) => {
    const query = `
      UPDATE usuarios 
      SET ultimo_acceso = CURRENT_TIMESTAMP
      WHERE id_usuario = $1
    `;
    await pool.query(query, [id]);
  }
};

module.exports = UsuarioModel;