const express = require('express');
const router = express.Router();
const {
  getAllProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  updateStock
} = require('../controllers/productoController');
// const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

// ✅ TEMPORALMENTE SIN AUTENTICACIÓN (para probar)
router.get('/', getAllProductos);
router.get('/:id', getProductoById);
router.post('/', createProducto);           // ← SIN verifyToken
router.put('/:id', updateProducto);         // ← SIN verifyToken
router.delete('/:id', deleteProducto);      // ← SIN verifyToken
router.patch('/:id/stock', updateStock);

module.exports = router;