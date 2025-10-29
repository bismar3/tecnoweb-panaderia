const express = require('express');
const router = express.Router();
const {
  getAllMetodosPago,
  getMetodoPagoById,
  createMetodoPago,
  updateMetodoPago,
  deleteMetodoPago
} = require('../controllers/metodoPagoController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, getAllMetodosPago);
router.get('/:id', verifyToken, getMetodoPagoById);
router.post('/', verifyToken, checkPermission('Pago'), createMetodoPago);
router.put('/:id', verifyToken, checkPermission('Pago'), updateMetodoPago);
router.delete('/:id', verifyToken, checkPermission('Pago'), deleteMetodoPago);

module.exports = router;