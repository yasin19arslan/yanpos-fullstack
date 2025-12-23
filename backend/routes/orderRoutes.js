const express = require('express');
const router = express.Router();
const {
  getOrders,
  getMyOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getOrdersByStatus,
  getStats,
  saveCompletedOrder
} = require('../controllers/orderController');
const { protect, staff, admin } = require('../middleware/authMiddleware');

// @route   GET /api/orders
router.get('/', protect, staff, getOrders);

// @route   GET /api/orders/my
router.get('/my', protect, getMyOrders);

// @route   GET /api/orders/status/:status
router.get('/status/:status', protect, staff, getOrdersByStatus);

// @route   GET /api/orders/stats
router.get('/stats', protect, staff, getStats);

// @route   GET /api/orders/:id
router.get('/:id', protect, getOrderById);

// @route   POST /api/orders
router.post('/', protect, createOrder);

// @route   PUT /api/orders/:id/status
router.put('/:id/status', protect, staff, updateOrderStatus);

// @route   POST /api/completed-orders
router.post('/completed-orders', protect, admin, saveCompletedOrder);

module.exports = router; 