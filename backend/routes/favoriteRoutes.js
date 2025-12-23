const express = require('express');
const router = express.Router();
const {
  addToFavorites,
  removeFromFavorites,
  getFavorites
} = require('../controllers/favoriteController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getFavorites)
  .post(protect, addToFavorites);

router.route('/:productId')
  .delete(protect, removeFromFavorites);

module.exports = router; 