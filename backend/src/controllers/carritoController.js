const pool = require('../config/database');

// ============================================
// OBTENER CARRITO DEL USUARIO
// ============================================
const getCarrito = async (req, res) => {
  try {
    const { id_usuario } = req.user; // Del token JWT

    const query = `
      SELECT 
        c.id_carrito,
        c.id_usuario,
        c.fecha_creacion,
        COALESCE(
          json_agg(
            json_build_object(
              'id_item', ci.id_item,
              'id_producto', ci.id_producto,
              'cantidad', ci.cantidad,
              'precio_unitario', ci.precio_unitario,
              'subtotal', ci.subtotal,
              'producto', json_build_object(
                'nombre', p.nombre,
                'codigo', p.codigo,
                'imagen_url', p.imagen_url,
                'unidad_medida', p.unidad_medida,
                'precio_venta', p.precio_venta
              )
            )
          ) FILTER (WHERE ci.id_item IS NOT NULL),
          '[]'
        ) as items,
        COALESCE(SUM(ci.subtotal), 0) as total
      FROM carritos c
      LEFT JOIN carrito_items ci ON c.id_carrito = ci.id_carrito
      LEFT JOIN productos p ON ci.id_producto = p.id_producto
      WHERE c.id_usuario = $1 AND c.estado = 'activo'
      GROUP BY c.id_carrito
    `;

    const result = await pool.query(query, [id_usuario]);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        carrito: null,
        mensaje: 'Carrito vacío'
      });
    }

    res.json({
      success: true,
      carrito: result.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener carrito',
      error: error.message
    });
  }
};

// ============================================
// AGREGAR PRODUCTO AL CARRITO
// ============================================
const agregarProducto = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id_usuario } = req.user;
    const { id_producto, cantidad } = req.body;

    if (!id_producto || !cantidad || cantidad <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Producto y cantidad son requeridos'
      });
    }

    await client.query('BEGIN');

    // Verificar que el producto existe y está activo
    const producto = await client.query(
      'SELECT id_producto, nombre, precio_venta, estado FROM productos WHERE id_producto = $1',
      [id_producto]
    );

    if (producto.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    if (!producto.rows[0].estado) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Producto no disponible'
      });
    }

    // Buscar o crear carrito activo
    let carrito = await client.query(
      'SELECT id_carrito FROM carritos WHERE id_usuario = $1 AND estado = $2',
      [id_usuario, 'activo']
    );

    let id_carrito;

    if (carrito.rows.length === 0) {
      // Crear nuevo carrito
      const nuevoCarrito = await client.query(
        'INSERT INTO carritos (id_usuario, estado) VALUES ($1, $2) RETURNING id_carrito',
        [id_usuario, 'activo']
      );
      id_carrito = nuevoCarrito.rows[0].id_carrito;
    } else {
      id_carrito = carrito.rows[0].id_carrito;
    }

    // Verificar si el producto ya está en el carrito
    const itemExistente = await client.query(
      'SELECT id_item, cantidad FROM carrito_items WHERE id_carrito = $1 AND id_producto = $2',
      [id_carrito, id_producto]
    );

    const precio_unitario = parseFloat(producto.rows[0].precio_venta);

    if (itemExistente.rows.length > 0) {
      // Actualizar cantidad
      const nuevaCantidad = itemExistente.rows[0].cantidad + parseInt(cantidad);
      const nuevoSubtotal = nuevaCantidad * precio_unitario;

      await client.query(
        'UPDATE carrito_items SET cantidad = $1, subtotal = $2 WHERE id_item = $3',
        [nuevaCantidad, nuevoSubtotal, itemExistente.rows[0].id_item]
      );
    } else {
      // Agregar nuevo item
      const subtotal = parseInt(cantidad) * precio_unitario;

      await client.query(
        `INSERT INTO carrito_items (id_carrito, id_producto, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [id_carrito, id_producto, cantidad, precio_unitario, subtotal]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Producto agregado al carrito'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al agregar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar producto',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// ============================================
// ACTUALIZAR CANTIDAD DE PRODUCTO
// ============================================
const actualizarCantidad = async (req, res) => {
  try {
    const { id_item } = req.params;
    const { cantidad } = req.body;
    const { id_usuario } = req.user;

    if (!cantidad || cantidad <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Cantidad inválida'
      });
    }

    // Verificar que el item pertenece al usuario
    const verificar = await pool.query(
      `SELECT ci.id_item, ci.precio_unitario, c.id_usuario
       FROM carrito_items ci
       JOIN carritos c ON ci.id_carrito = c.id_carrito
       WHERE ci.id_item = $1 AND c.id_usuario = $2`,
      [id_item, id_usuario]
    );

    if (verificar.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item no encontrado'
      });
    }

    const precio_unitario = verificar.rows[0].precio_unitario;
    const nuevoSubtotal = parseInt(cantidad) * parseFloat(precio_unitario);

    await pool.query(
      'UPDATE carrito_items SET cantidad = $1, subtotal = $2 WHERE id_item = $3',
      [cantidad, nuevoSubtotal, id_item]
    );

    res.json({
      success: true,
      message: 'Cantidad actualizada'
    });

  } catch (error) {
    console.error('Error al actualizar cantidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar cantidad',
      error: error.message
    });
  }
};

// ============================================
// ELIMINAR PRODUCTO DEL CARRITO
// ============================================
const eliminarProducto = async (req, res) => {
  try {
    const { id_item } = req.params;
    const { id_usuario } = req.user;

    // Verificar que el item pertenece al usuario
    const verificar = await pool.query(
      `SELECT ci.id_item
       FROM carrito_items ci
       JOIN carritos c ON ci.id_carrito = c.id_carrito
       WHERE ci.id_item = $1 AND c.id_usuario = $2`,
      [id_item, id_usuario]
    );

    if (verificar.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item no encontrado'
      });
    }

    await pool.query('DELETE FROM carrito_items WHERE id_item = $1', [id_item]);

    res.json({
      success: true,
      message: 'Producto eliminado del carrito'
    });

  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto',
      error: error.message
    });
  }
};

// ============================================
// VACIAR CARRITO
// ============================================
const vaciarCarrito = async (req, res) => {
  try {
    const { id_usuario } = req.user;

    await pool.query(
      `DELETE FROM carrito_items 
       WHERE id_carrito IN (
         SELECT id_carrito FROM carritos WHERE id_usuario = $1 AND estado = 'activo'
       )`,
      [id_usuario]
    );

    res.json({
      success: true,
      message: 'Carrito vaciado'
    });

  } catch (error) {
    console.error('Error al vaciar carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al vaciar carrito',
      error: error.message
    });
  }
};

// ============================================
// OBTENER CONTADOR DE ITEMS
// ============================================
const getContador = async (req, res) => {
  try {
    const { id_usuario } = req.user;

    const result = await pool.query(
      `SELECT COALESCE(SUM(ci.cantidad), 0) as total_items
       FROM carrito_items ci
       JOIN carritos c ON ci.id_carrito = c.id_carrito
       WHERE c.id_usuario = $1 AND c.estado = 'activo'`,
      [id_usuario]
    );

    res.json({
      success: true,
      total_items: parseInt(result.rows[0].total_items)
    });

  } catch (error) {
    console.error('Error al obtener contador:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener contador',
      error: error.message
    });
  }
};

module.exports = {
  getCarrito,
  agregarProducto,
  actualizarCantidad,
  eliminarProducto,
  vaciarCarrito,
  getContador
};