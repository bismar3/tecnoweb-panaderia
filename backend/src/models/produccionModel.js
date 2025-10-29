const pool = require('../config/database');

const ProduccionModel = {
  // Listar todas las producciones con filtros
  getAll: async (filtros = {}) => {
    let query = `
      SELECT 
        p.id_produccion,
        p.cantidad_producir,
        p.cantidad_producida,
        p.fecha_inicio,
        p.fecha_fin,
        p.estado,
        p.observaciones,
        r.nombre as receta_nombre,
        pr.nombre as producto_nombre,
        a.nombre as almacen_nombre,
        u.nombre as usuario_nombre
      FROM producciones p
      LEFT JOIN recetas r ON p.id_receta = r.id_receta
      LEFT JOIN productos pr ON r.id_producto = pr.id_producto
      LEFT JOIN almacenes a ON p.id_almacen = a.id_almacen
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

    if (filtros.id_almacen) {
      query += ` AND p.id_almacen = $${paramIndex}`;
      params.push(filtros.id_almacen);
      paramIndex++;
    }

    if (filtros.fecha_desde) {
      query += ` AND p.fecha_inicio >= $${paramIndex}`;
      params.push(filtros.fecha_desde);
      paramIndex++;
    }

    if (filtros.fecha_hasta) {
      query += ` AND p.fecha_inicio <= $${paramIndex}`;
      params.push(filtros.fecha_hasta);
      paramIndex++;
    }

    query += ` ORDER BY p.fecha_creacion DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  // Obtener producción por ID con detalles
  getById: async (id) => {
    const client = await pool.connect();
    try {
      const produccionQuery = `
        SELECT 
          p.*,
          r.nombre as receta_nombre,
          r.rendimiento,
          r.tiempo_produccion,
          pr.nombre as producto_nombre,
          pr.codigo as producto_codigo,
          pr.unidad_medida,
          a.nombre as almacen_nombre,
          u.nombre as usuario_nombre
        FROM producciones p
        LEFT JOIN recetas r ON p.id_receta = r.id_receta
        LEFT JOIN productos pr ON r.id_producto = pr.id_producto
        LEFT JOIN almacenes a ON p.id_almacen = a.id_almacen
        LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
        WHERE p.id_produccion = $1
      `;
      const produccionResult = await client.query(produccionQuery, [id]);

      if (produccionResult.rows.length === 0) {
        return null;
      }

      const produccion = produccionResult.rows[0];

      // Obtener ingredientes de la receta
      const ingredientesQuery = `
        SELECT 
          rd.id_receta_detalle,
          rd.cantidad as cantidad_requerida,
          rd.unidad,
          p.id_producto,
          p.codigo,
          p.nombre as producto_nombre,
          pa.cantidad as stock_disponible
        FROM recetas_detalles rd
        JOIN productos p ON rd.id_producto = p.id_producto
        LEFT JOIN productos_almacenes pa ON p.id_producto = pa.id_producto 
          AND pa.id_almacen = $2
        WHERE rd.id_receta = $1
      `;
      const ingredientesResult = await client.query(ingredientesQuery, [
        produccion.id_receta,
        produccion.id_almacen
      ]);

      produccion.ingredientes = ingredientesResult.rows;

      return produccion;
    } finally {
      client.release();
    }
  },

  // Crear nueva producción (solo registra, no descuenta)
  create: async (produccionData) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { id_receta, id_almacen, id_usuario, cantidad_producir, fecha_inicio, observaciones } = produccionData;

      // Validar que la receta existe
      const recetaQuery = `SELECT * FROM recetas WHERE id_receta = $1 AND estado = true`;
      const recetaResult = await client.query(recetaQuery, [id_receta]);

      if (recetaResult.rows.length === 0) {
        throw new Error('Receta no encontrada o inactiva');
      }

      // Validar stock de ingredientes
      const ingredientesQuery = `
        SELECT 
          rd.id_producto,
          rd.cantidad as cantidad_requerida,
          p.nombre as producto_nombre,
          pa.cantidad as stock_disponible
        FROM recetas_detalles rd
        JOIN productos p ON rd.id_producto = p.id_producto
        LEFT JOIN productos_almacenes pa ON rd.id_producto = pa.id_producto 
          AND pa.id_almacen = $2
        WHERE rd.id_receta = $1
      `;
      const ingredientes = await client.query(ingredientesQuery, [id_receta, id_almacen]);

      for (const ing of ingredientes.rows) {
        const cantidadNecesaria = parseFloat(ing.cantidad_requerida) * parseFloat(cantidad_producir);
        const stockDisponible = parseFloat(ing.stock_disponible || 0);

        if (stockDisponible < cantidadNecesaria) {
          throw new Error(
            `Stock insuficiente para "${ing.producto_nombre}". ` +
            `Necesario: ${cantidadNecesaria}, Disponible: ${stockDisponible}`
          );
        }
      }

      // Insertar producción
      const insertQuery = `
        INSERT INTO producciones (
          id_receta, id_almacen, id_usuario, cantidad_producir,
          fecha_inicio, observaciones, estado
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pendiente')
        RETURNING *
      `;

      const result = await client.query(insertQuery, [
        id_receta,
        id_almacen,
        id_usuario,
        cantidad_producir,
        fecha_inicio,
        observaciones
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

  // Iniciar producción (descuenta ingredientes)
  iniciar: async (id, id_usuario) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Obtener producción
      const produccionQuery = `SELECT * FROM producciones WHERE id_produccion = $1`;
      const produccionResult = await client.query(produccionQuery, [id]);

      if (produccionResult.rows.length === 0) {
        throw new Error('Producción no encontrada');
      }

      const produccion = produccionResult.rows[0];

      if (produccion.estado !== 'pendiente') {
        throw new Error(`No se puede iniciar producción en estado: ${produccion.estado}`);
      }

      // Obtener ingredientes
      const ingredientesQuery = `
        SELECT 
          rd.id_producto,
          rd.cantidad as cantidad_unitaria,
          rd.unidad,
          p.nombre as producto_nombre,
          p.precio_venta as costo_unitario
        FROM recetas_detalles rd
        JOIN productos p ON rd.id_producto = p.id_producto
        WHERE rd.id_receta = $1
      `;
      const ingredientes = await client.query(ingredientesQuery, [produccion.id_receta]);

      // Descontar ingredientes y registrar movimientos
      for (const ing of ingredientes.rows) {
        const cantidadDescontar = parseFloat(ing.cantidad_unitaria) * parseFloat(produccion.cantidad_producir);

        // Actualizar inventario
        const updateInventarioQuery = `
          UPDATE productos_almacenes 
          SET cantidad = cantidad - $1,
              ultima_actualizacion = CURRENT_TIMESTAMP
          WHERE id_producto = $2 AND id_almacen = $3
        `;
        await client.query(updateInventarioQuery, [
          cantidadDescontar,
          ing.id_producto,
          produccion.id_almacen
        ]);

        // Registrar movimiento de egreso
        const movimientoQuery = `
          INSERT INTO movimientos_inventario (
            tipo, id_producto, id_almacen, cantidad, costo_unitario,
            motivo, referencia, id_usuario
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        await client.query(movimientoQuery, [
          'egreso',
          ing.id_producto,
          produccion.id_almacen,
          cantidadDescontar,
          ing.costo_unitario,
          'Producción',
          `PROD-${id}`,
          id_usuario
        ]);
      }

      // Actualizar estado de producción
      const updateProduccionQuery = `
        UPDATE producciones 
        SET estado = 'en_proceso',
            fecha_inicio = CURRENT_TIMESTAMP
        WHERE id_produccion = $1
        RETURNING *
      `;
      const result = await client.query(updateProduccionQuery, [id]);

      await client.query('COMMIT');
      return result.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Completar producción (aumenta producto terminado en inventario)
  completar: async (id, cantidad_producida, id_usuario) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Obtener producción
      const produccionQuery = `
        SELECT p.*, r.id_producto
        FROM producciones p
        JOIN recetas r ON p.id_receta = r.id_receta
        WHERE p.id_produccion = $1
      `;
      const produccionResult = await client.query(produccionQuery, [id]);

      if (produccionResult.rows.length === 0) {
        throw new Error('Producción no encontrada');
      }

      const produccion = produccionResult.rows[0];

      if (produccion.estado !== 'en_proceso') {
        throw new Error(`No se puede completar producción en estado: ${produccion.estado}`);
      }

      // Verificar si el producto existe en el almacén
      const checkProductoQuery = `
        SELECT * FROM productos_almacenes 
        WHERE id_producto = $1 AND id_almacen = $2
      `;
      const checkResult = await client.query(checkProductoQuery, [
        produccion.id_producto,
        produccion.id_almacen
      ]);

      if (checkResult.rows.length === 0) {
        // Insertar producto en almacén si no existe
        await client.query(`
          INSERT INTO productos_almacenes (id_producto, id_almacen, cantidad)
          VALUES ($1, $2, 0)
        `, [produccion.id_producto, produccion.id_almacen]);
      }

      // Aumentar inventario del producto terminado
      const updateInventarioQuery = `
        UPDATE productos_almacenes 
        SET cantidad = cantidad + $1,
            ultima_actualizacion = CURRENT_TIMESTAMP
        WHERE id_producto = $2 AND id_almacen = $3
      `;
      await client.query(updateInventarioQuery, [
        cantidad_producida,
        produccion.id_producto,
        produccion.id_almacen
      ]);

      // Registrar movimiento de ingreso
      const productoQuery = `SELECT precio_venta FROM productos WHERE id_producto = $1`;
      const productoResult = await client.query(productoQuery, [produccion.id_producto]);
      const costoUnitario = productoResult.rows[0].precio_venta;

      const movimientoQuery = `
        INSERT INTO movimientos_inventario (
          tipo, id_producto, id_almacen, cantidad, costo_unitario,
          motivo, referencia, id_usuario
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      await client.query(movimientoQuery, [
        'ingreso',
        produccion.id_producto,
        produccion.id_almacen,
        cantidad_producida,
        costoUnitario,
        'Producción completada',
        `PROD-${id}`,
        id_usuario
      ]);

      // Actualizar producción
      const updateProduccionQuery = `
        UPDATE producciones 
        SET estado = 'completado',
            cantidad_producida = $1,
            fecha_fin = CURRENT_TIMESTAMP
        WHERE id_produccion = $2
        RETURNING *
      `;
      const result = await client.query(updateProduccionQuery, [cantidad_producida, id]);

      await client.query('COMMIT');
      return result.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Cancelar producción
  cancelar: async (id, motivo) => {
    const query = `
      UPDATE producciones 
      SET estado = 'cancelado',
          observaciones = COALESCE(observaciones || ' | ', '') || $2
      WHERE id_produccion = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id, `Cancelado: ${motivo}`]);
    return result.rows[0];
  }
};

module.exports = ProduccionModel;