import React, { createContext, useState, useContext } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState({});  // Her kullanıcı için ayrı sepet
  const { user } = useAuth();

  const addToCart = (product) => {
    if (!user) return;  // Kullanıcı girişi yoksa ekleme yapma

    setCartItems(currentCarts => {
      const userCart = currentCarts[user._id] || [];
      const existingItem = userCart.find(item => item._id === product._id);
      
      if (existingItem) {
        const updatedCart = userCart.map(item =>
          item._id === product._id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        return {
          ...currentCarts,
          [user._id]: updatedCart
        };
      }

      return {
        ...currentCarts,
        [user._id]: [...userCart, { ...product, quantity: 1 }]
      };
    });
  };

  const removeFromCart = (productId) => {
    if (!user) return;

    setCartItems(currentCarts => ({
      ...currentCarts,
      [user._id]: (currentCarts[user._id] || []).filter(item => item._id !== productId)
    }));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (!user || newQuantity < 1) return;

    setCartItems(currentCarts => ({
      ...currentCarts,
      [user._id]: (currentCarts[user._id] || []).map(item =>
        item._id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    }));
  };

  const getCartTotal = () => {
    if (!user) return 0;
    
    return (cartItems[user._id] || []).reduce(
      (total, item) => total + (item.price * item.quantity), 
      0
    );
  };

  const getCurrentUserCart = () => {
    return user ? (cartItems[user._id] || []) : [];
  };

  const clearCart = () => {
    if (!user) return;
    setCartItems(currentCarts => ({
      ...currentCarts,
      [user._id]: []
    }));
  };

  return (
    <CartContext.Provider value={{
      cartItems: getCurrentUserCart(),
      addToCart,
      removeFromCart,
      updateQuantity,
      getCartTotal,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
} 