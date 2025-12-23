import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import CartScreen from '../screens/CartScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SuggestionsScreen from '../screens/SuggestionsScreen';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Ana Sayfa') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Favoriler') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Sepetim') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Profil') {
            iconName = focused ? 'person' : 'person-outline';
          }

          if (route.name === 'Öneriler') {
            return (
              <Image 
                source={require('../../assets/yanposlogo.jpg')} 
                style={{ 
                  width: 35, 
                  height: 35, 
                  borderRadius: 17.5,
                  opacity: focused ? 1 : 0.7 
                }} 
              />
            );
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1A1A1A',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Ana Sayfa" component={HomeScreen} />
      <Tab.Screen name="Favoriler" component={FavoritesScreen} />
      <Tab.Screen 
        name="Öneriler" 
        component={SuggestionsScreen}
      />
      <Tab.Screen name="Sepetim" component={CartScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} />
    </Stack.Navigator>
  );
} 