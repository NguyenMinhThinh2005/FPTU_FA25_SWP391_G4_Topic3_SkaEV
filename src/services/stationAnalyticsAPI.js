import axios from 'axios';

const API_URL = 'http://localhost:5000/api/stationanalytics';

const stationAnalyticsAPI = {
  // Get power usage trends (last 30 days)
  getPowerUsageTrends: async (stationId) => {
    try {
      const response = await axios.get(`${API_URL}/${stationId}/power-usage`);
      return response.data;
    } catch (error) {
      console.error('Error fetching power usage trends:', error);
      throw error;
    }
  },

  // Get slot utilization (last 30 days)
  getSlotUtilization: async (stationId) => {
    try {
      const response = await axios.get(`${API_URL}/${stationId}/slot-utilization`);
      return response.data;
    } catch (error) {
      console.error('Error fetching slot utilization:', error);
      throw error;
    }
  },

  // Get revenue breakdown by payment method (last 30 days)
  getRevenueBreakdown: async (stationId) => {
    try {
      const response = await axios.get(`${API_URL}/${stationId}/revenue-breakdown`);
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue breakdown:', error);
      throw error;
    }
  },

  // Get session patterns (hourly distribution)
  getSessionPatterns: async (stationId) => {
    try {
      const response = await axios.get(`${API_URL}/${stationId}/session-patterns`);
      return response.data;
    } catch (error) {
      console.error('Error fetching session patterns:', error);
      throw error;
    }
  },

  // Get overall analytics summary
  getAnalyticsSummary: async (stationId) => {
    try {
      const response = await axios.get(`${API_URL}/${stationId}/summary`);
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics summary:', error);
      throw error;
    }
  },

  // Get all analytics data at once
  getAllAnalytics: async (stationId) => {
    try {
      const [powerUsage, slotUtilization, revenue, sessionPatterns, summary] = await Promise.all([
        stationAnalyticsAPI.getPowerUsageTrends(stationId),
        stationAnalyticsAPI.getSlotUtilization(stationId),
        stationAnalyticsAPI.getRevenueBreakdown(stationId),
        stationAnalyticsAPI.getSessionPatterns(stationId),
        stationAnalyticsAPI.getAnalyticsSummary(stationId)
      ]);

      return {
        powerUsage,
        slotUtilization,
        revenue,
        sessionPatterns,
        summary
      };
    } catch (error) {
      console.error('Error fetching all analytics:', error);
      throw error;
    }
  }
};

export default stationAnalyticsAPI;
