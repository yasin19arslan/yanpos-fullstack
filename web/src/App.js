import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Menu from './pages/Menu';
import SelfService from './pages/SelfService';
import Faturalar from './pages/Faturalar';
import Settings from './pages/Settings';
import Campaigns from './pages/Campaigns';
import MainLayout from './layouts/MainLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductsPage from './pages/admin/ProductsPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import CampaignsPage from './pages/admin/CampaignsPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <Router>
      {/* Toast bildirimleri için */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#333',
          },
          success: {
            style: {
              background: '#effaf5',
              border: '1px solid #10b981',
              color: '#10b981',
            },
          },
          error: {
            style: {
              background: '#fff5f5',
              border: '1px solid #f56565',
              color: '#f56565',
            },
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/menu"
          element={
            <ProtectedRoute>
              <Menu />
            </ProtectedRoute>
          }
        />
        <Route
          path="/self-service"
          element={
            <ProtectedRoute>
              <SelfService />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faturalar"
          element={
            <ProtectedRoute>
              <Faturalar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/campaigns"
          element={
            <ProtectedRoute>
              <Campaigns />
            </ProtectedRoute>
          }
        />

        {/* Admin Sayfaları */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/products" element={<AdminRoute><ProductsPage /></AdminRoute>} />
        <Route path="/admin/categories" element={<AdminRoute><CategoriesPage /></AdminRoute>} />
        <Route path="/admin/campaigns" element={<AdminRoute><CampaignsPage /></AdminRoute>} />

        {/* Ana sayfa yönlendirmesi */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
