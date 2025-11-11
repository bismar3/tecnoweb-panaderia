const pool = require('../config/database');

const RecetaModel = {
  getAll: async (filtros = {}) => {
    let query = `
      SELECT 
        r.id_receta,
        r.id_producto,
        r.nombre,
        r.descripcion,
        r.tiempo_produccion,
        r.rendimiento,
        r.estado,
        r.fecha_creacion,
        r.codigo,
        r.id_categoria,
        r.id_tipo,
        r.id_producto_final,
        r.unidad_rendimiento,
        r.tiempo_preparacion,
        r.tiempo_fermentacion,
        r.tiempo_horneado,
        r.temperatura,
        r.equipo,
        r.costo_total,
        r.costo_unitario,
        r.merma_porcentaje,
        r.nivel_dificultad,
        r.porciones,
        r.version,
        r.aprobado_por,
        r.fecha_aprobacion,
        r.notas,
        r.imagen_url,
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

    if (filtros.id_categoria) {
      query += ` AND r.id_categoria = $${paramIndex}`;
      params.push(filtros.id_categoria);
      paramIndex++;
    }

    if (filtros.nivel_dificultad) {
      query += ` AND r.nivel_dificultad = $${paramIndex}`;
      params.push(filtros.nivel_dificultad);
      paramIndex++;
    }

    query += ` ORDER BY r.nombre ASC`;

    const result = await pool.query(query, params);
    return result.rows;
  },

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
        i.codigo as ingrediente_codigo,
        i.nombre as ingrediente_nombre
      FROM recetas_detalles rd
      JOIN ingredientes i ON rd.id_ingrediente = i.id_ingrediente
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

  create: async (recetaData, ingredientes) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const recetaQuery = `
        INSERT INTO recetas (
          id_producto, nombre, descripcion, tiempo_produccion,
          tiempo_preparacion, tiempo_fermentacion, tiempo_horneado,
          rendimiento, unidad_rendimiento, porciones, temperatura,
          equipo, codigo, id_categoria, id_tipo, id_producto_final,
          costo_total, costo_unitario, merma_porcentaje, nivel_dificultad,
          version, aprobado_por, fecha_aprobacion, notas, imagen_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
        RETURNING *
      `;

      const recetaResult = await client.query(recetaQuery, [
        recetaData.id_producto || null,
        recetaData.nombre,
        recetaData.descripcion || null,
        recetaData.tiempo_produccion || null,
        recetaData.tiempo_preparacion || null,
        recetaData.tiempo_fermentacion || null,
        recetaData.tiempo_horneado || null,
        recetaData.rendimiento,
        recetaData.unidad_rendimiento || 'unidades',
        recetaData.porciones || null,
        recetaData.temperatura || null,
        recetaData.equipo || null,
        recetaData.codigo || null,
        recetaData.id_categoria || null,
        recetaData.id_tipo || null,
        recetaData.id_producto_final || null,
        recetaData.costo_total || 0,
        recetaData.costo_unitario || 0,
        recetaData.merma_porcentaje || 5.0,
        recetaData.nivel_dificultad || 'Media',
        recetaData.version || '1.0',
        recetaData.aprobado_por || null,
        recetaData.fecha_aprobacion || null,
        recetaData.notas || null,
        recetaData.imagen_url || null
      ]);

      const receta = recetaResult.rows[0];

      const ingredientesInsertados = [];
      for (const ingrediente of ingredientes) {
        const detalleQuery = `
          INSERT INTO recetas_detalles (id_receta, id_ingrediente, cantidad, unidad)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `;

        const detalleResult = await client.query(detalleQuery, [
          receta.id_receta,
          ingrediente.id_ingrediente,
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

  update: async (id, recetaData) => {
    const query = `
      UPDATE recetas SET
        nombre = COALESCE($1, nombre),
        descripcion = COALESCE($2, descripcion),
        tiempo_produccion = COALESCE($3, tiempo_produccion),
        tiempo_preparacion = COALESCE($4, tiempo_preparacion),
        tiempo_fermentacion = COALESCE($5, tiempo_fermentacion),
        tiempo_horneado = COALESCE($6, tiempo_horneado),
        rendimiento = COALESCE($7, rendimiento),
        unidad_rendimiento = COALESCE($8, unidad_rendimiento),
        porciones = COALESCE($9, porciones),
        temperatura = COALESCE($10, temperatura),
        equipo = COALESCE($11, equipo),
        codigo = COALESCE($12, codigo),
        id_categoria = COALESCE($13, id_categoria),
        id_tipo = COALESCE($14, id_tipo),
        id_producto_final = COALESCE($15, id_producto_final),
        costo_total = COALESCE($16, costo_total),
        costo_unitario = COALESCE($17, costo_unitario),
        merma_porcentaje = COALESCE($18, merma_porcentaje),
        nivel_dificultad = COALESCE($19, nivel_dificultad),
        version = COALESCE($20, version),
        aprobado_por = COALESCE($21, aprobado_por),
        fecha_aprobacion = COALESCE($22, fecha_aprobacion),
        notas = COALESCE($23, notas),
        imagen_url = COALESCE($24, imagen_url),
        estado = COALESCE($25, estado)
      WHERE id_receta = $26
      RETURNING *
    `;

    const result = await pool.query(query, [
      recetaData.nombre,
      recetaData.descripcion,
      recetaData.tiempo_produccion,
      recetaData.tiempo_preparacion,
      recetaData.tiempo_fermentacion,
      recetaData.tiempo_horneado,
      recetaData.rendimiento,
      recetaData.unidad_rendimiento,
      recetaData.porciones,
      recetaData.temperatura,
      recetaData.equipo,
      recetaData.codigo,
      recetaData.id_categoria,
      recetaData.id_tipo,
      recetaData.id_producto_final,
      recetaData.costo_total,
      recetaData.costo_unitario,
      recetaData.merma_porcentaje,
      recetaData.nivel_dificultad,
      recetaData.version,
      recetaData.aprobado_por,
      recetaData.fecha_aprobacion,
      recetaData.notas,
      recetaData.imagen_url,
      recetaData.estado,
      id
    ]);

    return result.rows[0];
  },

  updateIngredientes: async (id_receta, ingredientes) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query('DELETE FROM recetas_detalles WHERE id_receta = $1', [id_receta]);

      const ingredientesInsertados = [];
      for (const ingrediente of ingredientes) {
        const detalleQuery = `
          INSERT INTO recetas_detalles (id_receta, id_ingrediente, cantidad, unidad)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `;

        const detalleResult = await client.query(detalleQuery, [
          id_receta,
          ingrediente.id_ingrediente,
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

  delete: async (id) => {
    const query = `UPDATE recetas SET estado = false WHERE id_receta = $1 RETURNING *`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = RecetaModel;