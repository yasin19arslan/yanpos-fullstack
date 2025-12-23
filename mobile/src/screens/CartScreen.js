import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useNavigation } from '@react-navigation/native';

export default function CartScreen() {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const navigation = useNavigation();

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image 
        source={{ uri: item.img }} 
        style={styles.productImage} 
      />
      <View style={styles.productInfo}>
        <Text style={styles.productTitle}>{item.title}</Text>
        <Text style={styles.productPrice}>{item.price} ₺</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            onPress={() => {
              if (item.quantity === 1) {
                removeFromCart(item._id);
              } else {
                updateQuantity(item._id, item.quantity - 1);
              }
            }}
            style={styles.quantityButton}
          >
            <Ionicons name="remove" size={20} color="#000" />
          </TouchableOpacity>
          <Text style={styles.quantity}>{item.quantity}</Text>
          <TouchableOpacity 
            onPress={() => updateQuantity(item._id, item.quantity + 1)}
            style={styles.quantityButton}
          >
            <Ionicons name="add" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity 
        onPress={() => removeFromCart(item._id)}
        style={styles.removeButton}
      >
        <Ionicons name="trash-outline" size={24} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sepetim</Text>
      {cartItems.length === 0 ? (
        <View style={styles.emptyCart}>
          <Ionicons name="cart-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Sepetiniz boş</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.cartList}
          />
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>Toplam:</Text>
            <Text style={styles.totalAmount}>{getCartTotal()} ₺</Text>
          </View>
          <TouchableOpacity 
            style={[styles.checkoutButton, cartItems.length === 0 && { opacity: 0.5 }]} 
            onPress={() => {
              if (cartItems.length > 0) {
                navigation.navigate('PaymentScreen');
              }
            }}
            disabled={cartItems.length === 0}
          >
            <Text style={styles.checkoutButtonText}>Siparişi Tamamla</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    marginLeft: 15,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    marginHorizontal: 15,
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    padding: 5,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  totalText: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  checkoutButton: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  checkoutButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  cartList: {
    flexGrow: 1,
  },
}); 