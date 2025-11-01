import apiClient from '../axiosConfig';

const advancedAnalyticsAPI = {
  // Get user behavior analysis (current user)
  getMyBehavior: async () => {
    const response = await apiClient.get('/AdvancedAnalytics/user/behavior');
    return response.data;
  },

  // Get user behavior analysis (admin)
  getUserBehavior: async (userId) => {
    const response = await apiClient.get(`/AdvancedAnalytics/user/${userId}/behavior`);
    return response.data;
  },

  // Get charging patterns analysis
  getChargingPatterns: async () => {
    const response = await apiClient.get('/AdvancedAnalytics/charging-patterns');
    return response.data;
  },

  // Get station efficiency analysis
  getStationEfficiency: async (stationId) => {
    const response = await apiClient.get(`/AdvancedAnalytics/station/${stationId}/efficiency`);
    return response.data;
  },

  // Get recommendations (current user)
  getMyRecommendations: async () => {
    const response = await apiClient.get('/AdvancedAnalytics/recommendations');
    return response.data;
  },

  // Get recommendations for user (admin)
  getUserRecommendations: async (userId) => {
    const response = await apiClient.get(`/AdvancedAnalytics/user/${userId}/recommendations`);
    return response.data;
  }
};

export default advancedAnalyticsAPI;
