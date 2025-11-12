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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Stack,
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
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, subDays, subMonths } from "date-fns";
import { formatCurrency } from "../../utils/helpers";
import reportsAPI from "../../services/api/reportsAPI";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

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

// Time Series Tab Component
const TimeSeriesTab = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">Không có dữ liệu cho khoảng thời gian này</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Biểu đồ doanh thu và đặt chỗ theo thời gian
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8884d8"
                  fill="#8884d8"
                  name="Doanh thu (VNĐ)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="bookings"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  name="Số đặt chỗ"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Năng lượng tiêu thụ
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="energyKwh" fill="#ffc658" name="Năng lượng (kWh)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Tỷ lệ hoàn thành vs Hủy
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="completedSessions"
                  stroke="#00C49F"
                  name="Hoàn thành"
                />
                <Line
                  type="monotone"
                  dataKey="cancelledSessions"
                  stroke="#FF8042"
                  name="Đã hủy"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// Hourly Analysis Tab
const HourlyAnalysisTab = ({ data, peakHour }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">Không có dữ liệu phân tích theo giờ</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Phân bố sử dụng theo giờ 
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Giờ cao điểm: {peakHour}:00 - {peakHour + 1}:00
            </Alert>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" label={{ value: "Giờ", position: "insideBottom", offset: -5 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sessionCount" fill="#8884d8" name="Tổng phiên" />
                <Bar dataKey="completedCount" fill="#82ca9d" name="Hoàn thành" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Doanh thu theo giờ
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" name="Doanh thu (VNĐ)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// Monthly Analysis Tab
const MonthlyAnalysisTab = ({ data }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Tổng quan tháng {data.month}/{data.year}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h4">{data.totalBookings}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng đặt chỗ
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h4">{formatCurrency(data.totalRevenue)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Doanh thu
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h4">{data.totalEnergyKwh.toFixed(1)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Năng lượng (kWh)
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h4">{data.completionRate.toFixed(1)}%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tỷ lệ hoàn thành
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Phân tích theo ngày trong tháng
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data.dailyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), "dd/MM")} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip labelFormatter={(date) => format(new Date(date), "dd/MM/yyyy")} />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="totalRevenue"
                  stroke="#8884d8"
                  name="Doanh thu (VNĐ)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="totalBookings"
                  stroke="#82ca9d"
                  name="Số đặt chỗ"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// Yearly Analysis Tab
const YearlyAnalysisTab = ({ data }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Tổng quan năm {data.year}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h4">{data.totalBookings}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng đặt chỗ
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h4">{formatCurrency(data.totalRevenue)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Doanh thu
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h4">{data.totalEnergyKwh.toFixed(0)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Năng lượng (kWh)
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h4">{data.uniqueCustomers}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Khách hàng
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h4">{data.completionRate.toFixed(1)}%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tỷ lệ hoàn thành
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h4" color={data.growthRate >= 0 ? "success.main" : "error.main"}>
                    {data.growthRate >= 0 ? "+" : ""}{data.growthRate.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tăng trưởng
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Xu hướng theo tháng
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.monthlyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthName" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="totalRevenue" fill="#8884d8" name="Doanh thu (VNĐ)" />
                <Bar yAxisId="right" dataKey="totalBookings" fill="#82ca9d" name="Số đặt chỗ" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Chi tiết theo tháng
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tháng</TableCell>
                    <TableCell align="right">Đặt chỗ</TableCell>
                    <TableCell align="right">Hoàn thành</TableCell>
                    <TableCell align="right">Doanh thu</TableCell>
                    <TableCell align="right">Năng lượng (kWh)</TableCell>
                    <TableCell align="right">Tỷ lệ sử dụng</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.monthlyBreakdown.map((month) => (
                    <TableRow key={month.month}>
                      <TableCell>{month.monthName}</TableCell>
                      <TableCell align="right">{month.totalBookings}</TableCell>
                      <TableCell align="right">{month.completedSessions}</TableCell>
                      <TableCell align="right">{formatCurrency(month.totalRevenue)}</TableCell>
                      <TableCell align="right">{month.totalEnergyKwh.toFixed(1)}</TableCell>
                      <TableCell align="right">{month.utilizationRate.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default StationDetailedAnalytics;
