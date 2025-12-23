import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

export default function OrdersScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { orders, loading, fetchOrders, connectWebSocket } = useOrders();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // 'active' veya 'completed'

  // WebSocket bağlantısı ve sipariş güncelleme
  useEffect(() => {
    let wsConnection;
    
    const setupWebSocket = async () => {
      if (user?._id) {
        await fetchOrders(); // İlk siparişleri yükle
        wsConnection = connectWebSocket(); // WebSocket bağlantısını kur
      }
    };

    setupWebSocket();

    // Sayfa aktifken her 15 saniyede bir güncelle
    const interval = setInterval(() => {
      if (user?._id && activeTab === 'active') {
        fetchOrders();
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, [user?._id, activeTab]);

  // Sayfa odaklandığında siparişleri güncelle
  useFocusEffect(
    useCallback(() => {
      if (user?._id) {
        fetchOrders();
      }
    }, [user, fetchOrders])
  );

  // Tab değiştiğinde siparişleri güncelle
  useEffect(() => {
    if (user?._id) {
      fetchOrders();
    }
  }, [activeTab]);

  const onRefresh = useCallback(async () => {
    if (user?._id) {
      setRefreshing(true);
      await fetchOrders();
      setRefreshing(false);
    }
  }, [fetchOrders, user]);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return {
          text: 'Bekliyor',
          color: '#FFA000',
          icon: 'time-outline',
          bgColor: '#FFF8E1'
        };
      case 'confirmed':
        return {
          text: 'Onaylandı',
          color: '#2196F3',
          icon: 'checkmark-circle-outline',
          bgColor: '#E3F2FD'
        };
      case 'preparing':
        return {
          text: 'Hazırlanıyor',
          color: '#9C27B0',
          icon: 'restaurant-outline',
          bgColor: '#F3E5F5'
        };
      case 'ready':
        return {
          text: 'Hazır',
          color: '#00BCD4',
          icon: 'checkmark-done-circle-outline',
          bgColor: '#E0F7FA'
        };
      case 'completed':
        return {
          text: 'Tamamlandı',
          color: '#4CAF50',
          icon: 'checkmark-done-outline',
          bgColor: '#E8F5E9'
        };
      case 'cancelled':
        return {
          text: 'İptal Edildi',
          color: '#F44336',
          icon: 'close-circle-outline',
          bgColor: '#FFEBEE'
        };
      default:
        return {
          text: 'Bekliyor',
          color: '#FFA000',
          icon: 'time-outline',
          bgColor: '#FFF8E1'
        };
    }
  };

  const renderOrderItem = ({ item }) => {
    if (!item?._id) return null;
    const statusInfo = getStatusInfo(item.status);

    return (
      <View style={[styles.orderCard, { backgroundColor: theme.colors.surface }]}>
        {/* Sipariş Başlık */}
        <View style={styles.orderHeader}>
          <View>
            <Text style={[styles.orderDate, { color: theme.colors.textSecondary }]}>
              {new Date(item.createdAt).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
            <Text style={[styles.orderNumber, { color: theme.colors.text }]}>
              Sipariş #{item._id.slice(-6)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
            <Ionicons name={statusInfo.icon} size={16} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>

        {/* Sipariş İçeriği */}
        <View style={styles.orderContent}>
          <View style={styles.itemsList}>
            {item.items.map((product, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={[styles.itemText, { color: theme.colors.text }]}>
                  {product.quantity}x {product.name}
                </Text>
                <Text style={[styles.itemPrice, { color: theme.colors.textSecondary }]}>
                  {(product.price * product.quantity).toFixed(2)} ₺
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sipariş Detayları */}
        <View style={styles.orderFooter}>
          <View style={styles.orderInfo}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
              Ödeme Yöntemi
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {item.paymentMethod === 'online' ? 'Online Ödeme' : 'Nakit'}
            </Text>
          </View>
          <View style={styles.totalContainer}>
            <Text style={[styles.totalLabel, { color: theme.colors.textSecondary }]}>
              Toplam
            </Text>
            <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>
              {item.totalAmount.toFixed(2)} ₺
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (activeTab === 'active') {
        return ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status);
      }
      return ['completed', 'cancelled'].includes(order.status);
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders, activeTab]);

  if (!user?._id) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Siparişlerim</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Siparişlerinizi görüntülemek için giriş yapmalısınız
          </Text>
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Giriş Yap</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Siparişlerim</Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'active' && styles.activeTab,
            { borderColor: theme.colors.primary }
          ]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'active' && { color: theme.colors.primary }
          ]}>
            Aktif Siparişler
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'completed' && styles.activeTab,
            { borderColor: theme.colors.primary }
          ]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'completed' && { color: theme.colors.primary }
          ]}>
            Geçmiş Siparişler
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sipariş Listesi */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={activeTab === 'active' ? 'receipt-outline' : 'time-outline'} 
              size={64} 
              color={theme.colors.textSecondary} 
            />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {activeTab === 'active' 
                ? 'Aktif siparişiniz bulunmuyor'
                : 'Geçmiş siparişiniz bulunmuyor'}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#F5F5F5',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  orderCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  orderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  itemsList: {
    flex: 1,
  },
  itemText: {
    fontSize: 14,
    marginBottom: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemPrice: {
    fontSize: 14,
    marginLeft: 8,
  },
  orderFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  orderInfo: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalContainer: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  loginButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 