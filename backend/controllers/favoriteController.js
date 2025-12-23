const Favorite = require('../models/favoriteModel');
const Product = require('../models/productModel');

// @desc    Favorilere ürün ekle
// @route   POST /api/favorites
// @access  Private
const addToFavorites = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user._id;

    const favorite = await Favorite.create({
      user: userId,
      product: productId
    });

    res.status(201).json({
      success: true,
      message: 'Ürün favorilere eklendi',
      favorite
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Bu ürün zaten favorilerinizde'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Sunucu hatası',
        error: error.message
      });
    }
  }
};

// @desc    Favorilerden ürün çıkar
// @route   DELETE /api/favorites/:productId
// @access  Private
const removeFromFavorites = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    await Favorite.findOneAndDelete({
      user: userId,
      product: productId
    });

    res.status(200).json({
      success: true,
      message: 'Ürün favorilerden çıkarıldı'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};

// @desc    Kullanıcının favorilerini getir
// @route   GET /api/favorites
// @access  Private
const getFavorites = async (req, res) => {
  try {
    const userId = req.user._id;

    const favorites = await Favorite.find({ user: userId })
      .populate('product');

    res.status(200).json({
      success: true,
      favorites: favorites.map(f => f.product)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};

module.exports = {
  addToFavorites,
  removeFromFavorites,
  getFavorites
}; 