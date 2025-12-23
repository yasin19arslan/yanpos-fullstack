const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const { protect } = require('./middleware/authMiddleware');
const Favorite = require('./models/favoriteModel');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Enable CORS
app.use(cors());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test başarılı' });
});

// Route files
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Favori route'ları
app.get('/api/favorites', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const favorites = await Favorite.find({ user: userId }).populate('product');
    res.json({
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
});

app.post('/api/favorites', protect, async (req, res) => {
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
});

app.delete('/api/favorites/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    await Favorite.findOneAndDelete({
      user: userId,
      product: productId
    });

    res.json({
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
});

// Error handler
app.use(errorHandler);

module.exports = app; 