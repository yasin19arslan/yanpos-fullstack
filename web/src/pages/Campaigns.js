import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { campaignAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaTag, FaCopy, FaCalendarAlt } from 'react-icons/fa';

const Campaigns = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    minimumPurchase: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    isActive: true,
    usageLimit: 100,
    userLimit: 1,
    image: ''
  });

  useEffect(() => {
    console.log('Campaigns sayfası yüklendi, kampanyalar getiriliyor...');
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      console.log('Kampanyalar yükleniyor, kullanıcı:', user?.email, 'rol:', user?.role);
      
      // API çağrısı sadeleştirildi, rolden bağımsız tüm kampanyaları getirelim
      const response = await campaignAPI.getActiveCampaigns();
      
      console.log('Kampanyalar API yanıtı:', response);
      console.log('Kampanyalar veri içeriği:', response.data);
      
      if (Array.isArray(response.data)) {
        setCampaigns(response.data);
      } else if (response.data && Array.isArray(response.data.campaigns)) {
        // API yanıtı farklı bir formatta olabilir
        setCampaigns(response.data.campaigns);
      } else {
        console.error('Kampanya verisi dizi formatında değil:', response.data);
        setCampaigns([]);
      }
    } catch (error) {
      console.error('Kampanyaları getirme hatası:', error);
      toast.error('Kampanyalar yüklenirken bir hata oluştu');
      setCampaigns([]); // Hata durumunda boş dizi
    } finally {
      setLoading(false);
    }
  };

  // Form verilerini güncelle
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Kampanya oluştur/güncelle
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Form verilerini hazırla
      const campaignData = {
        ...formData,
        discountValue: Number(formData.discountValue),
        minimumPurchase: Number(formData.minimumPurchase),
        usageLimit: Number(formData.usageLimit),
        userLimit: Number(formData.userLimit),
        startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
        endDate: formData.endDate ? new Date(formData.endDate) : null
      };
      
      // Bitiş tarihi kontrolü
      const endDate = new Date(formData.endDate);
      const now = new Date();
      
      if (endDate < now) {
        toast.error('Bitiş tarihi geçmiş bir tarih olamaz');
        return;
      }

      try {
        if (editId) {
          // Kampanya güncelleme
          await campaignAPI.updateCampaign(editId, campaignData);
          toast.success('Kampanya başarıyla güncellendi');
        } else {
          // Yeni kampanya oluşturma
          await campaignAPI.createCampaign(campaignData);
          toast.success('Kampanya başarıyla oluşturuldu');
        }
        
        // Formu sıfırla ve kampanyaları yenile
        resetForm();
        fetchCampaigns();
      } catch (error) {
        console.error('API isteği hatası:', error);
        
        if (error.response) {
          toast.error(error.response.data.message || 'Kampanya kaydedilirken bir hata oluştu');
        } else if (error.request) {
          toast.error('Sunucu yanıt vermedi, lütfen internet bağlantınızı kontrol edin');
        } else {
          toast.error(`Hata: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Genel hata:', error);
      toast.error('Beklenmeyen bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Düzenleme moduna geç
  const handleEdit = (campaign) => {
    setEditId(campaign._id);
    setFormData({
      code: campaign.code,
      title: campaign.title,
      description: campaign.description || '',
      discountType: campaign.discountType,
      discountValue: campaign.discountValue,
      minimumPurchase: campaign.minimumPurchase,
      startDate: new Date(campaign.startDate).toISOString().split('T')[0],
      endDate: new Date(campaign.endDate).toISOString().split('T')[0],
      isActive: campaign.isActive,
      usageLimit: campaign.usageLimit,
      userLimit: campaign.userLimit,
      image: campaign.image || ''
    });
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  // Kampanya sil
  const handleDelete = async (id) => {
    if (window.confirm('Bu kampanyayı silmek istediğinize emin misiniz?')) {
      try {
        setLoading(true);
        await campaignAPI.deleteCampaign(id);
        toast.success('Kampanya başarıyla silindi');
        fetchCampaigns();
      } catch (error) {
        console.error('Kampanya silme hatası:', error);
        toast.error('Kampanya silinirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    }
  };

  // Formu sıfırla
  const resetForm = () => {
    setFormData({
      code: '',
      title: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      minimumPurchase: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      isActive: true,
      usageLimit: 100,
      userLimit: 1,
      image: ''
    });
    setEditId(null);
    setShowForm(false);
  };

  // Bitiş tarihine göre kalan gün hesapla
  const getDaysLeft = (endDate) => {
    const days = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} gün kaldı` : 'Son gün!';
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Kampanyalar</h1>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            {showForm ? (
              <>
                <FaTimes className="mr-2" /> İptal
              </>
            ) : (
              <>
                <FaPlus className="mr-2" /> Yeni Kampanya
              </>
            )}
          </button>
        )}
      </div>

      {showForm && user?.role === 'admin' && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-indigo-700">
            {editId ? 'Kampanya Düzenle' : 'Yeni Kampanya Oluştur'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kampanya Kodu*
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  placeholder="Örn: HOSGELDIN20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kampanya Başlığı*
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  placeholder="Örn: Hoş Geldin İndirimi"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama*
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows="2"
                  placeholder="Kampanya açıklaması..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İndirim Tipi*
                </label>
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="percentage">Yüzde (%)</option>
                  <option value="fixed">Sabit Tutar (TL)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İndirim Değeri*
                </label>
                <input
                  type="number"
                  name="discountValue"
                  value={formData.discountValue}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  min="0"
                  max={formData.discountType === 'percentage' ? 100 : 1000}
                  placeholder={formData.discountType === 'percentage' ? "0-100" : "TL"}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Sepet Tutarı (TL)
                </label>
                <input
                  type="number"
                  name="minimumPurchase"
                  value={formData.minimumPurchase}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maksimum Kullanım Sayısı
                </label>
                <input
                  type="number"
                  name="usageLimit"
                  value={formData.usageLimit}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                  placeholder="100"
                />
                <small className="text-gray-500">0 = sınırsız</small>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kullanıcı Başına Kullanım
                </label>
                <input
                  type="number"
                  name="userLimit"
                  value={formData.userLimit}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="1"
                  placeholder="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Başlangıç Tarihi*
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bitiş Tarihi*
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Görsel URL
                </label>
                <input
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://..."
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Aktif
                </label>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                disabled={loading}
              >
                {loading ? 'Kaydediliyor...' : (editId ? 'Güncelle' : 'Oluştur')}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center border border-gray-200">
          <div className="text-5xl text-gray-300 mb-4">
            <FaTag className="inline-block mx-auto" />
          </div>
          <p className="text-xl text-gray-500">Şu anda aktif kampanya bulunmuyor</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div 
              key={campaign._id} 
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-200"
            >
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-4 flex justify-between items-center">
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-bold flex items-center">
                  <FaTag className="mr-2" size={12} />
                  {campaign.code}
                </span>
                <span className="text-xs font-medium bg-white bg-opacity-10 px-2 py-1 rounded-full">
                  {getDaysLeft(campaign.endDate)}
                </span>
              </div>
              
              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{campaign.title}</h3>
                
                <div className="flex items-center mb-3">
                  <span className="text-lg font-bold text-indigo-600 mr-2">
                    {campaign.discountType === 'percentage' 
                      ? `%${campaign.discountValue} indirim` 
                      : `${campaign.discountValue} TL indirim`}
                  </span>
                  {campaign.minimumPurchase > 0 && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      Min. sepet: {campaign.minimumPurchase} TL
                    </span>
                  )}
                </div>
                
                {campaign.description && (
                  <p className="text-gray-600 text-sm mb-4 bg-gray-50 p-3 rounded-md">{campaign.description}</p>
                )}
                
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500 flex items-center">
                    <FaCalendarAlt className="mr-1" size={12} />
                    Son geçerlilik: {new Date(campaign.endDate).toLocaleDateString()}
                  </div>
                  
                  {user?.role === 'admin' ? (
                    <div className="flex space-x-2">
                      <button 
                        className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors flex items-center"
                        onClick={() => handleEdit(campaign)}
                      >
                        <FaEdit className="mr-1" size={12} /> Düzenle
                      </button>
                      <button 
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center"
                        onClick={() => handleDelete(campaign._id)}
                      >
                        <FaTrash className="mr-1" size={12} /> Sil
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
                      onClick={() => {
                        navigator.clipboard.writeText(campaign.code);
                        toast.success('Kampanya kodu kopyalandı!');
                      }}
                    >
                      <FaCopy className="mr-2" size={14} /> Kodu Kopyala
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Campaigns; 