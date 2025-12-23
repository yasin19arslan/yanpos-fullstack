import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Dimensions,
  SafeAreaView,
  Platform
} from 'react-native';
import { useCampaign } from '../context/CampaignContext';
import { useAuth } from '../context/AuthContext';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAppNotification } from '../../App';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

const CampaignsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { campaigns, getAllCampaigns, loading, error } = useCampaign();
  const { showNotification } = useAppNotification();
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    fetchCampaigns();
  }, []);
  
  const fetchCampaigns = async () => {
    try {
      await getAllCampaigns();
    } catch (err) {
      showNotification('Kampanyalar yüklenirken bir hata oluştu', 'error');
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCampaigns();
    setRefreshing(false);
  };

  const copyToClipboard = (code) => {
    showNotification(`Kampanya kodu: ${code}`, 'success');
  };
  
  // Bitiş tarihine göre kalan gün hesapla
  const getDaysLeft = (endDate) => {
    const days = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} gün kaldı` : 'Son gün!';
  };

  // Kampanya kartı için renk belirle
  const getCardColor = (index) => {
    const colors = [
      ['#4158D0', '#C850C0'], // Mor-Pembe
      ['#43cea2', '#185a9d'], // Yeşil-Mavi
      ['#ff9966', '#ff5e62'], // Turuncu-Kırmızı
      ['#6441A5', '#2a0845'], // Mor
      ['#334d50', '#cbcaa5']  // Gri-Yeşil
    ];
    
    return colors[index % colors.length];
  };

  const renderItem = ({ item, index }) => {
    const [color1, color2] = getCardColor(index);
    
    return (
      <TouchableOpacity 
        style={styles.campaignCard}
        onPress={() => copyToClipboard(item.code)}
        activeOpacity={0.8}
      >
        <View style={[styles.cardHeader, { 
          backgroundColor: color1,
          borderColor: color2
        }]}>
          <View style={styles.codeContainer}>
            <FontAwesome5 name="tags" size={12} color="#fff" style={styles.tagIcon} />
            <Text style={styles.campaignCode}>{item.code}</Text>
          </View>
          
          <View style={styles.expiryContainer}>
            <Ionicons name="time-outline" size={14} color="#fff" style={styles.timeIcon} />
            <Text style={styles.expiryText}>
              {getDaysLeft(item.endDate)}
            </Text>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.campaignTitle}>{item.title}</Text>
          
          <View style={styles.discountContainer}>
            <View style={[styles.discountBadge, { backgroundColor: `${color1}20` }]}>
              <Text style={[styles.discountText, { color: color1 }]}>
                {item.discountType === 'percentage' 
                  ? `%${item.discountValue}` 
                  : `${item.discountValue} TL`}
                <Text style={styles.discountLabel}> indirim</Text>
              </Text>
            </View>
            
            {item.minimumPurchase > 0 && (
              <View style={styles.minimumBadge}>
                <Text style={styles.minimumText}>
                  Min. {item.minimumPurchase} TL
                </Text>
              </View>
            )}
          </View>
          
          {item.description ? (
            <Text style={styles.description}>
              {item.description}
            </Text>
          ) : null}
          
          <View style={styles.footer}>
            <Text style={styles.tapToCopy}>Kodu kopyalamak için kartı tıklayın</Text>
            <Ionicons name="copy-outline" size={14} color="#999" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => {
    if (campaigns.length === 0) return null;
    
    return (
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Kampanyalar</Text>
        <Text style={styles.listSubtitle}>{campaigns.length} aktif kampanya</Text>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4158D0" />
          <Text style={styles.loadingText}>
            Kampanyalar yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#f7f7f7"
        translucent={false}
      />
      <View style={styles.container}>
        <FlatList
          data={campaigns}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="ticket-percent-outline" size={70} color="#ccc" />
              <Text style={styles.emptyText}>
                Aktif kampanya bulunmuyor
              </Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={fetchCampaigns}
              >
                <Text style={styles.refreshButtonText}>Yenile</Text>
              </TouchableOpacity>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4158D0', '#C850C0']}
              tintColor="#4158D0"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    paddingTop: Platform.OS === 'android' ? 0 : 0
  },
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  listTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  listSubtitle: {
    fontSize: 15,
    color: '#666',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
    paddingTop: 0,
  },
  campaignCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
  },
  tagIcon: {
    marginRight: 6,
  },
  campaignCode: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    marginRight: 4,
  },
  expiryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  cardContent: {
    padding: 16,
  },
  campaignTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  discountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  discountBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
    marginRight: 8,
    marginBottom: 6,
  },
  discountText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  discountLabel: {
    fontWeight: 'normal',
  },
  minimumBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
    marginBottom: 6,
  },
  minimumText: {
    fontSize: 12,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#ddd',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  tapToCopy: {
    fontSize: 12,
    color: '#999',
    marginRight: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 30,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 20,
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  refreshButton: {
    backgroundColor: '#4158D0',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 50,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});

export default CampaignsScreen; 