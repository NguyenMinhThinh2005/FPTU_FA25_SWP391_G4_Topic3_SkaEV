import React, { useState, useEffect, useCallback } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  ElectricCar,
  MonetizationOn,
  Battery80,
  Refresh,
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
import { formatCurrency } from "../../utils/helpers";
import reportsAPI from "../../services/api/reportsAPI";

const formatPeriodLabel = (year, month) => {
  if (!year) {
    return "Không xác định";
  }
  if (!month) {
    return `${year}`;
  }
  return `${year}-${String(month).padStart(2, "0")}`;
};

const getPeriodSortKey = (year, month) => {
  if (!year) {
    return "0000-00";
  }
  if (!month) {
    return `${year}-00`;
  }
  return `${year}-${String(month).padStart(2, "0")}`;
};

const AdvancedAnalytics = () => {
  // States
  const [timeRange, setTimeRange] = useState("30d");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Real data from API
  const [revenueData, setRevenueData] = useState([]);
  const [usageData, setUsageData] = useState([]);
  const [stationPerformanceData, setStationPerformanceData] = useState([]);
  const [peakHoursData, setPeakHoursData] = useState([]);

  // Fetch all analytics data
  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("🔄 Fetching analytics data for:", timeRange);
      
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      // Determine date range parameters
      let params = {};
      if (timeRange === "7d") {
        params = { year: currentYear, month: currentMonth };
      } else if (timeRange === "30d") {
        params = { year: currentYear, month: currentMonth };
      } else if (timeRange === "90d") {
        params = { year: currentYear };
      } else if (timeRange === "12m") {
        params = { year: currentYear };
      }

      console.log("📅 API params:", params);

      // Fetch data in parallel
      const [
        revenueResponse,
        usageResponse,
        performanceResponse,
        peakHoursResponse,
      ] = await Promise.all([
        reportsAPI.getRevenueReports(params),
        reportsAPI.getUsageReports(params),
        reportsAPI.getStationPerformance(),
        reportsAPI.getPeakHours({ 
          dateRange: timeRange === "7d" ? "last7days" : 
                     timeRange === "30d" ? "last30days" : 
                     "last90days" 
        }),
      ]);

      console.log("💰 Revenue response:", revenueResponse);
      console.log("⚡ Usage response:", usageResponse);
      console.log("🏆 Performance response:", performanceResponse);
      console.log("📊 Peak hours response:", peakHoursResponse);

      // Parse backend response structure correctly
      // Backend returns: { data: [...], summary: {...} }
      setRevenueData(revenueResponse.data || []);
      setUsageData(usageResponse.data || []);
      setStationPerformanceData(performanceResponse.data || []);
      // Peak hours returns: { data: { hourlyDistribution: [...], peakHour: 9 } }
      setPeakHoursData(peakHoursResponse.data?.hourlyDistribution || []);
      
      console.log("✅ Data loaded successfully");
      console.log("📈 Revenue items:", revenueResponse.data?.length || 0);
      console.log("📊 Usage items:", usageResponse.data?.length || 0);
      console.log("🏆 Performance items:", performanceResponse.data?.length || 0);
      console.log("⏰ Peak hours items:", peakHoursResponse.data?.length || 0);
      
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      setError(
        err?.message ||
          "Không thể tải dữ liệu phân tích. Vui lòng kiểm tra backend, seed dữ liệu báo cáo hoặc thử lại."
      );
      setRevenueData([]);
      setUsageData([]);
      setStationPerformanceData([]);
      setPeakHoursData([]);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Calculate KPIs from real data
  const calculateKPIs = () => {
    const totalRevenue = revenueData.reduce((sum, r) => sum + (r.totalRevenue || 0), 0);
    const totalEnergy = revenueData.reduce((sum, r) => sum + (r.totalEnergySoldKwh || 0), 0);

    const sessionsFromUsage = usageData.reduce((sum, u) => sum + (u.completedSessions || 0), 0);
    const bookingsFromUsage = usageData.reduce((sum, u) => sum + (u.totalBookings || 0), 0);
    const sessionsFromRevenue = revenueData.reduce((sum, r) => sum + (r.totalTransactions || 0), 0);

    const resolvedSessions = sessionsFromUsage > 0 ? sessionsFromUsage : sessionsFromRevenue;
    const resolvedBookings = bookingsFromUsage > 0 ? bookingsFromUsage : Math.max(sessionsFromRevenue, bookingsFromUsage);

    let avgUtilization = 0;
    if (usageData.length > 0) {
      avgUtilization = usageData.reduce((sum, u) => sum + (u.utilizationRatePercent || 0), 0) / usageData.length;
    } else if (stationPerformanceData.length > 0) {
      avgUtilization = stationPerformanceData.reduce((sum, s) => sum + (s.utilizationRate || s.currentOccupancyPercent || 0), 0) / stationPerformanceData.length;
    }

    const halfLength = Math.ceil(revenueData.length / 2);
    const firstHalf = revenueData.slice(0, halfLength);
    const secondHalf = revenueData.slice(halfLength);
    const firstHalfRevenue = firstHalf.reduce((sum, r) => sum + (r.totalRevenue || 0), 0);
    const secondHalfRevenue = secondHalf.reduce((sum, r) => sum + (r.totalRevenue || 0), 0);
    const revenueGrowth = firstHalfRevenue > 0 
      ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100 
      : 0;

    return {
      totalRevenue,
      totalSessions: resolvedSessions,
      totalBookings: resolvedBookings,
      totalEnergy,
      avgUtilization: Math.min(Math.max(avgUtilization, 0), 100),
      revenueGrowth,
    };
  };

  const kpis = calculateKPIs();

  // Transform revenue data for charts (group by day/week/month based on timeRange)
  const getRevenueChartData = () => {
    if (revenueData.length === 0) return [];

    const sortedRevenue = [...revenueData].sort((a, b) =>
      getPeriodSortKey(a.year, a.month).localeCompare(getPeriodSortKey(b.year, b.month))
    );

    return sortedRevenue.map((item) => ({
      label: item.stationName || `Trạm ${item.stationId}`,
      dateLabel: formatPeriodLabel(item.year, item.month),
      revenue: item.totalRevenue || 0,
      energy: item.totalEnergySoldKwh || 0,
      sessions: item.totalTransactions || 0,
    }));
  };

  const getEnergyUtilizationData = () => {
    if (revenueData.length === 0 && usageData.length === 0 && stationPerformanceData.length === 0) {
      return [];
    }

    const stationMap = new Map();

    const ensureStationEntry = (stationId, stationName = null) => {
      if (!stationMap.has(stationId)) {
        stationMap.set(stationId, {
          stationId,
          label: stationName || `Trạm ${stationId}`,
          energy: 0,
          utilizationSamples: [],
        });
      }
      return stationMap.get(stationId);
    };

    revenueData.forEach((item) => {
      const entry = ensureStationEntry(item.stationId, item.stationName);
      entry.energy += item.totalEnergySoldKwh || 0;
    });

    usageData.forEach((item) => {
      const entry = ensureStationEntry(item.stationId, item.stationName);
      if (typeof item.utilizationRatePercent === "number" && !Number.isNaN(item.utilizationRatePercent)) {
        entry.utilizationSamples.push(item.utilizationRatePercent);
      }
    });

    stationPerformanceData.forEach((item) => {
      const entry = ensureStationEntry(item.stationId, item.stationName);
      if (entry.utilizationSamples.length === 0 && typeof item.utilizationRate === "number") {
        entry.utilizationSamples.push(item.utilizationRate);
      }
    });

    return Array.from(stationMap.values())
      .map((entry) => {
        const utilization = entry.utilizationSamples.length > 0
          ? entry.utilizationSamples.reduce((sum, val) => sum + val, 0) / entry.utilizationSamples.length
          : 0;

        return {
          label: entry.label,
          energy: Number(entry.energy.toFixed(2)),
          utilization: Math.min(Math.max(utilization, 0), 100),
        };
      })
      .filter((entry) => entry.energy > 0 || entry.utilization > 0)
      .sort((a, b) => b.energy - a.energy)
      .slice(0, 12);
  };

  // Revenue by charging type
  const getRevenueByType = () => {
    // If we have revenue data, aggregate by station and estimate charging types
    if (revenueData.length === 0) return [];

    // Calculate total revenue by station
    const stationRevenue = {};
    revenueData.forEach(item => {
      const stationId = item.stationId;
      if (!stationRevenue[stationId]) {
        stationRevenue[stationId] = {
          stationName: item.stationName,
          totalRevenue: 0
        };
      }
      stationRevenue[stationId].totalRevenue += item.totalRevenue || 0;
    });

    // Estimate charging types based on station names (temporary solution)
    // In production, this should come from station metadata
    const typeRevenue = {
      "Standard AC": 0,
      "Fast DC": 0,
      "Ultra Fast": 0
    };

    Object.values(stationRevenue).forEach(station => {
      const name = station.stationName.toLowerCase();
      if (name.includes("fast") || name.includes("nhanh")) {
        if (name.includes("ultra") || name.includes("siêu")) {
          typeRevenue["Ultra Fast"] += station.totalRevenue;
        } else {
          typeRevenue["Fast DC"] += station.totalRevenue;
        }
      } else {
        typeRevenue["Standard AC"] += station.totalRevenue;
      }
    });

    return Object.entries(typeRevenue)
      .filter(([, revenue]) => revenue > 0)
      .map(([name, revenue]) => ({
        name,
        revenue,
        value: revenue, // For pie chart percentage
      }));
  };

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

  // Get time range label
  const getTimeRangeLabel = () => {
    switch(timeRange) {
      case "7d": return "7 ngày qua";
      case "30d": return "30 ngày qua";
      case "90d": return "3 tháng qua";
      case "12m": return "12 tháng qua";
      default: return "30 ngày qua";
    }
  };

  // Format tooltip
  const formatTooltipValue = (value, name) => {
    if (name === "revenue" || name.includes("Doanh thu")) return formatCurrency(value);
  if (name === "energy" || name.includes("Năng lượng")) return `${value.toFixed(1)} kWh`;
    if (name === "utilization" || name.includes("Sử dụng")) return `${value.toFixed(1)}%`;
    return value;
  };

  if (loading && revenueData.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }

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
            Báo cáo chi tiết về doanh thu, sử dụng và hiệu suất hệ thống
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          {/* Time Range Selector */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Khoảng thời gian</InputLabel>
            <Select
              value={timeRange}
              label="Khoảng thời gian"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="7d">7 ngày gần đây</MenuItem>
              <MenuItem value="30d">30 ngày gần đây</MenuItem>
              <MenuItem value="90d">3 tháng gần đây</MenuItem>
              <MenuItem value="12m">12 tháng gần đây</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
            onClick={fetchAnalyticsData}
            disabled={loading}
          >
            Làm mới
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

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
                    {kpis.revenueGrowth >= 0 ? (
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
                    Phiên sạc hoàn thành
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {kpis.totalBookings.toLocaleString()} lượt đặt chỗ
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
                    kWh năng lượng cung cấp
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    ≈ {(kpis.totalEnergy * 0.5).toFixed(0)} kg CO₂ tiết kiệm
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
                    Tỷ lệ sử dụng trung bình
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Trong {getTimeRangeLabel().toLowerCase()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Revenue & Sessions Trend */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Xu hướng doanh thu & phiên sạc ({getTimeRangeLabel()})
              </Typography>
              <Box sx={{ height: 350 }}>
                {getRevenueChartData().length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart 
                      data={getRevenueChartData()}
                      margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="label" 
                        angle={-15}
                        textAnchor="end"
                        height={60}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        yAxisId="left" 
                        orientation="left"
                        tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                        tick={{ fontSize: 12 }}
                        label={{ 
                          value: 'Doanh thu (VNĐ)', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { textAnchor: 'middle', fontSize: 12, fill: '#666' }
                        }}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right"
                        tick={{ fontSize: 12 }}
                        label={{ 
                          value: 'Số phiên sạc', 
                          angle: 90, 
                          position: 'insideRight',
                          style: { textAnchor: 'middle', fontSize: 12, fill: '#666' }
                        }}
                      />
                      <RechartsTooltip 
                        formatter={formatTooltipValue}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          padding: '10px'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '10px' }}
                        iconType="rect"
                      />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        fill={colors.primary}
                        fillOpacity={0.2}
                        stroke={colors.primary}
                        strokeWidth={3}
                        name="Doanh thu"
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="sessions"
                        fill={colors.secondary}
                        name="Số phiên sạc"
                        radius={[4, 4, 0, 0]}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                    <Typography color="text.secondary">Chưa có dữ liệu</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Revenue by Charging Type */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Doanh thu theo loại sạc
              </Typography>
              <Box sx={{ height: 300 }}>
                {getRevenueByType().length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getRevenueByType()}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ percent }) =>
                          `${(percent * 100).toFixed(1)}%`
                        }
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getRevenueByType().map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={pieColors[index % pieColors.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value, name, props) => [
                          formatCurrency(value),
                          props.payload.name
                        ]} 
                      />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        wrapperStyle={{ paddingTop: "20px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                    <Typography color="text.secondary">Chưa có dữ liệu</Typography>
                  </Box>
                )}
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
                Phân bố sử dụng theo giờ trong ngày
              </Typography>
              <Box sx={{ height: 320 }}>
                {peakHoursData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={peakHoursData}
                      margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="hour" 
                        tickFormatter={(hour) => `${hour}h`}
                        tick={{ fontSize: 12 }}
                        interval={1}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <RechartsTooltip 
                        labelFormatter={(hour) => `Khung giờ ${hour}:00 - ${hour}:59`}
                        formatter={(value) => [value, "Số phiên sạc"]}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          padding: '10px'
                        }}
                      />
                      <Bar
                        dataKey="sessionCount"
                        fill={colors.info}
                        name="Số phiên sạc"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                    <Typography color="text.secondary">Chưa có dữ liệu</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Energy & Utilization */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Năng lượng & Tỷ lệ sử dụng ({getTimeRangeLabel()})
              </Typography>
              <Box sx={{ height: 320 }}>
                {getEnergyUtilizationData().length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart 
                      data={getEnergyUtilizationData()}
                      margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="dateLabel" 
                        angle={-15}
                        textAnchor="end"
                        height={60}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        yAxisId="left"
                        tick={{ fontSize: 12 }}
                        label={{ 
                          value: 'Năng lượng (kWh)', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { textAnchor: 'middle', fontSize: 12, fill: '#666' }
                        }}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right"
                        tickFormatter={(value) => `${value.toFixed(0)}%`}
                        tick={{ fontSize: 12 }}
                        label={{ 
                          value: 'Tỷ lệ sử dụng (%)', 
                          angle: 90, 
                          position: 'insideRight',
                          style: { textAnchor: 'middle', fontSize: 12, fill: '#666' }
                        }}
                      />
                      <RechartsTooltip 
                        formatter={formatTooltipValue}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          padding: '10px'
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px' }} />
                      <Bar
                        yAxisId="left"
                        dataKey="energy"
                        fill={colors.success}
                        name="Năng lượng (kWh)"
                        radius={[4, 4, 0, 0]}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="utilization"
                        stroke={colors.warning}
                        strokeWidth={3}
                        name="Tỷ lệ sử dụng (%)"
                        dot={{ r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                    <Typography color="text.secondary">Chưa có dữ liệu</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Station Performance Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Bảng xếp hạng hiệu suất trạm sạc (Top 10)
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Xếp hạng</TableCell>
                  <TableCell>Trạm sạc</TableCell>
                  <TableCell align="center">Doanh thu</TableCell>
                  <TableCell align="center">Năng lượng (kWh)</TableCell>
                  <TableCell align="center">Phiên sạc</TableCell>
                  <TableCell align="center">Tỷ lệ sử dụng</TableCell>
                  <TableCell align="center">Trạng thái</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stationPerformanceData.length > 0 ? (
                  stationPerformanceData
                    .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
                    .slice(0, 10)
                    .map((station, index) => (
                      <TableRow key={station.stationId} hover>
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
                                {station.stationName || `Trạm ${station.stationId}`}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {station.stationId}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(station.totalRevenue || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {(station.totalEnergyDelivered || 0).toFixed(1)}
                        </TableCell>
                        <TableCell align="center">
                          {station.completedSessions || 0}
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ minWidth: 60 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(station.utilizationRate || 0, 100)}
                              sx={{ mb: 0.5 }}
                            />
                            <Typography variant="caption">
                              {(station.utilizationRate || 0).toFixed(1)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={station.status === "active" ? "Hoạt động" : "Không hoạt động"}
                            color={
                              station.status === "active" ? "success" : "error"
                            }
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary">Chưa có dữ liệu</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdvancedAnalytics;
