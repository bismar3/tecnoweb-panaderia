const pool = require('../config/database');

const PedidoModel = {
  getAll: async (filtros = {}) => {
    let query = `
      SELECT 
        p.id_pedido,
        p.numero_pedido,
        p.fecha_pedido,
        p.fecha_entrega_estimada,
        p.estado,
        p.subtotal,
        p.descuento,
        p.total,
        p.observaciones,
        c.nombre as cliente_nombre,
        c.nit as cliente_nit,
        u.nombre as usuario_nombre
      FROM pedidos p
      LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
      LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (filtros.estado) {
      query += ` AND p.estado = $${paramIndex}`;
      params.push(filtros.estado);
      paramIndex++;
    }

    if (filtros.id_cliente) {
      query += ` AND p.id_cliente = $${paramIndex}`;
      params.push(filtros.id_cliente);
      paramIndex++;
    }

    if (filtros.fecha_desde) {
      query += ` AND p.fecha_pedido >= $${paramIndex}`;
      params.push(filtros.fecha_desde);
      paramIndex++;
    }

    if (filtros.fecha_hasta) {
      query += ` AND p.fecha_pedido <= $${paramIndex}`;
      params.push(filtros.fecha_hasta);
      paramIndex++;
    }

    query += ` ORDER BY p.fecha_pedido DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  getById: async (id) => {
    const client = await pool.connect();
    try {
      const pedidoQuery = `
        SELECT 
          p.*,
          c.nombre as cliente_nombre,
          c.email as cliente_email,
          c.telefono as cliente_telefono,
          c.nit as cliente_nit,
          u.nombre as usuario_nombre
        FROM pedidos p
        LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
        LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
        WHERE p.id_pedido = $1
      `;
      const pedidoResult = await client.query(pedidoQuery, [id]);

      if (pedidoResult.rows.length === 0) {
        return null;
      }

      const pedido = pedidoResult.rows[0];

      const detallesQuery = `
        SELECT 
          pd.*,
          pr.codigo as producto_codigo,
          pr.nombre as producto_nombre,
          pr.unidad_medida
        FROM pedidos_detalles pd
        JOIN productos pr ON pd.id_producto = pr.id_producto
        WHERE pd.id_pedido = $1
        ORDER BY pd.id_pedido_detalle
      `;
      const detallesResult = await client.query(detallesQuery, [id]);

      pedido.detalles = detallesResult.rows;

      return pedido;
    } finally {
      client.release();
    }
  },

  create: async (pedidoData) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { id_cliente, id_usuario, id_almacen, fecha_entrega_estimada, observaciones, detalles } = pedidoData;

      if (!id_almacen) {
        throw new Error('Debe especificar un almacén');
      }

      // Generar número de pedido
      const numeroQuery = `SELECT COALESCE(MAX(CAST(SUBSTRING(numero_pedido FROM 4) AS INTEGER)), 0) + 1 as siguiente FROM pedidos WHERE numero_pedido LIKE 'PED%'`;
      const numeroResult = await client.query(numeroQuery);
      const numero_pedido = `PED${String(numeroResult.rows[0].siguiente).padStart(6, '0')}`;

      // Validar stock disponible (SOLO VALIDA, NO DESCUENTA)
      let subtotal = 0;
      for (const detalle of detalles) {
        const stockQuery = `
          SELECT cantidad 
          FROM productos_almacenes 
          WHERE id_producto = $1 AND id_almacen = $2
        `;
        const stockResult = await client.query(stockQuery, [detalle.id_producto, id_almacen]);

        if (stockResult.rows.length === 0) {
          const productoQuery = `SELECT nombre FROM productos WHERE id_producto = $1`;
          const productoResult = await client.query(productoQuery, [detalle.id_producto]);
          throw new Error(`Producto "${productoResult.rows[0].nombre}" no existe en el almacén`);
        }

        const stockActual = parseFloat(stockResult.rows[0].cantidad);
        const cantidadSolicitada = parseFloat(detalle.cantidad);

        if (stockActual < cantidadSolicitada) {
          const productoQuery = `SELECT nombre FROM productos WHERE id_producto = $1`;
          const productoResult = await client.query(productoQuery, [detalle.id_producto]);
          throw new Error(`Stock insuficiente para "${productoResult.rows[0].nombre}". Disponible: ${stockActual}, Solicitado: ${cantidadSolicitada}`);
        }

        detalle.subtotal = detalle.cantidad * detalle.precio_unitario;
        subtotal += detalle.subtotal;
      }

      const descuento = pedidoData.descuento || 0;
      const total = subtotal - descuento;

      // Insertar pedido (estado: pendiente)
      const pedidoQuery = `
        INSERT INTO pedidos (
          numero_pedido, id_cliente, id_usuario, fecha_entrega_estimada,
          subtotal, descuento, total, observaciones, estado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pendiente')
        RETURNING *
      `;

      const pedidoResult = await client.query(pedidoQuery, [
        numero_pedido,
        id_cliente,
        id_usuario,
        fecha_entrega_estimada,
        subtotal,
        descuento,
        total,
        observaciones
      ]);

      const pedido = pedidoResult.rows[0];

      // Insertar detalles (SIN DESCONTAR INVENTARIO)
      const detallesInsertados = [];
      for (const detalle of detalles) {
        const detalleQuery = `
          INSERT INTO pedidos_detalles (
            id_pedido, id_producto, cantidad, precio_unitario, subtotal
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;

        const detalleResult = await client.query(detalleQuery, [
          pedido.id_pedido,
          detalle.id_producto,
          detalle.cantidad,
          detalle.precio_unitario,
          detalle.subtotal
        ]);

        detallesInsertados.push(detalleResult.rows[0]);
      }

      // Guardar id_almacen en el pedido para usarlo después al pagar
      await client.query(
        `UPDATE pedidos SET observaciones = CONCAT(COALESCE(observaciones, ''), ' | ID_ALMACEN:', $1) WHERE id_pedido = $2`,
        [id_almacen, pedido.id_pedido]
      );

      await client.query('COMMIT');

      pedido.detalles = detallesInsertados;
      pedido.id_almacen = id_almacen; // Para devolverlo en la respuesta
      return pedido;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  update: async (id, pedidoData) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { fecha_entrega_estimada, estado, observaciones, detalles } = pedidoData;

      if (detalles && detalles.length > 0) {
        await client.query('DELETE FROM pedidos_detalles WHERE id_pedido = $1', [id]);

        let subtotal = 0;
        for (const detalle of detalles) {
          detalle.subtotal = detalle.cantidad * detalle.precio_unitario;
          subtotal += detalle.subtotal;

          await client.query(`
            INSERT INTO pedidos_detalles (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
            VALUES ($1, $2, $3, $4, $5)
          `, [id, detalle.id_producto, detalle.cantidad, detalle.precio_unitario, detalle.subtotal]);
        }

        const descuento = pedidoData.descuento || 0;
        const total = subtotal - descuento;

        await client.query(`
          UPDATE pedidos SET subtotal = $1, total = $2 WHERE id_pedido = $3
        `, [subtotal, total, id]);
      }

      const updateQuery = `
        UPDATE pedidos SET
          fecha_entrega_estimada = COALESCE($1, fecha_entrega_estimada),
          estado = COALESCE($2, estado),
          observaciones = COALESCE($3, observaciones)
        WHERE id_pedido = $4
        RETURNING *
      `;

      const result = await client.query(updateQuery, [
        fecha_entrega_estimada,
        estado,
        observaciones,
        id
      ]);

      await client.query('COMMIT');
      return result.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  deleteDetalle: async (id_pedido, id_detalle) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query('DELETE FROM pedidos_detalles WHERE id_pedido_detalle = $1', [id_detalle]);

      const detallesQuery = `SELECT SUM(subtotal) as nuevo_subtotal FROM pedidos_detalles WHERE id_pedido = $1`;
      const detallesResult = await client.query(detallesQuery, [id_pedido]);
      const nuevo_subtotal = detallesResult.rows[0].nuevo_subtotal || 0;

      const pedidoQuery = `SELECT descuento FROM pedidos WHERE id_pedido = $1`;
      const pedidoResult = await client.query(pedidoQuery, [id_pedido]);
      const descuento = pedidoResult.rows[0].descuento || 0;

      const nuevo_total = nuevo_subtotal - descuento;

      await client.query(`
        UPDATE pedidos SET subtotal = $1, total = $2 WHERE id_pedido = $3
      `, [nuevo_subtotal, nuevo_total, id_pedido]);

      await client.query('COMMIT');
      return { success: true };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  cambiarEstado: async (id, nuevoEstado) => {
    const query = `UPDATE pedidos SET estado = $1 WHERE id_pedido = $2 RETURNING *`;
    const result = await pool.query(query, [nuevoEstado, id]);
    return result.rows[0];
  }
};

module.exports = PedidoModel;