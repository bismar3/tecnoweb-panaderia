const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

router.use(verifyToken);

// Reporte de ventas (descarga PDF)
router.post('/ventas', checkPermission('Reporte'), reporteController.reporteVentas);

// Reporte de stock bajo (descarga PDF)
router.get('/stock-bajo', checkPermission('Reporte'), reporteController.reporteStockBajo);

module.exports = router;