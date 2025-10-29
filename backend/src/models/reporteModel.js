const pool = require('../config/database');

const ReporteModel = {
  // Reporte 1: Ventas por período
  ventasPorPeriodo: async (fecha_desde, fecha_hasta) => {
    const query = `
      SELECT 
        p.numero_pedido,
        p.fecha_pedido,
        c.nombre as cliente,
        p.subtotal,
        p.descuento,
        p.total,
        p.estado,
        u.nombre as usuario
      FROM pedidos p
      LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
      LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
      WHERE p.fecha_pedido BETWEEN $1 AND $2
      ORDER BY p.fecha_pedido DESC
    `;
    const result = await pool.query(query, [fecha_desde, fecha_hasta]);
    
    // Calcular totales
    const totalQuery = `
      SELECT 
        COUNT(*) as total_pedidos,
        COALESCE(SUM(total), 0) as total_ventas,
        COALESCE(SUM(subtotal), 0) as total_subtotal,
        COALESCE(SUM(descuento), 0) as total_descuentos,
        COUNT(CASE WHEN estado = 'completado' THEN 1 END) as completados,
        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
        COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as cancelados
      FROM pedidos
      WHERE fecha_pedido BETWEEN $1 AND $2
    `;
    const totales = await pool.query(totalQuery, [fecha_desde, fecha_hasta]);
    
    return {
      pedidos: result.rows,
      resumen: totales.rows[0]
    };
  },

  // Reporte 2: Productos con stock bajo
  stockBajo: async () => {
    const query = `
      SELECT 
        p.codigo,
        p.nombre as producto,
        c.nombre as categoria,
        a.nombre as almacen,
        pa.cantidad,
        pa.stock_minimo,
        (pa.stock_minimo - pa.cantidad) as faltante,
        p.precio_venta
      FROM productos_almacenes pa
      JOIN productos p ON pa.id_producto = p.id_producto
      JOIN almacenes a ON pa.id_almacen = a.id_almacen
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
      WHERE pa.cantidad <= pa.stock_minimo
      ORDER BY faltante DESC
    `;
    const result = await pool.query(query);
    
    const resumenQuery = `
      SELECT 
        COUNT(*) as total_productos,
        SUM(pa.cantidad) as stock_total,
        SUM(pa.stock_minimo - pa.cantidad) as faltante_total
      FROM productos_almacenes pa
      WHERE pa.cantidad <= pa.stock_minimo
    `;
    const resumen = await pool.query(resumenQuery);
    
    return {
      productos: result.rows,
      resumen: resumen.rows[0]
    };
  }
};

module.exports = ReporteModel;