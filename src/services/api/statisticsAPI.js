import axiosInstance from '../axiosConfig';

// Using shared axios instance from axiosConfig

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
