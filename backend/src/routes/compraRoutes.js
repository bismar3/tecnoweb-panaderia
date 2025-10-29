const express = require('express');
const router = express.Router();
const compraController = require('../controllers/compraController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/compras - Listar todas
router.get('/', checkPermission('Compra'), compraController.getAll);

// GET /api/compras/:id - Obtener por ID con detalles
router.get('/:id', checkPermission('Compra'), compraController.getById);

// POST /api/compras - Crear compra con detalles
router.post('/', checkPermission('Compra'), compraController.create);

// PUT /api/compras/:id - Actualizar compra
router.put('/:id', checkPermission('Compra'), compraController.update);

// PATCH /api/compras/:id/estado - Cambiar solo el estado
router.patch('/:id/estado', checkPermission('Compra'), compraController.updateEstado);

// DELETE /api/compras/:id - Cancelar compra
router.delete('/:id', checkPermission('Compra'), compraController.deleteCompra);

module.exports = router;