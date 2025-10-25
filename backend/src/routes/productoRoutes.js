const express = require('express');
const router = express.Router();
const {
  getAllProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  updateStock,
  getLowStockProducts
} = require('../controllers/productoController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

// Rutas públicas (solo lectura)
router.get('/', verifyToken, getAllProductos);
router.get('/low-stock', verifyToken, getLowStockProducts);
router.get('/:id', verifyToken, getProductoById);

// Rutas protegidas (requieren permisos)
router.post('/', verifyToken, checkPermission('Producto'), createProducto);
router.put('/:id', verifyToken, checkPermission('Producto'), updateProducto);
router.delete('/:id', verifyToken, checkPermission('Producto'), deleteProducto);
router.patch('/:id/stock', verifyToken, checkPermission('Producto'), updateStock);

module.exports = router;