const express = require('express');
const router = express.Router();
const {
  getAllAlmacenes,
  getAlmacenById,
  createAlmacen,
  updateAlmacen,
  deleteAlmacen,
  getProductosAlmacen
} = require('../controllers/almacenController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, getAllAlmacenes);
router.get('/:id', verifyToken, getAlmacenById);
router.get('/:id/productos', verifyToken, getProductosAlmacen);
router.post('/', verifyToken, checkPermission('Almacen'), createAlmacen);
router.put('/:id', verifyToken, checkPermission('Almacen'), updateAlmacen);
router.delete('/:id', verifyToken, checkPermission('Almacen'), deleteAlmacen);

module.exports = router;