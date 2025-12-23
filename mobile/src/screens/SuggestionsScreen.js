import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  Image, 
  TouchableOpacity,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { API_URL } from '../config/api';

const { width } = Dimensions.get('window');

export default function SuggestionsScreen() {
  const { theme } = useTheme();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, productsRes] = await Promise.all([
        fetch(`${API_URL}/api/categories/get-all`),
        fetch(`${API_URL}/api/products/get-all`)
      ]);

      const categoriesData = await categoriesRes.json();
      const productsData = await productsRes.json();

      setCategories(categoriesData);
      setProducts(productsData);
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderProductCard = (product) => (
    <TouchableOpacity 
      key={product._id}
      style={[styles.productCard, { backgroundColor: theme.colors.card }]}
      onPress={() => addToCart(product)}
    >
      <Image source={{ uri: product.img }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={[styles.productTitle, { color: theme.colors.text }]}>
          {product.title}
        </Text>
        <Text style={[styles.productPrice, { color: theme.colors.primary }]}>
          {product.price} ₺
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
        Kategorilere Göre Öneriler
      </Text>

      {categories.map(category => {
        const categoryProducts = products.filter(p => p.category === category.title);
        if (categoryProducts.length === 0) return null;

        return (
          <View key={category._id} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {category.title}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categoryProducts.map(product => (
                <View key={product._id} style={styles.horizontalCard}>
                  {renderProductCard(product)}
                </View>
              ))}
            </ScrollView>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  horizontalCard: {
    marginRight: 16,
    width: width * 0.6,
  },
  productCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  productInfo: {
    padding: 12,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  }
}); 