const express = require('express');
const router = express.Router();
const entregaController = require('../controllers/entregaController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

router.use(verifyToken);

// Listar entregas
router.get('/', checkPermission('Entrega'), entregaController.getAll);

// Obtener entrega por ID
router.get('/:id', checkPermission('Entrega'), entregaController.getById);

// Asignar delivery a pedido
router.post('/asignar', checkPermission('Entrega'), entregaController.asignarDelivery);

// Delivery acepta entrega
router.patch('/:id/aceptar', checkPermission('Entrega'), entregaController.aceptarEntrega);

// Delivery completa entrega
router.patch('/:id/completar', checkPermission('Entrega'), entregaController.completarEntrega);

module.exports = router;