const express = require('express');
const router = express.Router();
const compraController = require('../controllers/compraController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/compras - Listar todas con filtros mejorados
// Filtros disponibles: estado, id_proveedor, fecha_desde, fecha_hasta, numero_factura
router.get('/', checkPermission('Compra'), compraController.getAll);

// GET /api/compras/:id - Obtener por ID con detalles completos
router.get('/:id', checkPermission('Compra'), compraController.getById);

// POST /api/compras - Crear compra con detalles
// Body: { id_proveedor, id_almacen, estado, detalles: [...], numero_factura, fecha_factura, serie_factura, forma_pago, condicion_pago, observaciones }
router.post('/', checkPermission('Compra'), compraController.create);

// PUT /api/compras/:id - Actualizar compra (no detalles)
// Body: { estado, observaciones, numero_factura, fecha_factura, serie_factura, forma_pago, condicion_pago }
router.put('/:id', checkPermission('Compra'), compraController.update);

// PATCH /api/compras/:id/estado - Cambiar solo el estado
// Body: { estado }
// Estados válidos: borrador, pendiente, recibida, facturada, pagada, cancelada
router.patch('/:id/estado', checkPermission('Compra'), compraController.updateEstado);

// DELETE /api/compras/:id - Cancelar compra (solo si está en borrador o pendiente)
router.delete('/:id', checkPermission('Compra'), compraController.deleteCompra);

module.exports = router;