const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/campaignController');

// Test endpoint
router.get('/test', testEndpoint);

// Public rotalar
router.get('/', getCampaigns); // Tüm aktif kampanyaları getir
router.get('/code/:code', getCampaignByCode); // Kod ile kampanya getir - ÖNCE spesifik rotalar
router.get('/:id', getCampaign); // Kampanya detayı - SONRA parametreli rotalar

// Private rotalar (giriş yapılmış olmalı)
router.get('/user/campaigns', protect, getUserCampaigns); // Kullanıcının kampanyaları
router.post('/apply', protect, applyCampaign); // Kampanya uygula

// Admin rotaları
router.get('/admin', protect, admin, getAllCampaigns); // Frontend için admin kampanyaları
router.get('/all', protect, admin, getAllCampaigns);
router.post('/', protect, admin, createCampaign);
router.put('/:id', protect, admin, updateCampaign);
router.delete('/:id', protect, admin, deleteCampaign);
router.patch('/:id/toggle-active', protect, admin, toggleCampaignActive);

module.exports = router; 