import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoryAPI, productAPI, orderAPI } from '../services/api';

const SelfService = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [musteriAdi, setMusteriAdi] = useState('');
  const [siparisNo, setSiparisNo] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Kategorileri yükleme
  useEffect(() => {
    const loadCategories = async () => {
      try {
        console.log("Kategoriler yükleniyor...");
        const response = await categoryAPI.getCategories();
        console.log("Kategoriler API yanıtı:", response);
        
        if (response.data && response.data.categories) {
          setCategories(response.data.categories);
          console.log("Kategoriler başarıyla yüklendi:", response.data.categories);
        } else {
          console.error("API'dan beklenen format alınamadı:", response.data);
          setCategories([]);
        }
      } catch (err) {
        console.error("Kategori yükleme hatası:", err);
        setError('Kategoriler yüklenirken bir hata oluştu: ' + (err.response?.data?.message || err.message));
        setCategories([]);
      }
    };
    loadCategories();
  }, []);

  // Tüm ürünleri yükleme
  useEffect(() => {
    const loadProducts = async () => {
      try {
        console.log("Ürünler yükleniyor...");
        const response = await productAPI.getProducts();
        console.log("Ürünler API yanıtı:", response);
        
        if (response.data && response.data.products) {
          setProducts(response.data.products);
          console.log("Ürünler başarıyla yüklendi:", response.data.products);
        } else {
          console.error("API'dan beklenen format alınamadı:", response.data);
          setProducts([]);
        }
      } catch (err) {
        console.error("Ürün yükleme hatası:", err);
        setError('Ürünler yüklenirken bir hata oluştu: ' + (err.response?.data?.message || err.message));
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Kategoriye göre ürünleri filtreleme
  useEffect(() => {
    if (!selectedCategory) {
      const loadAllProducts = async () => {
        try {
          setLoading(true);
          const response = await productAPI.getProducts();
          
          if (response.data && response.data.products) {
            setProducts(response.data.products);
          } else {
            setProducts([]);
          }
        } catch (err) {
          console.error("Ürün yükleme hatası:", err);
          setError('Ürünler yüklenirken bir hata oluştu');
          setProducts([]);
        } finally {
          setLoading(false);
        }
      };
      loadAllProducts();
      return;
    }
    
    // Eğer kategori seçilmişse
    const loadProductsByCategory = async () => {
      try {
        setLoading(true);
        const response = await productAPI.getProductsByCategory(selectedCategory);
        
        if (response.data && response.data.products) {
          setProducts(response.data.products);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Kategori bazlı ürün yükleme hatası:", err);
        setError('Ürünler yüklenirken bir hata oluştu');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    loadProductsByCategory();
  }, [selectedCategory]);

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item._id === product._id);
      if (existingItem) {
        return prevCart.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item._id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setCart(prevCart =>
      prevCart.map(item =>
        item._id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleOrder = () => {
    if (cart.length === 0) return;
    setShowModal(true);
  };

  const handleOrderSubmit = async () => {
    if (!musteriAdi.trim()) return;

    try {
      const orderItems = cart.map(item => ({
        product: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      }));

      const siparis = {
        customerName: musteriAdi,
        items: orderItems,
        totalAmount: getTotalPrice(),
        paymentMethod: paymentMethod === 'card' ? 'credit_card' : 'cash',
        orderType: 'self_service',
        status: 'completed'
      };

      console.log('Gönderilen sipariş verisi:', siparis);
      
      try {
        const response = await orderAPI.createOrder(siparis);
        console.log('Sipariş oluşturma cevabı:', response.data);
        
        // API'dan dönen sipariş verisi ile current order'ı güncelle
        if (response.data && response.data.order) {
          setCurrentOrder({
            id: response.data.order._id,
            siparisNo: response.data.order.orderNumber,
            musteriAdi: response.data.order.customerName,
            items: cart,
            totalAmount: response.data.order.totalAmount,
            status: response.data.order.status,
            date: response.data.order.createdAt,
            paymentMethod: response.data.order.paymentMethod
          });
          
          setShowReceipt(true);
          setShowNotification(true);
          setTimeout(() => {
            setShowNotification(false);
          }, 3000);
          
          setCart([]);
          setShowModal(false);
          setMusteriAdi('');
          setSiparisNo('');
          setPaymentMethod('cash');
        } else {
          throw new Error('Geçersiz sunucu yanıtı');
        }
      } catch (apiError) {
        console.error('API Hatası:', apiError);
        const errorMessage = apiError.response?.data?.message || apiError.message;
        setError(`Sipariş oluşturulurken bir hata oluştu: ${errorMessage}`);
      }
    } catch (err) {
      console.error('Genel Hata:', err);
      setError('Sipariş oluşturulurken beklenmeyen bir hata oluştu');
    }
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Menü */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Self Servis Menü</h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
          </div>
        )}

        <div className="flex flex-wrap space-x-2 mb-6">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 mb-2 rounded-full ${
              selectedCategory === null
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Tümü
          </button>
          {categories.map((category) => (
            <button
              key={category._id}
              onClick={() => setSelectedCategory(category._id)}
              className={`px-4 py-2 mb-2 rounded-full ${
                selectedCategory === category._id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
                <div
                  key={product._id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <img
                    src={product.image || '/images/default-product.png'}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.src = '/images/default-product.png';
                    }}
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                    <p className="text-xl font-bold text-indigo-600 mt-1">₺{product.price}</p>
                    <button
                      onClick={() => addToCart(product)}
                      className="mt-4 w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-2 px-4 rounded-full hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 ease-in-out transform hover:scale-105"
                    >
                      Sepete Ekle
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Sepet */}
      <div className="w-96 bg-white shadow-lg overflow-y-auto">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600">
          <h2 className="text-xl font-bold text-white flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Sepetim
          </h2>
        </div>
        <div className="p-4">
          {cart.length === 0 ? (
            <div className="text-center py-10">
              <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-500 mt-4">Sepetiniz boş</p>
              <p className="text-gray-400 text-sm mt-2">Ürünlerinizi sepete ekleyerek başlayın</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
                {cart.map((item) => (
                  <div key={item._id} className="flex bg-gray-50 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover object-center" />
                    </div>
                    <div className="ml-4 flex flex-1 flex-col">
                      <div className="flex justify-between text-base font-medium text-gray-900">
                        <h3>{item.name}</h3>
                        <p className="ml-4 text-indigo-600 font-semibold">₺{item.price}</p>
                      </div>
                      <div className="flex items-end justify-between mt-auto text-sm">
                        <div className="flex items-center border border-gray-200 rounded-full overflow-hidden bg-white">
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="text-red-500 hover:text-red-700 flex items-center transition-colors"
                        >
                          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="text-xs">Kaldır</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-base text-gray-600">Ara Toplam</span>
                  <span className="text-lg font-bold">₺{getTotalPrice()}</span>
                </div>
                <button
                  onClick={handleOrder}
                  className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-md hover:from-green-600 hover:to-emerald-700 transition-all duration-200 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Siparişi Tamamla
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sipariş Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Siparişi Tamamla</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Kapat</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Sipariş Özeti</h4>
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item._id} className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-gray-500 ml-2">x {item.quantity}</span>
                      </div>
                      <span className="font-medium">₺{item.price * item.quantity}</span>
                    </div>
                  ))}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Toplam</span>
                      <span className="text-lg font-bold text-green-600">₺{getTotalPrice()}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Müşteri Adı</label>
                <input
                  type="text"
                  value={musteriAdi}
                  onChange={(e) => setMusteriAdi(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  placeholder="Adınızı giriniz..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ödeme Yöntemi</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 rounded-lg border-2 flex items-center justify-center space-x-2 ${
                      paymentMethod === 'cash'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Nakit</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-lg border-2 flex items-center justify-center space-x-2 ${
                      paymentMethod === 'card'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span>Kredi Kartı</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                İptal
              </button>
              <button
                onClick={handleOrderSubmit}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Siparişi Tamamla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fiş Modal */}
      {showReceipt && currentOrder && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 print:bg-white print:shadow-none">
          <div className="bg-white rounded-lg max-w-md w-full p-6 print:bg-white print:shadow-none">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">YanPOS</h3>
                <p className="text-sm text-gray-500">Sipariş Fişi</p>
              </div>
              <button onClick={() => setShowReceipt(false)} className="text-gray-400 hover:text-gray-500 print:hidden">
                <span className="sr-only">Kapat</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="border-b pb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sipariş No:</span>
                  <span className="font-medium">#{currentOrder.siparisNo}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500">Tarih:</span>
                  <span className="font-medium">{new Date(currentOrder.date).toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500">Müşteri:</span>
                  <span className="font-medium">{currentOrder.musteriAdi}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500">Ödeme:</span>
                  <span className="font-medium">{currentOrder.paymentMethod === 'cash' ? 'Nakit' : 'Kredi Kartı'}</span>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Ürünler</h4>
                <div className="space-y-2">
                  {currentOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-gray-500 ml-2">x {item.quantity}</span>
                      </div>
                      <span className="font-medium">₺{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Toplam</span>
                  <span className="text-lg font-bold text-green-600">₺{currentOrder.totalAmount}</span>
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end space-x-3 print:hidden">
              <button
                onClick={() => setShowReceipt(false)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Kapat
              </button>
              <button
                onClick={printReceipt}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Yazdır
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bildirim */}
      {showNotification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          Sipariş başarıyla oluşturuldu!
        </div>
      )}
    </div>
  );
};

export default SelfService; 