import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../../../services/axiosConfig";
import {
  exportRevenueToExcel,
  exportRevenueToPDF,
  exportEnergyToExcel,
  exportEnergyToPDF,
  exportUsageToExcel,
  exportUsageToPDF,
} from "../../../../utils/exportUtils";

export const useReportsAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [dateRange, setDateRange] = useState("last30days");
  const [granularity, setGranularity] = useState("daily");
  
  // Data states
  const [revenueData, setRevenueData] = useState(null);
  const [energyData, setEnergyData] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [peakHoursData, setPeakHoursData] = useState([]);
  const [stationComparison, setStationComparison] = useState([]);
  
  // Export menu state
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);

  const fetchRevenue = useCallback(async () => {
    try {
      const response = await axiosInstance.get(
        `/reports/revenue?dateRange=${dateRange}&granularity=${granularity}`
      );
      
      if (response.data.success) {
        setRevenueData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching revenue:", error);
    }
  }, [dateRange, granularity]);

  const fetchEnergy = useCallback(async () => {
    try {
      const response = await axiosInstance.get(
        `/reports/energy?dateRange=${dateRange}&granularity=${granularity}`
      );
      
      if (response.data.success) {
        setEnergyData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching energy:", error);
    }
  }, [dateRange, granularity]);

  const fetchUsage = useCallback(async () => {
    try {
      const response = await axiosInstance.get(
        `/reports/usage?dateRange=${dateRange}`
      );
      
      if (response.data.success) {
        const data = response.data.data;
        setUsageData(data);
        
        // Extract peak hours
        if (data.peakHours) {
          const peakHoursArray = Object.entries(data.peakHours).map(([hour, count]) => ({
            hour: `${hour}:00`,
            count: count,
          }));
          setPeakHoursData(peakHoursArray);
        }
        
        // Extract station comparison
        if (data.stationBreakdown) {
          setStationComparison(data.stationBreakdown.slice(0, 10)); // Top 10 stations
        }
      }
    } catch (error) {
      console.error("Error fetching usage:", error);
    }
  }, [dateRange]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchRevenue(),
        fetchEnergy(),
        fetchUsage(),
      ]);
    } catch (error) {
      console.error("Error fetching reports data:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchRevenue, fetchEnergy, fetchUsage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getDateRangeLabel = () => {
    const labels = {
      today: "Hôm nay",
      yesterday: "Hôm qua",
      last7days: "7 ngày qua",
      last30days: "30 ngày qua",
      thisMonth: "Tháng này",
      lastMonth: "Tháng trước",
      thisYear: "Năm nay",
    };
    return labels[dateRange] || dateRange;
  };

  // Export handlers
  const handleExportClick = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportMenuAnchor(null);
  };

  const handleExport = (format) => {
    const rangeLabel = getDateRangeLabel();
    let result;

    switch (currentTab) {
      case 0: // Revenue tab
        result = format === "excel"
          ? exportRevenueToExcel(revenueData, rangeLabel)
          : exportRevenueToPDF(revenueData, rangeLabel);
        break;
      case 1: // Energy tab
        result = format === "excel"
          ? exportEnergyToExcel(energyData, rangeLabel)
          : exportEnergyToPDF(energyData, rangeLabel);
        break;
      case 2: // Usage tab
        result = format === "excel"
          ? exportUsageToExcel(usageData, rangeLabel)
          : exportUsageToPDF(usageData, rangeLabel);
        break;
      default:
        result = { success: false, message: "Invalid tab" };
    }

    if (result.success) {
      alert(result.message);
    } else {
      alert(result.message);
    }

    handleExportClose();
  };

  return {
    loading,
    currentTab,
    setCurrentTab,
    dateRange,
    setDateRange,
    granularity,
    setGranularity,
    revenueData,
    energyData,
    usageData,
    peakHoursData,
    stationComparison,
    exportMenuAnchor,
    fetchData,
    getDateRangeLabel,
    handleExportClick,
    handleExportClose,
    handleExport
  };
};
