import React, { useState, useEffect, useCallback } from 'react';
import { 
  CurrencyDollarIcon, 
  ShoppingCartIcon, 
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { dashboardAPI } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    averageOrder: 0,
    totalOrders: 0,
    salesChange: 0,
    ordersChange: 0,
    dailySales: [],
    popularProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Son 7 günün tarihlerini hesapla
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const params = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };

      console.log('İstek tarihleri:', params);

      const response = await dashboardAPI.getStats(params);
      
      if (!response || !response.data) {
        throw new Error('Veri alınamadı');
      }
      
      console.log('Gelen veriler:', response.data);

      // Veri kontrolü ve varsayılan değerler
      const data = {
        totalSales: Number(response.data.totalSales) || 0,
        averageOrder: Number(response.data.averageOrder) || 0,
        totalOrders: Number(response.data.totalOrders) || 0,
        salesChange: Number(response.data.salesChange) || 0,
        ordersChange: Number(response.data.ordersChange) || 0,
        dailySales: Array.isArray(response.data.dailySales) ? response.data.dailySales : [],
        popularProducts: Array.isArray(response.data.popularProducts) ? response.data.popularProducts : []
      };

      setStats(data);
    } catch (err) {
      console.error('İstatistik hatası:', err);
      setError(err.response?.data?.message || 'İstatistikler yüklenirken bir hata oluştu');
      // Hata durumunda varsayılan değerleri ayarla
      setStats({
        totalSales: 0,
        averageOrder: 0,
        totalOrders: 0,
        salesChange: 0,
        ordersChange: 0,
        dailySales: [],
        popularProducts: []
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatCurrency = (amount) => {
    if (isNaN(amount) || amount === null) return '₺0,00';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatPercentage = (value) => {
    if (isNaN(value) || value === null) return '+0%';
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Toplam Satış */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-50 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div className={`flex items-center text-sm font-medium ${
              stats.salesChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.salesChange >= 0 ? (
                <ArrowUpIcon className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 mr-1" />
              )}
              {formatPercentage(stats.salesChange)}
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Toplam Satış</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '...' : formatCurrency(stats.totalSales)}
          </p>
        </div>

        {/* Ortalama Sepet */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <ShoppingCartIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className={`flex items-center text-sm font-medium ${
              stats.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.ordersChange >= 0 ? (
                <ArrowUpIcon className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 mr-1" />
              )}
              {formatPercentage(stats.ordersChange)}
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Ortalama Sepet</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '...' : formatCurrency(stats.averageOrder)}
          </p>
        </div>

        {/* Toplam Sipariş */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className={`flex items-center text-sm font-medium ${
              stats.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.ordersChange >= 0 ? (
                <ArrowUpIcon className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 mr-1" />
              )}
              {formatPercentage(stats.ordersChange)}
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Toplam Sipariş</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '...' : stats.totalOrders}
          </p>
        </div>
      </div>

      {/* En Çok Satılan Ürünler */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 mb-8">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">En Çok Satılan Ürünler</h3>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Yükleniyor...</span>
            </div>
          ) : stats.popularProducts && stats.popularProducts.length > 0 ? (
            <div className="space-y-4">
              {stats.popularProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.totalSold} adet satış</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(product.totalRevenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Henüz satış verisi bulunmuyor
            </div>
          )}
        </div>
      </div>

      {/* Günlük Satışlar */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Günlük Satışlar</h3>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Yükleniyor...</span>
            </div>
          ) : stats.dailySales && stats.dailySales.length > 0 ? (
            <div className="space-y-4">
              {stats.dailySales.map((sale, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{formatDate(sale.date)}</p>
                      <p className="text-sm text-gray-500">{sale.orders} sipariş</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(sale.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Seçilen tarih aralığında satış verisi bulunmuyor
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 