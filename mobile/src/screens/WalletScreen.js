import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Image
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/config';
import axiosInstance from '../services/axiosInstance';
import { formatCurrency } from '../utils/format';
import { useWallet } from '../context/WalletContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function WalletScreen() {
  const { user } = useAuth();
  const { wallet, loading: walletLoading, fetchWallet, deposit } = useWallet();
  const [loading, setLoading] = useState(false);
  const [isDepositModalVisible, setIsDepositModalVisible] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [cardNumberFormatted, setCardNumberFormatted] = useState('');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });
  const [predefinedAmounts] = useState([50, 100, 200, 500]);

  useEffect(() => {
    fetchWallet();
  }, []);

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

  const handleDeposit = async () => {
    if (!depositAmount || isNaN(depositAmount) || parseFloat(depositAmount) <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir miktar giriniz');
      return;
    }

    // Kart bilgilerini kontrol et
    if (cardDetails.cardNumber.length < 16) {
      Alert.alert('Hata', 'Geçerli bir kart numarası giriniz');
      return;
    }
    if (!cardDetails.cardName) {
      Alert.alert('Hata', 'Kart üzerindeki ismi giriniz');
      return;
    }
    if (cardDetails.expiryDate.length < 5) {
      Alert.alert('Hata', 'Geçerli bir son kullanma tarihi giriniz');
      return;
    }
    if (cardDetails.cvv.length < 3) {
      Alert.alert('Hata', 'Geçerli bir CVV giriniz');
      return;
    }

    try {
      setLoading(true);
      await deposit(parseFloat(depositAmount));
      setIsDepositModalVisible(false);
      setDepositAmount('');
      setCardDetails({
        cardNumber: '',
        cardName: '',
        expiryDate: '',
        cvv: ''
      });
      setCardNumberFormatted('');
      Alert.alert('Başarılı', 'Bakiye başarıyla yüklendi');
    } catch (error) {
      console.error('Bakiye yükleme hatası:', error);
      Alert.alert('Hata', error.message || 'Bakiye yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionType}>
          {item.type === 'deposit' ? 'Bakiye Yükleme' : 'Ödeme'}
        </Text>
        <Text style={styles.transactionDate}>
          {new Date(item.createdAt).toLocaleDateString('tr-TR')}
        </Text>
      </View>
      <Text style={[
        styles.transactionAmount,
        { color: item.type === 'deposit' ? '#10B981' : '#EF4444' }
      ]}>
        {item.type === 'deposit' ? '+' : '-'}{formatCurrency(Math.abs(item.amount))}
      </Text>
    </View>
  );

  if (loading || walletLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  const selectAmount = (amount) => {
    setDepositAmount(amount.toString());
  };

  return (
    <View style={styles.container}>
      {/* Bakiye Kartı */}
      <LinearGradient
        colors={['#6366F1', '#4F46E5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.balanceCard}
      >
        <View style={styles.balanceCardHeader}>
          <View>
            <Text style={styles.balanceLabel}>Mevcut Bakiye</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(wallet?.balance || 0)}</Text>
          </View>
          <MaterialCommunityIcons name="wallet-outline" size={40} color="#FFF" />
        </View>
        <TouchableOpacity
          style={styles.depositButton}
          onPress={() => setIsDepositModalVisible(true)}
        >
          <Ionicons name="add-circle-outline" size={18} color="#FFF" />
          <Text style={styles.depositButtonText}>Bakiye Yükle</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* İşlem Geçmişi */}
      <View style={styles.transactionsContainer}>
        <Text style={styles.sectionTitle}>İşlem Geçmişi</Text>
        <FlatList
          data={wallet?.transactions || []}
          renderItem={renderTransaction}
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Henüz işlem bulunmuyor</Text>
          }
        />
      </View>

      {/* Bakiye Yükleme Modal */}
      <Modal
        visible={isDepositModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDepositModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bakiye Yükle</Text>
              <TouchableOpacity
                onPress={() => setIsDepositModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Yüklenecek Miktar */}
              <View style={styles.amountSection}>
                <Text style={styles.sectionLabel}>Yüklenecek Miktar</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={depositAmount}
                  onChangeText={setDepositAmount}
                />
                <Text style={styles.currencyLabel}>₺</Text>
              </View>

              {/* Hazır Miktar Butonları */}
              <View style={styles.predefinedAmounts}>
                {predefinedAmounts.map(amount => (
                  <TouchableOpacity
                    key={amount}
                    style={[
                      styles.amountButton,
                      parseFloat(depositAmount) === amount && styles.selectedAmountButton
                    ]}
                    onPress={() => selectAmount(amount)}
                  >
                    <Text style={[
                      styles.amountButtonText,
                      parseFloat(depositAmount) === amount && styles.selectedAmountButtonText
                    ]}>
                      {amount} ₺
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Kart Bilgileri */}
              <View style={styles.cardSection}>
                <Text style={styles.sectionLabel}>Ödeme Bilgileri</Text>
                
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
                    <View style={styles.cardType}>
                      <MaterialCommunityIcons name="credit-card-outline" size={24} color="#FFF" />
                    </View>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="credit-card-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Kart Numarası"
                      placeholderTextColor="#9CA3AF"
                      value={cardNumberFormatted}
                      onChangeText={formatCardNumber}
                      keyboardType="numeric"
                      maxLength={19}
                    />
                  </View>
                  
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="account-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Kart Üzerindeki İsim"
                      placeholderTextColor="#9CA3AF"
                      value={cardDetails.cardName}
                      onChangeText={(text) => setCardDetails({...cardDetails, cardName: text.toUpperCase()})}
                      autoCapitalize="characters"
                    />
                  </View>
                  
                  <View style={styles.row}>
                    <View style={[styles.inputWrapper, styles.halfInputWrapper]}>
                      <MaterialCommunityIcons name="calendar-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="AA/YY"
                        placeholderTextColor="#9CA3AF"
                        value={cardDetails.expiryDate}
                        onChangeText={formatExpiryDate}
                        keyboardType="numeric"
                        maxLength={5}
                      />
                    </View>
                    
                    <View style={[styles.inputWrapper, styles.halfInputWrapper]}>
                      <MaterialCommunityIcons name="shield-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="CVV"
                        placeholderTextColor="#9CA3AF"
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

              <TouchableOpacity
                style={styles.payButton}
                onPress={handleDeposit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.payButtonText}>
                    {depositAmount ? `${depositAmount} ₺ Yükle` : 'Bakiye Yükle'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  balanceCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  balanceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginBottom: 8
  },
  balanceAmount: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold'
  },
  depositButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 8,
    alignSelf: 'flex-start'
  },
  depositButtonText: {
    color: '#FFF',
    marginLeft: 8,
    fontWeight: '600'
  },
  transactionsContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1F2937'
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  transactionInfo: {
    flex: 1
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937'
  },
  transactionDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600'
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 24
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937'
  },
  closeButton: {
    padding: 4
  },
  amountSection: {
    marginBottom: 24,
    position: 'relative'
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12
  },
  amountInput: {
    fontSize: 24,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingRight: 40,
    color: '#1F2937',
    fontWeight: '600'
  },
  currencyLabel: {
    position: 'absolute',
    right: 16,
    bottom: 18,
    fontSize: 20,
    color: '#6B7280',
    fontWeight: '600'
  },
  predefinedAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  amountButton: {
    width: '48%',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12
  },
  selectedAmountButton: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#6366F1'
  },
  amountButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563'
  },
  selectedAmountButtonText: {
    color: '#6366F1'
  },
  cardSection: {
    marginBottom: 24
  },
  cardPreview: {
    height: 180,
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    justifyContent: 'space-between',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardBankName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600'
  },
  cardNumberPreview: {
    marginVertical: 20
  },
  cardNumberText: {
    color: '#FFF',
    fontSize: 22,
    letterSpacing: 2,
    fontWeight: '500'
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  cardLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 4
  },
  cardValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500'
  },
  cardType: {
    marginBottom: 4
  },
  inputContainer: {
    marginBottom: 20
  },
  inputWrapper: {
    marginBottom: 16,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  inputIcon: {
    marginHorizontal: 12
  },
  input: {
    flex: 1,
    padding: 12,
    color: '#1F2937',
    fontSize: 16
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  halfInputWrapper: {
    width: '48%'
  },
  payButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  payButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600'
  }
}); 