const pool = require('../config/database');

const PermisoModel = {
  // Obtener todos los permisos
  getAll: async (filtros = {}) => {
    let query = `
      SELECT 
        id_permiso,
        nombre,
        descripcion,
        modulo,
        estado,
        fecha_creacion
      FROM permisos
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (filtros.estado !== undefined) {
      query += ` AND estado = $${paramIndex}`;
      params.push(filtros.estado);
      paramIndex++;
    }

    if (filtros.modulo) {
      query += ` AND modulo ILIKE $${paramIndex}`;
      params.push(`%${filtros.modulo}%`);
      paramIndex++;
    }

    query += ` ORDER BY modulo ASC, nombre ASC`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  // Obtener permiso por ID
  getById: async (id) => {
    const query = `
      SELECT 
        p.id_permiso,
        p.nombre,
        p.descripcion,
        p.modulo,
        p.estado,
        p.fecha_creacion,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id_rol', r.id_rol, 'nombre', r.nombre)
          ) FILTER (WHERE r.id_rol IS NOT NULL),
          '[]'
        ) as roles
      FROM permisos p
      LEFT JOIN roles_permisos rp ON p.id_permiso = rp.id_permiso
      LEFT JOIN roles r ON rp.id_rol = r.id_rol
      WHERE p.id_permiso = $1
      GROUP BY p.id_permiso
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Obtener permiso por nombre
  getByNombre: async (nombre) => {
    const query = `SELECT * FROM permisos WHERE nombre = $1`;
    const result = await pool.query(query, [nombre]);
    return result.rows[0];
  },

  // Crear permiso
  create: async (permisoData) => {
    const { nombre, descripcion, modulo, estado } = permisoData;

    const query = `
      INSERT INTO permisos (nombre, descripcion, modulo, estado)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [
      nombre,
      descripcion || null,
      modulo || null,
      estado !== undefined ? estado : true
    ]);

    return result.rows[0];
  },

  // Actualizar permiso
  update: async (id, permisoData) => {
    const { nombre, descripcion, modulo, estado } = permisoData;

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

    if (modulo !== undefined) {
      updates.push(`modulo = $${paramIndex}`);
      values.push(modulo);
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
      UPDATE permisos 
      SET ${updates.join(', ')} 
      WHERE id_permiso = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Eliminar permiso (soft delete)
  delete: async (id) => {
    const query = `
      UPDATE permisos 
      SET estado = false
      WHERE id_permiso = $1
      RETURNING id_permiso
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Verificar si tiene roles asignados
  hasRoles: async (id) => {
    const query = `
      SELECT COUNT(*) as count 
      FROM roles_permisos 
      WHERE id_permiso = $1
    `;
    const result = await pool.query(query, [id]);
    return parseInt(result.rows[0].count) > 0;
  },

  // Verificar si tiene usuarios asignados
  hasUsers: async (id) => {
    const query = `
      SELECT COUNT(*) as count 
      FROM usuarios_roles_permisos 
      WHERE id_permiso = $1
    `;
    const result = await pool.query(query, [id]);
    return parseInt(result.rows[0].count) > 0;
  },

  // Obtener permisos agrupados por módulo
  getAllGroupedByModule: async () => {
    const query = `
      SELECT 
        COALESCE(modulo, 'General') as modulo,
        json_agg(
          jsonb_build_object(
            'id_permiso', id_permiso,
            'nombre', nombre,
            'descripcion', descripcion
          ) ORDER BY nombre
        ) as permisos
      FROM permisos
      WHERE estado = true
      GROUP BY modulo
      ORDER BY modulo ASC
    `;

    const result = await pool.query(query);
    return result.rows;
  }
};

module.exports = PermisoModel;