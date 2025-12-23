import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = 'https://yanposapp.onrender.com';

export const useApi = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // İstek öncesi token kontrolü
  useEffect(() => {
    const reqInterceptor = axiosInstance.interceptors.request.use(
      (config) => {
        if (user && user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 401 hatası durumunda otomatik logout
    const resInterceptor = axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axiosInstance.interceptors.request.eject(reqInterceptor);
      axiosInstance.interceptors.response.eject(resInterceptor);
    };
  }, [user, logout, axiosInstance]);

  // GET isteği
  const get = useCallback(async (url, params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get(url, { params });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  // POST isteği
  const post = useCallback(async (url, data = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.post(url, data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  // PUT isteği
  const put = useCallback(async (url, data = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.put(url, data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  // PATCH isteği
  const patch = useCallback(async (url, data = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.patch(url, data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  // DELETE isteği
  const del = useCallback(async (url, params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.delete(url, { params });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Bir hata oluştu');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  return {
    get,
    post,
    put,
    patch,
    delete: del,
    loading,
    error,
    axiosInstance
  };
}; 