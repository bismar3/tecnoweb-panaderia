const pool = require('../config/database');

const ClienteModel = {
  // Obtener todos los clientes
  getAll: async (filtros = {}) => {
    let query = `
      SELECT 
        id_cliente,
        nombre,
        email,
        telefono,
        direccion,
        nit,
        tipo,
        estado,
        fecha_creacion
      FROM clientes
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (filtros.estado !== undefined) {
      query += ` AND estado = $${paramIndex}`;
      params.push(filtros.estado);
      paramIndex++;
    }

    if (filtros.tipo) {
      query += ` AND tipo = $${paramIndex}`;
      params.push(filtros.tipo);
      paramIndex++;
    }

    if (filtros.buscar) {
      query += ` AND (nombre ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR nit ILIKE $${paramIndex})`;
      params.push(`%${filtros.buscar}%`);
      paramIndex++;
    }

    query += ` ORDER BY nombre ASC`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  // Obtener cliente por ID
  getById: async (id) => {
    const query = `SELECT * FROM clientes WHERE id_cliente = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Obtener cliente por email
  getByEmail: async (email) => {
    const query = `SELECT * FROM clientes WHERE email = $1`;
    const result = await pool.query(query, [email]);
    return result.rows[0];
  },

  // Obtener cliente por NIT
  getByNit: async (nit) => {
    const query = `SELECT * FROM clientes WHERE nit = $1`;
    const result = await pool.query(query, [nit]);
    return result.rows[0];
  },

  // Crear cliente
  create: async (clienteData) => {
    const { nombre, email, telefono, direccion, nit, tipo } = clienteData;

    const query = `
      INSERT INTO clientes (nombre, email, telefono, direccion, nit, tipo)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [
      nombre,
      email || null,
      telefono || null,
      direccion || null,
      nit || null,
      tipo || 'regular'
    ]);

    return result.rows[0];
  },

  // Actualizar cliente
  update: async (id, clienteData) => {
    const { nombre, email, telefono, direccion, nit, tipo, estado } = clienteData;

    const query = `
      UPDATE clientes SET
        nombre = COALESCE($1, nombre),
        email = COALESCE($2, email),
        telefono = COALESCE($3, telefono),
        direccion = COALESCE($4, direccion),
        nit = COALESCE($5, nit),
        tipo = COALESCE($6, tipo),
        estado = COALESCE($7, estado)
      WHERE id_cliente = $8
      RETURNING *
    `;

    const result = await pool.query(query, [
      nombre,
      email,
      telefono,
      direccion,
      nit,
      tipo,
      estado,
      id
    ]);

    return result.rows[0];
  },

  // Eliminar cliente (soft delete)
  delete: async (id) => {
    const query = `
      UPDATE clientes 
      SET estado = false
      WHERE id_cliente = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = ClienteModel;