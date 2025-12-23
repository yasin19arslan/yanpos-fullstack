const axios = require('axios');

// Test edilecek kampanya kodları
const campaignCodes = ['HOSGELDIN20', 'TEST123', 'YANLIS'];

// API URL
const API_URL = 'http://localhost:5001';

// Her kodu test et
async function testCampaignCodes() {
  console.log('Kampanya Kodu Test Aracı');
  console.log('-----------------------');
  
  for (const code of campaignCodes) {
    try {
      console.log(`"${code}" kodunu test ediyorum...`);
      const response = await axios.get(`${API_URL}/api/campaigns/code/${code}`);
      
      console.log(`✅ "${code}" KOD BAŞARILI!`);
      console.log(`Kampanya: ${response.data.title}`);
      console.log(`İndirim: ${response.data.discountType === 'percentage' ? '%' : ''}${response.data.discountValue} ${response.data.discountType === 'percentage' ? '' : 'TL'}`);
      console.log(`Minimum Sepet: ${response.data.minimumPurchase} TL`);
      console.log(`Bitiş Tarihi: ${new Date(response.data.endDate).toLocaleDateString()}`);
      console.log('-----------------------');
    } catch (error) {
      console.log(`❌ "${code}" KOD BAŞARISIZ!`);
      if (error.response) {
        console.log(`Hata: ${error.response.status} - ${error.response.data.message || 'Bilinmeyen hata'}`);
      } else if (error.request) {
        console.log('Hata: Sunucuya ulaşılamadı. Sunucu çalışıyor mu?');
      } else {
        console.log(`Hata: ${error.message}`);
      }
      console.log('-----------------------');
    }
  }
}

// Testi çalıştır
testCampaignCodes(); 