import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

// Tema renkleri
const themes = {
  light: {
    background: '#FFFFFF',
    surface: '#F8F8F8',
    card: '#FFFFFF',
    primary: '#2196F3',
    secondary: '#1A1A1A',
    text: '#1A1A1A',
    textSecondary: '#666666',
    border: '#F0F0F0',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    info: '#2196F3',
    inputBackground: '#F5F5F5',
    modalBackground: 'rgba(0,0,0,0.5)',
    shadowColor: '#000',
    divider: '#F0F0F0',
    buttonText: '#FFFFFF',
    buttonDisabled: '#999999',
    switchTrack: {
      false: '#767577',
      true: '#81b0ff'
    },
    switchThumb: {
      false: '#f4f3f4',
      true: '#2196F3'
    }
  },
  dark: {
    background: '#1A1A1A',
    surface: '#2C2C2C',
    card: '#333333',
    primary: '#2196F3',
    secondary: '#FFFFFF',
    text: '#FFFFFF',
    textSecondary: '#CCCCCC',
    border: '#404040',
    error: '#FF453A',
    success: '#32D74B',
    warning: '#FF9F0A',
    info: '#5E5CE6',
    inputBackground: '#333333',
    modalBackground: 'rgba(0,0,0,0.7)',
    shadowColor: '#000',
    divider: '#404040',
    buttonText: '#FFFFFF',
    buttonDisabled: '#666666',
    switchTrack: {
      false: '#767577',
      true: '#81b0ff'
    },
    switchThumb: {
      false: '#f4f3f4',
      true: '#2196F3'
    }
  }
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Başlangıçta kaydedilmiş tema tercihini yükle
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('isDarkMode');
      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      }
    } catch (error) {
      console.error('Tema yüklenirken hata:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('isDarkMode', JSON.stringify(newMode));
    } catch (error) {
      console.error('Tema değiştirilirken hata:', error);
    }
  };

  const theme = {
    dark: isDarkMode,
    colors: isDarkMode ? themes.dark : themes.light
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 