const pool = require('../config/database');

const RolModel = {
  // Obtener todos los roles
  getAll: async (filtros = {}) => {
    let query = `
      SELECT 
        r.id_rol,
        r.nombre,
        r.descripcion,
        r.estado,
        r.fecha_creacion,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id_permiso', p.id_permiso, 'nombre', p.nombre)
          ) FILTER (WHERE p.id_permiso IS NOT NULL),
          '[]'
        ) as permisos
      FROM roles r
      LEFT JOIN roles_permisos rp ON r.id_rol = rp.id_rol
      LEFT JOIN permisos p ON rp.id_permiso = p.id_permiso
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (filtros.estado !== undefined) {
      query += ` AND r.estado = $${paramIndex}`;
      params.push(filtros.estado);
      paramIndex++;
    }

    query += ` GROUP BY r.id_rol ORDER BY r.nombre ASC`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  // Obtener rol por ID
  getById: async (id) => {
    const query = `
      SELECT 
        r.id_rol,
        r.nombre,
        r.descripcion,
        r.estado,
        r.fecha_creacion,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id_permiso', p.id_permiso, 'nombre', p.nombre, 'descripcion', p.descripcion)
          ) FILTER (WHERE p.id_permiso IS NOT NULL),
          '[]'
        ) as permisos
      FROM roles r
      LEFT JOIN roles_permisos rp ON r.id_rol = rp.id_rol
      LEFT JOIN permisos p ON rp.id_permiso = p.id_permiso
      WHERE r.id_rol = $1
      GROUP BY r.id_rol
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Obtener rol por nombre
  getByNombre: async (nombre) => {
    const query = `SELECT * FROM roles WHERE nombre = $1`;
    const result = await pool.query(query, [nombre]);
    return result.rows[0];
  },

  // Crear rol
  create: async (rolData) => {
    const { nombre, descripcion, estado } = rolData;

    const query = `
      INSERT INTO roles (nombre, descripcion, estado)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await pool.query(query, [
      nombre,
      descripcion || null,
      estado !== undefined ? estado : true
    ]);

    return result.rows[0];
  },

  // Actualizar rol
  update: async (id, rolData) => {
    const { nombre, descripcion, estado } = rolData;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (nombre) {
      updates.push(`nombre = $${paramIndex}`);
      values.push(nombre);
      paramIndex++;
    }

    if (descripcion !== undefined) {
      updates.push(`descripcion = $${paramIndex}`);
      values.push(descripcion);
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

    values.push(id);

    const query = `
      UPDATE roles 
      SET ${updates.join(', ')} 
      WHERE id_rol = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Eliminar rol (soft delete)
  delete: async (id) => {
    const query = `
      UPDATE roles 
      SET estado = false
      WHERE id_rol = $1
      RETURNING id_rol
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Asignar permisos (con cliente de transacción)
  assignPermisos: async (client, id_rol, permisos) => {
    // Eliminar permisos anteriores
    await client.query('DELETE FROM roles_permisos WHERE id_rol = $1', [id_rol]);

    // Insertar nuevos permisos
    if (permisos && permisos.length > 0) {
      for (const id_permiso of permisos) {
        await client.query(
          'INSERT INTO roles_permisos (id_rol, id_permiso) VALUES ($1, $2)',
          [id_rol, id_permiso]
        );
      }
    }
  },

  // Verificar si hay usuarios con este rol
  hasUsers: async (id) => {
    const query = `
      SELECT COUNT(*) as count 
      FROM usuarios_roles_permisos 
      WHERE id_rol = $1
    `;
    const result = await pool.query(query, [id]);
    return parseInt(result.rows[0].count) > 0;
  }
};

module.exports = RolModel;