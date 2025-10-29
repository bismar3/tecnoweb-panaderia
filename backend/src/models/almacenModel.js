const pool = require('../config/database');

const AlmacenModel = {
  // Obtener todos los almacenes
  getAll: async (filtros = {}) => {
    let query = `
      SELECT 
        id_almacen,
        nombre,
        ubicacion,
        capacidad_maxima,
        estado,
        fecha_creacion
      FROM almacenes
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (filtros.estado !== undefined) {
      query += ` AND estado = $${paramIndex}`;
      params.push(filtros.estado);
      paramIndex++;
    }

    query += ` ORDER BY nombre ASC`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  // Obtener almacén por ID
  getById: async (id) => {
    const query = `SELECT * FROM almacenes WHERE id_almacen = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Crear almacén
  create: async (almacenData) => {
    const { nombre, ubicacion, capacidad_maxima } = almacenData;

    const query = `
      INSERT INTO almacenes (nombre, ubicacion, capacidad_maxima)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await pool.query(query, [
      nombre,
      ubicacion || null,
      capacidad_maxima || null
    ]);

    return result.rows[0];
  },

  // Actualizar almacén
  update: async (id, almacenData) => {
    const { nombre, ubicacion, capacidad_maxima, estado } = almacenData;

    const query = `
      UPDATE almacenes SET
        nombre = COALESCE($1, nombre),
        ubicacion = COALESCE($2, ubicacion),
        capacidad_maxima = COALESCE($3, capacidad_maxima),
        estado = COALESCE($4, estado)
      WHERE id_almacen = $5
      RETURNING *
    `;

    const result = await pool.query(query, [
      nombre,
      ubicacion,
      capacidad_maxima,
      estado,
      id
    ]);

    return result.rows[0];
  },

  // Eliminar almacén (soft delete)
  delete: async (id) => {
    const query = `
      UPDATE almacenes 
      SET estado = false
      WHERE id_almacen = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Obtener productos en un almacén
  getProductos: async (id_almacen) => {
    const query = `
      SELECT 
        pa.id_producto_almacen,
        pa.id_producto,
        p.nombre as producto_nombre,
        p.codigo,
        pa.cantidad,
        pa.stock_minimo,
        pa.stock_maximo,
        pa.ultima_actualizacion
      FROM productos_almacenes pa
      JOIN productos p ON pa.id_producto = p.id_producto
      WHERE pa.id_almacen = $1
      ORDER BY p.nombre ASC
    `;
    const result = await pool.query(query, [id_almacen]);
    return result.rows;
  }
};

module.exports = AlmacenModel;