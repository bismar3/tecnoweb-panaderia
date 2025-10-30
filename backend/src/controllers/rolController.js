const pool = require('../config/database');

// Listar todos los roles
const getAll = async (req, res) => {
  try {
    const { estado } = req.query;
    
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

    if (estado !== undefined) {
      query += ` AND r.estado = $${paramIndex}`;
      params.push(estado === 'true');
      paramIndex++;
    }

    query += ` GROUP BY r.id_rol ORDER BY r.nombre ASC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      roles: result.rows
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

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    res.json({
      success: true,
      rol: result.rows[0]
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

    await client.query('BEGIN');

    // Verificar si el nombre ya existe
    const rolExists = await client.query(
      'SELECT id_rol FROM roles WHERE nombre = $1',
      [nombre]
    );

    if (rolExists.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Ya existe un rol con ese nombre'
      });
    }

    // Insertar rol
    const rolResult = await client.query(
      'INSERT INTO roles (nombre, descripcion, estado) VALUES ($1, $2, $3) RETURNING *',
      [nombre, descripcion || null, estado !== undefined ? estado : true]
    );

    const rol = rolResult.rows[0];

    // Asignar permisos
    if (permisos && permisos.length > 0) {
      for (const id_permiso of permisos) {
        await client.query(
          'INSERT INTO roles_permisos (id_rol, id_permiso) VALUES ($1, $2)',
          [rol.id_rol, id_permiso]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Rol creado exitosamente',
      rol
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

    await client.query('BEGIN');

    // Verificar que rol existe
    const rolCheck = await client.query(
      'SELECT id_rol FROM roles WHERE id_rol = $1',
      [id]
    );

    if (rolCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    // Verificar nombre único
    if (nombre) {
      const nombreCheck = await client.query(
        'SELECT id_rol FROM roles WHERE nombre = $1 AND id_rol != $2',
        [nombre, id]
      );

      if (nombreCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Ya existe un rol con ese nombre'
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
      const query = `UPDATE roles SET ${updates.join(', ')} WHERE id_rol = $${paramIndex} RETURNING *`;
      await client.query(query, values);
    }

    // Actualizar permisos si se proporcionan
    if (permisos !== undefined) {
      // Eliminar permisos anteriores
      await client.query('DELETE FROM roles_permisos WHERE id_rol = $1', [id]);

      // Insertar nuevos permisos
      if (permisos.length > 0) {
        for (const id_permiso of permisos) {
          await client.query(
            'INSERT INTO roles_permisos (id_rol, id_permiso) VALUES ($1, $2)',
            [id, id_permiso]
          );
        }
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Rol actualizado exitosamente'
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
    const usuariosConRol = await pool.query(
      'SELECT COUNT(*) as count FROM usuarios_roles_permisos WHERE id_rol = $1',
      [id]
    );

    if (parseInt(usuariosConRol.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el rol porque tiene usuarios asignados'
      });
    }

    const result = await pool.query(
      'UPDATE roles SET estado = false WHERE id_rol = $1 RETURNING id_rol',
      [id]
    );

    if (result.rows.length === 0) {
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