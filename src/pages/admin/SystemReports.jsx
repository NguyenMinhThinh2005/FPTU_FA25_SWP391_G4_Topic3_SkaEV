import React, { useState } from "react";
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

// Mock data for reports
const mockRevenueData = [
  { month: "Jan", revenue: 125000000, sessions: 1200, users: 450 },
  { month: "Feb", revenue: 142000000, sessions: 1350, users: 520 },
  { month: "Mar", revenue: 158000000, sessions: 1480, users: 600 },
  { month: "Apr", revenue: 175000000, sessions: 1620, users: 680 },
  { month: "May", revenue: 192000000, sessions: 1750, users: 750 },
  { month: "Jun", revenue: 210000000, sessions: 1890, users: 820 },
];

const mockStationUsage = [
  { name: "Vincom Royal City", usage: 85, sessions: 340, revenue: 45000000 },
  { name: "AEON Mall Long Biên", usage: 92, sessions: 410, revenue: 52000000 },
  { name: "Lotte Center", usage: 78, sessions: 290, revenue: 38000000 },
  { name: "BigC Thăng Long", usage: 65, sessions: 220, revenue: 28000000 },
  { name: "Vincom Times City", usage: 88, sessions: 380, revenue: 48000000 },
];

const mockUserGrowth = [
  { category: "New Customers", value: 1250, color: "#8884d8" },
  { category: "Active Stations", value: 85, color: "#82ca9d" },
  { category: "Staff Members", value: 42, color: "#ffc658" },
  { category: "Returning Users", value: 3200, color: "#ff7300" },
];

const mockSystemHealth = [
  { metric: "System Uptime", value: 99.8, status: "excellent" },
  {
    metric: "Average Response Time",
    value: 1.2,
    unit: "seconds",
    status: "good",
  },
  { metric: "Error Rate", value: 0.02, unit: "%", status: "excellent" },
  { metric: "Station Availability", value: 96.5, unit: "%", status: "good" },
  {
    metric: "Payment Success Rate",
    value: 99.1,
    unit: "%",
    status: "excellent",
  },
];

const AdminSystemReports = () => {
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState("last30days");

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

  const handleExportReport = () => {
    console.log("Exporting report...");
    // Here you would implement the export functionality
  };

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
            <Button startIcon={<Download />} onClick={handleExportReport}>
              Xuất báo cáo
            </Button>
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
                    {formatCurrency(210000000)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Doanh thu tháng
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <TrendingUp sx={{ color: "success.main", mr: 1 }} />
                <Typography variant="body2" color="success.main">
                  +12.5% so với tháng trước
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
                    1,890
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Phiên sạc
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <TrendingUp sx={{ color: "success.main", mr: 1 }} />
                <Typography variant="body2" color="success.main">
                  +8.2% so với tháng trước
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
                    4,577
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng người dùng
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <TrendingUp sx={{ color: "success.main", mr: 1 }} />
                <Typography variant="body2" color="success.main">
                  +15.3% so với tháng trước
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
                    127
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Trạm đang hoạt động
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <TrendingUp sx={{ color: "success.main", mr: 1 }} />
                <Typography variant="body2" color="success.main">
                  +5 trạm mới
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
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Xu hướng doanh thu (6 tháng gần nhất)
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={mockRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip
                      formatter={(value, name) => [
                        name === "revenue" ? formatCurrency(value) : value,
                        name === "revenue" ? "Doanh thu" : "Phiên truy cập",
                      ]}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="Doanh thu"
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
                  <LineChart data={mockRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="Phiên truy cập"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="Người dùng"
                      stroke="#82ca9d"
                      strokeWidth={2}
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
                  Hiệu suất trạm
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Tên trạm</TableCell>
                        <TableCell align="center">Tỷ lệ sử dụng</TableCell>
                        <TableCell align="center">Phiên</TableCell>
                        <TableCell align="center">Doanh thu</TableCell>
                        <TableCell align="center">Trạng thái</TableCell>
                        <TableCell align="center">Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mockStationUsage.map((station, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <LocationOn
                                sx={{ mr: 1, color: "text.secondary" }}
                              />
                              {station.name}
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
                                value={station.usage}
                                sx={{
                                  width: 60,
                                  height: 6,
                                  borderRadius: 3,
                                  mr: 1,
                                }}
                              />
                              <Typography variant="body2">
                                {station.usage}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            {station.sessions}
                          </TableCell>
                          <TableCell align="center">
                            {formatCurrency(station.revenue)}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={
                                station.usage > 80
                                  ? "Sử dụng cao"
                                  : station.usage > 60
                                  ? "Sử dụng bình thường"
                                  : "Sử dụng thấp"
                              }
                              color={
                                station.usage > 80
                                  ? "success"
                                  : station.usage > 60
                                  ? "info"
                                  : "warning"
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Xem chi tiết">
                              <IconButton size="small">
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
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
                  Phân tích người dùng
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={mockUserGrowth}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {mockUserGrowth.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Thống kê người dùng
                </Typography>
                {mockUserGrowth.map((item, index) => (
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
                          Math.max(...mockUserGrowth.map((u) => u.value))) *
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
              Các chỉ số tình trạng hệ thống được cập nhật theo thời gian thực.
              Tất cả các giá trị hiển thị là dữ liệu mới nhất từ lần kiểm tra hệ
              thống gần nhất.
            </Alert>
          </Grid>

          {mockSystemHealth.map((metric, index) => (
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
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default AdminSystemReports;
