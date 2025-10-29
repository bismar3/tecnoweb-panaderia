const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

router.use(verifyToken);

// Listar pagos
router.get('/', checkPermission('Pago'), pagoController.getAllPagos);

// Obtener pago por ID
router.get('/:id', checkPermission('Pago'), pagoController.getPagoById);

// Obtener pagos de un pedido específico
router.get('/pedido/:id_pedido', checkPermission('Pago'), pagoController.getPagosByPedido);

// Crear pago (descuenta inventario automáticamente)
router.post('/', checkPermission('Pago'), pagoController.createPago);

// Actualizar estado del pago
router.patch('/:id/estado', checkPermission('Pago'), pagoController.updateEstadoPago);

module.exports = router;
