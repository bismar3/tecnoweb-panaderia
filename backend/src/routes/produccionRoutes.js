const express = require('express');
const router = express.Router();
const produccionController = require('../controllers/produccionController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

router.use(verifyToken);

// Listar producciones
router.get('/', checkPermission('Produccion'), produccionController.getAll);

// Obtener producción por ID
router.get('/:id', checkPermission('Produccion'), produccionController.getById);

// Crear nueva producción (solo registra, no descuenta)
router.post('/', checkPermission('Produccion'), produccionController.create);

// Iniciar producción (descuenta ingredientes)
router.patch('/:id/iniciar', checkPermission('Produccion'), produccionController.iniciar);

// Completar producción (aumenta producto terminado)
router.patch('/:id/completar', checkPermission('Produccion'), produccionController.completar);

// Cancelar producción
router.patch('/:id/cancelar', checkPermission('Produccion'), produccionController.cancelar);

module.exports = router;