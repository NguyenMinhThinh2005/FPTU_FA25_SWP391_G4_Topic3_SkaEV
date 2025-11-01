import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  Assessment,
  TrendingUp,
  TrendingDown,
  ElectricCar,
  LocationOn,
  People,
  MonetizationOn,
  Download,
  Refresh,
  FilterList,
  Visibility,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import reportsAPI from "../../services/api/reportsAPI";
import statisticsAPI from "../../services/api/statisticsAPI";

const AdminSystemReports = () => {
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

  const getStatusColor = (status) => {
    switch (status) {
      case "excellent":
        return "success";
      case "good":
        return "info";
      case "warning":
        return "warning";
      case "critical":
        return "error";
      default:
        return "default";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handleExportReport = async () => {
    try {
      await reportsAPI.exportRevenueReport({ dateRange });
    } catch (error) {
      console.error("Error exporting report:", error);
    }
  };

  if (loading && !dashboardStats) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h4" fontWeight="bold">
            Báo cáo hệ thống
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Khoảng thời gian</InputLabel>
              <Select
                value={dateRange}
                label="Khoảng thời gian"
                onChange={(e) => setDateRange(e.target.value)}
              >
                <MenuItem value="last7days">7 ngày qua</MenuItem>
                <MenuItem value="last30days">30 ngày qua</MenuItem>
                <MenuItem value="last3months">3 tháng qua</MenuItem>
                <MenuItem value="last6months">6 tháng qua</MenuItem>
                <MenuItem value="lastyear">Năm qua</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              startIcon={<Refresh />}
              onClick={() => window.location.reload()}
            >
              Làm mới
            </Button>
          </Box>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Báo cáo tổng hợp dữ liệu và hiệu suất hoạt động của hệ thống
        </Typography>
      </Box>

      {/* Key Performance Indicators */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
                  <MonetizationOn />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {revenueData.length > 0 
                      ? formatCurrency(revenueData[revenueData.length - 1]?.revenue || 0)
                      : formatCurrency(0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Doanh thu tháng
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <TrendingUp sx={{ color: "success.main", mr: 1 }} />
                <Typography variant="body2" color="success.main">
                  Theo dữ liệu thực
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar sx={{ bgcolor: "success.main", mr: 2 }}>
                  <ElectricCar />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {dashboardStats?.bookings?.total || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng booking
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Hoàn thành: {dashboardStats?.bookings?.completed || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar sx={{ bgcolor: "info.main", mr: 2 }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {dashboardStats?.users?.total || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng người dùng
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Khách hàng: {dashboardStats?.users?.customers || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar sx={{ bgcolor: "warning.main", mr: 2 }}>
                  <LocationOn />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {dashboardStats?.stations?.active || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Trạm đang hoạt động
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Tổng: {dashboardStats?.stations?.total || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Phân tích doanh thu" />
          <Tab label="Hiệu suất trạm" />
          <Tab label="Phân tích người dùng" />
          <Tab label="Tình trạng hệ thống" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    Xu hướng doanh thu (theo thời gian)
                  </Typography>
                  <Button
                    startIcon={<Download />}
                    variant="outlined"
                    onClick={handleExportReport}
                  >
                    Xuất báo cáo
                  </Button>
                </Box>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip
                      formatter={(value, name) => [
                        name === "revenue" ? formatCurrency(value) : value,
                        name === "revenue" ? "Doanh thu" : "Số phiên",
                      ]}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                      name="Doanh thu"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Biểu đồ phiên truy cập và người dùng
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sessions"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="Phiên truy cập"
                    />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      name="Người dùng"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Phân tích doanh thu
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Phí sạc (85%)
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={85}
                    sx={{ height: 8, borderRadius: 4, mb: 1 }}
                  />

                  <Typography variant="body2" gutterBottom>
                    Phí thuê bao (10%)
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={10}
                    sx={{ height: 8, borderRadius: 4, mb: 1 }}
                  />

                  <Typography variant="body2" gutterBottom>
                    Doanh thu từ đối tác (5%)
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={5}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Hiệu suất trạm (Dữ liệu thật)
                </Typography>
                {loading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : stationUsage.length === 0 ? (
                  <Alert severity="info">Chưa có dữ liệu sử dụng trạm trong khoảng thời gian này</Alert>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Tên trạm</TableCell>
                          <TableCell align="center">Tỷ lệ sử dụng</TableCell>
                          <TableCell align="center">Tổng booking</TableCell>
                          <TableCell align="center">Hoàn thành</TableCell>
                          <TableCell align="center">Trạng thái</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stationUsage.map((station, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Box sx={{ display: "flex", alignItems: "center" }}>
                                <LocationOn
                                  sx={{ mr: 1, color: "text.secondary" }}
                                />
                                {station.stationName}
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(station.utilizationRate || 0, 100)}
                                  sx={{
                                    width: 60,
                                    height: 6,
                                    borderRadius: 3,
                                    mr: 1,
                                  }}
                                />
                                <Typography variant="body2">
                                  {(station.utilizationRate || 0).toFixed(1)}%
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              {station.totalBookings}
                            </TableCell>
                            <TableCell align="center">
                              {station.completedSessions}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={
                                  station.utilizationRate > 80
                                    ? "Sử dụng cao"
                                    : station.utilizationRate > 60
                                    ? "Sử dụng bình thường"
                                    : "Sử dụng thấp"
                                }
                                color={
                                  station.utilizationRate > 80
                                    ? "success"
                                    : station.utilizationRate > 60
                                    ? "info"
                                    : "warning"
                                }
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Phân tích người dùng (Dữ liệu thật)
                </Typography>
                {loading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={userGrowth}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ category, value }) => `${category}: ${value}`}
                      >
                        {userGrowth.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Thống kê người dùng
                </Typography>
                {userGrowth.map((item, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">{item.category}</Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {item.value.toLocaleString()}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={
                        (item.value /
                          Math.max(...userGrowth.map((u) => u.value))) *
                        100
                      }
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: `${item.color}20`,
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: item.color,
                        },
                      }}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Các chỉ số tình trạng hệ thống được cập nhật theo thời gian thực từ database.
              Tất cả các giá trị hiển thị là dữ liệu thật từ lần kiểm tra hệ thống gần nhất.
            </Alert>
          </Grid>

          {loading ? (
            <Grid item xs={12}>
              <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                <CircularProgress />
              </Box>
            </Grid>
          ) : systemHealth.length === 0 ? (
            <Grid item xs={12}>
              <Alert severity="warning">Không thể tải dữ liệu sức khỏe hệ thống</Alert>
            </Grid>
          ) : (
            systemHealth.map((metric, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold">
                        {metric.metric}
                      </Typography>
                      <Chip
                        label={metric.status}
                        color={getStatusColor(metric.status)}
                        size="small"
                      />
                    </Box>
                    <Typography
                      variant="h3"
                      fontWeight="bold"
                      color="primary.main"
                      gutterBottom
                    >
                      {metric.value}
                      {metric.unit || ""}
                    </Typography>
                    {metric.status === "excellent" && (
                      <Typography variant="body2" color="success.main">
                        ✓ Hoạt động trong tham số tối ưu
                      </Typography>
                    )}
                    {metric.status === "good" && (
                      <Typography variant="body2" color="info.main">
                        → Hiệu suất ổn định
                      </Typography>
                    )}
                    {metric.status === "warning" && (
                      <Typography variant="body2" color="warning.main">
                        ⚠ Cần chú ý
                      </Typography>
                    )}
                    {metric.status === "critical" && (
                      <Typography variant="body2" color="error.main">
                        ✕ Cần can thiệp ngay
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}
    </Box>
  );
};

export default AdminSystemReports;
