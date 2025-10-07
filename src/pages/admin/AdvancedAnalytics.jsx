import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  IconButton,
  Menu,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import {
  Analytics as AnalyticsIcon,
  TrendingUp,
  TrendingDown,
  ElectricCar,
  LocationOn,
  People,
  MonetizationOn,
  Schedule,
  Battery80,
  Download,
  FilterList,
  Refresh,
  MoreVert,
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
  ComposedChart,
} from "recharts";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import useStationStore from "../../store/stationStore";
import { mockData } from "../../data/mockData";
import { formatCurrency, formatDate } from "../../utils/helpers";

const AdvancedAnalytics = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { stations } = useStationStore();
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedMetric, setSelectedMetric] = useState("revenue");
  const [anchorEl, setAnchorEl] = useState(null);

  // Generate mock analytics data
  const generateAnalyticsData = () => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      data.push({
        date: date.toISOString().split("T")[0],
        dateLabel: date.toLocaleDateString("vi-VN", {
          month: "short",
          day: "numeric",
        }),
        revenue: Math.random() * 2000000 + 500000,
        sessions: Math.floor(Math.random() * 50) + 20,
        energy: Math.random() * 500 + 200,
        users: Math.floor(Math.random() * 30) + 10,
        utilization: Math.random() * 40 + 40,
        avgSessionTime: Math.random() * 60 + 30,
      });
    }

    return data;
  };

  const [analyticsData, setAnalyticsData] = useState(generateAnalyticsData());

  useEffect(() => {
    setAnalyticsData(generateAnalyticsData());
  }, [timeRange]);

  // Calculate KPIs
  const calculateKPIs = () => {
    const totalRevenue = analyticsData.reduce(
      (sum, day) => sum + day.revenue,
      0
    );
    const totalSessions = analyticsData.reduce(
      (sum, day) => sum + day.sessions,
      0
    );
    const totalEnergy = analyticsData.reduce((sum, day) => sum + day.energy, 0);
    const avgUtilization =
      analyticsData.reduce((sum, day) => sum + day.utilization, 0) /
      analyticsData.length;

    // Calculate growth (comparing first and last week)
    const halfLength = Math.floor(analyticsData.length / 2);
    const firstHalf = analyticsData.slice(0, halfLength);
    const secondHalf = analyticsData.slice(halfLength);

    const firstHalfRevenue = firstHalf.reduce(
      (sum, day) => sum + day.revenue,
      0
    );
    const secondHalfRevenue = secondHalf.reduce(
      (sum, day) => sum + day.revenue,
      0
    );
    const revenueGrowth =
      ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100;

    return {
      totalRevenue,
      totalSessions,
      totalEnergy,
      avgUtilization,
      revenueGrowth,
    };
  };

  const kpis = calculateKPIs();

  // Station performance data
  const stationPerformance = stations
    .map((station) => {
      const stationBookings = mockData.bookings.filter(
        (b) => b.stationId === station.id
      );
      const revenue = stationBookings.reduce((sum, b) => sum + b.cost, 0);
      const sessions = stationBookings.length;
      const utilization =
        ((station.charging.totalPorts - station.charging.availablePorts) /
          station.charging.totalPorts) *
        100;

      return {
        ...station,
        revenue,
        sessions,
        utilization: utilization || 0,
        efficiency: Math.random() * 20 + 80, // Mock efficiency score
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  

  // Chart colors
  const colors = {
    primary: "#1379FF",
    secondary: "#B5FF3D",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
  };

  const pieColors = [
    "#1379FF",
    "#B5FF3D",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
  ];

  // Usage by hour data
  const usageByHour = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    hourLabel: `${i.toString().padStart(2, "0")}:00`,
    sessions: Math.floor(Math.random() * 20) + 5,
    peak: i >= 8 && i <= 18, // Peak hours 8 AM - 6 PM
  }));

  // Revenue by station type
  const revenueByType = [
    { name: "Fast DC", value: 45, revenue: 2500000 },
    { name: "Standard AC", value: 35, revenue: 1800000 },
    { name: "Ultra Fast", value: 20, revenue: 3200000 },
  ];

  const formatTooltipValue = (value, name) => {
    if (name === "revenue") return formatCurrency(value);
    if (name === "energy") return `${value.toFixed(1)} kWh`;
    if (name === "utilization") return `${value.toFixed(1)}%`;
    return value;
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Phân tích nâng cao 📊
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Thông tin chi tiết về hiệu suất mạng lưới sạc xe điện của bạn
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          {/* Time Range Selector */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Khoảng thời gian</InputLabel>
            <Select
              value={timeRange}
              label="Khoảng thời gian"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="7d">7 ngày qua</MenuItem>
              <MenuItem value="30d">30 ngày qua</MenuItem>
              <MenuItem value="90d">90 ngày qua</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => console.log("Export report")}
          >
            Xuất báo cáo
          </Button>

          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={() => setAnalyticsData(generateAnalyticsData())}
          >
            Làm mới
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "linear-gradient(135deg, #1379FF 0%, #0D5FDD 100%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                  <MonetizationOn />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(kpis.totalRevenue)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Tổng doanh thu
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      mt: 0.5,
                    }}
                  >
                    {kpis.revenueGrowth > 0 ? (
                      <TrendingUp sx={{ fontSize: 16 }} />
                    ) : (
                      <TrendingDown sx={{ fontSize: 16 }} />
                    )}
                    <Typography variant="caption">
                      {Math.abs(kpis.revenueGrowth).toFixed(1)}% so với kỳ trước
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                  <ElectricCar />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {kpis.totalSessions.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Phiên sạc
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {(kpis.totalSessions / analyticsData.length).toFixed(0)} trung bình mỗi ngày
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                  <Battery80 />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {kpis.totalEnergy.toFixed(0)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    kWh đã cung cấp
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {(kpis.totalEnergy * 0.5).toFixed(0)} kg CO₂ đã tiết kiệm
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {kpis.avgUtilization.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Sử dụng trung bình
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Hiệu suất mạng lưới
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Revenue Trend */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Xu hướng doanh thu & phiên sạc
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dateLabel" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <RechartsTooltip formatter={formatTooltipValue} />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      fill={colors.primary}
                      fillOpacity={0.3}
                      stroke={colors.primary}
                      strokeWidth={2}
                      name="Doanh thu"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="sessions"
                      fill={colors.secondary}
                      name="Phiên sạc"
                      opacity={0.8}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Revenue by Station Type */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Doanh thu theo loại trạm
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {revenueByType.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={pieColors[index % pieColors.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value, name) => [
                        formatCurrency(
                          revenueByType.find((r) => r.name === name)?.revenue ||
                            0
                        ),
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      

      {/* Charts Row 2 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Usage by Hour */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Mẫu sử dụng theo giờ
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageByHour}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hourLabel" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar
                      dataKey="sessions"
                      fill={colors.info}
                      name="Phiên sạc"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Energy & Utilization */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Năng lượng cung cấp & Sử dụng
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dateLabel" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <RechartsTooltip formatter={formatTooltipValue} />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="energy"
                      fill={colors.success}
                      fillOpacity={0.3}
                      stroke={colors.success}
                      name="Năng lượng (kWh)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="utilization"
                      stroke={colors.warning}
                      strokeWidth={3}
                      name="Sử dụng (%)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Station Performance Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Bảng xếp hạng hiệu suất trạm sạc
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Xếp hạng</TableCell>
                  <TableCell>Trạm sạc</TableCell>
                  <TableCell align="center">Doanh thu</TableCell>
                  <TableCell align="center">Phiên</TableCell>
                  <TableCell align="center">Sử dụng</TableCell>
                  <TableCell align="center">Hiệu suất</TableCell>
                  <TableCell align="center">Trạng thái</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stationPerformance.slice(0, 5).map((station, index) => (
                  <TableRow key={station.id} hover>
                    <TableCell>
                      <Chip
                        label={`#${index + 1}`}
                        color={
                          index === 0
                            ? "primary"
                            : index === 1
                            ? "secondary"
                            : "default"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: "primary.main",
                            width: 32,
                            height: 32,
                          }}
                        >
                          <ElectricCar sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {station.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {station.location.address}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(station.revenue)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">{station.sessions}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ minWidth: 60 }}>
                        <LinearProgress
                          variant="determinate"
                          value={station.utilization}
                          sx={{ mb: 0.5 }}
                        />
                        <Typography variant="caption">
                          {station.utilization.toFixed(0)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${station.efficiency.toFixed(0)}%`}
                        color={
                          station.efficiency > 90
                            ? "success"
                            : station.efficiency > 80
                            ? "warning"
                            : "error"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={station.status}
                        color={
                          station.status === "active" ? "success" : "error"
                        }
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdvancedAnalytics;
