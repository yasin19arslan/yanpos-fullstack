const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getWallet,
  depositBalance,
  makePayment,
  getTransactions,
  createWallet
} = require('../controllers/walletController');

router.get('/', protect, getWallet);
router.post('/deposit', protect, depositBalance);
router.post('/payment', protect, makePayment);
router.get('/transactions', protect, getTransactions);
router.post('/create', protect, createWallet);

module.exports = router; 