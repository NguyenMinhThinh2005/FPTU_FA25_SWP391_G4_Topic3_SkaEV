import api from '../axiosConfig';

// Using shared axios instance from axiosConfig
// All interceptors (auth token, error handling) are configured there

const reportsAPI = {
  // Revenue reports
  getRevenueReports: async (params = {}) => {
    const response = await api.get('/admin/AdminReports/revenue', { params });
    return response.data;
  },

  // Usage reports
  getUsageReports: async (params = {}) => {
    const response = await api.get('/admin/AdminReports/usage', { params });
    return response.data;
  },

  // Station performance
  getStationPerformance: async (stationId = null) => {
    const params = stationId ? { stationId } : {};
    const response = await api.get('/admin/AdminReports/station-performance', { params });
    return response.data;
  },

  // Peak hours analysis
  getPeakHours: async (params = {}) => {
    const response = await api.get('/admin/AdminReports/peak-hours', { params });
    return response.data;
  },

  // System health metrics
  getSystemHealth: async () => {
    const response = await api.get('/admin/AdminReports/system-health');
    return response.data;
  },

  // User growth analytics
  getUserGrowth: async (dateRange = 'last30days') => {
    const response = await api.get('/admin/AdminReports/user-growth', {
      params: { dateRange },
    });
    return response.data;
  },

  // Dashboard summary
  getDashboardSummary: async () => {
    const response = await api.get('/admin/AdminReports/dashboard');
    return response.data;
  },

  // Export revenue report
  exportRevenueReport: async (params = {}) => {
    const response = await api.get('/admin/AdminReports/revenue/export', {
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

  // === NEW: Station-Specific Detailed Analytics ===
  
  // Get detailed analytics for a specific station
  getStationDetailedAnalytics: async (stationId, startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await api.get(`/admin/AdminReports/stations/${stationId}/detailed-analytics`, { params });
    return response.data?.data || response.data;
  },

  // Get daily analytics for a specific station
  getStationDailyAnalytics: async (stationId, startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await api.get(`/admin/AdminReports/stations/${stationId}/daily`, { params });
    return response.data?.data || response.data;
  },

  // Get monthly analytics for a specific station
  getStationMonthlyAnalytics: async (stationId, year, month) => {
    const params = {};
    if (year) params.year = year;
    if (month) params.month = month;
    
    const response = await api.get(`/admin/AdminReports/stations/${stationId}/monthly`, { params });
    return response.data?.data || response.data;
  },

  // Get yearly analytics for a specific station
  getStationYearlyAnalytics: async (stationId, year) => {
    const params = {};
    if (year) params.year = year;
    
    const response = await api.get(`/admin/AdminReports/stations/${stationId}/yearly`, { params });
    return response.data?.data || response.data;
  },

  // Get time-series data for a specific station
  getStationTimeSeries: async (stationId, granularity = 'daily', startDate, endDate) => {
    const params = { granularity };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await api.get(`/admin/AdminReports/stations/${stationId}/time-series`, { params });
    return response.data?.data || response.data;
  },

  // Revenue grouped by connector / charging type (DB-backed)
  getRevenueByConnector: async (params = {}) => {
    // params: { startDate: ISO, endDate: ISO }
    const response = await api.get('/admin/AdminReports/revenue-by-connector', { params });
    return response.data;
  },
};

export default reportsAPI;
