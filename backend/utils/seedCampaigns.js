const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Campaign = require('../models/campaignModel');

// Env değişkenlerini yükle
dotenv.config();

// MongoDB bağlantısı
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB bağlantısı başarılı'))
.catch(err => console.error('MongoDB bağlantı hatası:', err));

// Örnek kampanyalar
const campaigns = [
  {
    title: 'Hoş Geldin İndirimi',
    description: 'Yeni üyelere özel %20 indirim',
    code: 'HOSGELDIN20',
    discountType: 'percentage',
    discountValue: 20,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün
    minimumPurchase: 50,
    isActive: true,
    usageLimit: 100,
    userLimit: 1,
    image: 'https://via.placeholder.com/200'
  },
  {
    title: 'Test Kampanyası',
    description: 'Test amaçlı kampanya',
    code: 'TEST123',
    discountType: 'fixed',
    discountValue: 25,
    startDate: new Date(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 gün
    minimumPurchase: 0,
    isActive: true,
    usageLimit: 0, // sınırsız
    userLimit: 0, // sınırsız
    image: 'https://via.placeholder.com/200'
  }
];

// Kampanyaları ekle
const seedCampaigns = async () => {
  try {
    // Önce tüm kampanyaları temizle
    await Campaign.deleteMany({});
    console.log('Mevcut kampanyalar silindi');

    // Yeni kampanyaları ekle
    const createdCampaigns = await Campaign.insertMany(campaigns);
    console.log(`${createdCampaigns.length} kampanya eklendi`);
    
    // Kampanya kodlarını göster
    createdCampaigns.forEach(campaign => {
      console.log(`Kampanya: ${campaign.title}, Kod: ${campaign.code}`);
    });

    mongoose.disconnect();
    console.log('MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('Kampanya ekleme hatası:', error);
    process.exit(1);
  }
};

seedCampaigns(); 