const Order = require('../models/orderModel');
const Product = require('../models/productModel');

// @desc    Tüm siparişleri getir
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'id name')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message,
    });
  }
};

// @desc    Kullanıcı siparişlerini getir
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message,
    });
  }
};

// @desc    Sipariş detayını getir
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email');
    
    if (order) {
      res.status(200).json({
        success: true,
        order,
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı',
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message,
    });
  }
};

// @desc    Sipariş oluştur
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      customerName,
      tableNumber,
      totalAmount,
      paymentMethod,
      orderType,
      notes,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Sipariş ürünleri yok',
      });
    }

    // Sipariş numarası oluştur (günün tarihi + rastgele sayı)
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const randomNum = Math.floor(Math.random() * 1000);
    const orderNumber = `SIP${dateStr}-${randomNum}`;

    // Sipariş oluştur
    const order = new Order({
      orderNumber,
      user: req.user ? req.user.id : null,
      customerName,
      items: orderItems,
      tableNumber,
      totalAmount,
      paymentMethod,
      orderType,
      notes,
      status: 'pending',
    });

    const createdOrder = await order.save();

    res.status(201).json({
      success: true,
      order: createdOrder,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message,
    });
  }
};

// @desc    Sipariş durumunu güncelle
// @route   PUT /api/orders/:id/status
// @access  Private
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (order) {
      order.status = status || order.status;
      const updatedOrder = await order.save();

      res.status(200).json({
        success: true,
        order: updatedOrder,
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı',
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message,
    });
  }
};

// @desc    Duruma göre siparişleri getir
// @route   GET /api/orders/status/:status
// @access  Private
const getOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const orders = await Order.find({ status })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message,
    });
  }
};

// @desc    İstatistikleri getir
// @route   GET /api/orders/stats
// @access  Private
const getStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Toplam satış ve sipariş sayısı
    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      status: 'completed'
    });

    const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;
    const averageOrder = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Önceki dönem karşılaştırması
    const previousStart = new Date(start);
    const previousEnd = new Date(end);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    previousStart.setDate(previousStart.getDate() - daysDiff);
    previousEnd.setDate(previousEnd.getDate() - daysDiff);

    const previousOrders = await Order.find({
      createdAt: { $gte: previousStart, $lte: previousEnd },
      status: 'completed'
    });

    const previousTotalSales = previousOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const previousTotalOrders = previousOrders.length;

    const salesChange = previousTotalSales > 0 
      ? ((totalSales - previousTotalSales) / previousTotalSales) * 100 
      : 0;

    const ordersChange = previousTotalOrders > 0
      ? ((totalOrders - previousTotalOrders) / previousTotalOrders) * 100
      : 0;

    // Günlük satışlar
    const dailySales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$totalAmount" },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          total: 1,
          orders: 1
        }
      }
    ]);

    // Popüler ürünler
    const popularProducts = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: 'completed'
        }
      },
      {
        $unwind: "$items"
      },
      {
        $group: {
          _id: "$items.product",
          quantity: { $sum: "$items.quantity" }
        }
      },
      {
        $sort: { quantity: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $unwind: "$product"
      },
      {
        $project: {
          _id: 0,
          name: "$product.name",
          category: "$product.category",
          image: "$product.image",
          quantity: 1
        }
      }
    ]);

    // Müşteri değeri (ortalama sipariş tutarı)
    const customerValue = averageOrder;

    res.json({
      totalSales,
      averageOrder,
      totalOrders,
      customerValue,
      salesChange,
      ordersChange,
      dailySales,
      popularProducts
    });
  } catch (error) {
    console.error('İstatistik hatası:', error);
    res.status(500).json({ message: 'İstatistikler alınırken bir hata oluştu' });
  }
};

// @desc    Tamamlanan siparişi veritabanına kaydet
// @route   POST /api/completed-orders
// @access  Private/Admin
const saveCompletedOrder = async (req, res) => {
  try {
    const { 
      orderId, 
      customerName, 
      customerPhone, 
      items, 
      totalAmount, 
      paymentMethod, 
      createdAt,
      completedAt,
      orderType 
    } = req.body;

    // MongoDB'ye tamamlanan siparişi kaydet
    const completedOrder = await Order.create({
      orderId,
      user: req.user._id,
      customerName,
      customerPhone,
      items,
      totalAmount,
      paymentMethod,
      status: 'completed',
      orderType: orderType || 'mobile',
      createdAt: createdAt || new Date(),
      completedAt: completedAt || new Date(),
      // Faturalarda görünmesi için ekstra bilgiler
      orderNumber: `FTR-${Date.now().toString().slice(-8)}`,
      isPaid: true,
      invoiceGenerated: true
    });

    if (completedOrder) {
      res.status(201).json({
        success: true,
        message: 'Tamamlanan sipariş başarıyla kaydedildi',
        order: completedOrder
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Sipariş verisi geçersiz'
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};

module.exports = {
  getOrders,
  getMyOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getOrdersByStatus,
  getStats,
  saveCompletedOrder
}; 