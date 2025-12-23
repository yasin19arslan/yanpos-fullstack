import { Platform } from 'react-native';

const getApiUrl = () => {
  if (__DEV__) {
    // Geliştirme ortamı
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:5001'; // Android emülatör
    }
    return 'http://localhost:5001'; // iOS
  }
  // Canlı ortam
  return 'https://yan-pos.onrender.com'; // Render.com sunucu adresi
};

// Gerçek API URL'yi log'a yazdır
const apiUrl = getApiUrl();
console.log('Yapılandırılan API URL:', apiUrl);

export const API_URL = apiUrl;

// Diğer config değerleri buraya eklenebilir 