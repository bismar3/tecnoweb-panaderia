const pool = require('../config/database');

const RecetaModel = {
  // Obtener todas las recetas
  getAll: async (filtros = {}) => {
    let query = `
      SELECT 
        r.id_receta,
        r.nombre,
        r.descripcion,
        r.tiempo_produccion,
        r.rendimiento,
        r.estado,
        r.fecha_creacion,
        p.codigo as producto_codigo,
        p.nombre as producto_nombre
      FROM recetas r
      LEFT JOIN productos p ON r.id_producto = p.id_producto
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (filtros.estado !== undefined) {
      query += ` AND r.estado = $${paramIndex}`;
      params.push(filtros.estado);
      paramIndex++;
    }

    if (filtros.id_producto) {
      query += ` AND r.id_producto = $${paramIndex}`;
      params.push(filtros.id_producto);
      paramIndex++;
    }

    query += ` ORDER BY r.nombre ASC`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  // Obtener receta por ID con detalles (ingredientes)
  getById: async (id) => {
    const recetaQuery = `
      SELECT 
        r.*,
        p.codigo as producto_codigo,
        p.nombre as producto_nombre,
        p.unidad_medida as producto_unidad
      FROM recetas r
      LEFT JOIN productos p ON r.id_producto = p.id_producto
      WHERE r.id_receta = $1
    `;

    const detallesQuery = `
      SELECT 
        rd.*,
        pr.codigo as ingrediente_codigo,
        pr.nombre as ingrediente_nombre
      FROM recetas_detalles rd
      JOIN productos pr ON rd.id_producto = pr.id_producto
      WHERE rd.id_receta = $1
      ORDER BY rd.id_receta_detalle ASC
    `;

    const recetaResult = await pool.query(recetaQuery, [id]);
    if (recetaResult.rows.length === 0) return null;

    const detallesResult = await pool.query(detallesQuery, [id]);

    return {
      ...recetaResult.rows[0],
      ingredientes: detallesResult.rows
    };
  },

  // Crear receta con ingredientes (TRANSACCIÓN)
  create: async (recetaData, ingredientes) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { id_producto, nombre, descripcion, tiempo_produccion, rendimiento } = recetaData;

      // Insertar receta
      const recetaQuery = `
        INSERT INTO recetas (
          id_producto, nombre, descripcion, tiempo_produccion, rendimiento
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const recetaResult = await client.query(recetaQuery, [
        id_producto || null,
        nombre,
        descripcion || null,
        tiempo_produccion || null,
        rendimiento
      ]);

      const receta = recetaResult.rows[0];

      // Insertar ingredientes (detalles)
      const ingredientesInsertados = [];
      for (const ingrediente of ingredientes) {
        const detalleQuery = `
          INSERT INTO recetas_detalles (
            id_receta, id_producto, cantidad, unidad
          ) VALUES ($1, $2, $3, $4)
          RETURNING *
        `;

        const detalleResult = await client.query(detalleQuery, [
          receta.id_receta,
          ingrediente.id_producto,
          ingrediente.cantidad,
          ingrediente.unidad
        ]);

        ingredientesInsertados.push(detalleResult.rows[0]);
      }

      await client.query('COMMIT');

      return {
        ...receta,
        ingredientes: ingredientesInsertados
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Actualizar receta
  update: async (id, recetaData) => {
    const { nombre, descripcion, tiempo_produccion, rendimiento, estado } = recetaData;

    const query = `
      UPDATE recetas SET
        nombre = COALESCE($1, nombre),
        descripcion = COALESCE($2, descripcion),
        tiempo_produccion = COALESCE($3, tiempo_produccion),
        rendimiento = COALESCE($4, rendimiento),
        estado = COALESCE($5, estado)
      WHERE id_receta = $6
      RETURNING *
    `;

    const result = await pool.query(query, [
      nombre,
      descripcion,
      tiempo_produccion,
      rendimiento,
      estado,
      id
    ]);

    return result.rows[0];
  },

  // Actualizar ingredientes de una receta
  updateIngredientes: async (id_receta, ingredientes) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Eliminar ingredientes anteriores
      await client.query('DELETE FROM recetas_detalles WHERE id_receta = $1', [id_receta]);

      // Insertar nuevos ingredientes
      const ingredientesInsertados = [];
      for (const ingrediente of ingredientes) {
        const detalleQuery = `
          INSERT INTO recetas_detalles (
            id_receta, id_producto, cantidad, unidad
          ) VALUES ($1, $2, $3, $4)
          RETURNING *
        `;

        const detalleResult = await client.query(detalleQuery, [
          id_receta,
          ingrediente.id_producto,
          ingrediente.cantidad,
          ingrediente.unidad
        ]);

        ingredientesInsertados.push(detalleResult.rows[0]);
      }

      await client.query('COMMIT');
      return ingredientesInsertados;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Eliminar receta (soft delete)
  delete: async (id) => {
    const query = `
      UPDATE recetas 
      SET estado = false
      WHERE id_receta = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = RecetaModel;