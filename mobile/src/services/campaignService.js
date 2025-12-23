import axiosInstance from './axiosInstance';
import { API_URL } from '../config/config';

// Debug için
console.log('API URL:', API_URL);

// Tüm aktif kampanyaları getir
export const fetchCampaigns = async () => {
  try {
    const response = await axiosInstance.get('/api/campaigns');
    return response.data;
  } catch (error) {
    // Hata detayını sadece bildirim olarak döndür, konsola yazdırma
    throw error;
  }
};

// Belirli bir kampanyayı getir
export const fetchCampaignById = async (campaignId) => {
  try {
    const response = await axiosInstance.get(`/api/campaigns/${campaignId}`);
    return response.data;
  } catch (error) {
    // Hata detayını sadece bildirim olarak döndür, konsola yazdırma
    throw error;
  }
};

// Kampanya kodu ile kampanyayı doğrula
export const validateCampaignCode = async (code) => {
  try {
    const response = await axiosInstance.get(`/api/campaigns/code/${code}`);
    return response.data;
  } catch (error) {
    // Hata detayını sadece bildirim olarak döndür, konsola yazdırma
    throw error;
  }
};

// Kullanıcının kampanyalarını getir (giriş yapmış olmalı)
export const fetchUserCampaigns = async () => {
  try {
    const response = await axiosInstance.get('/api/campaigns/user/campaigns');
    return response.data;
  } catch (error) {
    // Hata detayını sadece bildirim olarak döndür, konsola yazdırma
    throw error;
  }
};

// Kampanya uygula (sepete veya siparişe)
export const applyCampaign = async (code, totalAmount) => {
  try {
    const response = await axiosInstance.post('/api/campaigns/apply', {
      code,
      totalAmount
    });
    return response.data;
  } catch (error) {
    // Hata detayını sadece bildirim olarak döndür, konsola yazdırma
    throw error;
  }
};