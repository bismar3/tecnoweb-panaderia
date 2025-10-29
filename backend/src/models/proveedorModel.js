const pool = require('../config/database');

const ProveedorModel = {
  // Listar todos los proveedores con filtros
  getAll: async (filtros = {}) => {
    let query = `
      SELECT 
        id_proveedor,
        nombre,
        contacto,
        telefono,
        email,
        direccion,
        nit,
        estado,
        fecha_creacion
      FROM proveedores
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (filtros.estado !== undefined) {
      query += ` AND estado = $${paramIndex}`;
      params.push(filtros.estado);
      paramIndex++;
    }

    if (filtros.nombre) {
      query += ` AND nombre ILIKE $${paramIndex}`;
      params.push(`%${filtros.nombre}%`);
      paramIndex++;
    }

    if (filtros.nit) {
      query += ` AND nit = $${paramIndex}`;
      params.push(filtros.nit);
      paramIndex++;
    }

    query += ` ORDER BY nombre ASC`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  // Obtener proveedor por ID
  getById: async (id) => {
    const query = `
      SELECT 
        p.*,
        COUNT(c.id_compra) as total_compras,
        COALESCE(SUM(c.total), 0) as monto_total_compras
      FROM proveedores p
      LEFT JOIN compras c ON p.id_proveedor = c.id_proveedor
      WHERE p.id_proveedor = $1
      GROUP BY p.id_proveedor
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  },

  // Obtener proveedor por NIT
  getByNit: async (nit) => {
    const query = `SELECT * FROM proveedores WHERE nit = $1`;
    const result = await pool.query(query, [nit]);
    return result.rows[0] || null;
  },

  // Obtener proveedor por email
  getByEmail: async (email) => {
    const query = `SELECT * FROM proveedores WHERE email = $1`;
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  },

  // Crear proveedor
  create: async (proveedorData) => {
    const { nombre, contacto, telefono, email, direccion, nit } = proveedorData;

    const query = `
      INSERT INTO proveedores (
        nombre, contacto, telefono, email, direccion, nit
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [
      nombre,
      contacto,
      telefono,
      email,
      direccion,
      nit
    ]);

    return result.rows[0];
  },

  // Actualizar proveedor
  update: async (id, proveedorData) => {
    const { nombre, contacto, telefono, email, direccion, nit, estado } = proveedorData;

    const query = `
      UPDATE proveedores SET
        nombre = COALESCE($1, nombre),
        contacto = COALESCE($2, contacto),
        telefono = COALESCE($3, telefono),
        email = COALESCE($4, email),
        direccion = COALESCE($5, direccion),
        nit = COALESCE($6, nit),
        estado = COALESCE($7, estado)
      WHERE id_proveedor = $8
      RETURNING *
    `;

    const result = await pool.query(query, [
      nombre,
      contacto,
      telefono,
      email,
      direccion,
      nit,
      estado,
      id
    ]);

    return result.rows[0];
  },

  // Cambiar estado (activar/desactivar)
  cambiarEstado: async (id, estado) => {
    const query = `
      UPDATE proveedores 
      SET estado = $1 
      WHERE id_proveedor = $2
      RETURNING *
    `;
    const result = await pool.query(query, [estado, id]);
    return result.rows[0];
  },

  // Eliminar proveedor (solo si no tiene compras)
  delete: async (id) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verificar si tiene compras
      const checkQuery = `SELECT COUNT(*) as total FROM compras WHERE id_proveedor = $1`;
      const checkResult = await client.query(checkQuery, [id]);

      if (parseInt(checkResult.rows[0].total) > 0) {
        throw new Error('No se puede eliminar el proveedor porque tiene compras registradas');
      }

      // Eliminar proveedor
      const deleteQuery = `DELETE FROM proveedores WHERE id_proveedor = $1 RETURNING *`;
      const result = await client.query(deleteQuery, [id]);

      await client.query('COMMIT');
      return result.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Obtener historial de compras de un proveedor
  getHistorialCompras: async (id, limit = 10) => {
    const query = `
      SELECT 
        c.id_compra,
        c.numero_compra,
        c.fecha_compra,
        c.total,
        c.estado,
        c.observaciones,
        u.nombre as usuario_nombre
      FROM compras c
      LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
      WHERE c.id_proveedor = $1
      ORDER BY c.fecha_compra DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [id, limit]);
    return result.rows;
  },

  // Obtener estadísticas de compras por proveedor
  getEstadisticas: async (id) => {
    const query = `
      SELECT 
        COUNT(*) as total_compras,
        COALESCE(SUM(total), 0) as monto_total,
        COALESCE(AVG(total), 0) as monto_promedio,
        MAX(fecha_compra) as ultima_compra,
        COUNT(CASE WHEN estado = 'completado' THEN 1 END) as compras_completadas,
        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as compras_pendientes
      FROM compras
      WHERE id_proveedor = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = ProveedorModel;