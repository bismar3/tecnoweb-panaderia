const pool = require('../config/database');

const IngredienteModel = {
  // Obtener todos los ingredientes
  getAll: async (filtros = {}) => {
    let query = `
      SELECT 
        i.id_ingrediente,
        i.codigo,
        i.nombre,
        i.descripcion,
        i.id_categoria,
        c.nombre as categoria_nombre,
        i.unidad_medida,
        i.costo_promedio,
        i.stock_actual,
        i.stock_minimo,
        i.estado,
        i.fecha_creacion,
        CASE 
          WHEN i.stock_actual <= i.stock_minimo THEN true 
          ELSE false 
        END as stock_bajo
      FROM ingredientes i
      LEFT JOIN categorias c ON i.id_categoria = c.id_categoria
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (filtros.estado !== undefined) {
      query += ` AND i.estado = $${paramIndex}`;
      params.push(filtros.estado);
      paramIndex++;
    }

    if (filtros.categoria) {
      query += ` AND i.id_categoria = $${paramIndex}`;
      params.push(filtros.categoria);
      paramIndex++;
    }

    if (filtros.buscar) {
      query += ` AND (i.nombre ILIKE $${paramIndex} OR i.codigo ILIKE $${paramIndex})`;
      params.push(`%${filtros.buscar}%`);
      paramIndex++;
    }

    if (filtros.stock_bajo === 'true') {
      query += ` AND i.stock_actual <= i.stock_minimo`;
    }

    query += ` ORDER BY i.nombre ASC`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  // Obtener ingrediente por ID
  getById: async (id) => {
    const query = `
      SELECT 
        i.*,
        c.nombre as categoria_nombre
      FROM ingredientes i
      LEFT JOIN categorias c ON i.id_categoria = c.id_categoria
      WHERE i.id_ingrediente = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Obtener ingrediente por código
  getByCodigo: async (codigo) => {
    const query = `SELECT * FROM ingredientes WHERE codigo = $1`;
    const result = await pool.query(query, [codigo]);
    return result.rows[0];
  },

  // Crear ingrediente
  create: async (data) => {
    const { 
      codigo, 
      nombre, 
      descripcion, 
      id_categoria, 
      unidad_medida, 
      costo_promedio,
      stock_minimo,
      estado 
    } = data;

    const query = `
      INSERT INTO ingredientes (
        codigo, 
        nombre, 
        descripcion, 
        id_categoria, 
        unidad_medida, 
        costo_promedio,
        stock_minimo,
        estado
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await pool.query(query, [
      codigo,
      nombre,
      descripcion || null,
      id_categoria || null,
      unidad_medida,
      costo_promedio || 0,
      stock_minimo || 0,
      estado !== undefined ? estado : true
    ]);

    return result.rows[0];
  },

  // Actualizar ingrediente
  update: async (id, data) => {
    const { 
      codigo, 
      nombre, 
      descripcion, 
      id_categoria, 
      unidad_medida, 
      costo_promedio,
      stock_minimo,
      estado 
    } = data;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (codigo !== undefined) {
      updates.push(`codigo = $${paramIndex}`);
      values.push(codigo);
      paramIndex++;
    }

    if (nombre !== undefined) {
      updates.push(`nombre = $${paramIndex}`);
      values.push(nombre);
      paramIndex++;
    }

    if (descripcion !== undefined) {
      updates.push(`descripcion = $${paramIndex}`);
      values.push(descripcion);
      paramIndex++;
    }

    if (id_categoria !== undefined) {
      updates.push(`id_categoria = $${paramIndex}`);
      values.push(id_categoria);
      paramIndex++;
    }

    if (unidad_medida !== undefined) {
      updates.push(`unidad_medida = $${paramIndex}`);
      values.push(unidad_medida);
      paramIndex++;
    }

    if (costo_promedio !== undefined) {
      updates.push(`costo_promedio = $${paramIndex}`);
      values.push(costo_promedio);
      paramIndex++;
    }

    if (stock_minimo !== undefined) {
      updates.push(`stock_minimo = $${paramIndex}`);
      values.push(stock_minimo);
      paramIndex++;
    }

    if (estado !== undefined) {
      updates.push(`estado = $${paramIndex}`);
      values.push(estado);
      paramIndex++;
    }

    if (updates.length === 0) {
      return null;
    }

    values.push(id);

    const query = `
      UPDATE ingredientes 
      SET ${updates.join(', ')} 
      WHERE id_ingrediente = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Actualizar stock (usado por compras y producción)
  updateStock: async (id, cantidad, operacion = 'suma') => {
    const query = operacion === 'suma' 
      ? `UPDATE ingredientes SET stock_actual = stock_actual + $1 WHERE id_ingrediente = $2 RETURNING *`
      : `UPDATE ingredientes SET stock_actual = stock_actual - $1 WHERE id_ingrediente = $2 RETURNING *`;
    
    const result = await pool.query(query, [cantidad, id]);
    return result.rows[0];
  },

  // Eliminar ingrediente (soft delete)
  delete: async (id) => {
    const query = `
      UPDATE ingredientes 
      SET estado = false
      WHERE id_ingrediente = $1
      RETURNING id_ingrediente
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Verificar si está en uso (recetas, compras, etc)
  isInUse: async (id) => {
    // Verificar en recetas
    const recetasQuery = `SELECT COUNT(*) as count FROM recetas_ingredientes WHERE id_ingrediente = $1`;
    const recetasResult = await pool.query(recetasQuery, [id]);
    
    if (parseInt(recetasResult.rows[0].count) > 0) {
      return { inUse: true, module: 'recetas' };
    }

    // Verificar en compras
    const comprasQuery = `SELECT COUNT(*) as count FROM detalle_compra WHERE id_ingrediente = $1`;
    const comprasResult = await pool.query(comprasQuery, [id]);
    
    if (parseInt(comprasResult.rows[0].count) > 0) {
      return { inUse: true, module: 'compras' };
    }

    return { inUse: false };
  },

  // Obtener ingredientes con stock bajo
  getStockBajo: async () => {
    const query = `
      SELECT * FROM ingredientes 
      WHERE estado = true 
      AND stock_actual <= stock_minimo
      ORDER BY stock_actual ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }
};

module.exports = IngredienteModel;
