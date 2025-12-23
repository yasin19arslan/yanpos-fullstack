const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/User');
const { getStats } = require('../controllers/dashboardController');

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics (sales, orders, customers)
// @access  Private/Admin
router.get('/stats', protect, getStats);

// @route   GET /api/dashboard/sales-trend
// @desc    Get sales trend data (daily, weekly, monthly)
// @access  Private/Admin
router.get('/sales-trend', protect, admin, async (req, res) => {
  try {
    const { timeRange, startDate, endDate } = req.query;
    
    // Bugünün tarihi
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let startDateFilter, endDateFilter;
    let resultData = [];
    
    // Tarih aralığı belirtilmişse onu kullan
    if (startDate && endDate) {
      startDateFilter = new Date(startDate);
      startDateFilter.setHours(0, 0, 0, 0);
      endDateFilter = new Date(endDate);
      endDateFilter.setHours(23, 59, 59, 999);
    } else {
      // Zaman aralığına göre filtre oluştur
      if (timeRange === 'weekly') {
        // Son 5 hafta
        startDateFilter = new Date(today);
        startDateFilter.setDate(today.getDate() - (5 * 7));
        endDateFilter = new Date(today);
      } else if (timeRange === 'monthly') {
        // Son 6 ay
        startDateFilter = new Date(today);
        startDateFilter.setMonth(today.getMonth() - 6);
        endDateFilter = new Date(today);
      } else {
        // Günlük (son 7 gün)
        startDateFilter = new Date(today);
        startDateFilter.setDate(today.getDate() - 6);
        endDateFilter = new Date(today);
      }
    }
    
    // Tamamlanmış siparişleri getir
    const orders = await Order.find({
      createdAt: { $gte: startDateFilter, $lte: endDateFilter },
      status: { $ne: 'cancelled' }
    }).sort({ createdAt: 1 });
    
    if (timeRange === 'weekly') {
      // Haftalık veriler
      let weekMap = new Map();
      const numWeeks = 5;
      
      // Son 5 hafta için boş veriler oluştur
      for (let i = 0; i < numWeeks; i++) {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - (7 * (numWeeks - i - 1)));
        const weekKey = `${weekStart.getFullYear()}-${weekStart.getMonth() + 1}-${weekStart.getDate()}`;
        weekMap.set(weekKey, 0);
      }
      
      // Siparişleri haftalara göre grupla
      orders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const weekStart = new Date(orderDate);
        weekStart.setDate(orderDate.getDate() - orderDate.getDay());
        const weekKey = `${weekStart.getFullYear()}-${weekStart.getMonth() + 1}-${weekStart.getDate()}`;
        
        if (weekMap.has(weekKey)) {
          weekMap.set(weekKey, weekMap.get(weekKey) + order.totalAmount);
        }
      });
      
      resultData = Array.from(weekMap.values());
    } else if (timeRange === 'monthly') {
      // Aylık veriler
      let monthMap = new Map();
      const numMonths = 6;
      
      // Son 6 ay için boş veriler oluştur
      for (let i = 0; i < numMonths; i++) {
        const monthStart = new Date(today);
        monthStart.setMonth(today.getMonth() - (numMonths - i - 1));
        monthStart.setDate(1);
        const monthKey = `${monthStart.getFullYear()}-${monthStart.getMonth() + 1}`;
        monthMap.set(monthKey, 0);
      }
      
      // Siparişleri aylara göre grupla
      orders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth() + 1}`;
        
        if (monthMap.has(monthKey)) {
          monthMap.set(monthKey, monthMap.get(monthKey) + order.totalAmount);
        }
      });
      
      resultData = Array.from(monthMap.values());
    } else {
      // Günlük veriler (varsayılan)
      let dayMap = new Map();
      const numDays = 7;
      
      // Son 7 gün için boş veriler oluştur
      for (let i = 0; i < numDays; i++) {
        const day = new Date(today);
        day.setDate(today.getDate() - (numDays - i - 1));
        const dayKey = `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`;
        dayMap.set(dayKey, 0);
      }
      
      // Siparişleri günlere göre grupla
      orders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const dayKey = `${orderDate.getFullYear()}-${orderDate.getMonth() + 1}-${orderDate.getDate()}`;
        
        if (dayMap.has(dayKey)) {
          dayMap.set(dayKey, dayMap.get(dayKey) + order.totalAmount);
        }
      });
      
      resultData = Array.from(dayMap.values());
    }
    
    res.json(resultData);
  } catch (error) {
    console.error('Sales trend error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/dashboard/hourly-data
// @desc    Get hourly order distribution
// @access  Private/Admin
router.get('/hourly-data', protect, admin, async (req, res) => {
  try {
    const { date } = req.query;
    
    // Seçilen tarih veya bugün
    let targetDate;
    if (date) {
      targetDate = new Date(date);
    } else {
      targetDate = new Date();
    }
    
    // Seçilen tarihin başlangıcı ve sonu
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // O güne ait tüm siparişleri getir
    const orders = await Order.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    
    // Saat gruplandırması için dizi
    const hourlyData = [];
    
    // Çalışma saatleri (09:00 - 22:00 arası)
    const openingHour = 9;
    const closingHour = 22;
    
    // Her saat için bir giriş oluştur
    for (let hour = openingHour; hour <= closingHour; hour++) {
      const hourStr = hour.toString().padStart(2, '0') + ':00';
      hourlyData.push({ hour: hourStr, orders: 0 });
    }
    
    // Siparişleri saatlere göre grupla
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const orderHour = orderDate.getHours();
      
      // Eğer çalışma saatleri içindeyse sayaca ekle
      if (orderHour >= openingHour && orderHour <= closingHour) {
        const hourIndex = orderHour - openingHour;
        if (hourlyData[hourIndex]) {
          hourlyData[hourIndex].orders += 1;
        }
      }
    });
    
    res.json(hourlyData);
  } catch (error) {
    console.error('Hourly data error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/dashboard/recent-orders
// @desc    Get recent orders
// @access  Private/Admin
router.get('/recent-orders', protect, admin, async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    
    let dateFilter = {};
    
    if (date) {
      // Tek gün için filtre
      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
    } else if (startDate && endDate) {
      // Tarih aralığı için filtre
      const startDateObj = new Date(startDate);
      startDateObj.setHours(0, 0, 0, 0);
      
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      
      dateFilter = { createdAt: { $gte: startDateObj, $lte: endDateObj } };
    }
    
    // En son 10 siparişi getir
    const recentOrders = await Order.find(dateFilter)
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name');
    
    // Uygun formatta döndür
    const formattedOrders = recentOrders.map(order => {
      const userName = order.user ? order.user.name : 'Misafir';
      
      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        customerName: userName,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt
      };
    });
    
    res.json(formattedOrders);
  } catch (error) {
    console.error('Recent orders error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/dashboard/popular-products
// @desc    Get popular products
// @access  Private/Admin
router.get('/popular-products', protect, admin, async (req, res) => {
  try {
    const { days, date, startDate, endDate } = req.query;
    
    let dateFilter = {};
    
    if (date) {
      // Tek gün için filtre
      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
    } else if (startDate && endDate) {
      // Tarih aralığı için filtre
      const startDateObj = new Date(startDate);
      startDateObj.setHours(0, 0, 0, 0);
      
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      
      dateFilter = { createdAt: { $gte: startDateObj, $lte: endDateObj } };
    } else {
      // Belirli gün sayısı için filtre (varsayılan 30 gün)
      const daysBack = parseInt(days) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      startDate.setHours(0, 0, 0, 0);
      
      dateFilter = { createdAt: { $gte: startDate } };
    }
    
    // Tamamlanan siparişleri getir
    const completedOrders = await Order.find({
      ...dateFilter,
      status: { $in: ['completed', 'ready'] }
    });
    
    // Ürün satışlarını topla
    const productSales = {};
    
    completedOrders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.product.toString();
        
        if (!productSales[productId]) {
          productSales[productId] = {
            id: productId,
            totalSold: 0,
            totalRevenue: 0
          };
        }
        
        productSales[productId].totalSold += item.quantity;
        productSales[productId].totalRevenue += item.price * item.quantity;
      });
    });
    
    // Ürün bilgilerini getir
    const productIds = Object.keys(productSales);
    const products = await Product.find({ _id: { $in: productIds } });
    
    // Ürün bilgilerini ekle
    const productsWithSales = products.map(product => {
      const sales = productSales[product._id.toString()];
      return {
        _id: product._id,
        name: product.name,
        totalSold: sales.totalSold,
        totalRevenue: sales.totalRevenue
      };
    });
    
    // Satış miktarına göre sırala ve en popüler 5 ürünü döndür
    const sortedProducts = productsWithSales
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5);
    
    res.json(sortedProducts);
  } catch (error) {
    console.error('Popular products error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 