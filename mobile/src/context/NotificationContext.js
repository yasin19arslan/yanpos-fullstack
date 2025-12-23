import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Bildirimleri yükle
  const loadNotifications = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/user/${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setNotifications(data);
        updateUnreadCount(data);
      }
    } catch (error) {
      console.error('Bildirimler yüklenirken hata:', error);
    }
  };

  // Okunmamış bildirimleri say
  const updateUnreadCount = (notifs) => {
    const unread = notifs.filter(n => !n.isRead).length;
    setUnreadCount(unread);
  };

  // Bildirimi okundu olarak işaretle
  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/mark-read/${notificationId}`, {
        method: 'PUT'
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n._id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Bildirim güncellenirken hata:', error);
    }
  };

  // Tüm bildirimleri okundu olarak işaretle
  const markAllAsRead = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/mark-all-read/${userId}`, {
        method: 'PUT'
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Bildirimler güncellenirken hata:', error);
    }
  };

  // Bildirimi sil
  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.filter(n => n._id !== notificationId)
        );
        updateUnreadCount(notifications.filter(n => n._id !== notificationId));
      }
    } catch (error) {
      console.error('Bildirim silinirken hata:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loadNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext); 