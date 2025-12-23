const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   GET /api/products
router.get('/', getProducts);

// @route   GET /api/products/category/:categoryId
router.get('/category/:categoryId', getProductsByCategory);

// @route   GET /api/products/:id
router.get('/:id', getProductById);

// @route   POST /api/products
router.post('/', protect, admin, createProduct);

// @route   PUT /api/products/:id
router.put('/:id', protect, admin, updateProduct);

// @route   DELETE /api/products/:id
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router; 