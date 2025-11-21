import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { subDays, subMonths } from "date-fns";
import reportsAPI from "../../../../services/api/reportsAPI";

export const useStationDetailedAnalytics = () => {
  const { stationId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // Date range filters
  const [dateRange, setDateRange] = useState("30days");
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const [customDateMode, setCustomDateMode] = useState(false);
  
  // Analytics data
  const [detailedAnalytics, setDetailedAnalytics] = useState(null);
  const [dailyAnalytics, setDailyAnalytics] = useState([]);
  const [monthlyAnalytics, setMonthlyAnalytics] = useState(null);
  const [yearlyAnalytics, setYearlyAnalytics] = useState(null);
  
  // Granularity for time series
  const [granularity, setGranularity] = useState("daily");

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load detailed analytics with time series
      const detailedData = await reportsAPI.getStationDetailedAnalytics(
        stationId,
        startDate.toISOString(),
        endDate.toISOString()
      );
      setDetailedAnalytics(detailedData);

      // Load daily analytics
      const dailyData = await reportsAPI.getStationDailyAnalytics(
        stationId,
        startDate.toISOString(),
        endDate.toISOString()
      );
      setDailyAnalytics(dailyData);

      // Load current month analytics
      const now = new Date();
      const monthlyData = await reportsAPI.getStationMonthlyAnalytics(
        stationId,
        now.getFullYear(),
        now.getMonth() + 1
      );
      setMonthlyAnalytics(monthlyData);

      // Load current year analytics
      const yearlyData = await reportsAPI.getStationYearlyAnalytics(
        stationId,
        now.getFullYear()
      );
      setYearlyAnalytics(yearlyData);

      setLoading(false);
    } catch (err) {
      console.error("Error loading analytics:", err);
      setError("Không thể tải dữ liệu phân tích. Vui lòng thử lại.");
      setLoading(false);
    }
  }, [stationId, startDate, endDate]);

  const updateDateRangeFromPreset = useCallback((preset) => {
    const end = new Date();
    let start;
    
    switch (preset) {
      case "7days":
        start = subDays(end, 7);
        setGranularity("daily");
        break;
      case "30days":
        start = subDays(end, 30);
        setGranularity("daily");
        break;
      case "3months":
        start = subMonths(end, 3);
        setGranularity("daily");
        break;
      case "6months":
        start = subMonths(end, 6);
        setGranularity("monthly");
        break;
      case "1year":
        start = subMonths(end, 12);
        setGranularity("monthly");
        break;
      default:
        start = subDays(end, 30);
        setGranularity("daily");
    }
    
    setStartDate(start);
    setEndDate(end);
    setCustomDateMode(false);
  }, []);

  useEffect(() => {
    if (stationId) {
      loadAnalytics();
    }
  }, [stationId, startDate, endDate, loadAnalytics]);

  useEffect(() => {
    if (dateRange !== "custom") {
      updateDateRangeFromPreset(dateRange);
    }
  }, [dateRange, updateDateRangeFromPreset]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDateRangeChange = (event) => {
    const value = event.target.value;
    setDateRange(value);
    if (value === "custom") {
      setCustomDateMode(true);
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Exporting analytics data...");
  };

  return {
    loading,
    error,
    activeTab,
    setActiveTab,
    dateRange,
    setDateRange,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    customDateMode,
    detailedAnalytics,
    dailyAnalytics,
    monthlyAnalytics,
    yearlyAnalytics,
    granularity,
    handleTabChange,
    handleDateRangeChange,
    handleExport,
    loadAnalytics,
    navigate
  };
};