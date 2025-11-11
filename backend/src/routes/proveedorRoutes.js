const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedorController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

// ✅ RUTAS PÚBLICAS (para consultas en otros módulos como compras)
router.get('/', proveedorController.getAll);
router.get('/:id', proveedorController.getById);

// 🔒 RUTAS PROTEGIDAS (requieren autenticación y permisos)
router.post('/', verifyToken, checkPermission('Proveedor'), proveedorController.create);
router.put('/:id', verifyToken, checkPermission('Proveedor'), proveedorController.update);
router.patch('/:id/estado', verifyToken, checkPermission('Proveedor'), proveedorController.cambiarEstado);
router.delete('/:id', verifyToken, checkPermission('Proveedor'), proveedorController.deleteProveedor);
router.get('/:id/compras', verifyToken, checkPermission('Proveedor'), proveedorController.getHistorialCompras);
router.get('/:id/estadisticas', verifyToken, checkPermission('Proveedor'), proveedorController.getEstadisticas);

module.exports = router;