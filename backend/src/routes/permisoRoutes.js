const express = require('express');
const router = express.Router();
const permisoController = require('../controllers/permisoController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

// ✅ GET sin token (solo lectura para formularios)
router.get('/', permisoController.getAll);
router.get('/:id', permisoController.getById);

// ❌ Estas SÍ requieren token
router.post('/', verifyToken, checkPermission('Permiso'), permisoController.create);
router.put('/:id', verifyToken, checkPermission('Permiso'), permisoController.update);
router.delete('/:id', verifyToken, checkPermission('Permiso'), permisoController.deletePermiso);

module.exports = router;