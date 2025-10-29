const pool = require('../config/database');

const DeliveryModel = {
  getAll: async (filtros = {}) => {
    let query = `
      SELECT 
        id_delivery,
        nombre,
        telefono,
        vehiculo,
        placa,
        estado,
        fecha_creacion
      FROM deliveries
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
    const query = `SELECT * FROM deliveries WHERE id_delivery = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  create: async (deliveryData) => {
    const { nombre, telefono, vehiculo, placa } = deliveryData;

    const query = `
      INSERT INTO deliveries (nombre, telefono, vehiculo, placa)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [nombre, telefono || null, vehiculo || null, placa || null]);
    return result.rows[0];
  },

  update: async (id, deliveryData) => {
    const { nombre, telefono, vehiculo, placa, estado } = deliveryData;

    const query = `
      UPDATE deliveries SET
        nombre = COALESCE($1, nombre),
        telefono = COALESCE($2, telefono),
        vehiculo = COALESCE($3, vehiculo),
        placa = COALESCE($4, placa),
        estado = COALESCE($5, estado)
      WHERE id_delivery = $6
      RETURNING *
    `;

    const result = await pool.query(query, [nombre, telefono, vehiculo, placa, estado, id]);
    return result.rows[0];
  },

  delete: async (id) => {
    const query = `
      UPDATE deliveries 
      SET estado = false
      WHERE id_delivery = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = DeliveryModel;