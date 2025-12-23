const Order = require('../models/orderModel');
const Product = require('../models/productModel');

// Dashboard istatistiklerini getir
const getStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    console.log('Gelen tarihler:', { startDate, endDate });
    
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    console.log('Kullanılan tarihler:', { start, end });

    // Tüm siparişleri getir (debug için)
    const allOrders = await Order.find({}).populate('items.product');
    console.log('Tüm siparişler:', {
      total: allOrders.length,
      statuses: allOrders.map(o => o.status),
      dates: allOrders.map(o => o.createdAt)
    });

    // Tüm durumları dahil et
    const query = {
      createdAt: {
        $gte: start,
        $lte: end
      }
    };

    console.log('Sorgu:', JSON.stringify(query));

    // Filtrelenmiş siparişleri getir
    const orders = await Order.find(query).populate('items.product');
    console.log('Filtrelenmiş siparişler:', {
      total: orders.length,
      orders: orders.map(o => ({
        id: o._id,
        status: o.status,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt
      }))
    });
    
    if (!orders || orders.length === 0) {
      console.log('Filtrelenmiş sipariş bulunamadı');
      return res.json({
        totalSales: 0,
        averageOrder: 0,
        totalOrders: 0,
        salesChange: 0,
        ordersChange: 0,
        dailySales: [],
        popularProducts: []
      });
    }

    const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalOrders = orders.length;
    const averageOrder = totalOrders > 0 ? totalSales / totalOrders : 0;

    console.log('Hesaplanan değerler:', { totalSales, totalOrders, averageOrder });

    // Önceki dönem için sorgu
    const previousOrders = await Order.find({
      createdAt: {
        $gte: new Date(start.getTime() - (7 * 24 * 60 * 60 * 1000)),
        $lt: start
      }
    });

    const previousTotalSales = previousOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const previousTotalOrders = previousOrders.length;

    console.log('Önceki dönem:', { previousTotalSales, previousTotalOrders });

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
          createdAt: {
            $gte: start,
            $lte: end
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$totalAmount" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('Günlük satışlar:', dailySales);

    // En çok satılan ürünler
    const popularProducts = await Order.aggregate([
      { 
        $match: {
          createdAt: {
            $gte: start,
            $lte: end
          }
        }
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      { $unwind: "$productInfo" },
      {
        $project: {
          _id: 0,
          name: "$productInfo.name",
          totalSold: 1,
          totalRevenue: 1
        }
      }
    ]);

    console.log('Popüler ürünler:', popularProducts);

    const result = {
      totalSales,
      averageOrder,
      totalOrders,
      salesChange,
      ordersChange,
      dailySales: dailySales.map(day => ({
        date: day._id,
        total: day.total,
        orders: day.orders
      })),
      popularProducts
    };

    console.log('Gönderilen sonuç:', result);
    res.json(result);
  } catch (error) {
    console.error('Dashboard istatistikleri hatası:', error);
    res.status(500).json({ 
      message: 'İstatistikler alınırken bir hata oluştu',
      error: error.message
    });
  }
};

module.exports = {
  getStats
}; 