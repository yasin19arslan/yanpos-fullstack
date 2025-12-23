const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// Kullanıcı girişini kontrol et
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        res.status(401);
        throw new Error('Kullanıcı bulunamadı');
      }
      
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        res.status(401).json({ message: 'Geçersiz token' });
      } else if (error.name === 'TokenExpiredError') {
        res.status(401).json({ message: 'Token süresi dolmuş' });
      } else {
        res.status(401).json({ message: 'Yetkilendirme başarısız', error: error.message });
      }
    }
  } else {
    res.status(401).json({ message: 'Token bulunamadı' });
  }
});

// Admin yetkisini kontrol et
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Bu işlem için admin yetkisi gerekiyor',
    });
  }
};

// Personel veya Admin yetkisini kontrol et
const staff = (req, res, next) => {
  if (req.user && (req.user.role === 'staff' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Bu işlem için personel yetkisi gerekiyor',
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Bu işlem için yetkiniz yok'
      });
    }
    next();
  };
};

module.exports = { protect, admin, staff, authorize }; 