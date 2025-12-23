import 'react-native-gesture-handler';
import React, { useState, createContext, useContext, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { FavoritesProvider } from './src/context/FavoritesContext';
import { OrderProvider } from './src/context/OrderContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { CampaignProvider } from './src/context/CampaignContext';
import { WalletProvider } from './src/context/WalletContext';
import NotificationPopup from './src/components/NotificationPopup';

import TabNavigator from './src/navigation/TabNavigator';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import WalletScreen from './src/screens/WalletScreen';

// Konsol loglarını temizle (geliştirme modunda değilse)
if (!__DEV__) {
  console.log = () => {};
  console.error = () => {};
  console.warn = () => {};
  console.info = () => {};
  console.debug = () => {};
}

const Stack = createStackNavigator();

// Global bildirim context'i
export const AppNotificationContext = createContext();

export default function App() {
  const [notification, setNotification] = useState({
    visible: false,
    message: '',
    type: 'info'
  });

  const showNotification = (message, type = 'info') => {
    setNotification({
      visible: true,
      message,
      type
    });
  };

  const hideNotification = () => {
    setNotification({
      visible: false,
      message: '',
      type: 'info'
    });
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <WalletProvider>
          <CartProvider>
            <FavoritesProvider>
              <CampaignProvider>
                <AppNotificationContext.Provider value={{ showNotification }}>
                  <OrderProvider>
                    <NotificationProvider>
                      <NavigationContainer>
                        <Stack.Navigator screenOptions={{ headerShown: false }}>
                          <Stack.Screen name="Main" component={TabNavigator} />
                          <Stack.Screen name="Profil" component={ProfileScreen} />
                          <Stack.Screen name="Login" component={LoginScreen} />
                          <Stack.Screen name="Register" component={RegisterScreen} />
                          <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
                          <Stack.Screen 
                            name="WalletScreen" 
                            component={WalletScreen} 
                            options={{
                              headerShown: true,
                              title: "Cüzdan",
                              headerTintColor: '#FFF',
                              headerStyle: {
                                backgroundColor: '#6366F1'
                              }
                            }}
                          />
                        </Stack.Navigator>
                        <NotificationPopup 
                          visible={notification.visible} 
                          message={notification.message}
                          type={notification.type}
                          onClose={hideNotification} 
                        />
                      </NavigationContainer>
                    </NotificationProvider>
                  </OrderProvider>
                </AppNotificationContext.Provider>
              </CampaignProvider>
            </FavoritesProvider>
          </CartProvider>
        </WalletProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Export a hook to use the notification context
export const useAppNotification = () => useContext(AppNotificationContext);
