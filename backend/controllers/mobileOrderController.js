const MobileOrder = require('../models/mobileOrderModel');
const Campaign = require('../models/campaignModel');
const UserCampaign = require('../models/userCampaignModel');

// @desc    Mobil sipariş oluştur
// @route   POST /api/mobile-orders
// @access  Public
const createMobileOrder = async (req, res) => {
  try {
    const { 
      customerName, 
      customerPhone, 
      items, 
      subtotal, 
      discount, 
      totalAmount, 
      paymentMethod,
      cardDetails,
      user, 
      campaign 
    } = req.body;

    if (!customerName || !items || !totalAmount || !user) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen tüm zorunlu alanları doldurun (müşteri adı, ürünler, toplam tutar ve kullanıcı ID)',
      });
    }

    // Ödeme yöntemi kontrolü
    if (!['card', 'wallet'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz ödeme yöntemi',
      });
    }

    // Kredi kartı ödemesi için kart bilgilerini kontrol et
    if (paymentMethod === 'card' && (!cardDetails || !cardDetails.cardNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Kredi kartı bilgileri eksik',
      });
    }

    // Sipariş verilerini hazırla
    const orderData = {
      customerName,
      customerPhone,
      items,
      subtotal: subtotal || totalAmount,
      discount: discount || 0,
      totalAmount,
      paymentMethod,
      status: 'pending',
      user
    };

    // Kredi kartı bilgilerini ekle
    if (paymentMethod === 'card' && cardDetails) {
      orderData.cardDetails = {
        cardNumber: cardDetails.cardNumber.replace(/\s/g, '').slice(-4), // Sadece son 4 haneyi sakla
        cardName: cardDetails.cardName,
        expiryDate: cardDetails.expiryDate,
      };
    }

    // Kampanya bilgisi varsa ekle
    if (campaign && campaign.id && campaign.code) {
      orderData.campaign = {
        campaignId: campaign.id,
        code: campaign.code,
        discountAmount: campaign.discount || discount || 0
      };

      try {
        const campaignDoc = await Campaign.findById(campaign.id);
        if (campaignDoc) {
          campaignDoc.usedCount += 1;
          await campaignDoc.save();

          let userCampaign = await UserCampaign.findOne({
            userId: user,
            campaignId: campaign.id
          });

          if (!userCampaign) {
            userCampaign = new UserCampaign({
              userId: user,
              campaignId: campaign.id,
              usedCount: 0
            });
          }

          userCampaign.usedCount += 1;
          userCampaign.lastUsedAt = new Date();
          await userCampaign.save();
        }
      } catch (campaignError) {
        console.error('Kampanya güncelleme hatası:', campaignError);
      }
    }

    const mobileOrder = await MobileOrder.create(orderData);

    // WebSocket bildirimi gönder
    if (global.notifyClients) {
      global.notifyClients({
        type: 'NEW_ORDER',
        order: {
          _id: mobileOrder._id,
          id: mobileOrder._id,
          user: mobileOrder.user,
          customerName: mobileOrder.customerName,
          customerPhone: mobileOrder.customerPhone,
          status: mobileOrder.status,
          subtotal: mobileOrder.subtotal,
          discount: mobileOrder.discount,
          totalAmount: mobileOrder.totalAmount,
          items: mobileOrder.items,
          campaign: mobileOrder.campaign,
          createdAt: mobileOrder.createdAt,
          paymentMethod: mobileOrder.paymentMethod
        },
        message: `Yeni sipariş: ${mobileOrder.customerName}`
      });
    }

    res.status(201).json({
      success: true,
      order: mobileOrder,
    });
  } catch (error) {
    console.error('Sipariş oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message,
    });
  }
};

// @desc    Kullanıcı mobil siparişlerini getir
// @route   GET /api/mobile-orders/user/:userId
// @access  Public
const getUserMobileOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı ID parametresi gerekli',
      });
    }

    // Son 24 saat için tarih hesapla
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);
    
    // Tüm siparişleri tek sorguda getir ve sırala
    const orders = await MobileOrder.find({
      user: userId,
    }).sort({ createdAt: -1 });
    
    // Siparişleri son 24 saat ve daha eski olarak ayır
    const recentOrders = orders.filter(order => new Date(order.createdAt) >= last24Hours);
    const olderOrders = orders.filter(order => new Date(order.createdAt) < last24Hours);
    
    res.status(200).json({
      success: true,
      count: orders.length,
      orders: [...recentOrders, ...olderOrders],
    });
  } catch (error) {
    console.error('Sipariş getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message,
    });
  }
};

// @desc    Tüm mobil siparişleri getir
// @route   GET /api/mobile-orders
// @access  Private/Admin
const getAllMobileOrders = async (req, res) => {
  try {
    const orders = await MobileOrder.find({})
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

// @desc    Mobil sipariş durumunu güncelle
// @route   PUT /api/mobile-orders/:id/status
// @access  Private/Admin
const updateMobileOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Durum bilgisi gerekli',
      });
    }

    const order = await MobileOrder.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı',
      });
    }

    const oldStatus = order.status;
    order.status = status;
    const updatedOrder = await order.save();

    // WebSocket bildirimi gönder
    if (global.notifyClients) {
      global.notifyClients({
        type: 'ORDER_UPDATE',
        order: {
          _id: updatedOrder._id,
          id: updatedOrder._id,
          user: updatedOrder.user,
          customerName: updatedOrder.customerName,
          customerPhone: updatedOrder.customerPhone,
          status: updatedOrder.status,
          oldStatus: oldStatus,
          totalAmount: updatedOrder.totalAmount,
          items: updatedOrder.items,
          updatedAt: new Date(),
          paymentMethod: updatedOrder.paymentMethod
        },
        message: `Sipariş durumu güncellendi: ${updatedOrder.customerName} - ${oldStatus} ➔ ${status}`
      });
    }

    res.status(200).json({
      success: true,
      order: updatedOrder,
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

module.exports = {
  createMobileOrder,
  getUserMobileOrders,
  getAllMobileOrders,
  updateMobileOrderStatus
}; 