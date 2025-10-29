const express = require('express');
const router = express.Router();
const {
  getAllPromociones,
  getPromocionById,
  createPromocion,
  updatePromocion,
  addProductoPromocion,
  removeProductoPromocion,
  deletePromocion,
  calcularDescuentoProducto
} = require('../controllers/promocionController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, getAllPromociones);
router.get('/:id', verifyToken, getPromocionById);
router.post('/', verifyToken, checkPermission('Promocion'), createPromocion);
router.put('/:id', verifyToken, checkPermission('Promocion'), updatePromocion);
router.post('/:id/productos', verifyToken, checkPermission('Promocion'), addProductoPromocion);
router.delete('/:id/productos/:id_producto', verifyToken, checkPermission('Promocion'), removeProductoPromocion);
router.delete('/:id', verifyToken, checkPermission('Promocion'), deletePromocion);
router.post('/calcular-descuento/:id_producto', verifyToken, calcularDescuentoProducto);

module.exports = router;