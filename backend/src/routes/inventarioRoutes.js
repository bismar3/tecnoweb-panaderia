const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

router.use(verifyToken);

// Rutas existentes
router.get('/', checkPermission('Inventario'), inventarioController.getAllInventarios);
router.get('/stock-bajo', checkPermission('Inventario'), inventarioController.getStockBajo);
router.get('/:id', checkPermission('Inventario'), inventarioController.getInventarioById);
router.post('/', checkPermission('Inventario'), inventarioController.createInventario);
router.put('/:id', checkPermission('Inventario'), inventarioController.updateInventario);
router.post('/ajustar', checkPermission('Inventario'), inventarioController.ajustarStock);
router.delete('/:id', checkPermission('Inventario'), inventarioController.deleteInventario);

// NUEVAS RUTAS - Movimientos manuales
router.post('/movimiento-manual', checkPermission('Inventario'), inventarioController.registrarMovimientoManual);
router.get('/movimientos/historial', checkPermission('Inventario'), inventarioController.getMovimientos);
router.get('/movimientos/:id', checkPermission('Inventario'), inventarioController.getMovimientoById);

module.exports = router;