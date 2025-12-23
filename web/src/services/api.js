import axios from 'axios';

const api = axios.create({
  baseURL: 'https://yanposapp.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request ve Response logları için interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API İsteği: ${config.method.toUpperCase()} ${config.url}`, config.data || config.params);
    return config;
  },
  (error) => {
    console.error('API İstek Hatası:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Yanıtı: ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error('API Yanıt Hatası:', error.response?.status, error.response?.data || error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth token interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth services
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
};

// Category services
export const categoryAPI = {
  getCategories: () => api.get('/categories'),
  getCategory: (id) => api.get(`/categories/${id}`),
  createCategory: (categoryData) => api.post('/categories', categoryData),
  updateCategory: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};

// Product services
export const productAPI = {
  getProducts: () => api.get('/products'),
  getProduct: (id) => api.get(`/products/${id}`),
  getProductsByCategory: (categoryId) => api.get(`/products/category/${categoryId}`),
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/products/${id}`),
};

// Order services
export const orderAPI = {
  createOrder: (orderData) => api.post('/orders', orderData),
  getOrders: () => api.get('/orders'),
  getOrder: (id) => api.get(`/orders/${id}`),
  updateOrderStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  deleteOrder: (id) => api.delete(`/orders/${id}`),
};

// Campaign services
export const campaignAPI = {
  getAllCampaigns: () => {
    console.log('Tüm kampanyalar isteniyor (admin)');
    return api.get('/campaigns/admin');
  },
  getActiveCampaigns: () => {
    console.log('Aktif kampanyalar isteniyor');
    return api.get('/campaigns');
  },
  getCampaign: (id) => api.get(`/campaigns/${id}`),
  createCampaign: (campaignData) => api.post('/campaigns', campaignData),
  updateCampaign: (id, campaignData) => api.put(`/campaigns/${id}`, campaignData),
  deleteCampaign: (id) => api.delete(`/campaigns/${id}`),
  toggleCampaignActive: (id, isActive) => api.patch(`/campaigns/${id}/toggle-active`, { isActive }),
  getCampaignByCode: (code) => api.get(`/campaigns/code/${code}`),
};

// Dashboard services
export const dashboardAPI = {
  getStats: (params) => {
    console.log('Dashboard API isteği:', params);
    return api.get('/dashboard/stats', { 
      params,
      timeout: 15000 // Timeout süresini artır
    });
  },
  
  getSalesTrend: (params) => api.get('/dashboard/sales-trend', { params }),
  
  getHourlyData: (params) => api.get('/dashboard/hourly-data', { params }),
  
  getRecentOrders: (params) => api.get('/dashboard/recent-orders', { params }),
  
  getPopularProducts: (params) => api.get('/dashboard/popular-products', { params })
};

export default api; 