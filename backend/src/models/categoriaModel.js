const pool = require('../config/database');

const CategoriaModel = {
  // Obtener todas las categorías
  getAll: async (filtros = {}) => {
    let query = `
      SELECT 
        c.id_categoria,
        c.nombre,
        c.descripcion,
        c.estado,
        c.fecha_creacion,
        COUNT(p.id_producto) as total_productos
      FROM categorias c
      LEFT JOIN productos p ON c.id_categoria = p.id_categoria AND p.estado = true
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // Filtro por estado
    if (filtros.estado !== undefined) {
      query += ` AND c.estado = $${paramIndex}`;
      params.push(filtros.estado);
      paramIndex++;
    }

    // Filtro por búsqueda
    if (filtros.buscar) {
      query += ` AND (c.nombre ILIKE $${paramIndex} OR c.descripcion ILIKE $${paramIndex})`;
      params.push(`%${filtros.buscar}%`);
      paramIndex++;
    }

    query += ` GROUP BY c.id_categoria, c.nombre, c.descripcion, c.estado, c.fecha_creacion`;
    query += ` ORDER BY c.nombre ASC`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  // Obtener categoría por ID
  getById: async (id) => {
    const query = `
      SELECT 
        c.*,
        COUNT(p.id_producto) as total_productos
      FROM categorias c
      LEFT JOIN productos p ON c.id_categoria = p.id_categoria AND p.estado = true
      WHERE c.id_categoria = $1
      GROUP BY c.id_categoria
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Obtener categoría por nombre
  getByNombre: async (nombre) => {
    const query = `SELECT * FROM categorias WHERE LOWER(nombre) = LOWER($1)`;
    const result = await pool.query(query, [nombre]);
    return result.rows[0];
  },

  // Crear categoría
  create: async (categoriaData) => {
    const { nombre, descripcion } = categoriaData;

    const query = `
      INSERT INTO categorias (nombre, descripcion)
      VALUES ($1, $2)
      RETURNING *
    `;

    const result = await pool.query(query, [
      nombre,
      descripcion || null
    ]);

    return result.rows[0];
  },

  // Actualizar categoría
  update: async (id, categoriaData) => {
    const { nombre, descripcion, estado } = categoriaData;

    const query = `
      UPDATE categorias SET
        nombre = COALESCE($1, nombre),
        descripcion = COALESCE($2, descripcion),
        estado = COALESCE($3, estado)
      WHERE id_categoria = $4
      RETURNING *
    `;

    const result = await pool.query(query, [
      nombre,
      descripcion,
      estado,
      id
    ]);

    return result.rows[0];
  },

  // Eliminar categoría (soft delete)
  delete: async (id) => {
    const query = `
      UPDATE categorias 
      SET estado = false
      WHERE id_categoria = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Verificar si tiene productos asociados
  hasProducts: async (id) => {
    const query = `
      SELECT COUNT(*) as count
      FROM productos
      WHERE id_categoria = $1 AND estado = true
    `;
    const result = await pool.query(query, [id]);
    return parseInt(result.rows[0].count) > 0;
  }
};

module.exports = CategoriaModel;