import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { categoryAPI, productAPI } from '../services/api';

const Menu = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: ''
  });

  // Kategori durumları ve işlevleri
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    image: '/images/default-category.png'
  });

  // Kategorileri yükle
  useEffect(() => {
    const loadCategories = async () => {
      try {
        console.log("Kategoriler yükleniyor...");
        const response = await categoryAPI.getCategories();
        console.log("Kategoriler API yanıtı:", response);
        // Backend'den gelen veriyi kontrol et
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

  // Ürünleri yükle
  useEffect(() => {
    const loadProducts = async () => {
      try {
        console.log("Ürünler yükleniyor...");
        const response = await productAPI.getProducts();
        console.log("Ürünler API yanıtı:", response);
        // Backend'den gelen veriyi kontrol et
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

  // Kategoriye göre ürünleri yükle
  useEffect(() => {
    const loadProductsByCategory = async () => {
      if (!selectedCategory) return;
      try {
        const response = await productAPI.getProductsByCategory(selectedCategory);
        if (response.data && response.data.products) {
          setProducts(response.data.products);
        } else {
          setProducts([]);
        }
      } catch (err) {
        setError('Ürünler yüklenirken bir hata oluştu');
        console.error(err);
        setProducts([]);
      }
    };
    loadProductsByCategory();
  }, [selectedCategory]);

  // Ürün düzenleme işlemi
  const handleEditProduct = (product) => {
    setEditingProduct({ ...product });
    setIsAddingProduct(false);
  };

  // Ürün güncelleme işlemi
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      // Zorunlu alanları kontrol et
      if (!editingProduct.name || !editingProduct.price || !editingProduct.category) {
        setError('Lütfen tüm zorunlu alanları doldurun');
        return;
      }

      const productData = {
        name: editingProduct.name,
        price: Number(editingProduct.price),
        description: editingProduct.description || '',
        image: editingProduct.image || '/images/default-product.png',
        category: editingProduct.category,
        isAvailable: editingProduct.isAvailable !== undefined ? editingProduct.isAvailable : true,
        isFeatured: editingProduct.isFeatured !== undefined ? editingProduct.isFeatured : false
      };
      
      console.log('Gönderilen güncelleme verisi:', productData);
      
      const response = await productAPI.updateProduct(editingProduct._id, productData);
      console.log('Ürün güncelleme cevabı:', response.data);
      
      if (response.data && response.data.product) {
        setProducts(prevProducts => 
          prevProducts.map(product => 
            product._id === editingProduct._id ? response.data.product : product
          )
        );
        setEditingProduct(null);
        setSuccess('Ürün başarıyla güncellendi');
      } else {
        throw new Error('Geçersiz sunucu yanıtı');
      }
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Ürün güncelleme hatası:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Ürün güncellenirken bir hata oluştu');
    }
  };

  // Ürün silme işlemi
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    setError('');
    setSuccess('');
    
    try {
      await productAPI.deleteProduct(productId);
      setProducts(prevProducts => prevProducts.filter(product => product._id !== productId));
      setSuccess('Ürün başarıyla silindi');
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError('Ürün silinirken bir hata oluştu');
      console.error(err);
    }
  };

  // Yeni ürün ekleme işlemi
  const handleAddProduct = () => {
    setNewProduct({
      name: '',
      description: '',
      price: '',
      category: selectedCategory || '',
      image: ''
    });
    setIsAddingProduct(true);
    setEditingProduct(null);
  };

  // Yeni ürün kaydetme işlemi
  const handleSaveNewProduct = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      // Zorunlu alanları kontrol et
      if (!newProduct.name || !newProduct.price || !newProduct.category) {
        setError('Lütfen tüm zorunlu alanları doldurun');
        return;
      }

      const productData = {
        name: newProduct.name,
        price: Number(newProduct.price),
        description: newProduct.description || '',
        image: newProduct.image || '/images/default-product.png',
        category: newProduct.category,
        isAvailable: true,
        isFeatured: false
      };
      
      console.log('Gönderilen ürün verisi:', productData);
      
      const response = await productAPI.createProduct(productData);
      console.log('Ürün ekleme cevabı:', response.data);
      
      if (response.data && response.data.product) {
        setProducts([...products, response.data.product]);
        setIsAddingProduct(false);
        setSuccess('Ürün başarıyla eklendi');
      } else {
        throw new Error('Geçersiz sunucu yanıtı');
      }
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Ürün ekleme hatası:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Ürün eklenirken bir hata oluştu');
    }
  };

  // Kategori ekleme işlemi
  const handleAddCategory = () => {
    setNewCategory({
      name: '',
      description: '',
      image: '/images/default-category.png'
    });
    setIsAddingCategory(true);
    setEditingCategory(null);
  };

  // Yeni kategori kaydetme işlemi
  const handleSaveNewCategory = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      // Zorunlu alanları kontrol et
      if (!newCategory.name) {
        setError('Kategori adı zorunludur');
        return;
      }
      
      // Backend'in beklediği isActive alanını ekle
      const categoryData = {
        name: newCategory.name,
        description: newCategory.description || '',
        image: newCategory.image || '/images/default-category.png',
        isActive: true
      };
      
      console.log('Gönderilen kategori verisi:', categoryData);
      
      const response = await categoryAPI.createCategory(categoryData);
      console.log('Kategori ekleme cevabı:', response.data);
      
      if (response.data && response.data.category) {
        setCategories([...categories, response.data.category]);
        setIsAddingCategory(false);
        setSuccess('Kategori başarıyla eklendi');
      } else {
        throw new Error('Geçersiz sunucu yanıtı');
      }
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Kategori ekleme hatası:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Kategori eklenirken bir hata oluştu');
    }
  };

  // Kategori düzenleme işlemi
  const handleEditCategory = (category, e) => {
    e.stopPropagation();
    setEditingCategory({ ...category });
    setIsAddingCategory(false);
  };

  // Kategori güncelleme işlemi
  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      // Zorunlu alanları kontrol et
      if (!editingCategory.name) {
        setError('Kategori adı zorunludur');
        return;
      }
      
      // Backend'in beklediği isActive alanını ekle
      const categoryData = {
        ...editingCategory,
        isActive: editingCategory.isActive !== undefined ? editingCategory.isActive : true
      };
      
      console.log('Gönderilen güncelleme verisi:', categoryData);
      
      const response = await categoryAPI.updateCategory(editingCategory._id, categoryData);
      console.log('Kategori güncelleme cevabı:', response.data);
      
      setCategories(prevCategories => 
        prevCategories.map(category => 
          category._id === editingCategory._id ? response.data.category : category
        )
      );
      setEditingCategory(null);
      setSuccess('Kategori başarıyla güncellendi');
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Kategori güncelleme hatası:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Kategori güncellenirken bir hata oluştu');
    }
  };

  // Kategori silme işlemi
  const handleDeleteCategory = async (categoryId, e) => {
    e.stopPropagation();
    if (!window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz? Bu işlem kategoriye ait tüm ürünleri etkileyebilir.')) {
      return;
    }
    
    setError('');
    setSuccess('');
    
    try {
      await categoryAPI.deleteCategory(categoryId);
      setCategories(prevCategories => prevCategories.filter(category => category._id !== categoryId));
      // Eğer silinen kategori seçiliyse, seçimi kaldır
      if (selectedCategory === categoryId) {
        setSelectedCategory(null);
      }
      setSuccess('Kategori başarıyla silindi');
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError('Kategori silinirken bir hata oluştu');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Menü Yönetimi</h1>
      </div>

      {/* Başarı ve hata mesajları */}
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

      {/* Ürün Düzenleme Modalı */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  Ürün Düzenle
                </h3>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            <form onSubmit={handleUpdateProduct} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Ürün Adı
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                    className="block w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    id="description"
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                    rows={2}
                    className="block w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                      Fiyat (₺)
                    </label>
                    <input
                      type="number"
                      id="price"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
                      className="block w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                      Kategori
                    </label>
                    <select
                      id="category"
                      value={editingProduct.category?._id || editingProduct.category || ''}
                      onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                      className="block w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                      required
                    >
                      <option value="">Seç</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                    Resim URL
                  </label>
                  <input
                    type="text"
                    id="image"
                    value={editingProduct.image || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, image: e.target.value})}
                    className="block w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                  />
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out transform hover:scale-[1.01]"
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Yeni Ürün Ekleme Modalı */}
      {isAddingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  Yeni Ürün Ekle
                </h3>
                <button
                  onClick={() => setIsAddingProduct(false)}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSaveNewProduct} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="newName" className="block text-sm font-medium text-gray-700 mb-1">
                    Ürün Adı
                  </label>
                  <input
                    type="text"
                    id="newName"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="block w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="newDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    id="newDescription"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    rows={2}
                    className="block w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="newPrice" className="block text-sm font-medium text-gray-700 mb-1">
                      Fiyat (₺)
                    </label>
                    <input
                      type="number"
                      id="newPrice"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                      className="block w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="newCategory" className="block text-sm font-medium text-gray-700 mb-1">
                      Kategori
                    </label>
                    <select
                      id="newCategory"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                      className="block w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                      required
                    >
                      <option value="">Seç</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="newImage" className="block text-sm font-medium text-gray-700 mb-1">
                    Resim URL
                  </label>
                  <input
                    type="text"
                    id="newImage"
                    value={newProduct.image}
                    onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
                    className="block w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                    placeholder="/images/default-product.png"
                  />
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out transform hover:scale-[1.01]"
                  >
                    Ekle
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kategori Düzenleme Modalı */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  Kategori Düzenle
                </h3>
                <button
                  onClick={() => setEditingCategory(null)}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            <form onSubmit={handleUpdateCategory} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="editCategoryName" className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori Adı
                  </label>
                  <input
                    type="text"
                    id="editCategoryName"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                    className="block w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="editCategoryDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama (Opsiyonel)
                  </label>
                  <textarea
                    id="editCategoryDescription"
                    value={editingCategory.description || ''}
                    onChange={(e) => setEditingCategory({...editingCategory, description: e.target.value})}
                    rows={2}
                    className="block w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="editCategoryImage" className="block text-sm font-medium text-gray-700 mb-1">
                    Resim URL
                  </label>
                  <input
                    type="text"
                    id="editCategoryImage"
                    value={editingCategory.image || ''}
                    onChange={(e) => setEditingCategory({...editingCategory, image: e.target.value})}
                    className="block w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                  />
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out transform hover:scale-[1.01]"
                  >
                    Güncelle
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Yeni Kategori Ekleme Modalı */}
      {isAddingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  Yeni Kategori Ekle
                </h3>
                <button
                  onClick={() => setIsAddingCategory(false)}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSaveNewCategory} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori Adı
                  </label>
                  <input
                    type="text"
                    id="categoryName"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                    className="block w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="categoryDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama (Opsiyonel)
                  </label>
                  <textarea
                    id="categoryDescription"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                    rows={2}
                    className="block w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="categoryImage" className="block text-sm font-medium text-gray-700 mb-1">
                    Resim URL
                  </label>
                  <input
                    type="text"
                    id="categoryImage"
                    value={newCategory.image}
                    onChange={(e) => setNewCategory({...newCategory, image: e.target.value})}
                    className="block w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                    placeholder="/images/default-category.png"
                  />
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out transform hover:scale-[1.01]"
                  >
                    Ekle
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Kategoriler */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-indigo-900">Kategoriler</h2>
              <button 
                onClick={handleAddCategory}
                className="inline-flex items-center p-1 text-sm font-medium rounded-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {Array.isArray(categories) && categories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => setSelectedCategory(category._id)}
                  className={`w-full px-4 py-3 text-left hover:bg-indigo-50 transition-colors ${
                    selectedCategory === category._id ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{category.name}</span>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={(e) => handleEditCategory(category, e)}
                        className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteCategory(category._id, e)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ürünler */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-indigo-900">
                {selectedCategory ? categories.find(c => c._id === selectedCategory)?.name || 'Seçili Kategori' : 'Tüm Ürünler'}
              </h2>
              <button 
                onClick={handleAddProduct}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-full text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-sm transition-all duration-200 ease-in-out transform hover:scale-105"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Yeni Ürün Ekle
              </button>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.isArray(products) && products
                .filter(product => !selectedCategory || product.category === selectedCategory || (product.category && product.category._id === selectedCategory))
                .map((product) => (
                  <div key={product._id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className="relative h-28">
                      <img src={product.image || '/images/default-product.png'} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">{product.name}</h3>
                          <p className="text-base font-bold text-indigo-600 mt-1">₺{product.price}</p>
                          {product.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{product.description}</p>
                          )}
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProduct(product);
                            }}
                            className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProduct(product._id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu; 