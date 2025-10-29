const pool = require('../config/database');

const PagoModel = {
  getAll: async (filtros = {}) => {
    let query = `
      SELECT 
        pg.id_pago,
        pg.id_pedido,
        pd.numero_pedido,
        pg.id_metodo_pago,
        mp.nombre as metodo_pago,
        pg.monto,
        pg.fecha_pago,
        pg.numero_transaccion,
        pg.estado,
        pg.observaciones,
        c.nombre as cliente_nombre
      FROM pagos pg
      JOIN pedidos pd ON pg.id_pedido = pd.id_pedido
      LEFT JOIN metodos_pago mp ON pg.id_metodo_pago = mp.id_metodo_pago
      LEFT JOIN clientes c ON pd.id_cliente = c.id_cliente
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (filtros.estado) {
      query += ` AND pg.estado = $${paramIndex}`;
      params.push(filtros.estado);
      paramIndex++;
    }

    if (filtros.id_pedido) {
      query += ` AND pg.id_pedido = $${paramIndex}`;
      params.push(filtros.id_pedido);
      paramIndex++;
    }

    if (filtros.fecha_desde) {
      query += ` AND pg.fecha_pago >= $${paramIndex}`;
      params.push(filtros.fecha_desde);
      paramIndex++;
    }

    if (filtros.fecha_hasta) {
      query += ` AND pg.fecha_pago <= $${paramIndex}`;
      params.push(filtros.fecha_hasta);
      paramIndex++;
    }

    query += ` ORDER BY pg.fecha_pago DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  getById: async (id) => {
    const query = `
      SELECT 
        pg.*,
        pd.numero_pedido,
        pd.total as total_pedido,
        mp.nombre as metodo_pago,
        c.nombre as cliente_nombre
      FROM pagos pg
      JOIN pedidos pd ON pg.id_pedido = pd.id_pedido
      LEFT JOIN metodos_pago mp ON pg.id_metodo_pago = mp.id_metodo_pago
      LEFT JOIN clientes c ON pd.id_cliente = c.id_cliente
      WHERE pg.id_pago = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  getByPedido: async (id_pedido) => {
    const query = `
      SELECT pg.*, mp.nombre as metodo_pago
      FROM pagos pg
      LEFT JOIN metodos_pago mp ON pg.id_metodo_pago = mp.id_metodo_pago
      WHERE pg.id_pedido = $1
      ORDER BY pg.fecha_pago DESC
    `;
    const result = await pool.query(query, [id_pedido]);
    return result.rows;
  },

  // Crear pago simple (sin tocar inventario)
  create: async (pagoData) => {
    const { id_pedido, id_metodo_pago, monto, numero_transaccion, observaciones } = pagoData;

    const query = `
      INSERT INTO pagos (id_pedido, id_metodo_pago, monto, numero_transaccion, observaciones)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await pool.query(query, [
      id_pedido,
      id_metodo_pago || null,
      monto,
      numero_transaccion || null,
      observaciones || null
    ]);

    return result.rows[0];
  },

  // Crear pago y actualizar estado del pedido + descontar inventario (TRANSACCIÓN)
  createConActualizacion: async (pagoData) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { id_pedido, id_metodo_pago, monto, numero_transaccion, observaciones } = pagoData;

      // 1. Obtener información del pedido
      const pedidoQuery = `
        SELECT p.*, p.id_usuario, p.numero_pedido, p.observaciones
        FROM pedidos p
        WHERE p.id_pedido = $1
      `;
      const pedidoResult = await client.query(pedidoQuery, [id_pedido]);
      
      if (pedidoResult.rows.length === 0) {
        throw new Error('Pedido no encontrado');
      }

      const pedido = pedidoResult.rows[0];

      // 2. Extraer id_almacen de las observaciones
      const obs = pedido.observaciones || '';
      const matchAlmacen = obs.match(/ID_ALMACEN:(\d+)/);
      const id_almacen = matchAlmacen ? parseInt(matchAlmacen[1]) : 1; // Default almacén 1

      // 3. Crear el pago
      const pagoQuery = `
        INSERT INTO pagos (id_pedido, id_metodo_pago, monto, numero_transaccion, observaciones, estado)
        VALUES ($1, $2, $3, $4, $5, 'completado')
        RETURNING *
      `;

      const pagoResult = await client.query(pagoQuery, [
        id_pedido,
        id_metodo_pago || null,
        monto,
        numero_transaccion || null,
        observaciones || null
      ]);

      const pago = pagoResult.rows[0];

      // 4. Obtener detalles del pedido
      const detallesQuery = `
        SELECT pd.id_producto, pd.cantidad, pd.precio_unitario
        FROM pedidos_detalles pd
        WHERE pd.id_pedido = $1
      `;
      
      const detallesResult = await client.query(detallesQuery, [id_pedido]);

      // 5. Descontar productos del inventario
      for (const detalle of detallesResult.rows) {
        // Verificar stock actual
        const stockCheck = await client.query(
          `SELECT cantidad FROM productos_almacenes WHERE id_producto = $1 AND id_almacen = $2`,
          [detalle.id_producto, id_almacen]
        );

        if (stockCheck.rows.length === 0) {
          const productoQuery = `SELECT nombre FROM productos WHERE id_producto = $1`;
          const productoResult = await client.query(productoQuery, [detalle.id_producto]);
          throw new Error(`Producto "${productoResult.rows[0].nombre}" no existe en el almacén`);
        }

        const stockActual = parseFloat(stockCheck.rows[0].cantidad);
        const cantidadSolicitada = parseFloat(detalle.cantidad);

        if (stockActual < cantidadSolicitada) {
          const productoQuery = `SELECT nombre FROM productos WHERE id_producto = $1`;
          const productoResult = await client.query(productoQuery, [detalle.id_producto]);
          throw new Error(`Stock insuficiente para "${productoResult.rows[0].nombre}". Disponible: ${stockActual}, Solicitado: ${cantidadSolicitada}`);
        }

        // Descontar del inventario
        await client.query(`
          UPDATE productos_almacenes 
          SET cantidad = cantidad - $1,
              ultima_actualizacion = CURRENT_TIMESTAMP
          WHERE id_producto = $2 AND id_almacen = $3
        `, [detalle.cantidad, detalle.id_producto, id_almacen]);

        // Registrar movimiento de inventario
        await client.query(`
          INSERT INTO movimientos_inventario (
            tipo, id_producto, id_almacen, cantidad, costo_unitario,
            motivo, referencia, id_usuario
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          'egreso',
          detalle.id_producto,
          id_almacen,
          detalle.cantidad,
          detalle.precio_unitario,
          'Venta',
          pedido.numero_pedido,
          pedido.id_usuario
        ]);
      }

      // 6. Actualizar estado del pedido a 'pagado'
      await client.query(
        `UPDATE pedidos SET estado = 'pagado' WHERE id_pedido = $1`,
        [id_pedido]
      );

      await client.query('COMMIT');
      return pago;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  updateEstado: async (id, estado, observaciones = null) => {
    const query = `
      UPDATE pagos 
      SET estado = $1,
          observaciones = COALESCE($2, observaciones)
      WHERE id_pago = $3
      RETURNING *
    `;
    const result = await pool.query(query, [estado, observaciones, id]);
    return result.rows[0];
  }
};

module.exports = PagoModel;