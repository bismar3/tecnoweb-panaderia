const pool = require('../config/database');

const MetodoPagoModel = {
  getAll: async (filtros = {}) => {
    let query = `
      SELECT 
        id_metodo_pago,
        nombre,
        descripcion,
        estado
      FROM metodos_pago
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

  getById: async (id) => {
    const query = `SELECT * FROM metodos_pago WHERE id_metodo_pago = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  create: async (metodoData) => {
    const { nombre, descripcion } = metodoData;

    const query = `
      INSERT INTO metodos_pago (nombre, descripcion)
      VALUES ($1, $2)
      RETURNING *
    `;

    const result = await pool.query(query, [nombre, descripcion || null]);
    return result.rows[0];
  },

  update: async (id, metodoData) => {
    const { nombre, descripcion, estado } = metodoData;

    const query = `
      UPDATE metodos_pago SET
        nombre = COALESCE($1, nombre),
        descripcion = COALESCE($2, descripcion),
        estado = COALESCE($3, estado)
      WHERE id_metodo_pago = $4
      RETURNING *
    `;

    const result = await pool.query(query, [nombre, descripcion, estado, id]);
    return result.rows[0];
  },

  delete: async (id) => {
    const query = `
      UPDATE metodos_pago 
      SET estado = false
      WHERE id_metodo_pago = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = MetodoPagoModel;