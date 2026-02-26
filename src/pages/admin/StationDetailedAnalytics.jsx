import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  ArrowBack,
  TrendingUp,
  ElectricBolt,
  AttachMoney,
  Schedule,
  People,
  Assessment,
  Download,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, subDays, subMonths } from "date-fns";
import { formatCurrency } from "../../utils/helpers";
import reportsAPI from "../../services/api/reportsAPI";
import {
  TimeSeriesTab,
  HourlyAnalysisTab,
  MonthlyAnalysisTab,
  YearlyAnalysisTab,
} from "./components/AnalyticsTabPanels";

const StationDetailedAnalytics = () => {
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
  const [_dailyAnalytics, setDailyAnalytics] = useState([]);
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate("/admin/stations")}>
          Quay lại danh sách trạm
        </Button>
      </Box>
    );
  }

  if (!detailedAnalytics) {
    return (
      <Box p={3}>
        <Alert severity="warning">Không tìm thấy dữ liệu trạm</Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton onClick={() => navigate("/admin/stations")}>
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h4" fontWeight="bold">
                {detailedAnalytics.stationName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {detailedAnalytics.location}
              </Typography>
            </Box>
            <Chip
              label={detailedAnalytics.status}
              color={detailedAnalytics.status === "active" ? "success" : "default"}
              size="small"
            />
          </Box>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExport}
          >
            Xuất báo cáo
          </Button>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Khoảng thời gian</InputLabel>
                <Select value={dateRange} onChange={handleDateRangeChange} label="Khoảng thời gian">
                  <MenuItem value="7days">7 ngày qua</MenuItem>
                  <MenuItem value="30days">30 ngày qua</MenuItem>
                  <MenuItem value="3months">3 tháng qua</MenuItem>
                  <MenuItem value="6months">6 tháng qua</MenuItem>
                  <MenuItem value="1year">1 năm qua</MenuItem>
                  <MenuItem value="custom">Tùy chỉnh</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {customDateMode && (
              <>
                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="Từ ngày"
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue)}
                    maxDate={new Date()}
                    slotProps={{ textField: { fullWidth: true, size: "small" } }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="Đến ngày"
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                    maxDate={new Date()}
                    slotProps={{ textField: { fullWidth: true, size: "small" } }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button fullWidth variant="contained" onClick={loadAnalytics}>
                    Áp dụng
                  </Button>
                </Grid>
              </>
            )}
          </Grid>
        </Paper>

        {/* Overview Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Tổng đặt chỗ
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {detailedAnalytics.periodBookings}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Từ {format(new Date(detailedAnalytics.periodStartDate), "dd/MM/yyyy")}
                    </Typography>
                  </Box>
                  <Schedule color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Doanh thu
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {formatCurrency(detailedAnalytics.periodRevenue)}
                    </Typography>
                    <Typography variant="caption" color="success.main">
                      +{detailedAnalytics.completionRate.toFixed(1)}% hoàn thành
                    </Typography>
                  </Box>
                  <AttachMoney color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Năng lượng
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {detailedAnalytics.periodEnergy.toFixed(1)} kWh
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Trung bình {detailedAnalytics.averageSessionDuration.toFixed(0)} phút/lần
                    </Typography>
                  </Box>
                  <ElectricBolt color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Tỷ lệ sử dụng
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {detailedAnalytics.currentOccupancyPercent.toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {detailedAnalytics.totalSlots} cổng sạc
                    </Typography>
                  </Box>
                  <TrendingUp color="info" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs for different views */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
            <Tab label="Tổng quan theo thời gian" icon={<Assessment />} iconPosition="start" />
            <Tab label="Phân tích theo giờ" icon={<Schedule />} iconPosition="start" />
            <Tab label="Phân tích theo tháng" icon={<TrendingUp />} iconPosition="start" />
            <Tab label="Phân tích theo năm" icon={<People />} iconPosition="start" />
          </Tabs>
        </Paper>

        {/* Tab Panels */}
        {activeTab === 0 && (
          <TimeSeriesTab
            data={detailedAnalytics.dailyData}
            granularity={granularity}
          />
        )}

        {activeTab === 1 && (
          <HourlyAnalysisTab
            data={detailedAnalytics.hourlyDistribution}
            peakHour={detailedAnalytics.peakUsageHour}
          />
        )}

        {activeTab === 2 && monthlyAnalytics && (
          <MonthlyAnalysisTab data={monthlyAnalytics} />
        )}

        {activeTab === 3 && yearlyAnalytics && (
          <YearlyAnalysisTab data={yearlyAnalytics} />
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default StationDetailedAnalytics;
