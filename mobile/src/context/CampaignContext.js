import React, { createContext, useState, useContext, useEffect } from 'react';
import { fetchCampaigns, validateCampaignCode as validateCampaignCodeAPI, applyCampaign } from '../services/campaignService';
import { useAuth } from './AuthContext';

const CampaignContext = createContext();

export const CampaignProvider = ({ children }) => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Tüm kampanyaları getir
  const getAllCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCampaigns();
      setCampaigns(data);
      return data;
    } catch (error) {
      setError('Kampanyalar yüklenirken bir hata oluştu');
      console.error('Kampanya yükleme hatası:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Kampanya kodunu doğrula
  const validateCouponCode = async (code) => {
    try {
      setLoading(true);
      setError(null);
      const campaign = await validateCampaignCodeAPI(code);
      return campaign;
    } catch (error) {
      setError(error.response?.data?.message || 'Kupon kodu geçersiz');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Kampanya uygula
  const applyActiveCampaign = async (code, totalAmount) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setError('Kampanya kullanmak için giriş yapmalısınız');
        return null;
      }
      
      const result = await applyCampaign(code, totalAmount);
      setActiveCampaign(result.campaign);
      return result;
    } catch (error) {
      setError(error.response?.data?.message || 'Kampanya uygulanırken bir hata oluştu');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Aktif kampanyayı temizle
  const clearActiveCampaign = () => {
    setActiveCampaign(null);
  };

  // İlk yükleme
  useEffect(() => {
    getAllCampaigns();
  }, []);

  const value = {
    campaigns,
    activeCampaign,
    loading,
    error,
    getAllCampaigns,
    validateCouponCode,
    applyActiveCampaign,
    clearActiveCampaign
  };

  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
};

export const useCampaign = () => {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
}; 