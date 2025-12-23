const Wallet = require('../models/walletModel');
const User = require('../models/User');

// @desc    Cüzdan bilgilerini getir
// @route   GET /api/wallet
// @access  Private
const getWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user._id });
    
    if (!wallet) {
      wallet = await Wallet.create({
        user: req.user._id,
        balance: 0,
        transactions: []
      });
    }

    res.json(wallet);
  } catch (error) {
    console.error('Cüzdan bilgileri getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Bakiye yükle
// @route   POST /api/wallet/deposit
// @access  Private
const depositBalance = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Geçerli bir miktar giriniz' });
    }

    let wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      wallet = await Wallet.create({
        user: req.user._id,
        balance: 0,
        transactions: []
      });
    }

    // Yeni işlem ekle
    const transaction = {
      type: 'deposit',
      amount,
      description: 'Bakiye yükleme',
      status: 'completed',
      createdAt: new Date()
    };

    wallet.transactions.push(transaction);
    wallet.balance += amount;

    await wallet.save();

    res.json({
      success: true,
      message: 'Bakiye başarıyla yüklendi',
      wallet
    });
  } catch (error) {
    console.error('Bakiye yükleme hatası:', error);
    res.status(500).json({ message: 'Bakiye yükleme işlemi başarısız', error: error.message });
  }
};

// @desc    Ödeme yap
// @route   POST /api/wallet/payment
// @access  Private
const makePayment = async (req, res) => {
  try {
    const { amount, orderId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Geçerli bir miktar giriniz' });
    }

    const wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      return res.status(404).json({ message: 'Cüzdan bulunamadı' });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ message: 'Yetersiz bakiye' });
    }

    // Yeni işlem ekle
    const transaction = {
      type: 'payment',
      amount: -amount,
      description: `Sipariş ödemesi: ${orderId}`,
      status: 'completed',
      createdAt: new Date()
    };

    wallet.transactions.push(transaction);
    wallet.balance -= amount;

    await wallet.save();

    res.json({
      success: true,
      message: 'Ödeme başarıyla tamamlandı',
      wallet
    });
  } catch (error) {
    console.error('Ödeme hatası:', error);
    res.status(500).json({ message: 'Ödeme işlemi başarısız', error: error.message });
  }
};

// @desc    İşlem geçmişini getir
// @route   GET /api/wallet/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      return res.status(404).json({ message: 'Cüzdan bulunamadı' });
    }

    res.json({
      success: true,
      transactions: wallet.transactions.sort((a, b) => b.createdAt - a.createdAt)
    });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Cüzdan oluştur
// @route   POST /api/wallet/create
// @access  Private
const createWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user._id });
    
    if (wallet) {
      return res.status(400).json({ message: 'Kullanıcının zaten bir cüzdanı var' });
    }

    wallet = await Wallet.create({
      user: req.user._id,
      balance: 0,
      transactions: []
    });

    res.status(201).json(wallet);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

module.exports = {
  getWallet,
  depositBalance,
  makePayment,
  getTransactions,
  createWallet
}; 