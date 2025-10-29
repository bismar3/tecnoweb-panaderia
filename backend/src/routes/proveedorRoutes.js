const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedorController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

router.use(verifyToken);

// Listar proveedores
router.get('/', checkPermission('Proveedor'), proveedorController.getAll);

// Obtener proveedor por ID
router.get('/:id', checkPermission('Proveedor'), proveedorController.getById);

// Crear proveedor
router.post('/', checkPermission('Proveedor'), proveedorController.create);

// Actualizar proveedor
router.put('/:id', checkPermission('Proveedor'), proveedorController.update);

// Cambiar estado (activar/desactivar)
router.patch('/:id/estado', checkPermission('Proveedor'), proveedorController.cambiarEstado);

// Eliminar proveedor
router.delete('/:id', checkPermission('Proveedor'), proveedorController.deleteProveedor);

// Obtener historial de compras del proveedor
router.get('/:id/compras', checkPermission('Proveedor'), proveedorController.getHistorialCompras);

// Obtener estadísticas del proveedor
router.get('/:id/estadisticas', checkPermission('Proveedor'), proveedorController.getEstadisticas);

module.exports = router;