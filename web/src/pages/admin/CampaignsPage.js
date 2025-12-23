import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config';
import { toast } from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import { campaignAPI } from '../../services/api';

const CampaignsPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
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
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Kampanyaları getir
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await campaignAPI.getAllCampaigns();
      console.log('Kampanyalar:', response.data);
      setCampaigns(response.data);
    } catch (error) {
      console.error('Kampanyaları getirme hatası:', error);
      toast.error('Kampanyalar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

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

      // Konsola verileri yazdır
      console.log('Gönderilecek form verileri:', campaignData);
      
      try {
        // localStorage'dan token alınıyor mu kontrol et
        const token = localStorage.getItem('token');
        console.log('Token mevcut mu:', !!token);
        
        if (!token) {
          toast.error('Oturum açmanız gerekiyor');
          return;
        }
        
        if (editId) {
          // Kampanya güncelleme
          console.log('Kampanya güncellenecek, ID:', editId);
          const response = await campaignAPI.updateCampaign(editId, campaignData);
          console.log('Güncelleme yanıtı:', response);
          toast.success('Kampanya başarıyla güncellendi');
        } else {
          // Yeni kampanya oluşturma
          console.log('Yeni kampanya oluşturuluyor...');
          const response = await campaignAPI.createCampaign(campaignData);
          console.log('Oluşturma yanıtı:', response);
          toast.success('Kampanya başarıyla oluşturuldu');
        }
        
        // Formu sıfırla ve kampanyaları yenile
        resetForm();
        fetchCampaigns();
      } catch (innerError) {
        console.error('API isteği hatası:', innerError);
        
        if (innerError.response) {
          console.error('Sunucu yanıtı:', innerError.response.status, innerError.response.data);
          toast.error(innerError.response.data.message || 'Kampanya kaydedilirken bir hata oluştu');
        } else if (innerError.request) {
          console.error('Sunucu yanıt vermedi', innerError.request);
          toast.error('Sunucu yanıt vermedi, lütfen internet bağlantınızı kontrol edin');
        } else {
          console.error('İstek hatası:', innerError.message);
          toast.error(`Hata: ${innerError.message}`);
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

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Kampanya Yönetimi</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
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
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="https://..."
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 rounded"
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
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Kaydediliyor...' : (editId ? 'Güncelle' : 'Oluştur')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h2 className="bg-gray-50 p-4 text-lg font-semibold border-b">Mevcut Kampanyalar</h2>
        
        {loading && !campaigns.length ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
            <p className="mt-2 text-gray-600">Kampanyalar yükleniyor...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Henüz kampanya oluşturulmamış
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kod
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Başlık
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İndirim
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Min. Tutar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih Aralığı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <tr key={campaign._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
                        {campaign.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {campaign.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {campaign.discountType === 'percentage'
                        ? `%${campaign.discountValue}`
                        : `${campaign.discountValue} TL`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {campaign.minimumPurchase > 0
                        ? `${campaign.minimumPurchase} TL`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(campaign.startDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(campaign.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {campaign.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-green-100 text-green-800">
                          <FaCheck className="mr-1" size={12} /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-red-100 text-red-800">
                          <FaTimes className="mr-1" size={12} /> Pasif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(campaign)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <FaEdit className="inline" /> Düzenle
                      </button>
                      <button
                        onClick={() => handleDelete(campaign._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTrash className="inline" /> Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignsPage; 