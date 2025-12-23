const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getUsers,
  getUserProfile,
  updateProfile
} = require('../controllers/userController');

// Protected routes
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateProfile);

// Admin routes
router.get('/', protect, admin, getUsers);

module.exports = router; 