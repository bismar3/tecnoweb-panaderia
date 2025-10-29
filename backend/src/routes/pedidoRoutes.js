const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

router.use(verifyToken);

// Listar pedidos
router.get('/', checkPermission('Pedido'), pedidoController.getAll);

// Obtener pedido por ID
router.get('/:id', checkPermission('Pedido'), pedidoController.getById);

// Crear pedido (valida stock, NO descuenta)
router.post('/', checkPermission('Pedido'), pedidoController.create);

// Actualizar pedido
router.put('/:id', checkPermission('Pedido'), pedidoController.update);

// Eliminar detalle de pedido
router.delete('/:id/detalle/:id_detalle', checkPermission('Pedido'), pedidoController.deleteDetalle);

// Cambiar estado del pedido
router.patch('/:id/estado', checkPermission('Pedido'), pedidoController.cambiarEstado);

module.exports = router;