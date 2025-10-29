const pool = require('../config/database');

const CompraModel = {
  // Obtener todas las compras
  getAll: async (filtros = {}) => {
    let query = `
      SELECT 
        c.id_compra,
        c.numero_compra,
        c.fecha_compra,
        c.estado,
        c.subtotal,
        c.impuestos,
        c.total,
        c.observaciones,
        p.nombre as proveedor_nombre,
        p.nit as proveedor_nit,
        u.nombre as usuario_nombre
      FROM compras c
      LEFT JOIN proveedores p ON c.id_proveedor = p.id_proveedor
      LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
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
        u.nombre as usuario_nombre
      FROM compras c
      LEFT JOIN proveedores p ON c.id_proveedor = p.id_proveedor
      LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
      WHERE c.id_compra = $1
    `;

    const detallesQuery = `
      SELECT 
        cd.*,
        pr.codigo as producto_codigo,
        pr.nombre as producto_nombre,
        pr.unidad_medida
      FROM compras_detalles cd
      JOIN productos pr ON cd.id_producto = pr.id_producto
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
  create: async (compraData, detalles, id_usuario, id_almacen) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Generar número de compra
      const numero_compra = await CompraModel.generarNumeroCompra();

      // Calcular subtotal y total
      let subtotal = 0;
      for (const detalle of detalles) {
        subtotal += parseFloat(detalle.costo_unitario) * parseFloat(detalle.cantidad);
      }

      const impuestos = compraData.impuestos || 0;
      const total = subtotal + impuestos;

      // Insertar compra
      const compraQuery = `
        INSERT INTO compras (
          numero_compra, id_proveedor, subtotal, impuestos, total, 
          id_usuario, observaciones, estado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const compraResult = await client.query(compraQuery, [
        numero_compra,
        compraData.id_proveedor || null,
        subtotal,
        impuestos,
        total,
        id_usuario,
        compraData.observaciones || null,
        compraData.estado || 'pendiente'
      ]);

      const compra = compraResult.rows[0];

      // Insertar detalles
      const detallesInsertados = [];
      for (const detalle of detalles) {
        const detalleQuery = `
          INSERT INTO compras_detalles (
            id_compra, id_producto, cantidad, costo_unitario, subtotal
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;

        const subtotalDetalle = parseFloat(detalle.costo_unitario) * parseFloat(detalle.cantidad);

        const detalleResult = await client.query(detalleQuery, [
          compra.id_compra,
          detalle.id_producto,
          detalle.cantidad,
          detalle.costo_unitario,
          subtotalDetalle
        ]);

        detallesInsertados.push(detalleResult.rows[0]);

        // Actualizar inventario (aumentar stock)
        const inventarioCheck = await client.query(
          'SELECT * FROM productos_almacenes WHERE id_producto = $1 AND id_almacen = $2',
          [detalle.id_producto, id_almacen]
        );

        if (inventarioCheck.rows.length > 0) {
          // Ya existe, actualizar cantidad
          await client.query(`
            UPDATE productos_almacenes 
            SET cantidad = cantidad + $1,
                ultima_actualizacion = CURRENT_TIMESTAMP
            WHERE id_producto = $2 AND id_almacen = $3
          `, [detalle.cantidad, detalle.id_producto, id_almacen]);
        } else {
          // No existe, crear registro
          await client.query(`
            INSERT INTO productos_almacenes (id_producto, id_almacen, cantidad, stock_minimo)
            VALUES ($1, $2, $3, 0)
          `, [detalle.id_producto, id_almacen, detalle.cantidad]);
        }

        // Registrar movimiento de inventario
        await client.query(`
          INSERT INTO movimientos_inventario (
            tipo, id_producto, id_almacen, cantidad, costo_unitario,
            motivo, referencia, id_usuario
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          'ingreso',
          detalle.id_producto,
          id_almacen,
          detalle.cantidad,
          detalle.costo_unitario,
          'Compra',
          numero_compra,
          id_usuario
        ]);
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

  // Actualizar compra
  update: async (id, compraData) => {
    const { estado, observaciones, impuestos } = compraData;

    const query = `
      UPDATE compras SET
        estado = COALESCE($1, estado),
        observaciones = COALESCE($2, observaciones),
        impuestos = COALESCE($3, impuestos),
        total = subtotal + COALESCE($3, impuestos)
      WHERE id_compra = $4
      RETURNING *
    `;

    const result = await pool.query(query, [
      estado,
      observaciones,
      impuestos,
      id
    ]);

    return result.rows[0];
  },

  // Actualizar estado de la compra
  updateEstado: async (id, estado) => {
    const query = `
      UPDATE compras 
      SET estado = $1
      WHERE id_compra = $2
      RETURNING *
    `;
    const result = await pool.query(query, [estado, id]);
    return result.rows[0];
  },

  // Cancelar compra
  delete: async (id) => {
    const query = `
      UPDATE compras 
      SET estado = 'cancelado'
      WHERE id_compra = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = CompraModel;