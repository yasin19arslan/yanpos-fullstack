import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  DevicePhoneMobileIcon,
  CheckIcon,
  XMarkIcon,
  BellIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import { API_URL } from '../config/api';

export default function Orders() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [mobileOrders, setMobileOrders] = useState({
    new: [],
    preparing: [],
    ready: []
  });
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const notificationSound = useRef(new Audio("/notification.mp3"));
  const previousOrderCountRef = useRef(0);
  const webSocketRef = useRef(null);
  const wsConnectedRef = useRef(false);

  // Bildirim sesini çal
  const playNotificationSound = () => {
    if (soundEnabled && notificationSound.current) {
      notificationSound.current.play().catch(error => {
        console.error('Ses çalma hatası:', error);
      });
    }
  };

  // Ses durumunu değiştir
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  const fetchMobileOrders = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/mobile-orders`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (!data || !data.orders) {
        setMobileOrders({
          new: [],
          preparing: [],
          ready: []
        });
        return;
      }
      
      const classifiedOrders = {
        new: data.orders.filter(order => order.status === 'pending') || [],
        preparing: data.orders.filter(order => order.status === 'preparing' || order.status === 'confirmed') || [],
        ready: data.orders.filter(order => order.status === 'ready' || order.status === 'completed') || []
      };

      // Yeni sipariş kontrolü
      const newOrderCount = classifiedOrders.new.length;
      if (newOrderCount > previousOrderCountRef.current) {
        playNotificationSound();
      }
      previousOrderCountRef.current = newOrderCount;
      
      setMobileOrders(classifiedOrders);
    } catch (error) {
      console.error('Mobil siparişler yüklenirken hata:', error);
      setMobileOrders({
        new: [],
        preparing: [],
        ready: []
      });
    } finally {
      setLoading(false);
    }
  }, [soundEnabled]);

  // WebSocket bağlantısı kurma
  const setupWebSocket = useCallback(() => {
    const wsUrl = API_URL.replace(/^http/, 'ws').replace(/^https/, 'wss');
    const socketUrl = `${wsUrl}/ws/orders`;
    
    try {
      if (webSocketRef.current && webSocketRef.current.readyState !== WebSocket.CLOSED) {
        return;
      }

      webSocketRef.current = new WebSocket(socketUrl);
      
      webSocketRef.current.onopen = () => {
        wsConnectedRef.current = true;
      };
      
      webSocketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'NEW_ORDER') {
            // Yeni sipariş geldiğinde ses çal
            playNotificationSound();
            // Siparişleri yenile
            fetchMobileOrders();
          } else if (data.type === 'ORDER_UPDATE') {
            // Sipariş güncellendiğinde siparişleri yenile
            fetchMobileOrders();
          }
        } catch (error) {
          console.error('WebSocket mesaj hatası:', error);
        }
      };
      
      webSocketRef.current.onerror = () => {
        wsConnectedRef.current = false;
        // 3 saniye sonra yeniden bağlan
        setTimeout(setupWebSocket, 3000);
      };
      
      webSocketRef.current.onclose = () => {
        wsConnectedRef.current = false;
        // 3 saniye sonra yeniden bağlan
        setTimeout(setupWebSocket, 3000);
      };
    } catch (error) {
      console.error('WebSocket bağlantı hatası:', error);
      wsConnectedRef.current = false;
      setTimeout(setupWebSocket, 3000);
    }
  }, [fetchMobileOrders]);

  useEffect(() => {
    fetchMobileOrders();
    setupWebSocket();

    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
    };
  }, [fetchMobileOrders, setupWebSocket]);

  // Her 15 saniyede bir bağlantıyı kontrol et
  useEffect(() => {
    const interval = setInterval(() => {
      if (!wsConnectedRef.current) {
        setupWebSocket();
      }
      fetchMobileOrders();
    }, 15000);
    
    return () => clearInterval(interval);
  }, [fetchMobileOrders, setupWebSocket]);

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
  };

  // Mobil sipariş işlemleri
  const handleAcceptMobileOrder = async (order) => {
    try {
      const response = await fetch(`${API_URL}/api/mobile-orders/${order._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'confirmed' })
      });

      if (response.ok) {
        // Hazırlanıyor durumuna hemen güncelle
        const preparingResponse = await fetch(`${API_URL}/api/mobile-orders/${order._id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ status: 'preparing' })
        });

        if (preparingResponse.ok) {
          // Siparişi yazdır
          handlePrintOrder(order);
          // Siparişleri hemen yenile
          await fetchMobileOrders();
        }
      }
    } catch (error) {
      console.error('Mobil sipariş durumu güncellenirken hata:', error);
    }
  };

  const handleReadyMobileOrder = async (order) => {
    try {
      const response = await fetch(`${API_URL}/api/mobile-orders/${order._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'ready' })
      });

      if (response.ok) {
        // Siparişleri hemen yenile
        await fetchMobileOrders();
      }
    } catch (error) {
      console.error('Mobil sipariş durumu güncellenirken hata:', error);
    }
  };

  const handleCompleteMobileOrder = async (order) => {
    try {
      // Önce siparişi tamamlandı olarak işaretle
      const response = await fetch(`${API_URL}/api/mobile-orders/${order._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'completed' })
      });

      if (response.ok) {
        // İnvoice formatı oluştur
        const invoice = {
          orderId: order._id,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          items: order.items,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt,
          completedAt: new Date().toISOString(),
          orderType: 'mobile'
        };

        // Siparişi veritabanına ve faturalara ekle
        const saveResponse = await fetch(`${API_URL}/api/completed-orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(invoice)
        });

        if (saveResponse.ok) {
          console.log('Sipariş başarıyla veritabanına ve faturalara kaydedildi');
        } else {
          console.error('Sipariş veritabanına kaydedilirken hata oluştu');
        }

        // Siparişleri hemen yenile
        await fetchMobileOrders();
      }
    } catch (error) {
      console.error('Mobil sipariş durumu güncellenirken hata:', error);
    }
  };

  const handleRejectMobileOrder = async (order) => {
    try {
      const response = await fetch(`${API_URL}/api/mobile-orders/${order._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'cancelled' })
      });

      if (response.ok) {
        // Siparişleri hemen yenile
        await fetchMobileOrders();
      }
    } catch (error) {
      console.error('Mobil sipariş durumu güncellenirken hata:', error);
    }
  };

  // Sipariş yazdırma fonksiyonu
  const handlePrintOrder = (order) => {
    try {
      // Yazdırma için bir pencere aç
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        alert('Lütfen popup engelleyiciyi devre dışı bırakın ve tekrar deneyin');
        return;
      }
      
      // Yazdırma içeriğini oluştur
      const printContent = `
        <html>
          <head>
            <title>Sipariş #${order._id.substring(0, 8)}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .order-info { margin-bottom: 20px; }
              .items { width: 100%; border-collapse: collapse; }
              .items th, .items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .items th { background-color: #f2f2f2; }
              .total { margin-top: 20px; text-align: right; font-weight: bold; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>SİPARİŞ DETAYI</h2>
              <p>Sipariş ID: #${order._id.substring(0, 8)}</p>
              <p>Tarih: ${new Date(order.createdAt).toLocaleString('tr-TR')}</p>
            </div>
            
            <div class="order-info">
              <p><strong>Müşteri:</strong> ${order.customerName}</p>
              <p><strong>Telefon:</strong> ${order.customerPhone}</p>
              <p><strong>Ödeme Yöntemi:</strong> ${
                order.paymentMethod === 'nakit' ? 'Nakit' :
                order.paymentMethod === 'kredi_karti' ? 'Kredi Kartı' : 'Online'
              }</p>
            </div>
            
            <table class="items">
              <tr>
                <th>Ürün</th>
                <th>Adet</th>
                <th>Fiyat</th>
                <th>Toplam</th>
              </tr>
              ${order.items && order.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>${item.price.toFixed(2)} ₺</td>
                  <td>${(item.price * item.quantity).toFixed(2)} ₺</td>
                </tr>
              `).join('')}
            </table>
            
            <div class="total">
              <p>TOPLAM: ${order.totalAmount.toFixed(2)} ₺</p>
            </div>
            
            <div class="footer">
              <p>Bizi tercih ettiğiniz için teşekkür ederiz!</p>
            </div>
          </body>
        </html>
      `;
      
      // İçeriği yazdırma penceresine yaz
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Sayfa yüklendikten sonra yazdırma diyaloğunu aç
      printWindow.onload = function() {
        printWindow.print();
        printWindow.onafterprint = function() {
          printWindow.close();
        };
      };
    } catch (error) {
      console.error('Sipariş yazdırılırken hata:', error);
      alert('Sipariş yazdırılırken bir hata oluştu');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Az önce';
    if (minutes < 60) return `${minutes} dk önce`;
    return date.toLocaleString('tr-TR');
  };

  const renderMobileOrderList = (orderList, type) => (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden border ${
      type === 'new' ? 'border-blue-100' : 
      type === 'preparing' ? 'border-yellow-100' : 
      'border-green-100'
    }`}>
      <div className={`px-6 py-4 flex items-center ${
        type === 'new' ? 'bg-blue-50' : 
        type === 'preparing' ? 'bg-yellow-50' : 
        'bg-green-50'
      }`}>
        {type === 'new' && <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600 mr-3" />}
        {type === 'preparing' && <ClockIcon className="h-6 w-6 text-yellow-600 mr-3" />}
        {type === 'ready' && <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3" />}
        <h3 className={`text-lg font-semibold ${
          type === 'new' ? 'text-blue-900' : 
          type === 'preparing' ? 'text-yellow-900' : 
          'text-green-900'
        }`}>
          {type === 'new' ? 'Yeni Siparişler' : 
           type === 'preparing' ? 'Hazırlanan Siparişler' : 
           'Hazır Siparişler'}
          {type === 'new' && orderList.length > 0 && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {orderList.length}
            </span>
          )}
        </h3>
      </div>
      <div className="divide-y divide-gray-100">
        {orderList.map((order) => (
          <div
            key={order._id}
            className={`p-4 hover:bg-${type}-50 cursor-pointer transition-colors ${type === 'new' ? 'bg-blue-50' : ''}`}
            onClick={() => handleOrderClick(order)}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    type === 'new' ? 'bg-blue-100 text-blue-800' : 
                    type === 'preparing' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-green-100 text-green-800'
                  }`}>
                    #{order._id.substring(0, 8)}
                  </span>
                  <DevicePhoneMobileIcon className="h-4 w-4 ml-2 text-gray-500" />
                </div>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-medium">{order.customerName}</span> • {order.customerPhone}
                </p>
                <div className="mt-2 space-y-1">
                  {order.items && order.items.map((item, index) => (
                    <p key={index} className="text-sm text-gray-600">
                      {item.quantity}x {item.name}
                    </p>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">{(order.totalAmount || 0).toFixed(2)} ₺</p>
                <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                {type === 'new' && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcceptMobileOrder(order);
                      }}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-sm transition-all duration-200 ease-in-out transform hover:scale-105"
                    >
                      <CheckIcon className="h-4 w-4 mr-1" />
                      Onayla
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRejectMobileOrder(order);
                      }}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-sm transition-all duration-200 ease-in-out transform hover:scale-105"
                    >
                      <XMarkIcon className="h-4 w-4 mr-1" />
                      Reddet
                    </button>
                  </div>
                )}
                {type === 'preparing' && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrintOrder(order);
                      }}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all duration-200 ease-in-out transform hover:scale-105"
                    >
                      <PrinterIcon className="h-4 w-4 mr-1" />
                      Yazdır
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReadyMobileOrder(order);
                      }}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-sm transition-all duration-200 ease-in-out transform hover:scale-105"
                    >
                      <CheckIcon className="h-4 w-4 mr-1" />
                      Hazır
                    </button>
                  </div>
                )}
                {type === 'ready' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCompleteMobileOrder(order);
                    }}
                    className="mt-2 inline-flex items-center px-4 py-1.5 border border-transparent text-xs font-medium rounded-full text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-sm transition-all duration-200 ease-in-out transform hover:scale-105"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Tamamlandı
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {orderList.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            Sipariş bulunamadı
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mobil Siparişler</h1>
        <div className="flex items-center">
          <button
            onClick={toggleSound}
            className={`px-4 py-2 text-sm font-medium rounded-md flex items-center ${
              soundEnabled
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <BellIcon className="h-5 w-5 mr-1" />
            {soundEnabled ? 'Ses Açık' : 'Ses Kapalı'}
          </button>
          <button
            onClick={fetchMobileOrders}
            className="ml-2 px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Yenile
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {renderMobileOrderList(mobileOrders.new, 'new')}
        {renderMobileOrderList(mobileOrders.preparing, 'preparing')}
        {renderMobileOrderList(mobileOrders.ready, 'ready')}
      </div>

      {/* Sipariş Detay Modalı */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  Sipariş Detayı
                </h3>
                <div className="flex items-center">
                  <button
                    onClick={() => handlePrintOrder(selectedOrder)}
                    className="mr-3 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <PrinterIcon className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <span className="sr-only">Kapat</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    Sipariş #{selectedOrder._id.substring(0, 8)}
                  </span>
                  <span className="text-sm font-medium text-gray-500">
                    {formatDate(selectedOrder.createdAt)}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-500">Müşteri Bilgileri</h4>
                  </div>
                  <div className="text-sm text-gray-900">
                    <p><span className="font-medium">İsim:</span> {selectedOrder.customerName}</p>
                    <p><span className="font-medium">Telefon:</span> {selectedOrder.customerPhone}</p>
                    <p><span className="font-medium">Ödeme Yöntemi:</span> {
                      selectedOrder.paymentMethod === 'nakit' ? 'Nakit' :
                      selectedOrder.paymentMethod === 'kredi_karti' ? 'Kredi Kartı' : 'Online'
                    }</p>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Siparişler</h4>
                  <div className="space-y-2">
                    {selectedOrder.items && selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex items-center">
                          <span className="font-medium mr-2">{item.quantity}x</span>
                          <span className="text-gray-900">{item.name}</span>
                        </div>
                        <span className="text-gray-900">{(item.price * item.quantity).toFixed(2)} ₺</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-sm text-gray-500">Toplam Tutar</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedOrder.totalAmount.toFixed(2)} ₺</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Durum</p>
                    <p className={`text-sm font-medium ${
                      selectedOrder.status === 'pending' ? 'text-blue-600' :
                      selectedOrder.status === 'confirmed' ? 'text-purple-600' :
                      selectedOrder.status === 'preparing' ? 'text-yellow-600' :
                      selectedOrder.status === 'ready' ? 'text-green-600' :
                      selectedOrder.status === 'completed' ? 'text-green-800' :
                      'text-red-600'
                    }`}>
                      {selectedOrder.status === 'pending' ? 'Bekliyor' :
                       selectedOrder.status === 'confirmed' ? 'Onaylandı' :
                       selectedOrder.status === 'preparing' ? 'Hazırlanıyor' :
                       selectedOrder.status === 'ready' ? 'Hazır' :
                       selectedOrder.status === 'completed' ? 'Tamamlandı' :
                       'İptal Edildi'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 