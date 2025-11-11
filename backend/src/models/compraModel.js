const pool = require('../config/database');

const CompraModel = {
  // Obtener todas las compras con filtros mejorados
  getAll: async (filtros = {}) => {
    let query = `
      SELECT 
        c.id_compra,
        c.numero_compra,
        c.fecha_compra,
        c.estado,
        c.subtotal,
        c.subtotal_exento,
        c.subtotal_gravado,
        c.iva,
        c.impuestos,
        c.total,
        c.observaciones,
        c.numero_factura,
        c.fecha_factura,
        c.serie_factura,
        c.forma_pago,
        c.condicion_pago,
        c.fecha_recepcion,
        c.recibido_por,
        p.nombre as proveedor_nombre,
        p.nit as proveedor_nit,
        u.nombre as usuario_nombre,
        ur.nombre as recibido_por_nombre,
        a.nombre as almacen_nombre
      FROM compras c
      LEFT JOIN proveedores p ON c.id_proveedor = p.id_proveedor
      LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
      LEFT JOIN usuarios ur ON c.recibido_por = ur.id_usuario
      LEFT JOIN almacenes a ON c.id_almacen = a.id_almacen
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (filtros.estado) {
      query += ` AND c.estado = $${paramIndex}`;
      params.push(filtros.estado);
      paramIndex++;
    }

    if (filtros.id_proveedor) {
      query += ` AND c.id_proveedor = $${paramIndex}`;
      params.push(filtros.id_proveedor);
      paramIndex++;
    }

    if (filtros.fecha_desde) {
      query += ` AND c.fecha_compra >= $${paramIndex}`;
      params.push(filtros.fecha_desde);
      paramIndex++;
    }

    if (filtros.fecha_hasta) {
      query += ` AND c.fecha_compra <= $${paramIndex}`;
      params.push(filtros.fecha_hasta);
      paramIndex++;
    }

    if (filtros.numero_factura) {
      query += ` AND c.numero_factura ILIKE $${paramIndex}`;
      params.push(`%${filtros.numero_factura}%`);
      paramIndex++;
    }

    query += ` ORDER BY c.fecha_compra DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  // Obtener compra por ID con detalles
  getById: async (id) => {
    const compraQuery = `
      SELECT 
        c.*,
        p.nombre as proveedor_nombre,
        p.contacto as proveedor_contacto,
        p.telefono as proveedor_telefono,
        p.email as proveedor_email,
        p.nit as proveedor_nit,
        u.nombre as usuario_nombre,
        ur.nombre as recibido_por_nombre,
        a.nombre as almacen_nombre
      FROM compras c
      LEFT JOIN proveedores p ON c.id_proveedor = p.id_proveedor
      LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
      LEFT JOIN usuarios ur ON c.recibido_por = ur.id_usuario
      LEFT JOIN almacenes a ON c.id_almacen = a.id_almacen
      WHERE c.id_compra = $1
    `;

    const detallesQuery = `
      SELECT 
        cd.*,
        i.codigo as ingrediente_codigo,
        i.nombre as ingrediente_nombre,
        i.unidad_medida
      FROM compras_detalles cd
      JOIN ingredientes i ON cd.id_ingrediente = i.id_ingrediente
      WHERE cd.id_compra = $1
      ORDER BY cd.id_compra_detalle ASC
    `;

    const compraResult = await pool.query(compraQuery, [id]);
    if (compraResult.rows.length === 0) return null;

    const detallesResult = await pool.query(detallesQuery, [id]);

    return {
      ...compraResult.rows[0],
      detalles: detallesResult.rows
    };
  },

  // Generar número de compra único
  generarNumeroCompra: async () => {
    const result = await pool.query(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(numero_compra FROM 5) AS INTEGER)), 0) + 1 as siguiente
      FROM compras
      WHERE numero_compra LIKE 'COM-%'
    `);
    const numero = result.rows[0].siguiente;
    return `COM-${numero.toString().padStart(6, '0')}`;
  },

  // Crear compra con detalles y actualizar inventario (TRANSACCIÓN)
  create: async (compraData, detalles, id_usuario) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Generar número de compra
      const numero_compra = await CompraModel.generarNumeroCompra();

      // Calcular totales
      let subtotal = 0;
      let subtotal_exento = 0;
      let subtotal_gravado = 0;

      for (const detalle of detalles) {
        const subtotalDetalle = parseFloat(detalle.costo_unitario) * parseFloat(detalle.cantidad);
        const descuento = detalle.descuento_porcentaje 
          ? (subtotalDetalle * parseFloat(detalle.descuento_porcentaje)) / 100
          : (detalle.descuento_monto || 0);
        
        const subtotalConDescuento = subtotalDetalle - descuento;
        subtotal += subtotalConDescuento;

        // Si el ingrediente está gravado (asumimos que todos están gravados por defecto)
        subtotal_gravado += subtotalConDescuento;
      }

      const iva = subtotal_gravado * 0.13; // 13% de IVA
      const total = subtotal + iva + (compraData.impuestos_adicionales || 0);

      // Insertar compra
      const compraQuery = `
        INSERT INTO compras (
          numero_compra, id_proveedor, id_almacen, subtotal, subtotal_exento, 
          subtotal_gravado, iva, impuestos, total, id_usuario, observaciones, 
          estado, numero_factura, fecha_factura, serie_factura, forma_pago, 
          condicion_pago
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *
      `;

      const compraResult = await client.query(compraQuery, [
        numero_compra,
        compraData.id_proveedor || null,
        compraData.id_almacen,
        subtotal,
        subtotal_exento,
        subtotal_gravado,
        iva,
        compraData.impuestos_adicionales || 0,
        total,
        id_usuario,
        compraData.observaciones || null,
        compraData.estado || 'borrador',
        compraData.numero_factura || null,
        compraData.fecha_factura || null,
        compraData.serie_factura || null,
        compraData.forma_pago || null,
        compraData.condicion_pago || null
      ]);

      const compra = compraResult.rows[0];

      // Insertar detalles
      const detallesInsertados = [];
      for (const detalle of detalles) {
        const subtotalDetalle = parseFloat(detalle.costo_unitario) * parseFloat(detalle.cantidad);
        const descuento = detalle.descuento_porcentaje 
          ? (subtotalDetalle * parseFloat(detalle.descuento_porcentaje)) / 100
          : (detalle.descuento_monto || 0);
        
        const subtotalFinal = subtotalDetalle - descuento;

        const detalleQuery = `
          INSERT INTO compras_detalles (
            id_compra, id_ingrediente, cantidad, costo_unitario, 
            descuento_porcentaje, descuento_monto, subtotal
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;

        const detalleResult = await client.query(detalleQuery, [
          compra.id_compra,
          detalle.id_ingrediente,
          detalle.cantidad,
          detalle.costo_unitario,
          detalle.descuento_porcentaje || null,
          detalle.descuento_monto || null,
          subtotalFinal
        ]);

        detallesInsertados.push(detalleResult.rows[0]);

        // Solo actualizar inventario si el estado es 'recibida'
        if (compraData.estado === 'recibida') {
          await CompraModel._actualizarInventario(
            client, 
            detalle.id_ingrediente, 
            compraData.id_almacen, 
            detalle.cantidad, 
            detalle.costo_unitario,
            numero_compra,
            id_usuario
          );
        }
      }

      await client.query('COMMIT');

      return {
        ...compra,
        detalles: detallesInsertados
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Método auxiliar para actualizar inventario
  _actualizarInventario: async (client, id_ingrediente, id_almacen, cantidad, costo_unitario, numero_compra, id_usuario) => {
    // Verificar si existe el ingrediente en el almacén
    const inventarioCheck = await client.query(
      'SELECT * FROM ingredientes_almacenes WHERE id_ingrediente = $1 AND id_almacen = $2',
      [id_ingrediente, id_almacen]
    );

    if (inventarioCheck.rows.length > 0) {
      // Actualizar cantidad y costo promedio
      await client.query(`
        UPDATE ingredientes_almacenes 
        SET cantidad = cantidad + $1,
            ultima_actualizacion = CURRENT_TIMESTAMP
        WHERE id_ingrediente = $2 AND id_almacen = $3
      `, [cantidad, id_ingrediente, id_almacen]);
    } else {
      // Crear nuevo registro
      await client.query(`
        INSERT INTO ingredientes_almacenes (id_ingrediente, id_almacen, cantidad, stock_minimo)
        VALUES ($1, $2, $3, 0)
      `, [id_ingrediente, id_almacen, cantidad]);
    }

    // Actualizar costo promedio del ingrediente
    await client.query(`
      UPDATE ingredientes 
      SET costo_promedio = (
        SELECT AVG(costo_unitario) 
        FROM compras_detalles 
        WHERE id_ingrediente = $1
      )
      WHERE id_ingrediente = $1
    `, [id_ingrediente]);

    // Registrar movimiento de inventario
    await client.query(`
      INSERT INTO movimientos_ingredientes (
        tipo, id_ingrediente, id_almacen, cantidad, costo_unitario,
        motivo, referencia, id_usuario
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      'ingreso',
      id_ingrediente,
      id_almacen,
      cantidad,
      costo_unitario,
      'Compra',
      numero_compra,
      id_usuario
    ]);
  },

  // Actualizar compra
  update: async (id, compraData) => {
    const query = `
      UPDATE compras SET
        estado = COALESCE($1, estado),
        observaciones = COALESCE($2, observaciones),
        numero_factura = COALESCE($3, numero_factura),
        fecha_factura = COALESCE($4, fecha_factura),
        serie_factura = COALESCE($5, serie_factura),
        forma_pago = COALESCE($6, forma_pago),
        condicion_pago = COALESCE($7, condicion_pago)
      WHERE id_compra = $8
      RETURNING *
    `;

    const result = await pool.query(query, [
      compraData.estado,
      compraData.observaciones,
      compraData.numero_factura,
      compraData.fecha_factura,
      compraData.serie_factura,
      compraData.forma_pago,
      compraData.condicion_pago,
      id
    ]);

    return result.rows[0];
  },

  // Actualizar estado de la compra y manejar recepción
  updateEstado: async (id, estado, id_usuario_recibe = null) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Obtener la compra con detalles
      const compraResult = await client.query(
        'SELECT * FROM compras WHERE id_compra = $1',
        [id]
      );

      if (compraResult.rows.length === 0) {
        throw new Error('Compra no encontrada');
      }

      const compra = compraResult.rows[0];

      // Si se está cambiando a 'recibida' y antes no lo estaba, actualizar inventario
      if (estado === 'recibida' && compra.estado !== 'recibida') {
        const detallesResult = await client.query(
          'SELECT * FROM compras_detalles WHERE id_compra = $1',
          [id]
        );

        for (const detalle of detallesResult.rows) {
          await CompraModel._actualizarInventario(
            client,
            detalle.id_ingrediente,
            compra.id_almacen,
            detalle.cantidad,
            detalle.costo_unitario,
            compra.numero_compra,
            id_usuario_recibe || compra.id_usuario
          );
        }

        // Actualizar fecha de recepción y quien recibió
        await client.query(`
          UPDATE compras 
          SET estado = $1,
              fecha_recepcion = CURRENT_TIMESTAMP,
              recibido_por = $2
          WHERE id_compra = $3
        `, [estado, id_usuario_recibe, id]);
      } else {
        // Solo actualizar estado
        await client.query(`
          UPDATE compras 
          SET estado = $1
          WHERE id_compra = $2
        `, [estado, id]);
      }

      const result = await client.query(
        'SELECT * FROM compras WHERE id_compra = $1',
        [id]
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

  // Cancelar compra
  delete: async (id) => {
    const query = `
      UPDATE compras 
      SET estado = 'cancelada'
      WHERE id_compra = $1 AND estado IN ('borrador', 'pendiente')
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      throw new Error('No se puede cancelar una compra recibida o facturada');
    }
    
    return result.rows[0];
  }
};

module.exports = CompraModel;