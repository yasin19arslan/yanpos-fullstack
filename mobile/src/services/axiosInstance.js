import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/config';

// Aynı URL'lere yapılan GET isteklerini önbelleklemek için
const cacheMap = new Map();
const cacheDuration = 5000; // 5 saniye

// Aynı URL'lere aynı anda birden fazla istek yapılmasını önlemek için
const pendingRequests = new Map();

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000
});

// Request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      // Her istekte AsyncStorage'dan user bilgisini al
      const userString = await AsyncStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        if (user && user.token) {
          // Token'ı header'a ekle
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      }
      
      // Eğer GET isteği ise önbellekte var mı kontrol et
      if (config.method === 'get') {
        const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`;
        
        // Eğer bu URL için bekleyen istek varsa, mevcut istek iptal edilir
        if (pendingRequests.has(cacheKey)) {
          const source = axios.CancelToken.source();
          config.cancelToken = source.token;
          source.cancel('Aynı istek zaten yapılıyor');
        }
        
        // Eğer önbellekte varsa ve süresi dolmamışsa
        const cachedData = cacheMap.get(cacheKey);
        if (cachedData && Date.now() - cachedData.timestamp < cacheDuration) {
          // Önbellekten veri dönecek şekilde ayarla
          const source = axios.CancelToken.source();
          config.cancelToken = source.token;
          source.cancel('İstek önbellekten alındı');
          
          // Özel bir durum döndürerek interceptor'da yakalanacak
          throw {
            response: {
              status: 200,
              data: cachedData.data
            },
            isFromCache: true
          };
        }
        
        // İsteği bekleyenler listesine ekle
        pendingRequests.set(cacheKey, true);
        
        // İstek tamamlandığında bekleyenler listesinden kaldırmak için
        config._cacheKey = cacheKey;
      }
    } catch (error) {
      if (error.isFromCache) {
        return Promise.reject(error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // GET isteklerini önbelleğe al
    if (response.config.method === 'get') {
      const cacheKey = response.config._cacheKey;
      if (cacheKey) {
        cacheMap.set(cacheKey, {
          data: response.data,
          timestamp: Date.now()
        });
        
        // İsteği bekleyenler listesinden kaldır
        pendingRequests.delete(cacheKey);
      }
    }
    return response;
  },
  (error) => {
    // Önbellekten dönen verileri işle
    if (error.isFromCache) {
      return Promise.resolve({ 
        status: 200, 
        data: error.response.data,
        fromCache: true
      });
    }
    
    // İsteği bekleyenler listesinden kaldır
    if (error.config && error.config._cacheKey) {
      pendingRequests.delete(error.config._cacheKey);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance; 