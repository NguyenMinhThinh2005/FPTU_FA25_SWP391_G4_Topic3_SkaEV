import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tab,
  Tabs,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Menu,
} from "@mui/material";
import {
  TrendingUp,
  AttachMoney,
  BatteryChargingFull,
  EvStation,
  CalendarToday,
  Download,
  Refresh,
  Speed,
  Schedule,
  People,
  LocationOn,
} from "@mui/icons-material";
import {
  exportRevenueToExcel,
  exportRevenueToPDF,
  exportEnergyToExcel,
  exportEnergyToPDF,
  exportUsageToExcel,
  exportUsageToPDF,
} from "../../utils/exportUtils";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import axiosInstance from "../../services/axiosConfig";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

const ReportsAnalytics = () => {
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
  }, [dateRange, granularity]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [dateRange, granularity, fetchData]);

  const fetchRevenue = async () => {
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
  };

  const fetchEnergy = async () => {
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
  };

  const fetchUsage = async () => {
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
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

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

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Báo cáo & Phân tích
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Theo dõi doanh thu, năng lượng và hoạt động hệ thống
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<Download />}
            onClick={handleExportClick}
          >
            Xuất báo cáo
          </Button>
          <Menu
            anchorEl={exportMenuAnchor}
            open={Boolean(exportMenuAnchor)}
            onClose={handleExportClose}
          >
            <MenuItem onClick={() => handleExport("excel")}>
              Xuất Excel (.xlsx)
            </MenuItem>
            <MenuItem onClick={() => handleExport("pdf")}>
              Xuất PDF (.pdf)
            </MenuItem>
          </Menu>
          <Button variant="contained" startIcon={<Refresh />} onClick={fetchData}>
            Làm mới
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Khoảng thời gian</InputLabel>
                <Select
                  value={dateRange}
                  label="Khoảng thời gian"
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <MenuItem value="today">Hôm nay</MenuItem>
                  <MenuItem value="yesterday">Hôm qua</MenuItem>
                  <MenuItem value="last7days">7 ngày qua</MenuItem>
                  <MenuItem value="last30days">30 ngày qua</MenuItem>
                  <MenuItem value="thisMonth">Tháng này</MenuItem>
                  <MenuItem value="lastMonth">Tháng trước</MenuItem>
                  <MenuItem value="thisYear">Năm nay</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Mức độ chi tiết</InputLabel>
                <Select
                  value={granularity}
                  label="Mức độ chi tiết"
                  onChange={(e) => setGranularity(e.target.value)}
                >
                  <MenuItem value="hourly">Theo giờ</MenuItem>
                  <MenuItem value="daily">Theo ngày</MenuItem>
                  <MenuItem value="weekly">Theo tuần</MenuItem>
                  <MenuItem value="monthly">Theo tháng</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Alert severity="info" icon={<CalendarToday />}>
                Đang xem: <strong>{getDateRangeLabel()}</strong>
              </Alert>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
            <Tab label="Doanh thu" icon={<AttachMoney />} iconPosition="start" />
            <Tab label="Năng lượng" icon={<BatteryChargingFull />} iconPosition="start" />
            <Tab label="Sử dụng" icon={<TrendingUp />} iconPosition="start" />
            <Tab label="Giờ cao điểm" icon={<Schedule />} iconPosition="start" />
            <Tab label="So sánh trạm" icon={<LocationOn />} iconPosition="start" />
          </Tabs>
        </Box>

        <CardContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Tab 0: Revenue */}
              {currentTab === 0 && revenueData && (
                <Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Báo cáo doanh thu - {getDateRangeLabel()}
                  </Typography>

                  {/* Summary Cards */}
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h4" color="primary" fontWeight="bold">
                            {formatCurrency(revenueData.totalRevenue || 0)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Tổng doanh thu
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h4" color="success.main" fontWeight="bold">
                            {formatCurrency(revenueData.averageRevenuePerSession || 0)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            TB/phiên sạc
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h4" color="info.main" fontWeight="bold">
                            {revenueData.totalSessions || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Tổng phiên sạc
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {revenueData.growthRate >= 0 ? (
                              <TrendingUp color="success" />
                            ) : (
                              <TrendingUp color="error" sx={{ transform: "rotate(180deg)" }} />
                            )}
                            <Typography
                              variant="h4"
                              color={revenueData.growthRate >= 0 ? "success.main" : "error"}
                              fontWeight="bold"
                            >
                              {revenueData.growthRate?.toFixed(1) || 0}%
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Tăng trưởng
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* Revenue Chart */}
                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Biểu đồ doanh thu theo thời gian
                      </Typography>
                      <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={revenueData.timeSeriesData || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tickFormatter={formatDate} />
                          <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                          <Tooltip
                            formatter={(value) => formatCurrency(value)}
                            labelFormatter={formatDate}
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            name="Doanh thu"
                            stroke="#8884d8"
                            fill="#8884d8"
                            fillOpacity={0.6}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Top Stations */}
                  {revenueData.topStations && revenueData.topStations.length > 0 && (
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          Top trạm sạc theo doanh thu
                        </Typography>
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Thứ hạng</TableCell>
                                <TableCell>Trạm sạc</TableCell>
                                <TableCell align="right">Doanh thu</TableCell>
                                <TableCell align="right">Phiên sạc</TableCell>
                                <TableCell align="right">TB/phiên</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {revenueData.topStations.map((station, index) => (
                                <TableRow key={station.stationId}>
                                  <TableCell>
                                    <Chip
                                      label={`#${index + 1}`}
                                      size="small"
                                      color={index === 0 ? "primary" : "default"}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight="medium">
                                      {station.stationName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {station.address}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2" fontWeight="bold" color="primary">
                                      {formatCurrency(station.totalRevenue)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">{station.sessionCount}</TableCell>
                                  <TableCell align="right">
                                    {formatCurrency(station.avgRevenuePerSession)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  )}
                </Box>
              )}

              {/* Tab 1: Energy */}
              {currentTab === 1 && energyData && (
                <Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Báo cáo năng lượng - {getDateRangeLabel()}
                  </Typography>

                  {/* Summary Cards */}
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={4}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h4" color="success.main" fontWeight="bold">
                            {(energyData.totalEnergyKwh || 0).toFixed(2)} kWh
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Tổng năng lượng
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h4" color="info.main" fontWeight="bold">
                            {(energyData.averageEnergyPerSession || 0).toFixed(2)} kWh
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            TB/phiên sạc
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h4" color="warning.main" fontWeight="bold">
                            {(energyData.peakPowerKw || 0).toFixed(0)} kW
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Công suất đỉnh
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* Energy Chart */}
                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Biểu đồ năng lượng tiêu thụ
                      </Typography>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={energyData.timeSeriesData || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tickFormatter={formatDate} />
                          <YAxis label={{ value: "kWh", angle: -90, position: "insideLeft" }} />
                          <Tooltip labelFormatter={formatDate} />
                          <Legend />
                          <Bar dataKey="energyKwh" name="Năng lượng (kWh)" fill="#00C49F" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Energy by Connector Type */}
                  {energyData.byConnectorType && energyData.byConnectorType.length > 0 && (
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          Năng lượng theo loại cổng sạc
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={energyData.byConnectorType}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={(entry) => `${entry.connectorType}: ${entry.energyKwh.toFixed(1)} kWh`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="energyKwh"
                            >
                              {energyData.byConnectorType.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}
                </Box>
              )}

              {/* Tab 2: Usage */}
              {currentTab === 2 && usageData && (
                <Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Báo cáo sử dụng - {getDateRangeLabel()}
                  </Typography>

                  {/* Summary Cards */}
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h4" color="primary" fontWeight="bold">
                            {usageData.totalSessions || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Tổng phiên sạc
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h4" color="success.main" fontWeight="bold">
                            {usageData.completedSessions || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Hoàn thành
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h4" color="error.main" fontWeight="bold">
                            {usageData.cancelledSessions || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Đã hủy
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h4" color="info.main" fontWeight="bold">
                            {(usageData.averageDurationMinutes || 0).toFixed(0)} phút
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Thời gian TB
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* Usage Trend Chart */}
                  {usageData.timeSeriesData && usageData.timeSeriesData.length > 0 && (
                    <Card variant="outlined" sx={{ mb: 3 }}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          Xu hướng sử dụng
                        </Typography>
                        <ResponsiveContainer width="100%" height={400}>
                          <LineChart data={usageData.timeSeriesData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tickFormatter={formatDate} />
                            <YAxis />
                            <Tooltip labelFormatter={formatDate} />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="sessions"
                              name="Phiên sạc"
                              stroke="#8884d8"
                              strokeWidth={2}
                            />
                            <Line
                              type="monotone"
                              dataKey="completed"
                              name="Hoàn thành"
                              stroke="#82ca9d"
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}

                  {/* Status Breakdown */}
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Phân bố trạng thái
                          </Typography>
                          <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                              <Pie
                                data={[
                                  { name: "Hoàn thành", value: usageData.completedSessions || 0 },
                                  { name: "Đã hủy", value: usageData.cancelledSessions || 0 },
                                  { name: "Đang sạc", value: usageData.inProgressSessions || 0 },
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry) => `${entry.name}: ${entry.value}`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {[
                                  { name: "Hoàn thành", value: usageData.completedSessions || 0 },
                                  { name: "Đã hủy", value: usageData.cancelledSessions || 0 },
                                  { name: "Đang sạc", value: usageData.inProgressSessions || 0 },
                                ].map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Người dùng hoạt động
                          </Typography>
                          <Box sx={{ mt: 2 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                              <Typography variant="body2">Tổng người dùng:</Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {usageData.totalUsers || 0}
                              </Typography>
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                              <Typography variant="body2">Hoạt động:</Typography>
                              <Typography variant="body2" fontWeight="bold" color="success.main">
                                {usageData.activeUsers || 0}
                              </Typography>
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                              <Typography variant="body2">Tỷ lệ hoạt động:</Typography>
                              <Typography variant="body2" fontWeight="bold" color="primary">
                                {usageData.totalUsers > 0
                                  ? ((usageData.activeUsers / usageData.totalUsers) * 100).toFixed(1)
                                  : 0}
                                %
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Tab 3: Peak Hours */}
              {currentTab === 3 && (
                <Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Giờ cao điểm - {getDateRangeLabel()}
                  </Typography>

                  <Alert severity="info" sx={{ mb: 3 }}>
                    Biểu đồ dưới đây hiển thị số lượng phiên sạc theo từng giờ trong ngày để xác định giờ cao điểm sử dụng.
                  </Alert>

                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Phân bố phiên sạc theo giờ
                      </Typography>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={peakHoursData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="hour" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" name="Số phiên sạc" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {peakHoursData.length > 0 && (
                    <Card variant="outlined" sx={{ mt: 3 }}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          Top giờ cao điểm
                        </Typography>
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Thứ hạng</TableCell>
                                <TableCell>Khung giờ</TableCell>
                                <TableCell align="right">Số phiên sạc</TableCell>
                                <TableCell align="right">% Tổng</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {[...peakHoursData]
                                .sort((a, b) => b.count - a.count)
                                .slice(0, 5)
                                .map((item, index) => {
                                  const total = peakHoursData.reduce((sum, h) => sum + h.count, 0);
                                  const percentage = total > 0 ? (item.count / total) * 100 : 0;
                                  return (
                                    <TableRow key={item.hour}>
                                      <TableCell>
                                        <Chip
                                          label={`#${index + 1}`}
                                          size="small"
                                          color={index === 0 ? "error" : "default"}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="body2" fontWeight="medium">
                                          {item.hour}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="right">
                                        <Typography variant="body2" fontWeight="bold" color="primary">
                                          {item.count}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="right">
                                        <Typography variant="body2">{percentage.toFixed(1)}%</Typography>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  )}
                </Box>
              )}

              {/* Tab 4: Station Comparison */}
              {currentTab === 4 && (
                <Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    So sánh hiệu suất trạm sạc - {getDateRangeLabel()}
                  </Typography>

                  <Alert severity="info" sx={{ mb: 3 }}>
                    So sánh các trạm sạc dựa trên số lượng phiên sạc, doanh thu và năng lượng tiêu thụ.
                  </Alert>

                  {stationComparison.length === 0 ? (
                    <Alert severity="warning">Chưa có dữ liệu so sánh trạm sạc</Alert>
                  ) : (
                    <>
                      <Card variant="outlined" sx={{ mb: 3 }}>
                        <CardContent>
                          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Biểu đồ so sánh số phiên sạc
                          </Typography>
                          <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={stationComparison} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis dataKey="stationName" type="category" width={150} />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="sessionCount" name="Phiên sạc" fill="#8884d8" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Bảng so sánh chi tiết
                          </Typography>
                          <TableContainer>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Thứ hạng</TableCell>
                                  <TableCell>Trạm sạc</TableCell>
                                  <TableCell align="right">Phiên sạc</TableCell>
                                  <TableCell align="right">Hoàn thành</TableCell>
                                  <TableCell align="right">Tỷ lệ hoàn thành</TableCell>
                                  <TableCell align="right">Hiệu suất</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {stationComparison.map((station, index) => {
                                  const completionRate =
                                    station.sessionCount > 0
                                      ? (station.completedCount / station.sessionCount) * 100
                                      : 0;
                                  return (
                                    <TableRow key={station.stationId}>
                                      <TableCell>
                                        <Chip
                                          label={`#${index + 1}`}
                                          size="small"
                                          color={index < 3 ? "primary" : "default"}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="body2" fontWeight="medium">
                                          {station.stationName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {station.city}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="right">
                                        <Typography variant="body2" fontWeight="bold">
                                          {station.sessionCount}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="right">
                                        <Typography variant="body2" color="success.main">
                                          {station.completedCount}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="right">
                                        <Chip
                                          label={`${completionRate.toFixed(1)}%`}
                                          size="small"
                                          color={completionRate >= 90 ? "success" : completionRate >= 70 ? "warning" : "error"}
                                        />
                                      </TableCell>
                                      <TableCell align="right">
                                        <Chip
                                          label={completionRate >= 90 ? "Xuất sắc" : completionRate >= 70 ? "Tốt" : "Cần cải thiện"}
                                          size="small"
                                          variant="outlined"
                                          color={completionRate >= 90 ? "success" : completionRate >= 70 ? "info" : "warning"}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReportsAnalytics;
