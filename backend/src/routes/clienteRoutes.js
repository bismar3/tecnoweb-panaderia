const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/clientes - Listar todos
router.get('/', checkPermission('Cliente'), clienteController.getAll);

// GET /api/clientes/:id - Obtener por ID
router.get('/:id', checkPermission('Cliente'), clienteController.getById);

// POST /api/clientes - Crear nuevo
router.post('/', checkPermission('Cliente'), clienteController.create);

// PUT /api/clientes/:id - Actualizar
router.put('/:id', checkPermission('Cliente'), clienteController.update);

// DELETE /api/clientes/:id - Eliminar (soft delete)
router.delete('/:id', checkPermission('Cliente'), clienteController.deleteCliente);

module.exports = router;