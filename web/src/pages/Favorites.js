import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Normalde burada API'den favori ürünleri çekerdik
    // Şimdilik örnek veri kullanıyoruz
    setTimeout(() => {
      setFavorites([
        {
          id: '1',
          name: 'Cheeseburger',
          price: 45.99,
          image: 'https://via.placeholder.com/150',
          description: 'Nefis peynirli hamburger'
        },
        {
          id: '2',
          name: 'Pizza Margarita',
          price: 79.99,
          image: 'https://via.placeholder.com/150',
          description: 'Klasik İtalyan pizzası'
        },
        {
          id: '3',
          name: 'Tavuk Döner',
          price: 35.99,
          image: 'https://via.placeholder.com/150',
          description: 'Lezzetli tavuk döner porsiyon'
        }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const removeFavorite = (id) => {
    setFavorites(favorites.filter(item => item.id !== id));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Favorilerim</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Favorilerim</h1>
      
      {favorites.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-medium text-gray-600 mb-4">Favori ürününüz bulunmamaktadır</h2>
          <p className="text-gray-500 mb-6">Menüden beğendiğiniz ürünleri favorilerinize ekleyebilirsiniz.</p>
          <Link 
            to="/menu" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Menüye Git
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <img 
                src={item.image} 
                alt={item.name} 
                className="w-full h-40 object-cover"
              />
              <div className="p-4">
                <h2 className="text-lg font-semibold">{item.name}</h2>
                <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="font-bold text-blue-600">₺{item.price.toFixed(2)}</span>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => removeFavorite(item.id)}
                      className="p-2 text-red-500 hover:text-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <Link 
                      to={`/menu/${item.id}`}
                      className="p-2 text-blue-600 hover:text-blue-800"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites; 