import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

const RegisterScreen = ({ navigation, visible, onClose }) => {
  const { register, loading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    try {
      await register(name, email, phone, password);
      Alert.alert('Başarılı', 'Kayıt işlemi başarılı');
      onClose();
      if (navigation.getParent()) {
        navigation.getParent().setOptions({
          tabBarStyle: { display: 'none' }
        });
      }
      navigation.navigate('Profil', { showLoginModal: true });
    } catch (error) {
      Alert.alert('Hata', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Kayıt Ol</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Ad Soyad"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="E-posta"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Telefon"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Şifre"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => {
          onClose();
          navigation.navigate('LoginScreen');
        }}
      >
        <Text style={styles.linkText}>
          Zaten hesabın var mı? Giriş yap
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    padding: 20,
    paddingTop: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000'
  },
  closeButton: {
    padding: 8
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666'
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600'
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 10
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16
  }
});

export default RegisterScreen; 