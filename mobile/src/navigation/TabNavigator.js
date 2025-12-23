import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import CartScreen from '../screens/CartScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OrdersScreen from '../screens/OrdersScreen';
import CampaignsScreen from '../screens/CampaignsScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { user } = useAuth();
  const hasToken = user && user.token;
  const isLoggedIn = !!user;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          height: 60,
          paddingBottom: 5
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false
      }}
    >
      <Tab.Screen
        name="Ana Sayfa"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          )
        }}
      />

      {isLoggedIn && (
        <Tab.Screen
          name="Siparişlerim"
          component={OrdersScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="receipt-outline" size={size} color={color} />
            )
          }}
        />
      )}

      <Tab.Screen
        name="Kampanyalar"
        component={CampaignsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetag-outline" size={size} color={color} />
          )
        }}
      />

      {isLoggedIn && (
        <Tab.Screen
          name="Favoriler"
          component={FavoritesScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="heart-outline" size={size} color={color} />
            )
          }}
        />
      )}

      {isLoggedIn && (
        <Tab.Screen
          name="Sepetim"
          component={CartScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cart-outline" size={size} color={color} />
            )
          }}
        />
      )}

      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          )
        }}
      />
    </Tab.Navigator>
  );
} 