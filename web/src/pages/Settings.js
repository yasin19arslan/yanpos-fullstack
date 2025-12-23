import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { CogIcon, KeyIcon, UserIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

const Settings = () => {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await authAPI.getProfile();
        const userData = response.data;
        setFormData({
          ...formData,
          name: userData.name,
          email: userData.email,
        });
      } catch (err) {
        setError('Kullanıcı bilgileri yüklenirken bir hata oluştu');
        console.error(err);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
      };

      if (formData.newPassword) {
        updateData.newPassword = formData.newPassword;
      }

      await authAPI.updateProfile(updateData);
      setSuccess('Profil başarıyla güncellendi');
      setFormData({
        ...formData,
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Profil güncellenirken bir hata oluştu');
      console.error(err);
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Hesap Ayarları</h1>
          <p className="mt-2 text-gray-600">Profil bilgilerinizi ve güvenlik ayarlarınızı yönetin</p>
        </div>

        {success && (
          <div className="mb-6 flex items-center p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            <CheckCircleIcon className="h-5 w-5 mr-3" />
            <span>{success}</span>
          </div>
        )}
        
        {error && (
          <div className="mb-6 flex items-center p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <ExclamationCircleIcon className="h-5 w-5 mr-3" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="md:flex">
            {/* Sidebar */}
            <div className="md:w-64 bg-gray-50 p-6 border-r border-gray-200">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center px-4 py-3 w-full text-left rounded-lg ${
                    activeTab === 'profile'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <UserIcon className="h-5 w-5 mr-3" />
                  <span className="font-medium">Profil Bilgileri</span>
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex items-center px-4 py-3 w-full text-left rounded-lg ${
                    activeTab === 'security'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <KeyIcon className="h-5 w-5 mr-3" />
                  <span className="font-medium">Güvenlik</span>
                </button>
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`flex items-center px-4 py-3 w-full text-left rounded-lg ${
                    activeTab === 'preferences'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <CogIcon className="h-5 w-5 mr-3" />
                  <span className="font-medium">Tercihler</span>
                </button>
              </nav>
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button 
                  onClick={handleLogout}
                  className="w-full py-2 px-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition duration-150"
                >
                  Çıkış Yap
                </button>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 p-6">
              <form onSubmit={handleSubmit}>
                {activeTab === 'profile' && (
                  <>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Profil Bilgileri</h2>
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                          Ad Soyad
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          E-posta Adresi
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'security' && (
                  <>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Güvenlik Ayarları</h2>
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                          Yeni Şifre
                        </label>
                        <input
                          type="password"
                          id="newPassword"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                        />
                        <p className="mt-1 text-xs text-gray-500">Değiştirmek istemiyorsanız boş bırakın</p>
                      </div>
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                          Şifreyi Doğrula
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                          disabled={!formData.newPassword}
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'preferences' && (
                  <>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Uygulama Tercihleri</h2>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          id="notifications"
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="notifications" className="ml-3 text-sm text-gray-700">
                          E-posta bildirimleri
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="darkMode"
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="darkMode" className="ml-3 text-sm text-gray-700">
                          Karanlık mod
                        </label>
                      </div>
                    </div>
                  </>
                )}

                <div className="mt-8">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-medium rounded-lg shadow-sm hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 transform hover:scale-[1.02]"
                  >
                    Değişiklikleri Kaydet
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 