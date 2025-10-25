const pool = require('../config/database');

const ProductoModel = {
  // Obtener todos los productos
  getAll: async (filtros = {}) => {
    let query = `
      SELECT 
        p.id_producto,
        p.codigo,
        p.nombre,
        p.descripcion,
        p.id_categoria,
        p.unidad_medida,
        p.precio_venta,
        p.estado,
        p.fecha_creacion,
        c.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (filtros.estado !== undefined) {
      query += ` AND p.estado = $${paramIndex}`;
      params.push(filtros.estado);
      paramIndex++;
    }

    if (filtros.categoria) {
      query += ` AND p.id_categoria = $${paramIndex}`;
      params.push(filtros.categoria);
      paramIndex++;
    }

    if (filtros.buscar) {
      query += ` AND (p.nombre ILIKE $${paramIndex} OR p.codigo ILIKE $${paramIndex})`;
      params.push(`%${filtros.buscar}%`);
      paramIndex++;
    }

    query += ` ORDER BY p.nombre ASC`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  // Obtener producto por ID
  getById: async (id) => {
    const query = `
      SELECT 
        p.*,
        c.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
      WHERE p.id_producto = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Obtener producto por código
  getByCodigo: async (codigo) => {
    const query = `SELECT * FROM productos WHERE codigo = $1`;
    const result = await pool.query(query, [codigo]);
    return result.rows[0];
  },

  // Crear producto
  create: async (productoData) => {
    const {
      codigo,
      nombre,
      descripcion,
      id_categoria,
      unidad_medida,
      precio_venta
    } = productoData;

    const query = `
      INSERT INTO productos (
        codigo, nombre, descripcion, id_categoria, unidad_medida, precio_venta
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [
      codigo,
      nombre,
      descripcion || null,
      id_categoria || null,
      unidad_medida,
      precio_venta
    ]);

    return result.rows[0];
  },

  // Actualizar producto
  update: async (id, productoData) => {
    const {
      codigo,
      nombre,
      descripcion,
      id_categoria,
      unidad_medida,
      precio_venta,
      estado
    } = productoData;

    const query = `
      UPDATE productos SET
        codigo = COALESCE($1, codigo),
        nombre = COALESCE($2, nombre),
        descripcion = COALESCE($3, descripcion),
        id_categoria = COALESCE($4, id_categoria),
        unidad_medida = COALESCE($5, unidad_medida),
        precio_venta = COALESCE($6, precio_venta),
        estado = COALESCE($7, estado),
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id_producto = $8
      RETURNING *
    `;

    const result = await pool.query(query, [
      codigo,
      nombre,
      descripcion,
      id_categoria,
      unidad_medida,
      precio_venta,
      estado,
      id
    ]);

    return result.rows[0];
  },

  // Eliminar producto (soft delete)
  delete: async (id) => {
    const query = `
      UPDATE productos 
      SET estado = false, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id_producto = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = ProductoModel;