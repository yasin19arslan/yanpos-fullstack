const Campaign = require('../models/campaignModel');
const UserCampaign = require('../models/userCampaignModel');

// @desc    Tüm aktif kampanyaları getir
// @route   GET /api/campaigns
// @access  Public
const getCampaigns = async (req, res) => {
  try {
    const now = new Date();
    const campaigns = await Campaign.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ createdAt: -1 });

    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Tüm kampanyaları getir (admin için)
// @route   GET /api/campaigns/all
// @access  Private/Admin
const getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({}).sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Kampanya oluştur
// @route   POST /api/campaigns
// @access  Private/Admin
const createCampaign = async (req, res) => {
  try {
    const {
      title,
      description,
      code,
      discountType,
      discountValue,
      startDate,
      endDate,
      minimumPurchase,
      isActive,
      usageLimit,
      userLimit,
      image
    } = req.body;

    // Kod benzersizliğini kontrol et
    const existingCode = await Campaign.findOne({ code });
    if (existingCode) {
      return res.status(400).json({ message: 'Bu kampanya kodu zaten kullanılıyor' });
    }

    const campaign = await Campaign.create({
      title,
      description,
      code,
      discountType,
      discountValue,
      startDate,
      endDate,
      minimumPurchase,
      isActive,
      usageLimit,
      userLimit,
      image
    });

    res.status(201).json(campaign);
  } catch (error) {
    console.error('Kampanya oluşturma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Kampanya güncelle
// @route   PUT /api/campaigns/:id
// @access  Private/Admin
const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      code,
      discountType,
      discountValue,
      startDate,
      endDate,
      minimumPurchase,
      isActive,
      usageLimit,
      userLimit,
      image
    } = req.body;

    // Kampanyayı bul
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ message: 'Kampanya bulunamadı' });
    }

    // Kod değiştiyse, benzersizliğini kontrol et
    if (code !== campaign.code) {
      const existingCode = await Campaign.findOne({ code });
      if (existingCode) {
        return res.status(400).json({ message: 'Bu kampanya kodu zaten kullanılıyor' });
      }
    }

    // Kampanyayı güncelle
    campaign.title = title;
    campaign.description = description;
    campaign.code = code;
    campaign.discountType = discountType;
    campaign.discountValue = discountValue;
    campaign.startDate = startDate;
    campaign.endDate = endDate;
    campaign.minimumPurchase = minimumPurchase;
    campaign.isActive = isActive;
    campaign.usageLimit = usageLimit;
    campaign.userLimit = userLimit;
    campaign.image = image;

    const updatedCampaign = await campaign.save();
    res.json(updatedCampaign);
  } catch (error) {
    console.error('Kampanya güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Kampanyayı sil
// @route   DELETE /api/campaigns/:id
// @access  Private/Admin
const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ message: 'Kampanya bulunamadı' });
    }

    await Campaign.deleteOne({ _id: id });
    
    // İlişkili kullanıcı kampanyalarını da sil
    await UserCampaign.deleteMany({ campaignId: id });
    
    res.json({ message: 'Kampanya başarıyla silindi' });
  } catch (error) {
    console.error('Kampanya silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Kampanya durumunu değiştir
// @route   PATCH /api/campaigns/:id/toggle-active
// @access  Private/Admin
const toggleCampaignActive = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ message: 'Kampanya bulunamadı' });
    }

    campaign.isActive = isActive;
    const updatedCampaign = await campaign.save();
    
    res.json(updatedCampaign);
  } catch (error) {
    console.error('Kampanya durum değiştirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Kampanya detayı
// @route   GET /api/campaigns/:id
// @access  Public
const getCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Kampanya bulunamadı' });
    }

    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Kampanya kodu ile kampanya bilgisi getir
// @route   GET /api/campaigns/code/:code
// @access  Public
const getCampaignByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const campaign = await Campaign.findOne({ code, isActive: true });
    
    if (!campaign) {
      return res.status(404).json({ message: 'Geçerli kampanya bulunamadı' });
    }

    // Kampanyanın geçerli olup olmadığını kontrol et
    if (!campaign.isValidForUse()) {
      return res.status(400).json({ message: 'Bu kampanya süresi dolmuş veya kullanım limiti dolmuş' });
    }

    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Kullanıcının kampanyaları
// @route   GET /api/campaigns/user
// @access  Private
const getUserCampaigns = async (req, res) => {
  try {
    const userCampaigns = await UserCampaign.find({ 
      userId: req.user._id 
    }).populate('campaignId');
    
    // Sadece aktif kampanyaları filtrele
    const now = new Date();
    const activeCampaigns = userCampaigns.filter(uc => 
      uc.campaignId && 
      uc.campaignId.isActive && 
      now >= uc.campaignId.startDate && 
      now <= uc.campaignId.endDate
    );

    res.json(activeCampaigns);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Kampanya uygula
// @route   POST /api/campaigns/apply
// @access  Private
const applyCampaign = async (req, res) => {
  try {
    const { code, totalAmount } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: 'Kampanya kodu gerekli' });
    }

    // Kampanyayı bul
    const campaign = await Campaign.findOne({ code, isActive: true });
    if (!campaign) {
      return res.status(404).json({ message: 'Geçerli kampanya bulunamadı' });
    }

    // Kampanyanın geçerli olup olmadığını kontrol et
    if (!campaign.isValidForUse()) {
      return res.status(400).json({ message: 'Bu kampanya süresi dolmuş veya kullanım limiti dolmuş' });
    }

    // Minimum alışveriş tutarı kontrolü
    if (totalAmount < campaign.minimumPurchase) {
      return res.status(400).json({ 
        message: `Bu kampanyayı kullanmak için minimum ${campaign.minimumPurchase} TL alışveriş yapmalısınız` 
      });
    }

    // Kullanıcının bu kampanyayı daha önce kullanıp kullanmadığını kontrol et
    let userCampaign = await UserCampaign.findOne({
      userId: req.user._id,
      campaignId: campaign._id
    });

    // Kullanıcı bu kampanyayı daha önce kullanmamışsa kaydet
    if (!userCampaign) {
      userCampaign = await UserCampaign.create({
        userId: req.user._id,
        campaignId: campaign._id,
        usedCount: 0,
        isActive: true
      });
    }

    // Kullanıcı bu kampanyayı kullanabilir mi kontrol et
    if (!userCampaign.canUse(campaign)) {
      return res.status(400).json({ message: 'Bu kampanyayı kullanma limitiniz dolmuş' });
    }

    // İndirim hesaplama
    let discount = 0;
    if (campaign.discountType === 'percentage') {
      discount = (totalAmount * campaign.discountValue) / 100;
    } else {
      discount = campaign.discountValue;
    }

    // Kampanyayı kullanıldı olarak işaretle
    userCampaign.usedCount += 1;
    userCampaign.lastUsedAt = new Date();
    await userCampaign.save();

    // Kampanyanın toplam kullanım sayısını artır
    campaign.usedCount += 1;
    await campaign.save();

    res.json({
      campaign: campaign,
      discount: discount,
      finalAmount: totalAmount - discount
    });
  } catch (error) {
    console.error('Kampanya uygulama hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Test endpoint
// @route   GET /api/campaigns/test
// @access  Public
const testEndpoint = async (req, res) => {
  res.json({ message: 'Kampanya API test endpoint çalışıyor!' });
};

module.exports = {
  getCampaigns,
  getCampaign,
  getCampaignByCode,
  getUserCampaigns,
  applyCampaign,
  getAllCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  toggleCampaignActive,
  testEndpoint
}; 