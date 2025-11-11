const express = require('express');
const router = express.Router();
const {
  // Funciones existentes
  getAllAlmacenes,
  getAlmacenById,
  createAlmacen,
  updateAlmacen,
  deleteAlmacen,
  getProductosAlmacen,
  
  // Nuevas funciones
  getInventarioAlmacen,
  getHistorialAlmacen,
  bloquearAlmacen,
  validarCapacidadAlmacen,
  recalcularOcupacion,
  getTiposAlmacen,
  getRangosTemperatura
} = require('../controllers/almacenController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

// ===== RUTAS PÚBLICAS (para consultas en otros módulos como compras) =====
router.get('/', getAllAlmacenes);
router.get('/catalogos/tipos', getTiposAlmacen);
router.get('/catalogos/temperaturas', getRangosTemperatura);
router.get('/:id', getAlmacenById);
router.get('/:id/productos', getProductosAlmacen);
router.get('/:id/inventario', getInventarioAlmacen);

// ===== RUTAS PROTEGIDAS (requieren autenticación y permisos) =====
router.post('/', verifyToken, checkPermission('Almacen'), createAlmacen);
router.put('/:id', verifyToken, checkPermission('Almacen'), updateAlmacen);
router.delete('/:id', verifyToken, checkPermission('Almacen'), deleteAlmacen);

// Historial de movimientos
router.get('/:id/historial', verifyToken, getHistorialAlmacen);

// Bloquear/Desbloquear almacén
router.post('/:id/bloquear', verifyToken, checkPermission('Almacen'), bloquearAlmacen);

// Validar capacidad disponible
router.post('/:id/validar-capacidad', verifyToken, validarCapacidadAlmacen);

// Recalcular ocupación (útil para ajustes manuales)
router.post('/:id/recalcular-ocupacion', verifyToken, checkPermission('Almacen'), recalcularOcupacion);

module.exports = router;