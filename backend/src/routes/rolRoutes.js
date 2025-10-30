const express = require('express');
const router = express.Router();
const rolController = require('../controllers/rolController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/roles - Listar todos
router.get('/', checkPermission('Rol'), rolController.getAll);

// GET /api/roles/:id - Obtener por ID
router.get('/:id', checkPermission('Rol'), rolController.getById);

// POST /api/roles - Crear
router.post('/', checkPermission('Rol'), rolController.create);

// PUT /api/roles/:id - Actualizar
router.put('/:id', checkPermission('Rol'), rolController.update);

// DELETE /api/roles/:id - Eliminar
router.delete('/:id', checkPermission('Rol'), rolController.deleteRol);

module.exports = router;