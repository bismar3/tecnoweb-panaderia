const ReporteModel = require('../models/reporteModel');
const { generarPDFVentas, generarPDFStock } = require('../services/pdfService');
const path = require('path');
const fs = require('fs');

const reporteVentas = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta } = req.body;

    if (!fecha_desde || !fecha_hasta) {
      return res.status(400).json({
        success: false,
        message: 'Fechas desde y hasta son requeridas'
      });
    }

    // Obtener datos
    const datos = await ReporteModel.ventasPorPeriodo(fecha_desde, fecha_hasta);
    
    // Generar PDF
    const fileName = `ventas_${fecha_desde}_${fecha_hasta}_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, '../../temp', fileName);
    
    await generarPDFVentas({
      periodo: `${fecha_desde} al ${fecha_hasta}`,
      ...datos
    }, filePath);

    // Enviar PDF como descarga
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Error al enviar PDF:', err);
      }
      // Eliminar archivo después de enviarlo
      fs.unlinkSync(filePath);
    });

  } catch (error) {
    console.error('Error en reporteVentas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte',
      error: error.message
    });
  }
};

const reporteStockBajo = async (req, res) => {
  try {
    // Obtener datos
    const datos = await ReporteModel.stockBajo();
    
    // Generar PDF
    const fileName = `stock_bajo_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, '../../temp', fileName);
    
    await generarPDFStock(datos, filePath);

    // Enviar PDF como descarga
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Error al enviar PDF:', err);
      }
      // Eliminar archivo después de enviarlo
      fs.unlinkSync(filePath);
    });

  } catch (error) {
    console.error('Error en reporteStockBajo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte',
      error: error.message
    });
  }
};

module.exports = { reporteVentas, reporteStockBajo };