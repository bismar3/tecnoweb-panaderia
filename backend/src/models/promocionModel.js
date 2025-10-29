const pool = require('../config/database');

const PromocionModel = {
  // Obtener todas las promociones
  getAll: async (filtros = {}) => {
    let query = `
      SELECT 
        p.id_promocion,
        p.nombre,
        p.descripcion,
        p.tipo,
        p.valor,
        p.fecha_inicio,
        p.fecha_fin,
        p.estado,
        p.fecha_creacion,
        COUNT(pp.id_producto) as cantidad_productos
      FROM promociones p
      LEFT JOIN promociones_productos pp ON p.id_promocion = pp.id_promocion
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (filtros.estado !== undefined) {
      query += ` AND p.estado = $${paramIndex}`;
      params.push(filtros.estado);
      paramIndex++;
    }

    if (filtros.activa) {
      query += ` AND p.fecha_inicio <= CURRENT_DATE AND p.fecha_fin >= CURRENT_DATE AND p.estado = true`;
    }

    query += ` GROUP BY p.id_promocion ORDER BY p.fecha_inicio DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  // Obtener promoción por ID con productos
  getById: async (id) => {
    const promocionQuery = `
      SELECT * FROM promociones WHERE id_promocion = $1
    `;

    const productosQuery = `
      SELECT 
        pp.id_promocion_producto,
        pp.id_producto,
        pr.codigo,
        pr.nombre as producto_nombre,
        pr.precio_venta
      FROM promociones_productos pp
      JOIN productos pr ON pp.id_producto = pr.id_producto
      WHERE pp.id_promocion = $1
    `;

    const promocionResult = await pool.query(promocionQuery, [id]);
    if (promocionResult.rows.length === 0) return null;

    const productosResult = await pool.query(productosQuery, [id]);

    return {
      ...promocionResult.rows[0],
      productos: productosResult.rows
    };
  },

  // Obtener promociones activas para un producto
  getActivasByProducto: async (id_producto) => {
    const query = `
      SELECT 
        p.id_promocion,
        p.nombre,
        p.tipo,
        p.valor,
        p.fecha_inicio,
        p.fecha_fin
      FROM promociones p
      JOIN promociones_productos pp ON p.id_promocion = pp.id_promocion
      WHERE pp.id_producto = $1
        AND p.estado = true
        AND p.fecha_inicio <= CURRENT_DATE
        AND p.fecha_fin >= CURRENT_DATE
      ORDER BY p.valor DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [id_producto]);
    return result.rows[0];
  },

  // Crear promoción con productos
  create: async (promocionData, productos) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { nombre, descripcion, tipo, valor, fecha_inicio, fecha_fin } = promocionData;

      // Insertar promoción
      const promocionQuery = `
        INSERT INTO promociones (nombre, descripcion, tipo, valor, fecha_inicio, fecha_fin)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const promocionResult = await client.query(promocionQuery, [
        nombre,
        descripcion || null,
        tipo,
        valor,
        fecha_inicio,
        fecha_fin
      ]);

      const promocion = promocionResult.rows[0];

      // Insertar productos asociados
      if (productos && productos.length > 0) {
        for (const id_producto of productos) {
          await client.query(
            'INSERT INTO promociones_productos (id_promocion, id_producto) VALUES ($1, $2)',
            [promocion.id_promocion, id_producto]
          );
        }
      }

      await client.query('COMMIT');
      return promocion;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Actualizar promoción
  update: async (id, promocionData) => {
    const { nombre, descripcion, tipo, valor, fecha_inicio, fecha_fin, estado } = promocionData;

    const query = `
      UPDATE promociones SET
        nombre = COALESCE($1, nombre),
        descripcion = COALESCE($2, descripcion),
        tipo = COALESCE($3, tipo),
        valor = COALESCE($4, valor),
        fecha_inicio = COALESCE($5, fecha_inicio),
        fecha_fin = COALESCE($6, fecha_fin),
        estado = COALESCE($7, estado)
      WHERE id_promocion = $8
      RETURNING *
    `;

    const result = await pool.query(query, [
      nombre,
      descripcion,
      tipo,
      valor,
      fecha_inicio,
      fecha_fin,
      estado,
      id
    ]);

    return result.rows[0];
  },

  // Agregar producto a promoción
  addProducto: async (id_promocion, id_producto) => {
    const query = `
      INSERT INTO promociones_productos (id_promocion, id_producto)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      RETURNING *
    `;
    const result = await pool.query(query, [id_promocion, id_producto]);
    return result.rows[0];
  },

  // Eliminar producto de promoción
  removeProducto: async (id_promocion, id_producto) => {
    const query = `
      DELETE FROM promociones_productos 
      WHERE id_promocion = $1 AND id_producto = $2
      RETURNING *
    `;
    const result = await pool.query(query, [id_promocion, id_producto]);
    return result.rows[0];
  },

  // Eliminar promoción (soft delete)
  delete: async (id) => {
    const query = `
      UPDATE promociones 
      SET estado = false
      WHERE id_promocion = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Calcular descuento de un producto
  calcularDescuento: async (id_producto, precio_original) => {
    const promocion = await PromocionModel.getActivasByProducto(id_producto);
    
    if (!promocion) {
      return {
        tiene_promocion: false,
        precio_original,
        precio_final: precio_original,
        descuento: 0
      };
    }

    let descuento = 0;
    if (promocion.tipo === 'porcentaje') {
      descuento = (parseFloat(precio_original) * parseFloat(promocion.valor)) / 100;
    } else if (promocion.tipo === 'monto_fijo') {
      descuento = parseFloat(promocion.valor);
    }

    const precio_final = Math.max(0, parseFloat(precio_original) - descuento);

    return {
      tiene_promocion: true,
      promocion: promocion.nombre,
      precio_original: parseFloat(precio_original),
      precio_final,
      descuento,
      tipo: promocion.tipo,
      valor: parseFloat(promocion.valor)
    };
  }
};

module.exports = PromocionModel;