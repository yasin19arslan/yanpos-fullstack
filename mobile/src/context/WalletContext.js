import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { API_URL } from '../config/config';
import axiosInstance from '../services/axiosInstance';

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const { user, fetchWallet: updateUserWallet } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isFirstRender = useRef(true);
  const isFetching = useRef(false);
  const lastFetchTime = useRef(0);

  const fetchWallet = async (force = false) => {
    if (!user?.token) return null;
    
    // API çağrılarını sınırla (3 saniye içinde tekrar çağırma)
    const now = Date.now();
    if (!force && (isFetching.current || now - lastFetchTime.current < 3000)) {
      return wallet;
    }
    
    isFetching.current = true;
    
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/api/wallet');
      lastFetchTime.current = Date.now();
      setWallet(response.data);
      return response.data;
    } catch (error) {
      // Axios'un iptal edilmiş istekleri için sessiz davran
      if (axios.isCancel(error)) {
        // Bu bir hata değil, istek bilinçli olarak iptal edildi
        return wallet;
      }
      
      if (error.response?.status === 404) {
        try {
          const createResponse = await axiosInstance.post('/api/wallet/create');
          lastFetchTime.current = Date.now();
          setWallet(createResponse.data);
          return createResponse.data;
        } catch (createError) {
          if (!axios.isCancel(createError)) {
            setError('Cüzdan oluşturulamadı');
            console.error('Cüzdan oluşturma hatası:', createError);
          }
        }
      } else if (!axios.isCancel(error)) {
        setError('Cüzdan bilgileri alınamadı');
        console.error('Cüzdan bilgileri alma hatası:', error);
      }
      return null;
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  const deposit = async (amount) => {
    if (!user?.token || !amount || amount <= 0) {
      throw new Error('Geçerli bir miktar giriniz');
    }

    try {
      setLoading(true);
      const response = await axiosInstance.post('/api/wallet/deposit', { amount });
      
      if (response.data.success) {
        setWallet(response.data.wallet);
        // Kullanıcı state'ini de güncelle
        await updateUserWallet();
        return response.data;
      } else {
        throw new Error(response.data.message || 'Bakiye yükleme işlemi başarısız');
      }
    } catch (error) {
      console.error('Bakiye yükleme hatası:', error);
      throw new Error(error.response?.data?.message || 'Bakiye yükleme işlemi başarısız');
    } finally {
      setLoading(false);
    }
  };

  const makePayment = async (amount, orderId) => {
    if (!user?.token || !amount || amount <= 0) {
      throw new Error('Geçerli bir miktar giriniz');
    }

    try {
      setLoading(true);
      const response = await axiosInstance.post('/api/wallet/payment', { amount, orderId });
      
      if (response.data.success) {
        setWallet(response.data.wallet);
        // Kullanıcı state'ini de güncelle
        await updateUserWallet();
        return response.data;
      } else {
        throw new Error(response.data.message || 'Ödeme işlemi başarısız');
      }
    } catch (error) {
      console.error('Ödeme hatası:', error);
      throw new Error(error.response?.data?.message || 'Ödeme işlemi başarısız');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token && (isFirstRender.current || !wallet)) {
      isFirstRender.current = false;
      fetchWallet();
    } else if (!user?.token) {
      setWallet(null);
    }
  }, [user?.token]);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        loading,
        error,
        fetchWallet,
        deposit,
        makePayment
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
} 