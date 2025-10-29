const PDFDocument = require('pdfkit');
const fs = require('fs');

const generarPDFVentas = (datos, filePath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      
      doc.pipe(stream);

      // Encabezado
      doc.fontSize(24).font('Helvetica-Bold').text('REPORTE DE VENTAS', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).font('Helvetica').text(`Período: ${datos.periodo}`, { align: 'center' });
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Resumen
      const r = datos.resumen;
      doc.fontSize(14).font('Helvetica-Bold').text('RESUMEN EJECUTIVO');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Total de Pedidos: ${r.total_pedidos}`);
      doc.text(`Subtotal: Bs. ${parseFloat(r.total_subtotal).toFixed(2)}`);
      doc.text(`Descuentos: Bs. ${parseFloat(r.total_descuentos).toFixed(2)}`);
      doc.text(`Total Ventas: Bs. ${parseFloat(r.total_ventas).toFixed(2)}`);
      doc.moveDown();
      doc.text(`Completados: ${r.completados} | Pendientes: ${r.pendientes} | Cancelados: ${r.cancelados}`);
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Tabla de pedidos
      doc.fontSize(14).font('Helvetica-Bold').text('DETALLE DE PEDIDOS');
      doc.moveDown();

      // Encabezado de tabla
      doc.fontSize(9).font('Helvetica-Bold');
      const startY = doc.y;
      doc.text('N° Pedido', 50, startY, { width: 80, continued: true });
      doc.text('Fecha', 130, startY, { width: 80, continued: true });
      doc.text('Cliente', 210, startY, { width: 120, continued: true });
      doc.text('Total', 330, startY, { width: 70, continued: true });
      doc.text('Estado', 400, startY, { width: 80 });
      
      doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
      doc.moveDown();

      // Filas de tabla
      doc.fontSize(8).font('Helvetica');
      datos.pedidos.forEach(pedido => {
        const y = doc.y;
        
        if (y > 700) { // Nueva página si se acaba el espacio
          doc.addPage();
        }
        
        doc.text(pedido.numero_pedido, 50, y, { width: 80, continued: true });
        doc.text(new Date(pedido.fecha_pedido).toLocaleDateString(), 130, y, { width: 80, continued: true });
        doc.text(pedido.cliente || 'N/A', 210, y, { width: 120, continued: true });
        doc.text(`Bs. ${parseFloat(pedido.total).toFixed(2)}`, 330, y, { width: 70, continued: true });
        doc.text(pedido.estado, 400, y, { width: 80 });
        
        doc.moveDown(0.5);
      });

      // Pie de página
      doc.fontSize(8).text(`Generado: ${new Date().toLocaleString()}`, 50, 750, { align: 'right' });

      doc.end();

      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

const generarPDFStock = (datos, filePath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      
      doc.pipe(stream);

      // Encabezado
      doc.fontSize(24).font('Helvetica-Bold').text('REPORTE DE STOCK BAJO', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).font('Helvetica').text(`Fecha: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Resumen
      const r = datos.resumen;
      doc.fontSize(14).font('Helvetica-Bold').text('RESUMEN');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Total Productos con Stock Bajo: ${r.total_productos}`);
      doc.text(`Stock Total Actual: ${r.stock_total}`);
      doc.text(`Cantidad Total Faltante: ${r.faltante_total}`);
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Tabla de productos
      doc.fontSize(14).font('Helvetica-Bold').text('PRODUCTOS CON STOCK BAJO');
      doc.moveDown();

      // Encabezado de tabla
      doc.fontSize(9).font('Helvetica-Bold');
      const startY = doc.y;
      doc.text('Código', 50, startY, { width: 60, continued: true });
      doc.text('Producto', 110, startY, { width: 150, continued: true });
      doc.text('Almacén', 260, startY, { width: 80, continued: true });
      doc.text('Stock', 340, startY, { width: 50, continued: true });
      doc.text('Mínimo', 390, startY, { width: 50, continued: true });
      doc.text('Faltante', 440, startY, { width: 50 });
      
      doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
      doc.moveDown();

      // Filas de tabla
      doc.fontSize(8).font('Helvetica');
      datos.productos.forEach(prod => {
        const y = doc.y;
        
        if (y > 700) {
          doc.addPage();
        }
        
        doc.text(prod.codigo, 50, y, { width: 60, continued: true });
        doc.text(prod.producto, 110, y, { width: 150, continued: true });
        doc.text(prod.almacen, 260, y, { width: 80, continued: true });
        doc.text(prod.cantidad.toString(), 340, y, { width: 50, continued: true });
        doc.text(prod.stock_minimo.toString(), 390, y, { width: 50, continued: true });
        doc.text(prod.faltante.toString(), 440, y, { width: 50 });
        
        doc.moveDown(0.5);
      });

      // Pie de página
      doc.fontSize(8).text(`Generado: ${new Date().toLocaleString()}`, 50, 750, { align: 'right' });

      doc.end();

      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generarPDFVentas, generarPDFStock };