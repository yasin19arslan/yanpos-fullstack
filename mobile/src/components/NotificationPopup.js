import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const NotificationPopup = ({ visible, message, type = 'info', onClose }) => {
  const translateY = new Animated.Value(-100);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();

      // 3 saniye sonra otomatik kapan
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: -100,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start(() => onClose());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#10B981',
          icon: '✓',
          borderColor: '#059669'
        };
      case 'warning':
        return {
          backgroundColor: '#F59E0B',
          icon: '⚠',
          borderColor: '#D97706'
        };
      case 'error':
        return {
          backgroundColor: '#EF4444',
          icon: '✕',
          borderColor: '#DC2626'
        };
      case 'order':
        return {
          backgroundColor: '#8B5CF6',
          icon: '🛍',
          borderColor: '#7C3AED'
        };
      default:
        return {
          backgroundColor: '#3B82F6',
          icon: 'ℹ',
          borderColor: '#2563EB'
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          backgroundColor: typeStyles.backgroundColor,
          borderLeftColor: typeStyles.borderColor,
          transform: [{ translateY }],
          opacity
        }
      ]}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{typeStyles.icon}</Text>
      </View>
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderLeftWidth: 4,
    zIndex: 1000,
  },
  iconContainer: {
    marginRight: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  message: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
});

export default NotificationPopup; 