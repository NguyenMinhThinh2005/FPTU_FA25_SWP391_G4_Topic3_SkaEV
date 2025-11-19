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

const AdvancedAnalytics = () => {
  // States
  const [timeRange, setTimeRange] = useState("30d");
  const [groupBy, setGroupBy] = useState("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Real data from API
  const [revenueData, setRevenueData] = useState([]);
  const [usageData, setUsageData] = useState([]);
  const [stationPerformanceData, setStationPerformanceData] = useState([]);
  const [peakHoursData, setPeakHoursData] = useState([]);
  const [revenueByConnectorData, setRevenueByConnectorData] = useState([]);

  // Fetch all analytics data
  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
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
      if (groupBy && groupBy !== "auto") params.groupBy = groupBy;

      // Fetch data in parallel (including connector-level revenue)
      const [
        revenueResponse,
        usageResponse,
        performanceResponse,
        peakHoursResponse,
        revenueConnectorResponse,
      ] = await Promise.all([
        reportsAPI.getRevenueReports(params),
        reportsAPI.getUsageReports(params),
        reportsAPI.getStationPerformance(),
        reportsAPI.getPeakHours({ 
          dateRange: timeRange === "7d" ? "last7days" : 
                     timeRange === "30d" ? "last30days" : 
                     "last90days",
          ...(groupBy && groupBy !== 'auto' ? { groupBy } : {}),
        }),
        reportsAPI.getRevenueByConnector(params),
      ]);

      setRevenueData(revenueResponse.data || []);
      setUsageData(usageResponse.data || []);
      setStationPerformanceData(performanceResponse.data || []);
      setPeakHoursData(peakHoursResponse.data?.hourlyUsage || []);
      // Normalize revenueByConnector payload: prefer `data` array if present
      const connectorPayload = revenueConnectorResponse?.data?.data || revenueConnectorResponse?.data || revenueConnectorResponse || [];
      setRevenueByConnectorData(connectorPayload);
      
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      setError("Không thể tải dữ liệu phân tích. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [timeRange, groupBy]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Calculate KPIs from loaded data
  const calculateKPIs = () => {
    const totalRevenue = revenueData.reduce((sum, r) => sum + (r.totalRevenue || 0), 0);
    const totalSessions = usageData.reduce((sum, u) => sum + (u.completedSessions || 0), 0);
    const totalBookings = usageData.reduce((sum, u) => sum + (u.totalBookings || 0), 0);
    const totalEnergy = revenueData.reduce((sum, r) => sum + (r.totalEnergySoldKwh || 0), 0);
    const avgUtilization = usageData.length > 0
      ? usageData.reduce((sum, u) => sum + (u.utilizationRatePercent || 0), 0) / usageData.length
      : 0;

    const arps = totalSessions > 0 ? totalRevenue / totalSessions : 0;
    const conversionRate = totalBookings > 0 ? (totalSessions / totalBookings) * 100 : null;

    return {
      totalRevenue,
      totalSessions,
      totalBookings,
      totalEnergy,
      avgUtilization,
      arps,
      conversionRate,
    };
  };

  const kpis = calculateKPIs();

  // Revenue by charging type
  const getRevenueByType = () => {
    // Prefer connector-level revenue if available (authoritative source)
    const typeRevenue = {};

    const normalizeType = (raw) => {
      if (!raw) return "Standard AC";
      let s = String(raw);
      // Replace non-breaking spaces and weird unicode spaces
      s = s.replace(/\u00A0/g, ' ');
      // Remove punctuation except spaces and alphanumerics
      s = s.replace(/[\u2000-\u206F\u2E00-\u2E7F\p{P}\p{S}]+/gu, '');
      // Collapse whitespace
      s = s.replace(/\s+/g, ' ').trim();
      const simple = s.replace(/[^A-Za-z0-9]/g, '').toLowerCase();

      if (/^ccs2?$/.test(simple) || /ccs2?/.test(simple)) return "CCS2";
      if (/chademo/.test(simple) || /chademo/.test(s.toLowerCase())) return "CHAdeMO";
      if (/^type2$/.test(simple) || /type2/.test(simple)) return "Type 2";

      // Title-case remaining normalized string for display
      return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    };

    const connectorArray = Array.isArray(revenueByConnectorData)
      ? revenueByConnectorData
      : (revenueByConnectorData?.data || []);

    if (Array.isArray(connectorArray) && connectorArray.length > 0) {
      connectorArray.forEach(item => {
        const rawType = item.connectorType || item.ConnectorType || item.chargingType || item.name;
        const type = normalizeType(rawType) || "Standard AC";
        if (!typeRevenue[type]) typeRevenue[type] = 0;
        const rev = item.revenue || item.totalRevenue || item.TotalRevenue || 0;
        typeRevenue[type] += rev;
      });
    } else {
      // Fallback to station performance aggregation
      stationPerformanceData.forEach(station => {
        const type = normalizeType(station.chargingType) || "Standard AC";
        if (!typeRevenue[type]) {
          typeRevenue[type] = 0;
        }
        typeRevenue[type] += station.totalRevenue || 0;
      });
    }

    return Object.entries(typeRevenue)
      .map(([name, revenue]) => ({ name, revenue: Number(revenue || 0), value: Number(revenue || 0) }))
      .filter(x => x.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue);
  };

  // Helpers for chart data
  const getRevenueChartData = () => {
    if (Array.isArray(revenueData) && revenueData.length > 0) {
      return revenueData.map(r => ({
        dateLabel: r.label || (r.month ? `${r.month}/${r.year}` : r.date || r.label),
        revenue: r.totalRevenue || r.revenue || 0,
        sessions: r.completedSessions || r.sessions || 0,
      }));
    }
    if (Array.isArray(usageData) && usageData.length > 0) {
      return usageData.map(u => ({
        dateLabel: u.label || (u.month ? `${u.month}/${u.year}` : u.date),
        revenue: u.totalRevenue || 0,
        sessions: u.completedSessions || 0,
      }));
    }
    return [];
  };

  const getSessionsChartData = () => {
    if (Array.isArray(usageData) && usageData.length > 0) {
      return usageData.map(u => ({
        dateLabel: u.label || (u.month ? `${u.month}/${u.year}` : u.date),
        sessions: u.completedSessions || 0,
        utilization: u.utilizationRatePercent || u.utilizationRate || 0,
      }));
    }
    return [];
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
            Phân tích tổng quan
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Báo cáo chi tiết về doanh thu, sử dụng và hiệu suất hệ thống — {getTimeRangeLabel()}
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

              {/* Group By selector for aggregation granularity */}
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Nhóm theo</InputLabel>
                <Select
                  value={groupBy}
                  label="Nhóm theo"
                  onChange={(e) => setGroupBy(e.target.value)}
                >
                  <MenuItem value="auto">Tự động</MenuItem>
                  <MenuItem value="hour">Giờ</MenuItem>
                  <MenuItem value="day">Ngày</MenuItem>
                  <MenuItem value="week">Tuần</MenuItem>
                  <MenuItem value="month">Tháng</MenuItem>
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
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
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
                Xu hướng doanh thu & phiên sạc 
              </Typography>
              <Box sx={{ height: 300 }}>
                {getRevenueChartData().length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={getRevenueChartData()}>
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
                        name="Doanh thu (VND)"
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
                {(() => {
                  const revenueByType = getRevenueByType();
                  const totalInChart = revenueByType.reduce((s, r) => s + (r.revenue || 0), 0);
                  const overallRevenue = kpis.totalRevenue || 0;

                  if (revenueByType.length === 0) {
                    return (
                      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                        <Typography color="text.secondary">Chưa có dữ liệu</Typography>
                      </Box>
                    );
                  }

                  return (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={revenueByType}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                              `${name} (${(percent * 100).toFixed(0)}%)`
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
                          <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>

                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Tổng trong biểu đồ: {formatCurrency(totalInChart)}{
                            overallRevenue ? ` — Tổng báo cáo: ${formatCurrency(overallRevenue)}` : ''
                          }
                        </Typography>
                        {overallRevenue && Math.abs(totalInChart - overallRevenue) > 1 && (
                          <Typography variant="caption" color="error" sx={{ display: 'block' }}>
                            Lưu ý: Tổng theo loại sạc khác tổng báo cáo (chênh lệch {formatCurrency(Math.abs(totalInChart - overallRevenue))}).
                          </Typography>
                        )}
                      </Box>
                    </>
                  );
                })()}
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
                Phân bố sử dụng theo giờ 
              </Typography>
              <Box sx={{ height: 300 }}>
                {peakHoursData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={peakHoursData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="hour" 
                        tickFormatter={(hour) => `${hour}h`}
                      />
                      <YAxis />
                      <RechartsTooltip 
                        labelFormatter={(hour) => `${hour}:00 - ${hour}:59`}
                        formatter={(value) => [`${value} phiên`, "Số phiên sạc"]}
                      />
                      <Bar
                        dataKey="sessionCount"
                        fill={colors.info}
                        name="Phiên sạc"
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
                Năng lượng & Tỷ lệ sử dụng 
              </Typography>
              <Box sx={{ height: 300 }}>
                {getSessionsChartData().length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={getSessionsChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="dateLabel" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <RechartsTooltip formatter={formatTooltipValue} />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="sessions"
                        fill={colors.success}
                        fillOpacity={0.8}
                        name="Phiên hoàn thành"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="utilization"
                        stroke={colors.warning}
                        strokeWidth={3}
                        name="Tỷ lệ sử dụng (%)"
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
