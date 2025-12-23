const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Auth controller fonksiyonlarını import et
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
} = require('../controllers/authController');

// Routes
router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);

module.exports = router; 