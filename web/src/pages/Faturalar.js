import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { orderAPI } from '../services/api';

const Faturalar = () => {
  const location = useLocation();
  const [faturalar, setFaturalar] = useState([]);
  const [filteredFaturalar, setFilteredFaturalar] = useState([]);
  const [filterName, setFilterName] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Veritabanından siparişleri yükle
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const response = await orderAPI.getOrders();
        console.log('Sipariş verileri:', response.data);
        
        if (response.data && response.data.orders) {
          const formattedOrders = response.data.orders.map(order => ({
            id: order._id,
            siparisNo: order.orderNumber,
            musteriAdi: order.customerName,
            tarih: new Date(order.createdAt).toLocaleString('tr-TR'),
            toplam: order.totalAmount,
            durum: mapOrderStatus(order.status),
            urunler: order.items,
            odemeYontemi: order.paymentMethod === 'credit_card' ? 'Kredi Kartı' : 'Nakit',
            orderType: order.orderType
          }));
          
          setFaturalar(formattedOrders);
        } else {
          setFaturalar([]);
        }
      } catch (err) {
        console.error('Siparişleri yükleme hatası:', err);
        setError('Siparişler yüklenirken bir hata oluştu: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    
    loadOrders();
  }, []);

  // Sipariş durumunu Türkçeye çevir
  const mapOrderStatus = (status) => {
    const statusMap = {
      'pending': 'Tamamlandı',
      'preparing': 'Hazırlanıyor',
      'ready': 'Hazır',
      'completed': 'Tamamlandı',
      'cancelled': 'İptal Edildi'
    };
    return statusMap[status] || 'Tamamlandı';
  };

  useEffect(() => {
    // State'ten gelen siparişleri de ekle
    if (location.state?.newOrder) {
      const order = location.state.newOrder;
      setFaturalar(prevFaturalar => {
        // Eğer sipariş zaten ekli değilse ekle
        if (!prevFaturalar.some(f => f.id === order.id)) {
          return [...prevFaturalar, {
            id: order.id,
            siparisNo: order.siparisNo,
            musteriAdi: order.musteriAdi,
            tarih: new Date(order.date).toLocaleString('tr-TR'),
            toplam: order.totalAmount,
            durum: 'Tamamlandı',
            urunler: order.items
          }];
        }
        return prevFaturalar;
      });
      // State'i temizle
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Filtreleri uygula
  useEffect(() => {
    let filtered = [...faturalar];
    
    // İsme göre filtrele
    if (filterName) {
      filtered = filtered.filter(fatura => 
        fatura.musteriAdi.toLowerCase().includes(filterName.toLowerCase())
      );
    }
    
    // Başlangıç tarihine göre filtrele
    if (filterStartDate) {
      const startDate = new Date(filterStartDate);
      filtered = filtered.filter(fatura => {
        const faturaDate = new Date(fatura.tarih);
        return faturaDate >= startDate;
      });
    }
    
    // Bitiş tarihine göre filtrele
    if (filterEndDate) {
      const endDate = new Date(filterEndDate);
      // Bitiş tarihini günün sonuna ayarla
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(fatura => {
        const faturaDate = new Date(fatura.tarih);
        return faturaDate <= endDate;
      });
    }
    
    setFilteredFaturalar(filtered);
  }, [faturalar, filterName, filterStartDate, filterEndDate]);

  const handleFişYazdır = (fatura) => {
    // Yazdırma işlemi için faturayı hazırla
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      alert('Lütfen popup engelleyiciyi kapatın ve tekrar deneyin.');
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Fiş - ${fatura.siparisNo}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .info { margin-bottom: 20px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .items { margin-bottom: 20px; }
            .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .item-details { margin-top: 5px; margin-left: 20px; font-size: 12px; color: #555; }
            .total { display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #000; padding-top: 10px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; }
            td { padding: 8px; text-align: left; }
            .column-price { text-align: right; }
            .column-qty { text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>YanPOS</h1>
            <p>Sipariş Fişi</p>
          </div>
          <div class="info">
            <div class="info-row">
              <span>Sipariş No:</span>
              <span>${fatura.siparisNo}</span>
            </div>
            <div class="info-row">
              <span>Tarih:</span>
              <span>${fatura.tarih}</span>
            </div>
            <div class="info-row">
              <span>Müşteri:</span>
              <span>${fatura.musteriAdi}</span>
            </div>
            <div class="info-row">
              <span>Durum:</span>
              <span>${fatura.durum}</span>
            </div>
            <div class="info-row">
              <span>Ödeme Yöntemi:</span>
              <span>${fatura.odemeYontemi}</span>
            </div>
          </div>
          <div class="items">
            <h3>Ürünler</h3>
            <table>
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th class="column-qty">Adet</th>
                  <th class="column-price">Birim Fiyat</th>
                  <th class="column-price">Toplam</th>
                </tr>
              </thead>
              <tbody>
                ${fatura.urunler.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td class="column-qty">${item.quantity}</td>
                    <td class="column-price">₺${item.price}</td>
                    <td class="column-price">₺${item.price * item.quantity}</td>
                  </tr>
                  ${item.description ? `
                  <tr>
                    <td colspan="4" class="item-details">${item.description}</td>
                  </tr>` : ''}
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="total">
            <span>Toplam:</span>
            <span>₺${fatura.toplam}</span>
          </div>
          <div class="footer">
            <p>Bizi tercih ettiğiniz için teşekkür ederiz!</p>
            <p>${new Date().toLocaleString('tr-TR')}</p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const resetFilters = () => {
    setFilterName('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Faturalar</h1>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {showFilters ? 'Filtreleri Gizle' : 'Filtreleri Göster'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}

      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri Adı</label>
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Müşteri adı ara..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md mr-2"
            >
              Filtreleri Temizle
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm flex items-center justify-center p-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-indigo-600">Yükleniyor...</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sipariş No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ödeme</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFaturalar.length > 0 ? (
                  filteredFaturalar.map((fatura) => (
                    <tr key={fatura.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{fatura.siparisNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fatura.musteriAdi}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fatura.tarih}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₺{fatura.toplam}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          fatura.durum === 'Tamamlandı' ? 'bg-green-100 text-green-800' : 
                          fatura.durum === 'İptal Edildi' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {fatura.durum}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fatura.odemeYontemi}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleFişYazdır(fatura)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center space-x-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                          </svg>
                          <span>Fiş Yazdır</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                      {filterName || filterStartDate || filterEndDate ? 
                        'Arama kriterlerine uygun fatura bulunamadı.' : 
                        'Henüz fatura bulunmuyor.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Faturalar; 