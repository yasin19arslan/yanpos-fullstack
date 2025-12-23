const express = require('express');
const router = express.Router();
const {
  createMobileOrder,
  getUserMobileOrders,
  getAllMobileOrders,
  updateMobileOrderStatus
} = require('../controllers/mobileOrderController');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   POST /api/mobile-orders
router.post('/', createMobileOrder);

// @route   GET /api/mobile-orders
router.get('/', protect, admin, getAllMobileOrders);

// @route   GET /api/mobile-orders/user/:userId
router.get('/user/:userId', getUserMobileOrders);

// @route   PUT /api/mobile-orders/:id/status
router.put('/:id/status', protect, admin, updateMobileOrderStatus);

module.exports = router; 