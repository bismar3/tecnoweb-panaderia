const pool = require('../config/database');

// Listar todos los permisos
const getAll = async (req, res) => {
  try {
    const { estado, modulo } = req.query;
    
    let query = `
      SELECT 
        id_permiso,
        nombre,
        descripcion,
        estado,
        fecha_creacion
      FROM permisos
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (estado !== undefined) {
      query += ` AND estado = $${paramIndex}`;
      params.push(estado === 'true');
      paramIndex++;
    }

    if (modulo) {
      query += ` AND nombre ILIKE $${paramIndex}`;
      params.push(`%${modulo}%`);
      paramIndex++;
    }

    query += ` ORDER BY nombre ASC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      permisos: result.rows
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

    const query = `
      SELECT 
        p.id_permiso,
        p.nombre,
        p.descripcion,
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

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Permiso no encontrado'
      });
    }

    res.json({
      success: true,
      permiso: result.rows[0]
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
    const { nombre, descripcion, estado } = req.body;

    // Validaciones
    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido'
      });
    }

    // Verificar si el nombre ya existe
    const permisoExists = await pool.query(
      'SELECT id_permiso FROM permisos WHERE nombre = $1',
      [nombre]
    );

    if (permisoExists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un permiso con ese nombre'
      });
    }

    // Insertar permiso
    const result = await pool.query(
      'INSERT INTO permisos (nombre, descripcion, estado) VALUES ($1, $2, $3) RETURNING *',
      [nombre, descripcion || null, estado !== undefined ? estado : true]
    );

    res.status(201).json({
      success: true,
      message: 'Permiso creado exitosamente',
      permiso: result.rows[0]
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
    const { nombre, descripcion, estado } = req.body;

    // Verificar que permiso existe
    const permisoCheck = await pool.query(
      'SELECT id_permiso FROM permisos WHERE id_permiso = $1',
      [id]
    );

    if (permisoCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Permiso no encontrado'
      });
    }

    // Verificar nombre único
    if (nombre) {
      const nombreCheck = await pool.query(
        'SELECT id_permiso FROM permisos WHERE nombre = $1 AND id_permiso != $2',
        [nombre, id]
      );

      if (nombreCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un permiso con ese nombre'
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

    values.push(id);

    if (updates.length > 0) {
      const query = `UPDATE permisos SET ${updates.join(', ')} WHERE id_permiso = $${paramIndex} RETURNING *`;
      const result = await pool.query(query, values);

      res.json({
        success: true,
        message: 'Permiso actualizado exitosamente',
        permiso: result.rows[0]
      });
    } else {
      res.json({
        success: true,
        message: 'No hay cambios para actualizar'
      });
    }

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
    const rolesConPermiso = await pool.query(
      'SELECT COUNT(*) as count FROM roles_permisos WHERE id_permiso = $1',
      [id]
    );

    const usuariosConPermiso = await pool.query(
      'SELECT COUNT(*) as count FROM usuarios_roles_permisos WHERE id_permiso = $1',
      [id]
    );

    const totalAsignaciones = 
      parseInt(rolesConPermiso.rows[0].count) + 
      parseInt(usuariosConPermiso.rows[0].count);

    if (totalAsignaciones > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el permiso porque está asignado a roles o usuarios'
      });
    }

    const result = await pool.query(
      'UPDATE permisos SET estado = false WHERE id_permiso = $1 RETURNING id_permiso',
      [id]
    );

    if (result.rows.length === 0) {
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