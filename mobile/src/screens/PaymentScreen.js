import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrderContext';
import { useCampaign } from '../context/CampaignContext';
import { useWallet } from '../context/WalletContext';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { API_URL } from '../config/config';
import { useAppNotification } from '../../App';
import axios from 'axios';

const { width } = Dimensions.get('window');

export default function PaymentScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { user, fetchWallet: updateUserWallet } = useAuth();
  const { cartItems, clearCart } = useCart();
  const { fetchOrders } = useOrders();
  const { validateCouponCode } = useCampaign();
  const { showNotification } = useAppNotification();
  const { wallet, makePayment, fetchWallet } = useWallet();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });
  const [cardNumberFormatted, setCardNumberFormatted] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [applyingCampaign, setApplyingCampaign] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal - discount;

  const paymentMethodMap = {
    card: 'kredi_karti',
    online: 'online',
  };

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
  };

  const formatCardNumber = (text) => {
    // Sadece rakamları al
    const cleaned = text.replace(/\D/g, '');
    // 4'er gruplar halinde formatlama
    let formatted = '';
    for (let i = 0; i < cleaned.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += ' ';
      }
      formatted += cleaned[i];
    }
    setCardNumberFormatted(formatted);
    // Sadece rakamları kaydet
    setCardDetails({...cardDetails, cardNumber: cleaned});
  };

  const formatExpiryDate = (text) => {
    // Sadece rakamları al
    const cleaned = text.replace(/\D/g, '');
    // MM/YY formatında formatlama
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    setCardDetails({...cardDetails, expiryDate: formatted});
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      showNotification('Lütfen bir kupon kodu girin', 'warning');
      return;
    }

    try {
      setCouponLoading(true);
      const campaign = await validateCouponCode(couponCode);
      
      if (!campaign) {
        showNotification('Geçersiz kupon kodu', 'error');
        return;
      }

      // Minimum sepet tutarı kontrolü
      if (subtotal < campaign.minimumPurchase) {
        showNotification(
          `Bu kampanya için minimum ${campaign.minimumPurchase} TL alışveriş yapmalısınız`, 
          'warning'
        );
        return;
      }

      // İndirim hesaplama
      let discountAmount = 0;
      if (campaign.discountType === 'percentage') {
        discountAmount = (subtotal * campaign.discountValue) / 100;
      } else {
        discountAmount = campaign.discountValue;
      }

      setDiscount(discountAmount);
      setActiveCampaign(campaign);
      showNotification(`${campaign.title} uygulandı!`, 'success');
    } catch (error) {
      console.error('Kupon uygulama hatası:', error);
      showNotification('Kupon kodu uygulanırken bir hata oluştu', 'error');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setDiscount(0);
    setCouponCode('');
    setActiveCampaign(null);
    showNotification('Kupon kodu kaldırıldı', 'info');
  };

  const handleOrder = async () => {
    if (!user || !user._id) {
      showNotification('Lütfen giriş yapın', 'error');
      return;
    }

    if (!phoneNumber || phoneNumber.length < 10) {
      showNotification('Lütfen geçerli bir telefon numarası giriniz', 'error');
      return;
    }

    if (cartItems.length === 0) {
      showNotification('Sepetiniz boş!', 'warning');
      return;
    }

    if (selectedPaymentMethod === 'card') {
      if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, '').length < 16) {
        showNotification('Geçerli bir kart numarası giriniz', 'error');
        return;
      }
      if (!cardDetails.cardName) {
        showNotification('Kart üzerindeki ismi giriniz', 'error');
        return;
      }
      if (!cardDetails.expiryDate || cardDetails.expiryDate.length < 5) {
        showNotification('Geçerli bir son kullanma tarihi giriniz', 'error');
        return;
      }
      if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
        showNotification('Geçerli bir CVV giriniz', 'error');
        return;
      }
    }

    if (selectedPaymentMethod === 'wallet') {
      // Cüzdan bilgilerini güncelleyelim
      await fetchWallet();
      // Bakiye kontrolü
      if (!wallet?.balance || wallet.balance < total) {
        showNotification('Yetersiz bakiye', 'error');
        return;
      }
    }

    try {
      setLoading(true);

      const orderData = {
        items: cartItems.map(item => ({
          product: item._id,
          name: item.title || item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.img || item.image
        })),
        subtotal,
        discount,
        totalAmount: total,
        paymentMethod: selectedPaymentMethod,
        customerName: user.name || 'Misafir Kullanıcı',
        customerPhone: phoneNumber,
        notes: '',
        user: user._id
      };

      if (selectedPaymentMethod === 'card') {
        orderData.cardDetails = {
          ...cardDetails,
          cardNumber: cardDetails.cardNumber.replace(/\s/g, '')
        };
      }

      if (activeCampaign) {
        orderData.campaign = {
          id: activeCampaign._id,
          code: activeCampaign.code,
          discount: discount
        };
      }

      // Önce siparişi oluştur
      const orderResponse = await axios.post(`${API_URL}/api/mobile-orders`, orderData, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (orderResponse.data.success) {
        // Cüzdan ödemesi ise
        if (selectedPaymentMethod === 'wallet') {
          try {
            await makePayment(total, orderResponse.data.order._id);
          } catch (payError) {
            console.error('Ödeme hatası:', payError);
            showNotification(payError.message || 'Ödeme işlemi başarısız', 'error');
            return;
          }
        }

        showNotification('Siparişiniz başarıyla oluşturuldu!', 'success');
        clearCart();
        fetchOrders();
        
        // Cüzdan ve kullanıcı bilgilerini güncelle
        await fetchWallet();
        await updateUserWallet();
        
        // Navigasyon düzeltmesi
        navigation.navigate('Main', { screen: 'Siparişlerim' });
      } else {
        throw new Error(orderResponse?.data?.message || 'Sipariş oluşturulamadı');
      }
    } catch (error) {
      console.error('Sipariş hatası:', error);
      showNotification(
        error.response?.data?.message || error.message || 'Sipariş oluşturulurken bir hata oluştu',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const applyCampaignCode = async () => {
    if (!couponCode.trim()) {
      showNotification('Lütfen bir kampanya kodu girin', 'warning');
      return;
    }

    try {
      setApplyingCampaign(true);
      const result = await validateCouponCode(couponCode);
      
      if (!result) {
        showNotification('Geçersiz kampanya kodu', 'error');
        return;
      }

      // Minimum sepet tutarı kontrolü
      if (subtotal < result.minimumPurchase) {
        showNotification(
          `Bu kampanya için minimum ${result.minimumPurchase} TL alışveriş yapmalısınız`, 
          'warning'
        );
        return;
      }

      // İndirim hesaplama
      let discountAmount = 0;
      if (result.discountType === 'percentage') {
        discountAmount = (subtotal * result.discountValue) / 100;
      } else {
        discountAmount = result.discountValue;
      }

      setDiscount(discountAmount);
      setActiveCampaign(result);
      showNotification(`${result.title} uygulandı!`, 'success');
    } catch (error) {
      console.error('Kampanya uygulama hatası:', error);
      let errorMessage = 'Kampanya uygulanırken bir hata oluştu';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Geçersiz kampanya kodu';
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      showNotification(errorMessage, 'error');
    } finally {
      setApplyingCampaign(false);
    }
  };

  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      Alert.alert('Uyarı', 'Sepetiniz boş!', [
        { text: 'Tamam', onPress: () => navigation.goBack() }
      ]);
    }
  }, []);

  // Component mount edildiğinde sadece bir kez çalışacak
  useEffect(() => {
    // Ekran ilk yüklendiğinde bir kez çalışır
    const loadInitialData = async () => {
      await fetchWallet();
    };
    loadInitialData();
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

  const renderPaymentMethods = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Ödeme Yöntemi</Text>
      <View style={styles.paymentMethodsContainer}>
        <TouchableOpacity
          style={[
            styles.paymentMethodButton,
            selectedPaymentMethod === 'wallet' && styles.selectedPaymentMethod,
            { backgroundColor: theme.colors.card }
          ]}
          onPress={() => setSelectedPaymentMethod('wallet')}
        >
          <View style={styles.paymentMethodContent}>
            <View style={[styles.paymentMethodIcon, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="wallet-outline" size={24} color="#6366F1" />
            </View>
            <View>
              <Text style={[styles.paymentMethodTitle, { color: theme.colors.text }]}>Cüzdan</Text>
              <Text style={[styles.paymentMethodSubtitle, { color: theme.colors.textSecondary }]}>
                Bakiye: {wallet?.balance || 0}₺
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.paymentMethodButton,
            selectedPaymentMethod === 'card' && styles.selectedPaymentMethod,
            { backgroundColor: theme.colors.card }
          ]}
          onPress={() => setSelectedPaymentMethod('card')}
        >
          <View style={styles.paymentMethodContent}>
            <View style={[styles.paymentMethodIcon, { backgroundColor: '#F0F9FF' }]}>
              <Ionicons name="card-outline" size={24} color="#0EA5E9" />
            </View>
            <View>
              <Text style={[styles.paymentMethodTitle, { color: theme.colors.text }]}>Kredi Kartı</Text>
              <Text style={[styles.paymentMethodSubtitle, { color: theme.colors.textSecondary }]}>
                Güvenli Ödeme
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContactInfo = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>İletişim Bilgileri</Text>
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Ionicons name="call-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.surface }]}
            placeholder="Telefon Numarası"
            placeholderTextColor={theme.colors.textSecondary}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            maxLength={11}
          />
        </View>
      </View>
    </View>
  );

  const renderCardDetails = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Kart Bilgileri</Text>
      
      <View style={styles.cardPreview}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardBankName}>Banka Kartı</Text>
          <MaterialCommunityIcons name="contactless-payment" size={24} color="#FFF" />
        </View>
        
        <View style={styles.cardNumberPreview}>
          <Text style={styles.cardNumberText}>
            {cardNumberFormatted || '•••• •••• •••• ••••'}
          </Text>
        </View>
        
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.cardLabel}>KART SAHİBİ</Text>
            <Text style={styles.cardValue}>{cardDetails.cardName || 'AD SOYAD'}</Text>
          </View>
          <View>
            <Text style={styles.cardLabel}>SON KULLANMA</Text>
            <Text style={styles.cardValue}>{cardDetails.expiryDate || 'AA/YY'}</Text>
          </View>
          <Image 
            source={require('../../assets/mastercard.png')} 
            style={styles.cardTypeIcon}
            resizeMode="contain"
          />
        </View>
      </View>
      
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons name="credit-card-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.surface }]}
            placeholder="Kart Numarası"
            placeholderTextColor={theme.colors.textSecondary}
            value={cardNumberFormatted}
            onChangeText={formatCardNumber}
            keyboardType="numeric"
            maxLength={19} // 16 rakam + 3 boşluk
          />
        </View>
        
        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons name="account-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.surface }]}
            placeholder="Kart Üzerindeki İsim"
            placeholderTextColor={theme.colors.textSecondary}
            value={cardDetails.cardName}
            onChangeText={(text) => setCardDetails({...cardDetails, cardName: text.toUpperCase()})}
            autoCapitalize="characters"
          />
        </View>
        
        <View style={styles.row}>
          <View style={[styles.inputWrapper, styles.halfInputWrapper]}>
            <MaterialCommunityIcons name="calendar-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.surface }]}
              placeholder="AA/YY"
              placeholderTextColor={theme.colors.textSecondary}
              value={cardDetails.expiryDate}
              onChangeText={formatExpiryDate}
              keyboardType="numeric"
              maxLength={5}
            />
          </View>
          
          <View style={[styles.inputWrapper, styles.halfInputWrapper]}>
            <MaterialCommunityIcons name="shield-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.surface }]}
              placeholder="CVV"
              placeholderTextColor={theme.colors.textSecondary}
              value={cardDetails.cvv}
              onChangeText={(text) => setCardDetails({...cardDetails, cvv: text})}
              keyboardType="numeric"
              maxLength={3}
              secureTextEntry
            />
          </View>
        </View>
      </View>
    </View>
  );

  const renderCouponSection = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Kampanya Kodu</Text>
      
      {activeCampaign ? (
        <View style={styles.activeCouponContainer}>
          <View style={styles.activeCouponInfo}>
            <Text style={[styles.activeCouponTitle, { color: theme.colors.primary }]}>
              {activeCampaign.title}
            </Text>
            <Text style={[styles.activeCouponCode, { color: theme.colors.textSecondary }]}>
              Kod: {activeCampaign.code}
            </Text>
            <Text style={[styles.discountText, { color: theme.colors.success }]}>
              {discount.toFixed(2)} ₺ indirim uygulandı
            </Text>
          </View>
          <TouchableOpacity
            style={styles.removeCouponButton}
            onPress={handleRemoveCoupon}
          >
            <Ionicons name="close-circle" size={24} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.couponInputContainer}>
          <TextInput
            style={[
              styles.couponInput,
              { 
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }
            ]}
            placeholder="Kampanya kodunu girin"
            placeholderTextColor={theme.colors.textSecondary}
            value={couponCode}
            onChangeText={setCouponCode}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={[
              styles.couponButton,
              { backgroundColor: theme.colors.primary }
            ]}
            onPress={applyCampaignCode}
            disabled={applyingCampaign || !couponCode.trim()}
          >
            {applyingCampaign ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.couponButtonText}>Uygula</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderSummary = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Sipariş Özeti</Text>
      
      <View style={styles.cartItems}>
        {cartItems.map((item, index) => (
          <View key={index} style={styles.cartItem}>
            <View style={styles.cartItemInfo}>
              <Text style={[styles.cartItemName, { color: theme.colors.text }]}>
                {item.title || item.name}
              </Text>
              <Text style={[styles.cartItemQuantity, { color: theme.colors.textSecondary }]}>
                {item.quantity} x {item.price.toFixed(2)} ₺
              </Text>
            </View>
            <Text style={[styles.cartItemPrice, { color: theme.colors.text }]}>
              {(item.quantity * item.price).toFixed(2)} ₺
            </Text>
          </View>
        ))}
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.summaryItem}>
        <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Ara Toplam</Text>
        <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{subtotal.toFixed(2)} ₺</Text>
      </View>
      
      {discount > 0 && (
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Kampanya İndirimi</Text>
          <Text style={[styles.summaryValue, { color: theme.colors.success }]}>-{discount.toFixed(2)} ₺</Text>
        </View>
      )}
      
      <View style={styles.summaryItem}>
        <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Teslimat</Text>
        <Text style={[styles.summaryValue, { color: theme.colors.success }]}>Ücretsiz</Text>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.totalRow}>
        <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Toplam</Text>
        <Text style={[styles.totalValue, { color: theme.colors.primary }]}>{total.toFixed(2)} ₺</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Main');
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Ödeme</Text>
        <View style={styles.rightPlaceholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderContactInfo()}
        {renderPaymentMethods()}
        {selectedPaymentMethod === 'card' && renderCardDetails()}
        {renderCouponSection()}
        {renderSummary()}
        <View style={styles.bottomSpace} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.payButton, 
            { 
              backgroundColor: 
                loading || !selectedPaymentMethod || !phoneNumber || 
                (selectedPaymentMethod === 'card' && (!cardDetails.cardNumber || !cardDetails.cardName || !cardDetails.expiryDate || !cardDetails.cvv)) 
                ? theme.colors.textSecondary 
                : theme.colors.primary 
            }
          ]}
          onPress={handleOrder}
          disabled={
            loading || 
            !selectedPaymentMethod || 
            !phoneNumber || 
            (selectedPaymentMethod === 'card' && (!cardDetails.cardNumber || !cardDetails.cardName || !cardDetails.expiryDate || !cardDetails.cvv))
          }
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.payButtonText}>Ödeme Yap</Text>
              <Text style={styles.payButtonAmount}>{total.toFixed(2)} ₺</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 0
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  rightPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
    backgroundColor: 'transparent',
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  paymentMethodsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  paymentMethodButton: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  selectedPaymentMethod: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5.84,
    elevation: 5,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  paymentMethodTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  paymentMethodSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2.22,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInputWrapper: {
    width: '48%',
  },
  cardPreview: {
    height: 180,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    backgroundColor: '#3B82F6',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBankName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  cardNumberPreview: {
    marginTop: 30,
    marginBottom: 30,
  },
  cardNumberText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '500',
  },
  cardValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  cardTypeIcon: {
    width: 50,
    height: 30,
  },
  cartItems: {
    marginBottom: 16,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  cartItemQuantity: {
    fontSize: 14,
  },
  cartItemPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 15,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  payButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  payButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  payButtonAmount: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  bottomSpace: {
    height: 40,
  },
  couponInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  couponInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginRight: 8,
  },
  couponButton: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  activeCouponContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    borderRadius: 12,
    marginBottom: 16,
  },
  activeCouponInfo: {
    flex: 1,
  },
  activeCouponTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activeCouponCode: {
    fontSize: 14,
    marginBottom: 4,
  },
  discountText: {
    fontSize: 14,
    fontWeight: '500',
  },
  removeCouponButton: {
    padding: 6,
  },
}); 