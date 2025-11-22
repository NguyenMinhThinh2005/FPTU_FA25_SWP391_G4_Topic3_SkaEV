import { useState, useEffect, useCallback } from "react";
import reportsAPI from "../../../../services/api/reportsAPI";
import statisticsAPI from "../../../../services/api/statisticsAPI";

export const useSystemReports = () => {
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState("last30days");
  const [loading, setLoading] = useState(true);
  
  // State for real data
  const [revenueData, setRevenueData] = useState([]);
  const [stationUsage, setStationUsage] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [systemHealth, setSystemHealth] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [revenueRes, usageRes, growthRes, healthRes, statsRes] = await Promise.all([
        reportsAPI.getRevenueReports({ dateRange }),
        reportsAPI.getUsageReports({ dateRange }),
        reportsAPI.getUserGrowth(dateRange),
        reportsAPI.getSystemHealth(),
        statisticsAPI.getDashboardStats(),
      ]);

      // Process revenue data for charts
      if (revenueRes.success && revenueRes.data) {
        setRevenueData(revenueRes.data.monthlyData || []);
      }

      // Process station usage
      if (usageRes.success && usageRes.data) {
        setStationUsage(usageRes.data);
      }

      // Process user growth
      if (growthRes.success && growthRes.data) {
        setUserGrowth(growthRes.data);
      }

      // Process system health
      if (healthRes.success && healthRes.data) {
        setSystemHealth(healthRes.data);
      }

      // Process dashboard stats
      if (statsRes.success && statsRes.data) {
        setDashboardStats(statsRes.data);
      }
    } catch (error) {
      console.error("Error fetching reports data:", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleExportReport = async () => {
    try {
      await reportsAPI.exportRevenueReport({ dateRange });
    } catch (error) {
      console.error("Error exporting report:", error);
    }
  };

  return {
    tabValue,
    setTabValue,
    dateRange,
    setDateRange,
    loading,
    revenueData,
    stationUsage,
    userGrowth,
    systemHealth,
    dashboardStats,
    handleTabChange,
    handleExportReport
  };
};
