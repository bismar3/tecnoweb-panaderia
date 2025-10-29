const express = require('express');
const router = express.Router();
const {
  getAllDeliveries,
  getDeliveryById,
  createDelivery,
  updateDelivery,
  deleteDelivery
} = require('../controllers/deliveryController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, getAllDeliveries);
router.get('/:id', verifyToken, getDeliveryById);
router.post('/', verifyToken, checkPermission('Delivery'), createDelivery);
router.put('/:id', verifyToken, checkPermission('Delivery'), updateDelivery);
router.delete('/:id', verifyToken, checkPermission('Delivery'), deleteDelivery);

module.exports = router;