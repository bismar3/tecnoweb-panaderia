const pool = require('../config/database');

const InventarioModel = {
  // Obtener todo el inventario
  getAll: async (filtros = {}) => {
    let query = `
      SELECT 
        pa.id_producto_almacen,
        pa.id_producto,
        p.codigo,
        p.nombre as producto_nombre,
        pa.id_almacen,
        a.nombre as almacen_nombre,
        pa.cantidad,
        pa.stock_minimo,
        pa.stock_maximo,
        pa.ultima_actualizacion
      FROM productos_almacenes pa
      JOIN productos p ON pa.id_producto = p.id_producto
      JOIN almacenes a ON pa.id_almacen = a.id_almacen
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (filtros.id_almacen) {
      query += ` AND pa.id_almacen = $${paramIndex}`;
      params.push(filtros.id_almacen);
      paramIndex++;
    }

    if (filtros.id_producto) {
      query += ` AND pa.id_producto = $${paramIndex}`;
      params.push(filtros.id_producto);
      paramIndex++;
    }

    if (filtros.stock_bajo) {
      query += ` AND pa.cantidad <= pa.stock_minimo`;
    }

    query += ` ORDER BY p.nombre ASC`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  // Obtener inventario por ID
  getById: async (id) => {
    const query = `
      SELECT 
        pa.*,
        p.codigo,
        p.nombre as producto_nombre,
        a.nombre as almacen_nombre
      FROM productos_almacenes pa
      JOIN productos p ON pa.id_producto = p.id_producto
      JOIN almacenes a ON pa.id_almacen = a.id_almacen
      WHERE pa.id_producto_almacen = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Obtener stock de un producto en un almacén específico
  getByProductoAlmacen: async (id_producto, id_almacen) => {
    const query = `
      SELECT * FROM productos_almacenes 
      WHERE id_producto = $1 AND id_almacen = $2
    `;
    const result = await pool.query(query, [id_producto, id_almacen]);
    return result.rows[0];
  },

  // Crear registro de inventario
  create: async (inventarioData) => {
    const { id_producto, id_almacen, cantidad, stock_minimo, stock_maximo } = inventarioData;

    const query = `
      INSERT INTO productos_almacenes (id_producto, id_almacen, cantidad, stock_minimo, stock_maximo)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await pool.query(query, [
      id_producto,
      id_almacen,
      cantidad || 0,
      stock_minimo || 0,
      stock_maximo || null
    ]);

    return result.rows[0];
  },

  // Actualizar inventario
  update: async (id, inventarioData) => {
    const { cantidad, stock_minimo, stock_maximo } = inventarioData;

    const query = `
      UPDATE productos_almacenes SET
        cantidad = COALESCE($1, cantidad),
        stock_minimo = COALESCE($2, stock_minimo),
        stock_maximo = COALESCE($3, stock_maximo),
        ultima_actualizacion = CURRENT_TIMESTAMP
      WHERE id_producto_almacen = $4
      RETURNING *
    `;

    const result = await pool.query(query, [cantidad, stock_minimo, stock_maximo, id]);
    return result.rows[0];
  },

  // Ajustar stock (sumar o restar)
  ajustarStock: async (id_producto, id_almacen, cantidad, operacion = 'suma') => {
    const simbolo = operacion === 'suma' ? '+' : '-';
    
    const query = `
      UPDATE productos_almacenes 
      SET cantidad = cantidad ${simbolo} $1,
          ultima_actualizacion = CURRENT_TIMESTAMP
      WHERE id_producto = $2 AND id_almacen = $3
      RETURNING *
    `;

    const result = await pool.query(query, [cantidad, id_producto, id_almacen]);
    return result.rows[0];
  },

  // Eliminar registro de inventario
  delete: async (id) => {
    const query = `DELETE FROM productos_almacenes WHERE id_producto_almacen = $1 RETURNING *`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Productos con stock bajo
  getStockBajo: async () => {
    const query = `
      SELECT 
        pa.id_producto_almacen,
        p.codigo,
        p.nombre as producto_nombre,
        a.nombre as almacen_nombre,
        pa.cantidad,
        pa.stock_minimo,
        (pa.stock_minimo - pa.cantidad) as faltante
      FROM productos_almacenes pa
      JOIN productos p ON pa.id_producto = p.id_producto
      JOIN almacenes a ON pa.id_almacen = a.id_almacen
      WHERE pa.cantidad <= pa.stock_minimo
      ORDER BY faltante DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  // ===== NUEVAS FUNCIONES PARA MOVIMIENTOS MANUALES =====

  // Registrar movimiento manual (ingreso o egreso)
  registrarMovimientoManual: async (movimientoData) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { tipo, id_producto, id_almacen, cantidad, costo_unitario, motivo, id_usuario } = movimientoData;

      // Validar que el producto existe en el almacén
      const checkQuery = `
        SELECT * FROM productos_almacenes 
        WHERE id_producto = $1 AND id_almacen = $2
      `;
      const checkResult = await client.query(checkQuery, [id_producto, id_almacen]);

      if (checkResult.rows.length === 0) {
        // Si no existe, crear el registro
        await client.query(`
          INSERT INTO productos_almacenes (id_producto, id_almacen, cantidad)
          VALUES ($1, $2, 0)
        `, [id_producto, id_almacen]);
      }

      // Si es egreso, validar stock disponible
      if (tipo === 'egreso') {
        const stockQuery = `
          SELECT cantidad FROM productos_almacenes 
          WHERE id_producto = $1 AND id_almacen = $2
        `;
        const stockResult = await client.query(stockQuery, [id_producto, id_almacen]);
        const stockActual = parseFloat(stockResult.rows[0]?.cantidad || 0);

        if (stockActual < parseFloat(cantidad)) {
          const productoQuery = `SELECT nombre FROM productos WHERE id_producto = $1`;
          const productoResult = await client.query(productoQuery, [id_producto]);
          throw new Error(
            `Stock insuficiente para "${productoResult.rows[0].nombre}". ` +
            `Disponible: ${stockActual}, Solicitado: ${cantidad}`
          );
        }
      }

      // Actualizar inventario
      const operador = tipo === 'ingreso' ? '+' : '-';
      const updateQuery = `
        UPDATE productos_almacenes 
        SET cantidad = cantidad ${operador} $1,
            ultima_actualizacion = CURRENT_TIMESTAMP
        WHERE id_producto = $2 AND id_almacen = $3
        RETURNING cantidad
      `;
      await client.query(updateQuery, [cantidad, id_producto, id_almacen]);

      // Registrar movimiento
      const movimientoQuery = `
        INSERT INTO movimientos_inventario (
          tipo, id_producto, id_almacen, cantidad, costo_unitario,
          motivo, referencia, id_usuario
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const movimientoResult = await client.query(movimientoQuery, [
        tipo,
        id_producto,
        id_almacen,
        cantidad,
        costo_unitario,
        motivo,
        'MANUAL',
        id_usuario
      ]);

      await client.query('COMMIT');
      return movimientoResult.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Obtener historial de movimientos con filtros
  getMovimientos: async (filtros = {}) => {
    let query = `
      SELECT 
        m.id_movimiento,
        m.tipo,
        m.cantidad,
        m.costo_unitario,
        m.motivo,
        m.referencia,
        m.fecha_movimiento,
        p.codigo as producto_codigo,
        p.nombre as producto_nombre,
        a.nombre as almacen_nombre,
        u.nombre as usuario_nombre
      FROM movimientos_inventario m
      LEFT JOIN productos p ON m.id_producto = p.id_producto
      LEFT JOIN almacenes a ON m.id_almacen = a.id_almacen
      LEFT JOIN usuarios u ON m.id_usuario = u.id_usuario
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (filtros.tipo) {
      query += ` AND m.tipo = $${paramIndex}`;
      params.push(filtros.tipo);
      paramIndex++;
    }

    if (filtros.id_producto) {
      query += ` AND m.id_producto = $${paramIndex}`;
      params.push(filtros.id_producto);
      paramIndex++;
    }

    if (filtros.id_almacen) {
      query += ` AND m.id_almacen = $${paramIndex}`;
      params.push(filtros.id_almacen);
      paramIndex++;
    }

    if (filtros.motivo) {
      query += ` AND m.motivo ILIKE $${paramIndex}`;
      params.push(`%${filtros.motivo}%`);
      paramIndex++;
    }

    if (filtros.fecha_desde) {
      query += ` AND m.fecha_movimiento >= $${paramIndex}`;
      params.push(filtros.fecha_desde);
      paramIndex++;
    }

    if (filtros.fecha_hasta) {
      query += ` AND m.fecha_movimiento <= $${paramIndex}`;
      params.push(filtros.fecha_hasta);
      paramIndex++;
    }

    // Solo movimientos manuales
    if (filtros.solo_manuales) {
      query += ` AND m.referencia = 'MANUAL'`;
    }

    query += ` ORDER BY m.fecha_movimiento DESC`;

    if (filtros.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filtros.limit);
    }

    const result = await pool.query(query, params);
    return result.rows;
  },

  // Obtener movimiento por ID
  getMovimientoById: async (id) => {
    const query = `
      SELECT 
        m.*,
        p.codigo as producto_codigo,
        p.nombre as producto_nombre,
        a.nombre as almacen_nombre,
        u.nombre as usuario_nombre
      FROM movimientos_inventario m
      LEFT JOIN productos p ON m.id_producto = p.id_producto
      LEFT JOIN almacenes a ON m.id_almacen = a.id_almacen
      LEFT JOIN usuarios u ON m.id_usuario = u.id_usuario
      WHERE m.id_movimiento = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }
};

module.exports = InventarioModel;