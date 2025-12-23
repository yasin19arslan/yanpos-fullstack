import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // AsyncStorage'dan kullanıcıya özel favorileri yükle
  const loadFavorites = async () => {
    try {
      if (!user) {
        setFavorites([]);
        return;
      }
      const storedFavorites = await AsyncStorage.getItem(`favorites_${user._id}`);
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error('Favoriler yüklenirken hata:', error);
    }
  };

  // Favorileri kullanıcıya özel olarak AsyncStorage'a kaydet
  const saveFavorites = async (newFavorites) => {
    try {
      if (!user) return;
      await AsyncStorage.setItem(`favorites_${user._id}`, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Favoriler kaydedilirken hata:', error);
    }
  };

  // Favori ekleme/çıkarma
  const toggleFavorite = async (product) => {
    try {
      if (!user) return;
      
      const isFavorite = favorites.some(item => item._id === product._id);
      let newFavorites;

      if (isFavorite) {
        // Favorilerden çıkar
        newFavorites = favorites.filter(item => item._id !== product._id);
      } else {
        // Favorilere ekle
        newFavorites = [...favorites, product];
      }

      setFavorites(newFavorites);
      await saveFavorites(newFavorites);
    } catch (error) {
      console.error('Favori işlemi sırasında hata:', error);
    }
  };

  // Favori kontrolü
  const isFavorite = (productId) => {
    return favorites.some(item => item._id === productId);
  };

  // Kullanıcı değiştiğinde favorileri yükle
  useEffect(() => {
    loadFavorites();
  }, [user]);

  const value = {
    favorites,
    loading,
    toggleFavorite,
    isFavorite
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
} 