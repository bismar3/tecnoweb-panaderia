const pool = require('../config/database');

const EntregaModel = {
  getAll: async (filtros = {}) => {
    let query = `
      SELECT 
        e.id_entrega,
        e.id_pedido,
        p.numero_pedido,
        e.id_delivery,
        d.nombre as delivery_nombre,
        e.fecha_salida,
        e.fecha_entrega,
        e.direccion_entrega,
        e.estado,
        e.observaciones,
        e.fecha_creacion,
        c.nombre as cliente_nombre
      FROM entregas e
      JOIN pedidos p ON e.id_pedido = p.id_pedido
      LEFT JOIN deliveries d ON e.id_delivery = d.id_delivery
      LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (filtros.estado) {
      query += ` AND e.estado = $${paramIndex}`;
      params.push(filtros.estado);
      paramIndex++;
    }

    if (filtros.id_delivery) {
      query += ` AND e.id_delivery = $${paramIndex}`;
      params.push(filtros.id_delivery);
      paramIndex++;
    }

    query += ` ORDER BY e.fecha_creacion DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  getById: async (id) => {
    const query = `
      SELECT 
        e.*,
        p.numero_pedido,
        d.nombre as delivery_nombre,
        d.telefono as delivery_telefono,
        c.nombre as cliente_nombre,
        c.telefono as cliente_telefono
      FROM entregas e
      JOIN pedidos p ON e.id_pedido = p.id_pedido
      LEFT JOIN deliveries d ON e.id_delivery = d.id_delivery
      LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
      WHERE e.id_entrega = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Asignar delivery a pedido
  asignar: async (id_pedido, id_delivery, direccion_entrega) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Crear entrega
      const entregaQuery = `
        INSERT INTO entregas (id_pedido, id_delivery, direccion_entrega, estado)
        VALUES ($1, $2, $3, 'pendiente')
        RETURNING *
      `;
      const entregaResult = await client.query(entregaQuery, [id_pedido, id_delivery, direccion_entrega]);

      // Actualizar pedido a "confirmado"
      await client.query(
        `UPDATE pedidos SET estado = 'confirmado' WHERE id_pedido = $1`,
        [id_pedido]
      );

      await client.query('COMMIT');
      return entregaResult.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Delivery acepta entrega
  aceptar: async (id_entrega) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Obtener id_pedido
      const entregaQuery = `SELECT id_pedido FROM entregas WHERE id_entrega = $1`;
      const entregaResult = await client.query(entregaQuery, [id_entrega]);
      
      if (entregaResult.rows.length === 0) {
        throw new Error('Entrega no encontrada');
      }

      const id_pedido = entregaResult.rows[0].id_pedido;

      // Actualizar entrega
      const updateEntregaQuery = `
        UPDATE entregas
        SET estado = 'en_camino',
            fecha_salida = CURRENT_TIMESTAMP
        WHERE id_entrega = $1
        RETURNING *
      `;
      const result = await client.query(updateEntregaQuery, [id_entrega]);

      // Actualizar pedido a "enviado"
      await client.query(
        `UPDATE pedidos SET estado = 'enviado' WHERE id_pedido = $1`,
        [id_pedido]
      );

      await client.query('COMMIT');
      return result.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Delivery completa entrega
  completar: async (id_entrega) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Obtener id_pedido
      const entregaQuery = `SELECT id_pedido FROM entregas WHERE id_entrega = $1`;
      const entregaResult = await client.query(entregaQuery, [id_entrega]);
      
      if (entregaResult.rows.length === 0) {
        throw new Error('Entrega no encontrada');
      }

      const id_pedido = entregaResult.rows[0].id_pedido;

      // Actualizar entrega
      const updateEntregaQuery = `
        UPDATE entregas
        SET estado = 'entregado',
            fecha_entrega = CURRENT_TIMESTAMP
        WHERE id_entrega = $1
        RETURNING *
      `;
      const result = await client.query(updateEntregaQuery, [id_entrega]);

      // Actualizar pedido a "completado"
      await client.query(
        `UPDATE pedidos SET estado = 'completado' WHERE id_pedido = $1`,
        [id_pedido]
      );

      await client.query('COMMIT');
      return result.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = EntregaModel;