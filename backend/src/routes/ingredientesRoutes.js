const express = require('express');
const router = express.Router();
const ingredientesController = require('../controllers/ingredientesController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

// Rutas públicas (para consultas en otros módulos)
router.get('/', ingredientesController.getAll);
router.get('/stock-bajo', ingredientesController.getStockBajo);
router.get('/:id', ingredientesController.getById);

// Rutas protegidas (requieren autenticación y permisos)
router.post('/', verifyToken, checkPermission('Producto Almacen'), ingredientesController.create);
router.put('/:id', verifyToken, checkPermission('Producto Almacen'), ingredientesController.update);
router.delete('/:id', verifyToken, checkPermission('Producto Almacen'), ingredientesController.deleteIngrediente);

module.exports = router;