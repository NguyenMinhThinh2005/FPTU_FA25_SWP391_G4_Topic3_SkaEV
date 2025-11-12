import axiosInstance from "../axiosConfig";

/**
 * Admin Analytics and Reports API Service
 * Provides comprehensive analytics data for admin dashboard and advanced analytics
 */
const adminAnalyticsAPI = {
  // ========== Revenue Reports ==========
  
  /**
   * Get revenue reports with filtering
   * @param {Object} filters - { stationId?, year?, month? }
   */
  getRevenueReports: async (filters = {}) => {
    const params = {
      ...(filters.stationId && { stationId: filters.stationId }),
      ...(filters.year && { year: filters.year }),
      ...(filters.month && { month: filters.month })
    };
    return axiosInstance.get("/admin/reports/revenue", { params });
  },

  // ========== Usage Reports ==========
  
  /**
   * Get usage/utilization reports
   * @param {Object} filters - { stationId?, year?, month? }
   */
  getUsageReports: async (filters = {}) => {
    const params = {
      ...(filters.stationId && { stationId: filters.stationId }),
      ...(filters.year && { year: filters.year }),
      ...(filters.month && { month: filters.month })
    };
    return axiosInstance.get("/admin/reports/usage", { params });
  },

  // ========== Station Performance ==========
  
  /**
   * Get station performance metrics
   * @param {number} stationId - Optional specific station ID
   */
  getStationPerformance: async (stationId = null) => {
    const params = stationId ? { stationId } : {};
    return axiosInstance.get("/admin/reports/station-performance", { params });
  },

  // ========== Dashboard Summary ==========
  
  /**
   * Get comprehensive dashboard summary
   * Includes: total stations, active sessions, revenue (today/MTD/YTD), bookings, top stations
   */
  getDashboardSummary: async () => {
    return axiosInstance.get("/admin/reports/dashboard");
  },

  // ========== Customer Reports ==========
  
  /**
   * Get top customers by revenue or activity
   * @param {Object} params - { year?, month?, limit? }
   */
  getTopCustomers: async (params = {}) => {
    const queryParams = {
      year: params.year,
      month: params.month,
      limit: params.limit || 10
    };
    return axiosInstance.get("/admin/reports/top-customers", { params: queryParams });
  },

  // ========== Payment Methods ==========
  
  /**
   * Get payment methods usage statistics
   */
  getPaymentMethodsStats: async () => {
    return axiosInstance.get("/admin/reports/payment-methods-stats");
  },

  // ========== Time Series Data ==========
  
  /**
   * Get time series analytics data for charts
   * @param {Object} params - { days?, groupBy?, stationId? }
   */
  getTimeSeriesData: async (params = {}) => {
    const queryParams = {
      days: params.days || 30,
      groupBy: params.groupBy || 'day', // day, week, month
      ...(params.stationId && { stationId: params.stationId })
    };
    return axiosInstance.get("/admin/reports/timeseries", { params: queryParams });
  },

  // ========== Export Functions ==========
  
  /**
   * Export revenue report as CSV
   */
  exportRevenueReport: async (filters = {}) => {
    const params = {
      ...(filters.stationId && { stationId: filters.stationId }),
      ...(filters.year && { year: filters.year }),
      ...(filters.month && { month: filters.month })
    };
    const response = await axiosInstance.get("/admin/reports/export/revenue", {
      params,
      responseType: 'blob'
    });
    return response;
  },

  /**
   * Export usage report as CSV
   */
  exportUsageReport: async (filters = {}) => {
    const params = {
      ...(filters.stationId && { stationId: filters.stationId }),
      ...(filters.year && { year: filters.year }),
      ...(filters.month && { month: filters.month })
    };
    const response = await axiosInstance.get("/admin/reports/export/usage", {
      params,
      responseType: 'blob'
    });
    return response;
  },

  // ========== Advanced Analytics ==========
  
  /**
   * Get comprehensive analytics for Advanced Analytics page
   * Combines multiple data sources for rich visualizations
   */
  getAdvancedAnalytics: async (timeRange = '7d') => {
    try {
      // Get all necessary data in parallel
      const [
        dashboardData,
        revenueReports,
        usageReports,
        stationPerformance
      ] = await Promise.all([
        adminAnalyticsAPI.getDashboardSummary(),
        adminAnalyticsAPI.getRevenueReports({}),
        adminAnalyticsAPI.getUsageReports({}),
        adminAnalyticsAPI.getStationPerformance()
      ]);

      // Calculate time range for filtering
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Filter and aggregate data
      const timeSeriesData = adminAnalyticsAPI._generateTimeSeriesFromReports(
        revenueReports.data || revenueReports,
        usageReports.data || usageReports,
        days
      );

      return {
        dashboard: dashboardData.data || dashboardData,
        revenue: revenueReports.data || revenueReports,
        usage: usageReports.data || usageReports,
        stationPerformance: stationPerformance.data || stationPerformance,
        timeSeries: timeSeriesData
      };
    } catch (error) {
      console.error('Error fetching advanced analytics:', error);
      throw error;
    }
  },

  // ========== Helper Functions ==========
  
  /**
   * Generate time series data from revenue and usage reports
   * @private
   */
  _generateTimeSeriesFromReports: (revenueReports, usageReports, days = 30) => {
    const data = [];
    const revenueMap = new Map();
    const usageMap = new Map();

    // Build maps for quick lookup
    (revenueReports || []).forEach(report => {
      if (report.year && report.month) {
        const key = `${report.year}-${String(report.month).padStart(2, '0')}`;
        if (!revenueMap.has(key)) {
          revenueMap.set(key, {
            revenue: 0,
            transactions: 0,
            energy: 0
          });
        }
        const existing = revenueMap.get(key);
        existing.revenue += report.totalRevenue || 0;
        existing.transactions += report.totalTransactions || 0;
        existing.energy += report.totalEnergySoldKwh || 0;
      }
    });

    (usageReports || []).forEach(report => {
      if (report.year && report.month) {
        const key = `${report.year}-${String(report.month).padStart(2, '0')}`;
        if (!usageMap.has(key)) {
          usageMap.set(key, {
            sessions: 0,
            utilization: 0
          });
        }
        const existing = usageMap.get(key);
        existing.sessions += report.completedSessions || 0;
        existing.utilization += report.utilizationRatePercent || 0;
      }
    });

    // Generate daily data points
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const revenueData = revenueMap.get(monthKey) || { revenue: 0, transactions: 0, energy: 0 };
      const usageData = usageMap.get(monthKey) || { sessions: 0, utilization: 0 };

      // Distribute monthly data across days (simple average)
      const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

      data.push({
        date: dateStr,
        dateLabel: date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
        revenue: revenueData.revenue / daysInMonth,
        sessions: Math.round(usageData.sessions / daysInMonth),
        energy: revenueData.energy / daysInMonth,
        utilization: usageData.utilization || 0,
        users: Math.round(revenueData.transactions / daysInMonth),
        avgSessionTime: 45 // Will be enhanced when we have actual session duration data
      });
    }

    return data;
  }
};

export default adminAnalyticsAPI;
