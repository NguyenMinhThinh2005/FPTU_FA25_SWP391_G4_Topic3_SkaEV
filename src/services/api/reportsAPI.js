import api from '../axiosConfig';

// Using shared axios instance from axiosConfig
// All interceptors (auth token, error handling) are configured there

const reportsAPI = {
  // Revenue reports
  getRevenueReports: async (params = {}) => {
    const response = await api.get('/api/admin/AdminReports/revenue', { params });
    return response.data;
  },

  // Usage reports
  getUsageReports: async (params = {}) => {
    const response = await api.get('/api/admin/AdminReports/usage', { params });
    return response.data;
  },

  // Station performance
  getStationPerformance: async (stationId = null) => {
    const params = stationId ? { stationId } : {};
    const response = await api.get('/api/admin/AdminReports/station-performance', { params });
    return response.data;
  },

  // Peak hours analysis
  getPeakHours: async (params = {}) => {
    const response = await api.get('/api/admin/AdminReports/peak-hours', { params });
    return response.data;
  },

  // System health metrics
  getSystemHealth: async () => {
    const response = await api.get('/api/admin/AdminReports/system-health');
    return response.data;
  },

  // User growth analytics
  getUserGrowth: async (dateRange = 'last30days') => {
    const response = await api.get('/api/admin/AdminReports/user-growth', {
      params: { dateRange },
    });
    return response.data;
  },

  // Dashboard summary
  getDashboardSummary: async () => {
    const response = await api.get('/api/admin/AdminReports/dashboard');
    return response.data;
  },

  // Export revenue report
  exportRevenueReport: async (params = {}) => {
    const response = await api.get('/api/admin/AdminReports/revenue/export', {
      params,
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `revenue_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return response;
  },
};

export default reportsAPI;
