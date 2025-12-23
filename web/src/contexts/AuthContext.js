import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('Token bulundu, profil bilgileri alınıyor...');
        const response = await authAPI.getProfile();
        console.log('Profil bilgileri alındı:', response.data);
        setUser(response.data);
      } else {
        console.log('Token bulunamadı, kullanıcı giriş yapmamış.');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Login isteği gönderiliyor:', { email });
      const response = await authAPI.login({ email, password });
      console.log('Login yanıtı:', response.data);
      
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        
        // Kullanıcı verilerini ayarla
        const userData = response.data.user || {
          _id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role
        };
        
        console.log('Ayarlanan kullanıcı verileri:', userData);
        setUser(userData);
        return response.data;
      } else {
        throw new Error('Token alınamadı');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        return response.data;
      } else {
        throw new Error('Token alınamadı');
      }
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 