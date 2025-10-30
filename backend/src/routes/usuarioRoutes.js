const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/usuarios - Listar todos
router.get('/', checkPermission('Usuario'), usuarioController.getAll);

// GET /api/usuarios/:id - Obtener por ID
router.get('/:id', checkPermission('Usuario'), usuarioController.getById);

// POST /api/usuarios - Crear
router.post('/', checkPermission('Usuario'), usuarioController.create);

// PUT /api/usuarios/:id - Actualizar
router.put('/:id', checkPermission('Usuario'), usuarioController.update);

// DELETE /api/usuarios/:id - Eliminar
router.delete('/:id', checkPermission('Usuario'), usuarioController.deleteUsuario);

module.exports = router;