const pool = require('../config/database');

const AlmacenModel = {
  // Obtener todos los almacenes con información de ocupación
  getAll: async (filtros = {}) => {
    let query = `
      SELECT 
        a.id_almacen,
        a.codigo,
        a.nombre,
        a.tipo_almacen,
        a.ubicacion,
        a.capacidad_maxima,
        a.ocupacion_actual,
        a.unidad_medida,
        a.temperatura,
        a.estado,
        a.fecha_creacion,
        calcular_porcentaje_ocupacion(a.id_almacen) as porcentaje_ocupacion
      FROM almacenes a
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (filtros.estado !== undefined) {
      query += ` AND a.estado = $${paramIndex}`;
      params.push(filtros.estado);
      paramIndex++;
    }

    if (filtros.tipo_almacen) {
      query += ` AND a.tipo_almacen = $${paramIndex}`;
      params.push(filtros.tipo_almacen);
      paramIndex++;
    }

    query += ` ORDER BY a.codigo ASC`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  // Obtener almacén por ID con detalles completos
  getById: async (id) => {
    const query = `
      SELECT 
        a.*,
        calcular_porcentaje_ocupacion(a.id_almacen) as porcentaje_ocupacion,
        COUNT(DISTINCT ia.id_producto) as total_productos
      FROM almacenes a
      LEFT JOIN inventario_almacen ia ON a.id_almacen = ia.id_almacen
      WHERE a.id_almacen = $1
      GROUP BY a.id_almacen
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Crear almacén con código automático
  create: async (almacenData) => {
    const { nombre, ubicacion, capacidad_maxima, tipo_almacen, temperatura, unidad_medida, notas } = almacenData;

    // Generar código automático
    const queryMaxCodigo = `
      SELECT COALESCE(MAX(SUBSTRING(codigo FROM 5)::INTEGER), 0) as max 
      FROM almacenes 
      WHERE codigo LIKE 'ALM-%'
    `;
    const resultMax = await pool.query(queryMaxCodigo);
    const nextNum = resultMax.rows[0].max + 1;
    const codigo = `ALM-${String(nextNum).padStart(3, '0')}`;

    const query = `
      INSERT INTO almacenes (
        codigo, nombre, ubicacion, capacidad_maxima, 
        tipo_almacen, temperatura, unidad_medida, notas
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await pool.query(query, [
      codigo,
      nombre,
      ubicacion || null,
      capacidad_maxima || null,
      tipo_almacen || 'Mixto',
      temperatura || 'Ambiente',
      unidad_medida || 'm³',
      notas || null
    ]);

    return result.rows[0];
  },

  // Actualizar almacén
  update: async (id, almacenData) => {
    const { nombre, ubicacion, capacidad_maxima, tipo_almacen, temperatura, unidad_medida, estado, notas } = almacenData;

    const query = `
      UPDATE almacenes SET
        nombre = COALESCE($1, nombre),
        ubicacion = COALESCE($2, ubicacion),
        capacidad_maxima = COALESCE($3, capacidad_maxima),
        tipo_almacen = COALESCE($4, tipo_almacen),
        temperatura = COALESCE($5, temperatura),
        unidad_medida = COALESCE($6, unidad_medida),
        estado = COALESCE($7, estado),
        notas = COALESCE($8, notas)
      WHERE id_almacen = $9
      RETURNING *
    `;

    const result = await pool.query(query, [
      nombre,
      ubicacion,
      capacidad_maxima,
      tipo_almacen,
      temperatura,
      unidad_medida,
      estado,
      notas,
      id
    ]);

    return result.rows[0];
  },

  // Eliminar almacén (soft delete)
  delete: async (id) => {
    const query = `
      UPDATE almacenes 
      SET estado = false
      WHERE id_almacen = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Bloquear/Desbloquear almacén
  toggleBloqueo: async (id, bloquear = true) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE almacenes 
        SET estado = $1
        WHERE id_almacen = $2
        RETURNING *
      `;
      const result = await client.query(query, [!bloquear, id]);

      // Registrar en historial
      await client.query(`
        INSERT INTO historial_almacen (
          id_almacen, tipo_movimiento, descripcion,
          ocupacion_anterior, ocupacion_nueva
        )
        VALUES ($1, $2, $3, $4, $5)
      `, [
        id,
        'bloqueo',
        bloquear ? 'Almacén bloqueado' : 'Almacén desbloqueado',
        result.rows[0].ocupacion_actual,
        result.rows[0].ocupacion_actual
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

  // Obtener inventario del almacén
  getInventario: async (id_almacen) => {
    const query = `
      SELECT 
        ia.id_inventario,
        ia.id_producto,
        p.nombre as producto_nombre,
        p.codigo as producto_codigo,
        ia.cantidad,
        ia.volumen_ocupado,
        ia.fecha_ultima_actualizacion
      FROM inventario_almacen ia
      JOIN productos p ON ia.id_producto = p.id_producto
      WHERE ia.id_almacen = $1
      ORDER BY p.nombre ASC
    `;
    const result = await pool.query(query, [id_almacen]);
    return result.rows;
  },

  // Obtener historial de movimientos
  getHistorial: async (id_almacen, limite = 50) => {
    const query = `
      SELECT 
        id_historial,
        tipo_movimiento,
        ocupacion_anterior,
        ocupacion_nueva,
        porcentaje_anterior,
        porcentaje_nuevo,
        descripcion,
        fecha_movimiento
      FROM historial_almacen
      WHERE id_almacen = $1
      ORDER BY fecha_movimiento DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [id_almacen, limite]);
    return result.rows;
  },

  // Obtener tipos de almacén disponibles
  getTiposAlmacen: async () => {
    const query = `
      SELECT * FROM tipo_almacen 
      WHERE activo = true 
      ORDER BY nombre
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  // Obtener rangos de temperatura
  getRangosTemperatura: async () => {
    const query = `
      SELECT * FROM rango_temperatura 
      WHERE activo = true 
      ORDER BY temp_minima DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  // Validar capacidad disponible
  validarCapacidad: async (id_almacen, volumen_requerido) => {
    const query = `
      SELECT 
        capacidad_maxima,
        ocupacion_actual,
        (capacidad_maxima - ocupacion_actual) as espacio_disponible
      FROM almacenes
      WHERE id_almacen = $1
    `;
    const result = await pool.query(query, [id_almacen]);
    
    if (!result.rows[0]) return { valido: false, mensaje: 'Almacén no encontrado' };
    
    const { espacio_disponible } = result.rows[0];
    return {
      valido: espacio_disponible >= volumen_requerido,
      espacio_disponible,
      mensaje: espacio_disponible >= volumen_requerido 
        ? 'Capacidad disponible' 
        : `Espacio insuficiente. Disponible: ${espacio_disponible}`
    };
  },

  // Actualizar ocupación (llamado desde triggers, pero útil para ajustes manuales)
  recalcularOcupacion: async (id_almacen) => {
    const query = `
      UPDATE almacenes 
      SET ocupacion_actual = (
        SELECT COALESCE(SUM(volumen_ocupado), 0)
        FROM inventario_almacen
        WHERE id_almacen = $1
      )
      WHERE id_almacen = $1
      RETURNING ocupacion_actual, calcular_porcentaje_ocupacion($1) as porcentaje
    `;
    const result = await pool.query(query, [id_almacen]);
    return result.rows[0];
  },

  // Obtener productos en un almacén (manteniendo compatibilidad con código anterior)
  getProductos: async (id_almacen) => {
    // Intentar primero con la nueva tabla
    const queryNuevo = `
      SELECT 
        ia.id_inventario as id_producto_almacen,
        ia.id_producto,
        p.nombre as producto_nombre,
        p.codigo,
        ia.cantidad,
        NULL as stock_minimo,
        NULL as stock_maximo,
        ia.fecha_ultima_actualizacion as ultima_actualizacion
      FROM inventario_almacen ia
      JOIN productos p ON ia.id_producto = p.id_producto
      WHERE ia.id_almacen = $1
      ORDER BY p.nombre ASC
    `;
    
    try {
      const result = await pool.query(queryNuevo, [id_almacen]);
      return result.rows;
    } catch (error) {
      // Si falla, intentar con la tabla antigua (productos_almacenes)
      const queryAntiguo = `
        SELECT 
          pa.id_producto_almacen,
          pa.id_producto,
          p.nombre as producto_nombre,
          p.codigo,
          pa.cantidad,
          pa.stock_minimo,
          pa.stock_maximo,
          pa.ultima_actualizacion
        FROM productos_almacenes pa
        JOIN productos p ON pa.id_producto = p.id_producto
        WHERE pa.id_almacen = $1
        ORDER BY p.nombre ASC
      `;
      const result = await pool.query(queryAntiguo, [id_almacen]);
      return result.rows;
    }
  }
};

module.exports = AlmacenModel;