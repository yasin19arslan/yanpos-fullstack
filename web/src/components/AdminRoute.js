import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../layouts/AdminLayout';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  console.log('AdminRoute - Kullanıcı bilgileri:', user);
  console.log('AdminRoute - Loading durumu:', loading);

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
  if (!user) {
    console.log('AdminRoute - Kullanıcı giriş yapmamış, login sayfasına yönlendiriliyor');
    return <Navigate to="/login" />;
  }

  // Kullanıcı admin değilse ana sayfaya yönlendir
  if (user.role !== 'admin') {
    console.log('AdminRoute - Kullanıcı admin değil, ana sayfaya yönlendiriliyor. Rol:', user.role);
    return <Navigate to="/dashboard" />;
  }

  console.log('AdminRoute - Admin erişimi onaylandı, içeriği gösteriliyor');
  // Admin ise içeriği göster, admin layout içinde
  return <AdminLayout>{children}</AdminLayout>;
};

export default AdminRoute; 