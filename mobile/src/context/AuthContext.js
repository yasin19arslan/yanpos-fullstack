import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../services/axiosInstance';
import { API_URL } from '../config/config';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const isFetchingWallet = useRef(false);
  const lastWalletFetchTime = useRef(0);

  const fetchWallet = async (force = false) => {
    if (!user || !user.token) return null;
    
    // API çağrılarını sınırla (3 saniye içinde tekrar çağırma)
    const now = Date.now();
    if (!force && (isFetchingWallet.current || now - lastWalletFetchTime.current < 3000)) {
      return user.wallet;
    }
    
    isFetchingWallet.current = true;
    
    try {
      const response = await axiosInstance.get('/api/wallet');
      lastWalletFetchTime.current = Date.now();
      
      setUser(prev => ({
        ...prev,
        wallet: response.data
      }));
      return response.data;
    } catch (error) {
      // Axios'un iptal edilmiş istekleri için sessiz davran
      if (axios.isCancel(error)) {
        // Bu bir hata değil, istek bilinçli olarak iptal edildi
        return user.wallet;
      }
      console.error('Cüzdan bilgisi alınamadı:', error);
      return null;
    } finally {
      isFetchingWallet.current = false;
    }
  };

  const login = async (loginData) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post('/api/auth/login', loginData);

      const data = response.data;
      const userData = {
        _id: data._id,
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        role: data.role,
        token: data.token
      };

      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      // Giriş sonrası cüzdan bilgisini getir (force true)
      await fetchWallet(true);
      
      return userData;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        'Giriş yapılırken bir hata oluştu'
      );
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, phone, password) => {
    try {
      setLoading(true);
      
      // Validasyon kontrolü
      if (!name || !email || !password) {
        throw new Error('Tüm gerekli alanları doldurun');
      }
      
      const response = await axiosInstance.post('/api/auth/register', {
        name,
        email,
        phone,
        password
      });

      const data = response.data;
      if (!data || !data.token) {
        throw new Error('Sunucu yanıtı geçersiz');
      }

      const userData = {
        _id: data._id,
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        bio: data.bio || '',
        role: data.role,
        token: data.token
      };

      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      // Kayıt sonrası cüzdan bilgisini getir
      setTimeout(() => {
        fetchWallet(true);
      }, 500);
      
      return userData;
    } catch (error) {
      console.error('Kayıt hatası:', error);
      let errorMessage = 'Kayıt olurken bir hata oluştu';
      
      if (error.response) {
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Çıkış hatası:', error);
    }
  };

  const updateProfile = async (updateData) => {
    try {
      const savedUser = await AsyncStorage.getItem('user');
      if (!savedUser) {
        throw new Error('Kullanıcı bilgileri bulunamadı');
      }

      const userData = JSON.parse(savedUser);
      
      // API'ye gönderilecek verileri hazırla
      const requestData = {
        name: updateData.name,
        email: updateData.email,
        phone: updateData.phone,
        bio: updateData.bio || ''
      };

      console.log('API\'ye gönderilen veri:', requestData);
      console.log('Kullanılan token:', userData.token);

      const response = await axiosInstance.put('/api/auth/profile', 
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${userData.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('API yanıtı:', response.data);

      // Backend'den gelen yanıtı kullanıcı verisine entegre et
      const updatedUser = {
        ...userData,
        ...response.data,
        token: userData.token // Token'ı koru
      };

      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('UpdateProfile error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        request: error.request
      });
      
      // Daha spesifik hata mesajları
      if (error.response) {
        // Server hatası
        const serverMessage = error.response.data?.message || 'Sunucu hatası';
        throw new Error(serverMessage);
      } else if (error.request) {
        // Ağ hatası
        throw new Error('Ağ bağlantısı sorunu. Lütfen internet bağlantınızı kontrol edin.');
      } else {
        // Diğer hatalar
        throw new Error(error.message || 'Profil güncellenirken bir hata oluştu');
      }
    }
  };

  const changePassword = async ({ currentPassword, newPassword }) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post('/api/auth/change-password',
        {
          currentPassword,
          newPassword
        },
        {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        }
      );

      const data = response.data;
      if (data.token) {
        const updatedUser = { ...user, token: data.token };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }

      return data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        'Şifre değiştirme işlemi başarısız'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
          // Kullanıcı bilgisi yüklendiğinde cüzdan bilgisini getir
          // Zamanlayıcı kullanarak hemen değil, 1 saniye sonra çağır
          setTimeout(() => {
            fetchWallet(true);
          }, 1000);
        }
      } catch (error) {
        console.error('Kullanıcı yükleme hatası:', error);
      }
    };

    loadUser();
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    fetchWallet
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 