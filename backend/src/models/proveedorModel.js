const pool = require('../config/database');

const ProveedorModel = {
  // Listar todos los proveedores con filtros
  getAll: async (filtros = {}) => {
    let query = `
      SELECT 
        id_proveedor,
        nombre,
        razon_social,
        tipo_persona,
        contacto,
        telefono,
        email,
        direccion,
        nit,
        pais,
        dias_credito,
        limite_credito,
        categoria,
        forma_pago,
        calificacion_abc,
        notas_internas,
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
      query += ` AND (nombre ILIKE $${paramIndex} OR razon_social ILIKE $${paramIndex})`;
      params.push(`%${filtros.nombre}%`);
      paramIndex++;
    }

    if (filtros.nit) {
      query += ` AND nit = $${paramIndex}`;
      params.push(filtros.nit);
      paramIndex++;
    }

    if (filtros.categoria) {
      query += ` AND categoria = $${paramIndex}`;
      params.push(filtros.categoria);
      paramIndex++;
    }

    if (filtros.calificacion_abc) {
      query += ` AND calificacion_abc = $${paramIndex}`;
      params.push(filtros.calificacion_abc);
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
        COALESCE(SUM(c.total), 0) as monto_total_compras,
        MAX(c.fecha_compra) as ultima_compra
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
    const { 
      nombre, razon_social, tipo_persona, contacto, telefono, email, 
      direccion, nit, pais, dias_credito, limite_credito, categoria, 
      forma_pago, calificacion_abc, notas_internas 
    } = proveedorData;

    const query = `
      INSERT INTO proveedores (
        nombre, razon_social, tipo_persona, contacto, telefono, email, 
        direccion, nit, pais, dias_credito, limite_credito, categoria, 
        forma_pago, calificacion_abc, notas_internas
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const result = await pool.query(query, [
      nombre,
      razon_social,
      tipo_persona || 'juridica',
      contacto,
      telefono,
      email,
      direccion,
      nit,
      pais || 'Bolivia',
      dias_credito || 0,
      limite_credito || 0,
      categoria || 'regular',
      forma_pago || 'contado',
      calificacion_abc,
      notas_internas
    ]);

    return result.rows[0];
  },

  // Actualizar proveedor
  update: async (id, proveedorData) => {
    const { 
      nombre, razon_social, tipo_persona, contacto, telefono, email, 
      direccion, nit, pais, dias_credito, limite_credito, categoria, 
      forma_pago, calificacion_abc, notas_internas, estado 
    } = proveedorData;

    const query = `
      UPDATE proveedores SET
        nombre = COALESCE($1, nombre),
        razon_social = COALESCE($2, razon_social),
        tipo_persona = COALESCE($3, tipo_persona),
        contacto = COALESCE($4, contacto),
        telefono = COALESCE($5, telefono),
        email = COALESCE($6, email),
        direccion = COALESCE($7, direccion),
        nit = COALESCE($8, nit),
        pais = COALESCE($9, pais),
        dias_credito = COALESCE($10, dias_credito),
        limite_credito = COALESCE($11, limite_credito),
        categoria = COALESCE($12, categoria),
        forma_pago = COALESCE($13, forma_pago),
        calificacion_abc = COALESCE($14, calificacion_abc),
        notas_internas = COALESCE($15, notas_internas),
        estado = COALESCE($16, estado)
      WHERE id_proveedor = $17
      RETURNING *
    `;

    const result = await pool.query(query, [
      nombre, razon_social, tipo_persona, contacto, telefono, email,
      direccion, nit, pais, dias_credito, limite_credito, categoria,
      forma_pago, calificacion_abc, notas_internas, estado, id
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