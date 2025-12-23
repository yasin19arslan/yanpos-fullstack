import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  Switch,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
  Animated,
  Dimensions,
  ImageBackground,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useOrders } from '../context/OrderContext';
import { useFavorites } from '../context/FavoritesContext';
import { useWallet } from '../context/WalletContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { API_URL } from '../config/config';
import RegisterScreen from './RegisterScreen';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ route }) {
  const navigation = useNavigation();
  const { user, logout, updateProfile, changePassword, login, register, setUser, fetchWallet } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { orders } = useOrders();
  const { favorites } = useFavorites();
  const { wallet, fetchWallet: refreshWallet } = useWallet();

  // Varsayılan renkler
  const defaultColors = {
    primary: '#2196F3',
    text: '#1A1A1A',
    textSecondary: '#666666',
    background: '#FFFFFF',
    card: '#FFFFFF',
    inputBackground: '#F5F5F5'
  };

  // Theme renklerini güvenli bir şekilde al
  const colors = theme?.colors || defaultColors;

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isRegisterModalVisible, setIsRegisterModalVisible] = useState(false);
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false);
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [scrollY] = useState(new Animated.Value(0));
  const [profileImage, setProfileImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [selectedAvatar, setSelectedAvatar] = useState(null);

  const [editedUser, setEditedUser] = useState({
    name: '',
    email: '',
    phone: '',
    bio: 'Merhaba! Ben yeni bir kullanıcıyım.'
  });

  // Component mount edildiğinde cüzdan bilgisini yenile
  useEffect(() => {
    fetchWallet();
    refreshWallet();
  }, []);

  // Screen her focus olduğunda çalışacak
  useFocusEffect(
    useCallback(() => {
      // Ekran her odaklandığında çalışır
      fetchWallet();
      return () => {
        // Cleanup fonksiyonu
      };
    }, [])
  );

  const stats = [
    {
      title: 'Favoriler',
      value: favorites?.length || 0,
      icon: 'heart-outline'
    },
    {
      title: 'Bakiye',
      value: `${user?.wallet?.balance || wallet?.balance || 0}₺`,
      icon: 'wallet-outline',
      onPress: () => navigation.navigate('WalletScreen')
    },
    {
      title: 'Puanlar',
      value: user?.points || 0,
      icon: 'star-outline'
    }
  ];

  const menuItems = [
    {
      title: 'Profili Düzenle',
      icon: 'person-outline',
      onPress: () => setIsEditModalVisible(true)
    },
    {
      title: 'Cüzdan',
      icon: 'wallet-outline',
      onPress: () => navigation.navigate('WalletScreen')
    },
    {
      title: 'Tema',
      icon: theme?.dark ? 'moon-outline' : 'sunny-outline',
      onPress: toggleTheme
    },
    {
      title: 'Bildirimler',
      icon: 'notifications-outline',
      onPress: () => setNotificationsEnabled(!notificationsEnabled),
      rightComponent: () => (
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          trackColor={{ false: '#767577', true: colors.primary }}
          thumbColor={notificationsEnabled ? colors.primary : '#f4f3f4'}
        />
      )
    },
    {
      title: 'Çıkış Yap',
      icon: 'log-out-outline',
      onPress: logout,
      danger: true
    }
  ];

  const avatars = [
    require('../../assets/a1.png'),
    require('../../assets/a2.png'),
    require('../../assets/a3.png'),
    require('../../assets/a4.png'),
  ];

  const pickImage = async (type) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'cover' ? [16, 9] : [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        if (type === 'cover') {
          setCoverImage(result.assets[0].uri);
        } else {
          setProfileImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      Alert.alert('Hata', 'Resim seçilirken bir hata oluştu');
    }
  };

  const handleSelectCoverImage = () => pickImage('cover');
  const handleSelectProfileImage = () => pickImage('profile');

  const handleSelectAvatar = async (index) => {
    try {
      setLoading(true);
      
      const updateData = {
        ...editedUser,
        selectedAvatar: index + 1
      };
      
      console.log('Avatar güncelleme verileri:', updateData);
      
      // Profil güncellemesini yap
      const result = await updateProfile(updateData);
      
      console.log('Avatar güncelleme sonucu:', result);

      if (result) {
        setSelectedAvatar(index + 1);
        setIsAvatarModalVisible(false);
      }
    } catch (error) {
      console.error('Avatar güncelleme hatası:', error);
      Alert.alert('Hata', error.message || 'Avatar güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [250, 100],
    extrapolate: 'clamp'
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.5],
    extrapolate: 'clamp'
  });

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={['#6366F1', '#4F46E5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerTopRow}>
          <View style={styles.userInfoContainer}>
            <Text style={styles.greeting}>Merhaba,</Text>
            <Text style={styles.userName}>{user?.name || 'Misafir'}</Text>
          </View>
          
          <View style={styles.profileImageContainer}>
            {selectedAvatar ? (
              <Image
                source={avatars[selectedAvatar - 1]}
                style={styles.profileImage}
              />
            ) : profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <Image
                source={require('../../assets/default-avatar.png')}
                style={styles.profileImage}
              />
            )}
          </View>
        </View>
        
        <View style={styles.userDetailsContainer}>
          <View style={styles.userDetailItem}>
            <Ionicons name="mail-outline" size={16} color="#FFF" style={styles.detailIcon} />
            <Text style={styles.userDetailText}>{user?.email || 'E-posta yok'}</Text>
          </View>
          
          {user?.phone && (
            <View style={styles.userDetailItem}>
              <Ionicons name="call-outline" size={16} color="#FFF" style={styles.detailIcon} />
              <Text style={styles.userDetailText}>{user.phone}</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );

  const renderStats = () => (
    <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
      {stats.map((stat, index) => (
        <View key={index} style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: index === 0 ? '#FEF3F2' : '#F0F9FF' }]}>
            <Ionicons 
              name={stat.icon} 
              size={24} 
              color={index === 0 ? '#F43F5E' : '#0EA5E9'} 
            />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
          <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{stat.title}</Text>
        </View>
      ))}
    </View>
  );

  const renderMenuItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.menuItem, 
        { 
          backgroundColor: item.danger ? '#FEF2F2' : colors.card,
        }
      ]}
      onPress={item.onPress}
    >
      <View style={styles.menuItemLeft}>
        <View style={[
          styles.menuItemIcon, 
          { 
            backgroundColor: item.danger ? '#FEE2E2' : 
              item.icon === 'person-outline' ? '#F3E8FF' :
              item.icon === 'moon-outline' || item.icon === 'sunny-outline' ? '#ECFDF5' :
              '#EFF6FF',
          }
        ]}>
          <Ionicons 
            name={item.icon} 
            size={22} 
            color={
              item.danger ? '#DC2626' : 
              item.icon === 'person-outline' ? '#9333EA' :
              item.icon === 'moon-outline' || item.icon === 'sunny-outline' ? '#10B981' :
              '#3B82F6'
            } 
          />
        </View>
        <Text style={[
          styles.menuItemTitle, 
          { color: item.danger ? '#B91C1C' : colors.text }
        ]}>
          {item.title}
        </Text>
      </View>
      {item.rightComponent ? (
        item.rightComponent()
      ) : (
        <Ionicons 
          name={item.danger ? "alert-circle-outline" : "chevron-forward"} 
          size={20} 
          color={item.danger ? '#DC2626' : colors.textSecondary} 
        />
      )}
    </TouchableOpacity>
  );

  // Kullanıcı değiştiğinde profil bilgilerini güncelle
  useEffect(() => {
    if (user) {
      console.log('Gelen kullanıcı bilgileri:', user);
      setEditedUser({
        name: user.name || '',
        email: user.email || '',
        phone: user.phoneNumber || user.phone || '',
        bio: user.bio || ''
      });
      setProfileImage(user.profileImage || null);
      setSelectedAvatar(user.selectedAvatar || null);
    } else {
      // Kullanıcı çıkış yaptığında bilgileri temizle
      setEditedUser({
        name: '',
        email: '',
        phone: '',
        bio: ''
      });
      setProfileImage(null);
      setSelectedAvatar(null);
    }
  }, [user]);

  // Route params'dan login modalını kontrol et
  useEffect(() => {
    if (route?.params?.showLoginModal) {
      setIsLoginModalVisible(true);
      // Param'ı temizle
      navigation.setParams({ showLoginModal: false });
    }
  }, [route?.params?.showLoginModal]);

  const handleSaveProfile = async () => {
    if (!editedUser.name || !editedUser.email) {
      Alert.alert('Hata', 'Ad ve e-posta alanları zorunludur');
      return;
    }

    try {
      setLoading(true);
      
      // Profil verilerini hazırla
      const updateData = {
        name: editedUser.name,
        email: editedUser.email,
        phone: editedUser.phone,
        bio: editedUser.bio || '',
        selectedAvatar: selectedAvatar
      };

      // Context'teki updateProfile fonksiyonunu kullan
      const result = await updateProfile(updateData);

      // Kullanıcı bilgilerini güncelle
      setEditedUser({
        name: result.name,
        email: result.email,
        phone: result.phone || '',
        bio: result.bio || ''
      });

      setSelectedAvatar(result.selectedAvatar);
      
      // Modal'ı kapat ve başarı mesajı göster
      setIsEditModalVisible(false);
      Alert.alert('Başarılı', 'Profiliniz başarıyla güncellendi');
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      Alert.alert(
        'Profil Güncellenemedi', 
        'Profil bilgileriniz güncellenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.',
        [{ text: 'Tamam', style: 'cancel' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    try {
      setLoading(true);
      await login({ 
        email: loginForm.email, 
        password: loginForm.password 
      });
      setIsLoginModalVisible(false);
      setLoginForm({ email: '', password: '' });
      navigation.navigate('Main', { screen: 'Profil' });
    } catch (error) {
      Alert.alert('Hata', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerForm.name || !registerForm.email || !registerForm.phone || !registerForm.password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    try {
      setLoading(true);
      await register({ 
        name: registerForm.name, 
        email: registerForm.email, 
        phone: registerForm.phone, 
        password: registerForm.password 
      });
      setIsRegisterModalVisible(false);
      setRegisterForm({
        name: '',
        email: '',
        phone: '',
        password: ''
      });
      navigation.navigate('Main', { screen: 'Profil' });
    } catch (error) {
      Alert.alert('Hata', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      Alert.alert('Hata', 'Yeni şifre en az 6 karakter olmalıdır');
      return;
    }

    try {
      setLoading(true);
      const result = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      // Şifre değiştirme başarılı olduğunda yeni token ile giriş yap
      if (result.token) {
        await login({ 
          email: user.email, 
          password: passwordForm.newPassword 
        });
      }

      // Modal'ı kapat ve formu temizle
      setIsChangePasswordModalVisible(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      Alert.alert('Başarılı', 'Şifreniz başarıyla değiştirildi');
    } catch (error) {
      Alert.alert('Hata', error.message || 'Şifre değiştirirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const renderAuthButtons = () => (
    <View style={styles.authButtonsContainer}>
      <TouchableOpacity
        style={styles.authButton}
        onPress={() => setIsLoginModalVisible(true)}
      >
        <Text style={styles.authButtonText}>Giriş Yap</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.authButton, styles.registerButton]}
        onPress={() => setIsRegisterModalVisible(true)}
      >
        <Text style={[styles.authButtonText, styles.registerButtonText]}>
          Kayıt Ol
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {user ? (
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
        >
          {renderHeader()}
          {renderStats()}
          
          <View style={styles.menuContainer}>
            <Text style={[styles.menuSectionTitle, {color: colors.text}]}>Hesap Ayarları</Text>
            <FlatList
              data={menuItems}
              renderItem={renderMenuItem}
              keyExtractor={(item, index) => index.toString()}
              scrollEnabled={false}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.supportButton}
            onPress={() => Alert.alert('Destek', 'Destek ekibimiz size yardımcı olmak için burada!')}
          >
            <Ionicons name="help-circle-outline" size={22} color="#6366F1" />
            <Text style={styles.supportButtonText}>Yardım ve Destek</Text>
          </TouchableOpacity>
          
          <View style={styles.versionContainer}>
            <Text style={[styles.versionText, {color: colors.textSecondary}]}>
              Yan-POS v1.0.0
            </Text>
          </View>
        </Animated.ScrollView>
      ) : (
        <View style={[styles.loginContainer, { backgroundColor: colors.background }]}>
          <LinearGradient
            colors={['#6366F1', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loginGradientBox}
          >
            <Image 
              source={require('../../assets/default-avatar.png')}
              style={styles.loginImage}
            />
            <Text style={styles.loginWelcomeText}>Yan-POS</Text>
          </LinearGradient>
          
          <Text style={[styles.loginTitle, { color: colors.text }]}>
            Hoş Geldiniz!
          </Text>
          <Text style={[styles.loginSubtitle, { color: colors.textSecondary }]}>
            Siparişlerinizi görüntülemek ve özel tekliflerden yararlanmak için giriş yapın
          </Text>
          {renderAuthButtons()}
        </View>
      )}

      <Modal
        visible={isRegisterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsRegisterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <RegisterScreen
            navigation={navigation}
            visible={isRegisterModalVisible}
            onClose={() => setIsRegisterModalVisible(false)}
          />
        </View>
      </Modal>

      {/* Login Modal */}
      <Modal
        visible={isLoginModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Giriş Yap</Text>
              <TouchableOpacity onPress={() => setIsLoginModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>E-posta</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.inputBackground,
                  color: colors.text
                }]}
                value={loginForm.email}
                onChangeText={(text) => setLoginForm({...loginForm, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Şifre</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.inputBackground,
                  color: colors.text
                }]}
                value={loginForm.password}
                onChangeText={(text) => setLoginForm({...loginForm, password: text})}
                secureTextEntry
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>Giriş Yap</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.switchAuthButton}
              onPress={() => {
                setIsLoginModalVisible(false);
                setIsRegisterModalVisible(true);
              }}
            >
              <Text style={[styles.switchAuthText, { color: colors.textSecondary }]}>
                Hesabınız yok mu? <Text style={{ color: colors.primary }}>Kayıt Olun</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <Text style={[styles.editModalTitle, { color: colors.text }]}>Profili Düzenle</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setIsEditModalVisible(false)}
              >
                <Ionicons name="close" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.editInputContainer}>
                <Text style={styles.editInputLabel}>Ad Soyad</Text>
                <View style={styles.editInputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#6366F1" style={styles.editInputIcon} />
                  <TextInput
                    style={styles.editInput}
                    value={editedUser.name}
                    onChangeText={(text) => setEditedUser({...editedUser, name: text})}
                    placeholder="Adınızı girin"
                    placeholderTextColor="#bbb"
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.editInputContainer}>
                <Text style={styles.editInputLabel}>E-posta</Text>
                <View style={styles.editInputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#6366F1" style={styles.editInputIcon} />
                  <TextInput
                    style={styles.editInput}
                    value={editedUser.email}
                    onChangeText={(text) => setEditedUser({...editedUser, email: text})}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="E-posta adresiniz"
                    placeholderTextColor="#bbb"
                  />
                </View>
              </View>

              <View style={styles.editInputContainer}>
                <Text style={styles.editInputLabel}>Telefon</Text>
                <View style={styles.editInputWrapper}>
                  <Ionicons name="call-outline" size={20} color="#6366F1" style={styles.editInputIcon} />
                  <TextInput
                    style={styles.editInput}
                    value={editedUser.phone}
                    onChangeText={(text) => setEditedUser({...editedUser, phone: text})}
                    keyboardType="phone-pad"
                    placeholder="Telefon numaranız"
                    placeholderTextColor="#bbb"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.editChangePasswordButton}
                onPress={() => {
                  setIsEditModalVisible(false);
                  setIsChangePasswordModalVisible(true);
                }}
              >
                <Ionicons name="lock-closed-outline" size={20} color="#6366F1" style={{marginRight: 8}} />
                <Text style={styles.editChangePasswordText}>Şifremi Değiştir</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.editButtonsContainer}>
              <TouchableOpacity
                style={styles.editCancelButton}
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.editCancelButtonText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.editSaveButton}
                onPress={handleSaveProfile}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.editSaveButtonText}>Kaydet</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={isChangePasswordModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Şifre Değiştir</Text>
              <TouchableOpacity onPress={() => {
                setIsChangePasswordModalVisible(false);
                setPasswordForm({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: ''
                });
              }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Mevcut Şifre</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.inputBackground,
                  color: colors.text
                }]}
                value={passwordForm.currentPassword}
                onChangeText={(text) => setPasswordForm({...passwordForm, currentPassword: text})}
                secureTextEntry
                placeholderTextColor={colors.textSecondary}
                placeholder="Mevcut şifrenizi girin"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Yeni Şifre</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.inputBackground,
                  color: colors.text
                }]}
                value={passwordForm.newPassword}
                onChangeText={(text) => setPasswordForm({...passwordForm, newPassword: text})}
                secureTextEntry
                placeholderTextColor={colors.textSecondary}
                placeholder="En az 6 karakter"
              />
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                En az 6 karakter uzunluğunda olmalıdır
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Yeni Şifre Tekrar</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.inputBackground,
                  color: colors.text
                }]}
                value={passwordForm.confirmPassword}
                onChangeText={(text) => setPasswordForm({...passwordForm, confirmPassword: text})}
                secureTextEntry
                placeholderTextColor={colors.textSecondary}
                placeholder="Yeni şifrenizi tekrar girin"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>Şifreyi Değiştir</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 0
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    height: 200,
    position: 'relative',
  },
  headerGradient: {
    width: '100%',
    height: '100%',
    padding: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImageContainer: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userInfoContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  userDetailsContainer: {
    marginTop: 10,
  },
  userDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    marginRight: 8,
  },
  userDetailText: {
    color: '#FFF',
    fontSize: 14,
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginTop: -30,
    marginHorizontal: 15,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  menuContainer: {
    paddingTop: 30,
    paddingHorizontal: 15,
  },
  menuSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    marginLeft: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
  },
  supportButtonText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 12,
    opacity: 0.7,
  },
  loginContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loginGradientBox: {
    width: 160,
    height: 160,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  loginImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    marginBottom: 10,
  },
  loginWelcomeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 32,
    lineHeight: 22,
  },
  authButtonsContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  authButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    marginBottom: 15,
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4.65,
    elevation: 6,
  },
  authButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  registerButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#6366F1',
    shadowColor: 'transparent',
    elevation: 0,
  },
  registerButtonText: {
    color: '#6366F1',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '60%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  changePasswordButton: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  changePasswordText: {
    fontSize: 16,
    fontWeight: '600',
  },
  imageSection: {
    marginBottom: 24,
  },
  coverImageContainer: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: -50,
  },
  editCoverButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  helperText: {
    fontSize: 12,
    textAlign: 'right',
  },
  switchAuthButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  switchAuthText: {
    fontSize: 14,
    textAlign: 'center',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 16,
  },
  avatarItem: {
    width: width / 4,
    aspectRatio: 1,
    padding: 8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: width / 8,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  editModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    minHeight: '70%',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  editModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  editInputContainer: {
    marginBottom: 22,
  },
  editInputLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    color: '#444',
    marginLeft: 4,
  },
  editInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f6fa',
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  editInputIcon: {
    marginRight: 12,
  },
  editInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#222',
  },
  editChangePasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#6366F1',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: '#EEF2FF',
  },
  editChangePasswordText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
  editButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  editCancelButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 16,
    marginRight: 10,
  },
  editCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  editSaveButton: {
    flex: 1.5,
    backgroundColor: '#6366F1',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3.84,
    elevation: 5,
  },
  editSaveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
 