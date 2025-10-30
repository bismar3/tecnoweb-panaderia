const express = require('express');
const router = express.Router();
const permisoController = require('../controllers/permisoController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/permisos - Listar todos
router.get('/', checkPermission('Permiso'), permisoController.getAll);

// GET /api/permisos/:id - Obtener por ID
router.get('/:id', checkPermission('Permiso'), permisoController.getById);

// POST /api/permisos - Crear
router.post('/', checkPermission('Permiso'), permisoController.create);

// PUT /api/permisos/:id - Actualizar
router.put('/:id', checkPermission('Permiso'), permisoController.update);

// DELETE /api/permisos/:id - Eliminar
router.delete('/:id', checkPermission('Permiso'), permisoController.deletePermiso);

module.exports = router;