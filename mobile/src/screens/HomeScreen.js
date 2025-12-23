import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  FlatList,
  ImageBackground,
  Dimensions,
  ActivityIndicator,
  TextInput,
  Image,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../context/FavoritesContext';
import Modal from 'react-native-modal';
import { API_URL } from '../config/api';
import { useCart } from '../context/CartContext';
import NotificationPopup from '../components/NotificationPopup';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [notification, setNotification] = useState({
    visible: false,
    message: ''
  });

  const { favorites, toggleFavorite } = useFavorites();
  const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();
  const { theme } = useTheme();
  const { user } = useAuth();

  const stories = [
    {
      id: '1',
      title: 'Kampanya',
      image: require('../../assets/story1.jpg'),
    },
    {
      id: '2',
      title: 'Yeni',
      image: require('../../assets/story2.jpg'),
    },
    {
      id: '3',
      title: 'İndirim',
      image: require('../../assets/story3.jpg'),
    },
    {
      id: '4',
      title: 'Özel',
      image: require('../../assets/story4.jpg'),
    },
  ];

  const fetchData = async () => {
    try {
      const categoriesResponse = await fetch(`${API_URL}/api/categories`);
      const productsResponse = await fetch(`${API_URL}/api/products`);

      if (!categoriesResponse.ok || !productsResponse.ok) {
        throw new Error('Veri çekme hatası');
      }

      const categoriesData = await categoriesResponse.json();
      const productsData = await productsResponse.json();

      let categories = [];
      if (categoriesData && categoriesData.categories) {
        categories = categoriesData.categories.map(cat => ({
          _id: cat._id,
          title: cat.name || cat.title
        }));
      }

      setCategories([
        { _id: 'all', title: 'Tümü' },
        ...categories
      ]);

      const products = productsData.products || [];
      const formattedProducts = products.map(product => ({
        _id: product._id,
        title: product.name || 'İsimsiz Ürün',
        price: product.price || 0,
        img: product.image || '',
        categoryId: product.categoryId || product.category || null
      }));

      setProducts(formattedProducts);
      setFilteredProducts(formattedProducts);
      setLoading(false);
    } catch (error) {
      setCategories([{ _id: 'all', title: 'Tümü' }]);
      setProducts([]);
      setFilteredProducts([]);
      setLoading(false);
      Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Kategori değiştiğinde ürünleri filtrele
  useEffect(() => {
    const filterProducts = async () => {
      try {
        if (selectedCategory === 'all') {
          setFilteredProducts(products);
          return;
        }

        const selectedCategoryObj = categories.find(cat => cat._id === selectedCategory);
        if (selectedCategoryObj) {
          const filtered = products.filter(product => {
            if (!product.categoryId) return false;
            const productCategoryId = typeof product.categoryId === 'object' 
              ? product.categoryId._id 
              : product.categoryId;
            return productCategoryId === selectedCategoryObj._id;
          });
          setFilteredProducts(filtered);
        } else {
          setFilteredProducts([]);
        }
      } catch (error) {
        setFilteredProducts([]);
      }
    };

    filterProducts();
  }, [selectedCategory, products, categories]);

  // Kategori seçildiğinde
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  // Arama fonksiyonu
  const handleSearch = (text) => {
    setSearchQuery(text);
    
    if (text.trim() === '') {
      // Arama boşsa kategoriye göre filtrele
      if (selectedCategory === 'all') {
        setFilteredProducts(products);
      } else {
        const selectedCategoryObj = categories.find(cat => cat._id === selectedCategory);
        if (selectedCategoryObj) {
          const filtered = products.filter(product => {
            const productCategoryId = typeof product.categoryId === 'object' 
              ? product.categoryId._id 
              : product.categoryId;
            return productCategoryId === selectedCategoryObj._id;
          });
          setFilteredProducts(filtered);
        }
      }
      return;
    }

    // Arama yapılıyorsa
    const filtered = products.filter(product => {
      const matchesSearch = product.title.toLowerCase().includes(text.toLowerCase());
      
      if (selectedCategory === 'all') {
        return matchesSearch;
      } else {
        const selectedCategoryObj = categories.find(cat => cat._id === selectedCategory);
        if (selectedCategoryObj) {
          const productCategoryId = typeof product.categoryId === 'object' 
            ? product.categoryId._id 
            : product.categoryId;
          return productCategoryId === selectedCategoryObj._id && matchesSearch;
        }
      }
      return false;
    });
    setFilteredProducts(filtered);
  };

  // Arama ikonuna tıklandığında
  const toggleSearch = () => {
    if (isSearchActive) {
      // Arama kapatılıyorsa
      setSearchQuery('');  // Arama metnini temizle
      setIsSearchActive(false);  // Arama kutusunu kapat
      
      // Ürünleri kategoriye göre filtrele
      if (selectedCategory === 'all') {
        setFilteredProducts(products);
      } else {
        const selectedCategoryObj = categories.find(cat => cat._id === selectedCategory);
        if (selectedCategoryObj) {
          const filtered = products.filter(product => {
            const productCategoryId = typeof product.categoryId === 'object' 
              ? product.categoryId._id 
              : product.categoryId;
            return productCategoryId === selectedCategoryObj._id;
          });
          setFilteredProducts(filtered);
        }
      }
    } else {
      setIsSearchActive(true);  // Arama kutusunu aç
    }
  };

  const handleAddToCart = async (item) => {
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

  const handleFavoritePress = async (item) => {
    if (!user) {
      setNotification({
        visible: true,
        message: 'Favorilere eklemek için lütfen giriş yapın'
      });
      return;
    }

    try {
      const isFavorite = favorites.some(fav => fav._id === item._id);
      await toggleFavorite(item);
      setNotification({
        visible: true,
        message: isFavorite ? 'Ürün favorilerden çıkarıldı' : 'Ürün favorilere eklendi'
      });
    } catch (error) {
      console.error('Favori işlemi sırasında hata:', error);
      setNotification({
        visible: true,
        message: 'Bir hata oluştu'
      });
    }
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.categoryItem,
        selectedCategory === item._id && styles.selectedCategory,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.border }
      ]}
      onPress={() => handleCategorySelect(item._id)}
    >
      <Text style={[
        styles.categoryText,
        selectedCategory === item._id && styles.selectedCategoryText,
        { color: theme.colors.text }
      ]}>
        {item.title}
      </Text>
      {selectedCategory === item._id && (
        <View style={styles.selectedIndicator} />
      )}
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }) => {
    const cartItem = cartItems.find(cartItem => cartItem._id === item._id);
    const quantity = cartItem ? cartItem.quantity : 0;
    const isFavorited = favorites.some(fav => fav._id === item._id);

    return (
      <View
        style={[
          styles.productCard,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border }
        ]}
      >
        <ImageBackground
          source={{ uri: item.img }}
          style={styles.productImage}
          imageStyle={{ borderRadius: 15 }}
          resizeMode="cover"
          onError={(e) => console.log('Image Error:', e.nativeEvent.error)}
        >
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={() => handleFavoritePress(item)}
          >
            <Ionicons 
              name={isFavorited ? "heart" : "heart-outline"} 
              size={24} 
              color="#FF4B4B" 
            />
          </TouchableOpacity>
          <View style={styles.productInfo}>
            <View style={styles.productDetails}>
              <Text style={[styles.productTitle, { color: '#FFFFFF' }]}>
                {item.title || 'İsimsiz Ürün'}
              </Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={[styles.productPrice, { color: '#FFFFFF' }]}>
                {item.price ? `${item.price} ₺` : 'Fiyat Belirtilmemiş'}
              </Text>
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
                    <Ionicons name="remove" size={20} color="#FFF" />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{quantity}</Text>
                  <TouchableOpacity 
                    style={styles.quantityButton}
                    onPress={() => handleAddToCart(item)}
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

  const renderStoryItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.storyItem}
      onPress={() => setSelectedStory(item)}
    >
      <View style={styles.storyRing}>
        <Image
          source={item.image}
          style={styles.storyImage}
        />
      </View>
      <Text style={[styles.storyTitle, { color: theme.colors.text }]}>{item.title}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#1A1A1A" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
          <View>
            <Text style={[styles.greeting, { color: theme.colors.text }]}>Merhaba 👋</Text>
          </View>
          <TouchableOpacity 
            style={[styles.searchButton, { backgroundColor: theme.colors.card }]}
            onPress={toggleSearch}
          >
            <Ionicons 
              name={isSearchActive ? "close-outline" : "search-outline"} 
              size={24} 
              color={theme.colors.text} 
            />
          </TouchableOpacity>
        </View>

        {/* Stories */}
        <View style={[styles.storiesContainer, { backgroundColor: theme.colors.background }]}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={stories}
            renderItem={renderStoryItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.storiesList}
          />
        </View>

        {/* Story Modal */}
        <Modal
          isVisible={selectedStory !== null}
          onSwipeComplete={() => setSelectedStory(null)}
          onBackdropPress={() => setSelectedStory(null)}
          swipeDirection={['down']}
          style={styles.modal}
          backdropOpacity={0.9}
        >
          <View style={styles.modalContent}>
            {selectedStory && (
              <>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setSelectedStory(null)}
                >
                  <Ionicons name="close" size={28} color="#FFF" />
                </TouchableOpacity>
                <Image
                  source={selectedStory.image}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              </>
            )}
          </View>
        </Modal>

        {/* Search Bar */}
        {isSearchActive && (
          <View style={[styles.searchContainer, { backgroundColor: theme.colors.inputBackground }]}>
            <TextInput
              style={[
                styles.searchInput,
                { 
                  backgroundColor: theme.colors.inputBackground,
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }
              ]}
              placeholder="Ürün ara..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus={true}  // Arama açıldığında klavyeyi otomatik aç
            />
          </View>
        )}

        {/* Categories */}
        <View style={[styles.categoriesContainer, { backgroundColor: theme.colors.background }]}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={item => item._id}
            contentContainerStyle={[styles.categoriesList, { paddingRight: 16 }]}
          />
        </View>

        {/* Products */}
        <FlatList
          data={filteredProducts} // Filtrelenmiş ürünleri kullan
          renderItem={renderProductItem}
          keyExtractor={item => item._id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.productsList, { paddingBottom: 20 }]}
        />
      </View>
      <NotificationPopup 
        visible={notification.visible}
        message={notification.message}
        onClose={() => setNotification({ visible: false, message: '' })}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0, // Status bar için padding değerini kaldırdım
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  searchButton: {
    width: 45,
    height: 45,
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesList: {
    paddingRight: 16,
  },
  categoryItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  selectedCategory: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
    shadowColor: '#1A1A1A',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  categoryText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#FF4B4B',
    borderRadius: 3,
  },
  productsList: {
    paddingBottom: 20,
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#1A1A1A',
  },
  searchContainer: {
    marginBottom: 15,
    paddingHorizontal: 16,
    zIndex: 1, // Arama kutusunun diğer elemanların üzerinde görünmesi için
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 15,
    fontSize: 16,
    borderWidth: 1,
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
    zIndex: 1,
  },
  storiesContainer: {
    marginBottom: 20,
  },
  storiesList: {
    paddingLeft: 16,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 15,
  },
  storyRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FF4B4B',
  },
  storyImage: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  storyTitle: {
    fontSize: 12,
    marginTop: 4,
    color: '#666',
  },
  modal: {
    margin: 0,
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
}); 