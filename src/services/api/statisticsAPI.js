import axios from 'axios';

// Backend API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const statisticsAPI = {
  /**
   * Get home page statistics
   */
  getHomeStats: async () => {
    try {
      const response = await axiosInstance.get('/statistics/home');
      return response.data;
    } catch (error) {
      console.error('Error fetching home statistics:', error);
      throw error;
    }
  },

  /**
   * Get dashboard statistics (admin only)
   */
  getDashboardStats: async () => {
    try {
      const response = await axiosInstance.get('/statistics/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard statistics:', error);
      throw error;
    }
  },
};

export default statisticsAPI;
