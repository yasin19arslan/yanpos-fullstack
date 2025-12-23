import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { API_URL } from '../config/api';
import { useAuth } from './AuthContext';
import { useAppNotification } from '../../App';

const OrderContext = createContext();
const WS_URL = API_URL.replace('http', 'ws');

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const orderStatusesRef = useRef({});
  const { user } = useAuth();
  const { showNotification } = useAppNotification();
  const wsRef = useRef(null);
  const isRequestInProgressRef = useRef(false);

  const handleOrderUpdate = useCallback((updatedOrder) => {
    if (!updatedOrder || !updatedOrder._id) return;

    setOrders(prevOrders => {
      const existingOrderIndex = prevOrders.findIndex(order => order._id === updatedOrder._id);
      const newOrders = [...prevOrders];
      
      if (existingOrderIndex !== -1) {
        newOrders[existingOrderIndex] = updatedOrder;
      } else {
        newOrders.unshift(updatedOrder);
      }
      
      return newOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });

    const oldStatus = orderStatusesRef.current[updatedOrder._id];
    if (oldStatus && oldStatus !== updatedOrder.status) {
      showStatusUpdateNotification(updatedOrder);
    }
    orderStatusesRef.current[updatedOrder._id] = updatedOrder.status;
  }, [showStatusUpdateNotification]);

  const connectWebSocket = useCallback(() => {
    if (!user?._id) return;

    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;
      if (wsRef.current?.readyState === WebSocket.CONNECTING) return;

      // Mevcut bağlantıyı temizle
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      const ws = new WebSocket(`${WS_URL}/ws/orders`);

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'AUTH', userId: user._id }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ORDER_UPDATE' || data.type === 'NEW_ORDER') {
            if (data.order) {
              handleOrderUpdate(data.order);
            }
          }
        } catch (error) {
          console.error('WebSocket mesaj hatası:', error);
        }
      };

      ws.onerror = () => {
        wsRef.current = null;
        setTimeout(connectWebSocket, 3000);
      };

      ws.onclose = (event) => {
        wsRef.current = null;
        if (event.code !== 1000) {
          setTimeout(connectWebSocket, 3000);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('WebSocket bağlantı hatası:', error);
      wsRef.current = null;
      setTimeout(connectWebSocket, 3000);
    }
  }, [user?._id, handleOrderUpdate]);

  const fetchOrders = useCallback(async () => {
    if (!user?._id || isRequestInProgressRef.current) return;
    
    try {
      isRequestInProgressRef.current = true;
      setLoading(true);
      
      const response = await fetch(`${API_URL}/api/mobile-orders/user/${user._id}`, {
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        const newOrders = data.orders || [];
        setOrders(newOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      }
    } catch (error) {
      console.error('Siparişler yüklenirken hata:', error);
    } finally {
      setLoading(false);
      isRequestInProgressRef.current = false;
    }
  }, [user]);

  // WebSocket bağlantısını başlat ve yönet
  useEffect(() => {
    if (user?._id) {
      connectWebSocket();
      fetchOrders();
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user?._id, connectWebSocket, fetchOrders]);

  // Durum değişikliklerini bildir
  const showStatusUpdateNotification = useCallback((order) => {
    let statusText = '';
    let message = '';
    let notificationType = 'order';

    switch (order.status) {
      case 'confirmed':
        statusText = 'Onaylandı';
        message = `Sipariş #${order.orderNumber || order._id.slice(-4)} onaylandı ve hazırlanmaya başlayacak`;
        notificationType = 'success';
        break;
      case 'preparing':
        statusText = 'Hazırlanıyor';
        message = `Sipariş #${order.orderNumber || order._id.slice(-4)} şu anda hazırlanıyor`;
        notificationType = 'order';
        break;
      case 'ready':
        statusText = 'Hazır';
        message = `Sipariş #${order.orderNumber || order._id.slice(-4)} hazır! Alabilirsiniz`;
        notificationType = 'success';
        break;
      case 'completed':
        statusText = 'Tamamlandı';
        message = `Sipariş #${order.orderNumber || order._id.slice(-4)} tamamlandı. Afiyet olsun!`;
        notificationType = 'success';
        break;
      case 'cancelled':
        statusText = 'İptal Edildi';
        message = `Sipariş #${order.orderNumber || order._id.slice(-4)} iptal edildi`;
        notificationType = 'error';
        break;
      default:
        return; // Diğer durumlar için bildirim gösterme
    }

    // Sadece popup bildirim göster (Alert.alert kaldırıldı)
    showNotification(message, notificationType);
  }, [showNotification]);

  return (
    <OrderContext.Provider value={{ orders, loading, fetchOrders }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext); 