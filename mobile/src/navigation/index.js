import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

import HomeScreen from '../screens/HomeScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import CategoryProductsScreen from '../screens/CategoryProductsScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CartScreen from '../screens/CartScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import PaymentScreen from '../screens/PaymentScreen';
import CampaignsScreen from '../screens/CampaignsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Ana Sayfa') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Kategoriler') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Sepetim') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Favorilerim') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Profilim') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Kampanyalar') {
            iconName = focused ? 'pricetag' : 'pricetag-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { 
          backgroundColor: theme.background,
          borderTopColor: theme.border
        },
        headerStyle: {
          backgroundColor: theme.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        }
      })}
    >
      <Tab.Screen name="Ana Sayfa" component={HomeScreen} />
      <Tab.Screen name="Kategoriler" component={CategoriesScreen} />
      <Tab.Screen name="Kampanyalar" component={CampaignsScreen} />
      <Tab.Screen name="Sepetim" component={CartScreen} />
      <Tab.Screen name="Favorilerim" component={FavoritesScreen} />
      <Tab.Screen name="Profilim" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const MainNavigator = () => {
  const { user } = useAuth();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      {user ? (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="CategoryProducts" component={CategoryProductsScreen} />
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
          <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
          <Stack.Screen name="Orders" component={OrdersScreen} />
          <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default MainNavigator; 