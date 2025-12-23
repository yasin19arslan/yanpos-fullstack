import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  ImageBackground, 
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../context/FavoritesContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import NotificationPopup from '../components/NotificationPopup';

const { width } = Dimensions.get('window');

export default function FavoritesScreen() {
  const { favorites, toggleFavorite } = useFavorites();
  const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [notification, setNotification] = React.useState({
    visible: false,
    message: ''
  });

  const handleFavoriteToggle = (item) => {
    if (!user) {
      Alert.alert('Uyarı', 'Lütfen önce giriş yapın.');
      setNotification({
        visible: true,
        message: 'Lütfen önce giriş yapın'
      });
      return;
    }

    const isFavorite = favorites.some(fav => fav._id === item._id);
    
    if (isFavorite) {
      setNotification({
        visible: true,
        message: `${item.title} favorilerden çıkarıldı`
      });
    } else {
      setNotification({
        visible: true,
        message: `${item.title} favorilere eklendi`
      });
    }
    
    toggleFavorite(item);
  };

  const handleAddToCart = (item) => {
    if (!user) {
      Alert.alert('Uyarı', 'Lütfen önce giriş yapın.');
      return;
    }
    addToCart(item);
    setNotification({
      visible: true,
      message: `${item.title} sepetinize eklendi`
    });
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (!user) {
      Alert.alert('Uyarı', 'Lütfen önce giriş yapın.');
      return;
    }
    updateQuantity(itemId, newQuantity);
    if (newQuantity > 0) {
      setNotification({
        visible: true,
        message: 'Ürün miktarı güncellendi'
      });
    }
  };

  const renderItem = ({ item }) => {
    const cartItem = cartItems.find(cartItem => cartItem._id === item._id);
    const quantity = cartItem ? cartItem.quantity : 0;

    return (
      <View style={styles.productCard}>
        <ImageBackground
          source={{ uri: item.img }}
          style={styles.productImage}
          imageStyle={{ borderRadius: 15 }}
        >
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={() => handleFavoriteToggle(item)}
          >
            <Ionicons name="heart" size={24} color="#FF4B4B" />
          </TouchableOpacity>
          <View style={styles.productInfo}>
            <View style={styles.productDetails}>
              <Text style={styles.productTitle}>{item.title}</Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.productPrice}>{item.price} ₺</Text>
              {quantity > 0 ? (
                <View style={styles.quantityContainer}>
                  <TouchableOpacity 
                    style={styles.quantityButton}
                    onPress={() => {
                      if (quantity === 1) {
                        removeFromCart(item._id);
                      } else {
                        updateQuantity(item._id, quantity - 1);
                      }
                    }}
                  >
                    <Ionicons name="remove" size={20} color={theme.colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{quantity}</Text>
                  <TouchableOpacity 
                    style={styles.quantityButton}
                    onPress={() => handleUpdateQuantity(item._id, quantity + 1)}
                  >
                    <Ionicons name="add" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => handleAddToCart(item)}
                >
                  <Ionicons name="add" size={20} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Favorilerim</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Favorilerinizi görmek için lütfen giriş yapın
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Favorilerim</Text>
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Henüz favori ürününüz yok
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.productsList}
        />
      )}
      <NotificationPopup 
        visible={notification.visible}
        message={notification.message}
        onClose={() => setNotification({ visible: false, message: '' })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    marginTop: 0,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  productsList: {
    padding: 8,
  },
  productCard: {
    flex: 1,
    margin: 8,
    height: 200,
    maxWidth: (width - 48) / 2,
    borderRadius: 15,
    backgroundColor: '#FFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  productImage: {
    flex: 1,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  productDetails: {
    marginBottom: 8,
  },
  productTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    paddingHorizontal: 5,
  },
  quantityButton: {
    padding: 4,
  },
  quantityText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  addButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  }
}); 