const express = require('express');
const router = express.Router();
const {
  getOrders,
  createOrder,
  updateOrderStatus,
  getOrder,
  getUserOrders,
  getOrdersByStatus
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const Order = require('../models/orderModel');

// Ana route'lar
router.get('/', getOrders);
router.post('/', protect, createOrder);

// Spesifik route'lar (önce gelmeli)
router.get('/status/:status', protect, getOrdersByStatus);
router.get('/user/:userId', protect, getUserOrders);

// Dinamik ID route'ları (en sona gelmeli)
router.get('/:id', protect, getOrder);
router.put('/:id/status', protect, updateOrderStatus);

module.exports = router; 