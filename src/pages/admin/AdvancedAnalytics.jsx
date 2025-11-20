import React, { useState, useEffect, useCallback } from "react";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
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
  TableFooter,
  TableRow,
  LinearProgress,
  CircularProgress,
  Alert,
  TextField,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  ElectricCar,
  MonetizationOn,
  Battery80,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
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

// getPeriodSortKey removed — we now aggregate by `dateLabel` and sort by that string.

const AdvancedAnalytics = () => {
  // States
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // lastRange removed; UI no longer shows explicit date caption
  // dateMode is fixed to 'day' by UX decision (selector removed)
  const dateMode = 'day'; // 'day' | 'month' | 'year'
  const [selectedFrom, setSelectedFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 29); d.setHours(0,0,0,0); return d; });
  const [selectedTo, setSelectedTo] = useState(() => { const d = new Date(); d.setHours(23,59,59,999); return d; });

  // Real data from API
  const [revenueData, setRevenueData] = useState([]);
  const [usageData, setUsageData] = useState([]);
  const [stationPerformanceData, setStationPerformanceData] = useState([]);
  const [peakHoursData, setPeakHoursData] = useState([]);
  // Revenue broken down by connector type (from backend)
  const [revenueByConnectorData, setRevenueByConnectorData] = useState([]);

  // Fetch all analytics data
  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      

      // Build ISO start/end timestamps from user-selected date pickers and dateMode
      let from = selectedFrom ? new Date(selectedFrom) : null;
      let to = selectedTo ? new Date(selectedTo) : null;

      if (dateMode === 'day') {
        if (!from) { from = new Date(); from.setDate(from.getDate() - 29); }
        from.setHours(0,0,0,0);
        if (!to) { to = new Date(); }
        to.setHours(23,59,59,999);
      } else if (dateMode === 'month') {
        if (!from) from = new Date();
        from = new Date(from.getFullYear(), from.getMonth(), 1, 0, 0, 0, 0);
        if (!to) to = new Date();
        to = new Date(to.getFullYear(), to.getMonth() + 1, 0, 23, 59, 59, 999);
      } else if (dateMode === 'year') {
        if (!from) from = new Date();
        from = new Date(from.getFullYear(), 0, 1, 0, 0, 0, 0);
        if (!to) to = new Date();
        to = new Date(to.getFullYear(), 11, 31, 23, 59, 59, 999);
      }

      if (from && to && from > to) {
        const tmp = from; from = to; to = tmp;
      }

      const paramsWithTimestamps = {
        startDate: from ? from.toISOString() : undefined,
        endDate: to ? to.toISOString() : undefined,
        granularity: dateMode === 'day' ? 'daily' : dateMode === 'month' ? 'monthly' : 'yearly'
      };
      // compute a sensible peak-hours dateRange string for the API based on the selected window
      const msPerDay = 24 * 60 * 60 * 1000;
      const diffDays = from && to ? Math.ceil((to - from) / msPerDay) + 1 : 30;
      const peakDateRange = diffDays <= 7 ? 'last7days' : diffDays <= 30 ? 'last30days' : 'last90days';

      // Fetch data in parallel. Include connector breakdown (DB-backed) explicitly.
      const [
        revenueResponse,
        usageResponse,
        performanceResponse,
        peakHoursResponse,
        revenueByConnectorResponse,
      ] = await Promise.all([
        reportsAPI.getRevenueReports(paramsWithTimestamps),
        reportsAPI.getUsageReports(paramsWithTimestamps),
        reportsAPI.getStationPerformance(),
        reportsAPI.getPeakHours({ dateRange: peakDateRange }),
        reportsAPI.getRevenueByConnector(paramsWithTimestamps),
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
    // If backend returns summary/data envelope, normalize to `revenueByConnectorData` array
    const connectorData = revenueByConnectorResponse?.data || revenueByConnectorResponse || [];
    setRevenueByConnectorData(connectorData);
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
  }, [selectedFrom, selectedTo]);

  // compute rangeDays derived from selectedFrom/selectedTo for conditional UI logic
  const computeRangeDays = () => {
    const from = selectedFrom ? new Date(selectedFrom) : null;
    const to = selectedTo ? new Date(selectedTo) : null;
    if (!from || !to) return 30;
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.ceil((to - from) / msPerDay) + 1;
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Calculate KPIs from real data
  const calculateKPIs = () => {
    // Prefer server-side aggregated station performance data when available
    const stationRevenueSum = stationPerformanceData.reduce((sum, s) => sum + (s.totalRevenue || 0), 0);
    const stationEnergySum = stationPerformanceData.reduce((sum, s) => sum + (s.totalEnergyDelivered || 0), 0);
    const stationSessionsSum = stationPerformanceData.reduce((sum, s) => sum + (s.completedSessions || 0), 0);

    const totalRevenueFromRevenueData = revenueData.reduce((sum, r) => sum + (r.totalRevenue || 0), 0);
    const totalEnergyFromRevenueData = revenueData.reduce((sum, r) => sum + (r.totalEnergySoldKwh || 0), 0);

    // Use stationPerformanceData (which reflects per-station revenues shown in the table)
    // as the authoritative source for KPI totals when available to keep the card in sync
    // with the station list below.
    const totalRevenue = stationPerformanceData.length > 0 ? stationRevenueSum : totalRevenueFromRevenueData;
    const totalEnergy = stationPerformanceData.length > 0 ? stationEnergySum : totalEnergyFromRevenueData;

    const sessionsFromUsage = usageData.reduce((sum, u) => sum + (u.completedSessions || 0), 0);
    const bookingsFromUsage = usageData.reduce((sum, u) => sum + (u.totalBookings || 0), 0);
    const sessionsFromRevenue = revenueData.reduce((sum, r) => sum + (r.totalTransactions || 0), 0);

    const resolvedSessions = stationPerformanceData.length > 0
      ? stationSessionsSum
      : sessionsFromUsage > 0
      ? sessionsFromUsage
      : sessionsFromRevenue;

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

  // Enrich KPIs with ARPS and conversion rate safely
  const baseKpis = calculateKPIs();
  const enrichedKPIs = {
    ...baseKpis,
    arps: baseKpis.totalSessions > 0 ? baseKpis.totalRevenue / baseKpis.totalSessions : 0,
    conversionRate:
      baseKpis.totalBookings > 0 ? (baseKpis.totalSessions / baseKpis.totalBookings) * 100 : null,
  };

  const kpis = enrichedKPIs;

  // (revenueByTypeData and tableTotals are computed after helper functions are defined)

  // Transform revenue data for charts (group by day/week/month based on timeRange)
  const getRevenueChartData = () => {
    // Aggregate revenueData into a true time-series by period (year-month or year)
    if (revenueData.length === 0) return [];
    const grouped = {};

    revenueData.forEach((item) => {
      // Prefer server-provided dateLabel (human) or ISO date. Fall back to year/month.
      const isoDate = item.date || item.dateIso || item.dateLabelIso;
      const dateLabel = item.dateLabel
        || (isoDate ? new Date(isoDate).toLocaleDateString() : formatPeriodLabel(item.year, item.month));

  // Use an internal sort key that prefers ISO dates when available for correct ordering
  const _sortKey = isoDate || (item.year ? `${item.year}-${String(item.month || 1).padStart(2, "0")}-01` : dateLabel);

        if (!grouped[_sortKey]) grouped[_sortKey] = { dateLabel, _sortKey, revenue: 0, sessions: 0, energy: 0 };
        grouped[_sortKey].revenue += item.totalRevenue || 0;
        grouped[_sortKey].sessions += item.totalTransactions || 0;
        grouped[_sortKey].energy += item.totalEnergySoldKwh || 0;
    });

    const rows = Object.values(grouped)
      .sort((a, b) => (a._sortKey > b._sortKey ? 1 : a._sortKey < b._sortKey ? -1 : 0))
      .map((v) => {
        const { _sortKey, dateLabel, ...rest } = v;
        // Provide an ISO date for reliable sorting/formatting in charts. If the source
        // provided an ISO date we already used it as _sortKey; otherwise _sortKey is
        // YYYY-MM-01 for monthly aggregates and is safe to use as an ISO anchor.
        const dateISO = v._sortKey && !isNaN(Date.parse(v._sortKey))
          ? new Date(v._sortKey).toISOString()
          : null;
        return { dateLabel, dateISO, ...rest };
      });

    return rows;
  };

  // Determine whether the series is daily or monthly (or mixed). Uses dateISO where
  // available; falls back to inspecting dateLabel patterns.
  const detectGranularity = (series) => {
    if (!series || series.length < 2) return 'daily';
    const dates = series
      .map((s) => s.dateISO && !isNaN(Date.parse(s.dateISO)) ? new Date(s.dateISO) : null)
      .filter(Boolean);
    if (dates.length < 2) {
      // try to infer from dateLabel strings (YYYY-MM format)
      const monthlyLike = series.every((s) => /^\d{4}-\d{2}/.test(s.dateLabel));
      return monthlyLike ? 'monthly' : 'daily';
    }
    // compute average gap in days
    let totalGap = 0;
    let gaps = 0;
    for (let i = 1; i < dates.length; i++) {
      const diffDays = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
      totalGap += Math.abs(diffDays);
      gaps++;
    }
    const avgGap = totalGap / Math.max(1, gaps);
    if (avgGap > 25) return 'monthly';
    return 'daily';
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
  // revenueByConnectorData will be filled from backend; keep a lightweight fallback
  // that groups by connectorType if the server doesn't return connector-level data.

  const getRevenueByType = () => {
    if (revenueByConnectorData && revenueByConnectorData.length > 0) {
      return revenueByConnectorData.map((r) => ({
        name: r.connectorType || r.connector || 'Unknown',
        revenue: r.totalRevenue || 0,
        value: r.totalRevenue || 0,
      }));
    }

    // Fallback: if backend didn't supply connector data, try grouping revenueData by
    // station metadata connectorTypes where available. This is a light best-effort
    // fallback and should rarely be used when DB is populated.
    if (revenueData.length === 0) return [];

    const connectorAgg = {};
    revenueData.forEach((item) => {
      const connectors = item.connectorTypes || item.stationConnectorTypes || [];
      if (Array.isArray(connectors) && connectors.length > 0) {
        connectors.forEach((c) => {
          const key = c || 'Unknown';
          connectorAgg[key] = (connectorAgg[key] || 0) + (item.totalRevenue || 0);
        });
      } else {
        connectorAgg['Unknown'] = (connectorAgg['Unknown'] || 0) + (item.totalRevenue || 0);
      }
    });

    return Object.entries(connectorAgg).map(([name, revenue]) => ({ name, revenue, value: revenue }));
  };

  // Compute revenue-by-type and table totals after helper is defined
  const revenueByTypeData = getRevenueByType().sort((a, b) => b.revenue - a.revenue);

  // We'll compute topStations (top 10 by revenue) and use that for table/footer totals
  const topStations = (stationPerformanceData || [])
    .slice()
    .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
    .slice(0, 10);

  // Table totals to show in footer and to cross-check KPI totals (for top 10 only)
  const tableTotals = {
    revenue: topStations.reduce((s, st) => s + (st.totalRevenue || 0), 0),
    energy: topStations.reduce((s, st) => s + (st.totalEnergyDelivered || 0), 0),
    sessions: topStations.reduce((s, st) => s + (st.completedSessions || 0), 0),
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
    const days = computeRangeDays();
    if (dateMode === 'day') {
      if (days <= 7) return '7 ngày qua';
      if (days <= 30) return '30 ngày qua';
      if (days <= 90) return '3 tháng qua';
      return `${days} ngày`;
    }
    if (dateMode === 'month') {
      const f = selectedFrom ? new Date(selectedFrom) : new Date();
      const t = selectedTo ? new Date(selectedTo) : new Date();
      return `${f.getFullYear()}-${String(f.getMonth()+1).padStart(2,'0')} → ${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}`;
    }
    // year
    const fy = selectedFrom ? new Date(selectedFrom).getFullYear() : new Date().getFullYear();
    const ty = selectedTo ? new Date(selectedTo).getFullYear() : new Date().getFullYear();
    return `${fy} → ${ty}`;
  };

  // Format tooltip
  const formatTooltipValue = (value, name) => {
    if (name === "revenue" || name.includes("Doanh thu")) return formatCurrency(value);
  if (name === "energy" || name.includes("Năng lượng")) return `${value.toFixed(1)} kWh`;
    if (name === "utilization" || name.includes("Sử dụng")) return `${value.toFixed(1)}%`;
    return value;
  };

  // Precompute series and fallbacks for rendering (avoid IIFE in JSX)
  const revenueSeries = getRevenueChartData();
  const revenueGranularity = detectGranularity(revenueSeries);
  const rangeDaysNow = computeRangeDays();
  const shouldShowPerStation = rangeDaysNow <= 30 && revenueSeries.length <= 1;
  const stationBars = (topStations || []).map((s) => ({
    name: s.stationName || `Trạm ${s.stationId}`,
    revenue: s.totalRevenue || 0,
    sessions: s.completedSessions || 0,
  }));

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
            Báo cáo chi tiết về doanh thu, sử dụng và hiệu suất hệ thống
          </Typography>
          {/* Date range caption removed per UX request */}
        </Box>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          {/* 'Chế độ' selector removed per request - dateMode defaults to 'day' */}

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              views={dateMode === 'day' ? ['year','month','day'] : dateMode === 'month' ? ['year','month'] : ['year']}
              label={dateMode === 'day' ? 'Từ ngày' : dateMode === 'month' ? 'Từ tháng' : 'Từ năm'}
              value={selectedFrom}
              onChange={(d) => setSelectedFrom(d)}
              maxDate={new Date()}
              renderInput={(params) => <TextField {...params} size="small" />}
            />

            <DatePicker
              views={dateMode === 'day' ? ['year','month','day'] : dateMode === 'month' ? ['year','month'] : ['year']}
              label={dateMode === 'day' ? 'Đến ngày' : dateMode === 'month' ? 'Đến tháng' : 'Đến năm'}
              value={selectedTo}
              onChange={(d) => setSelectedTo(d)}
              maxDate={new Date()}
              renderInput={(params) => <TextField {...params} size="small" />}
            />
          </LocalizationProvider>

          <Button variant="contained" onClick={fetchAnalyticsData} disabled={loading} startIcon={loading ? <CircularProgress size={18} /> : null}>
            Áp dụng
          </Button>

          {/* 'Làm mới' button removed per request */}

          {/* Date range caption removed per UX request */}
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
  <Grid container spacing={3} sx={{ mb: 4 }} alignItems="stretch">
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "linear-gradient(135deg, #1379FF 0%, #0D5FDD 100%)",
              color: "white",
              height: "100%",
            }}
          >
            <CardContent sx={{ height: "100%", display: "flex", alignItems: "center" }}>
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
              height: "100%",
            }}
          >
            <CardContent sx={{ height: "100%", display: "flex", alignItems: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                  <ElectricCar />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {kpis.totalSessions.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Phiên hoàn thành
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
              height: "100%",
            }}
          >
            <CardContent sx={{ height: "100%", display: "flex", alignItems: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                  <Battery80 />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {kpis.totalSessions > 0 ? formatCurrency(kpis.arps) : "N/A"}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Doanh thu trung bình / phiên (ARPS)
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
              height: "100%",
            }}
          >
            <CardContent sx={{ height: "100%", display: "flex", alignItems: "center" }}>
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
              <Box sx={{ height: 350 }}>
                {shouldShowPerStation ? (
                  stationBars.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stationBars} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                        <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                        <RechartsTooltip
                          formatter={(value, name, props) => [formatCurrency(value), props.dataKey || name]}
                          contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #ddd', borderRadius: 8 }}
                        />
                        <Legend verticalAlign="top" />
                        <Bar dataKey="revenue" fill={colors.primary} radius={[4, 4, 0, 0]} />
                        <Line type="monotone" dataKey="sessions" stroke={colors.info} strokeWidth={2} name="Số phiên" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                      <Typography color="text.secondary">Chưa có dữ liệu</Typography>
                    </Box>
                  )
                ) : revenueSeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart 
                      data={revenueSeries}
                      margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="dateISO"
                        angle={-15}
                        textAnchor="end"
                        height={60}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(iso) => {
                          if (!iso) return '';
                          const dt = new Date(iso);
                          if (revenueGranularity === 'daily') {
                            return dt.toLocaleDateString();
                          }
                          // monthly
                          return dt.toLocaleString(undefined, { month: 'short', year: 'numeric' });
                        }}
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
              <Box sx={{ height: 350 }}>
                {revenueByTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueByTypeData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                      <YAxis type="category" dataKey="name" width={160} />
                      <RechartsTooltip 
                        formatter={(value, name, props) => [formatCurrency(value), props.payload.name]}
                        contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #ddd', borderRadius: 8 }}
                      />
                      <Legend verticalAlign="top" />
                      <Bar dataKey="revenue" fill={colors.primary} radius={[4, 4, 4, 4]} isAnimationActive={false}>
                        {revenueByTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Bar>
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
                Năng lượng & Tỷ lệ sử dụng 
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
                {topStations.length > 0 ? (
                  topStations.map((station, index) => (
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
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2}>
                    <Typography variant="subtitle2" fontWeight="bold">Tổng (Top 10)</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="subtitle2" fontWeight="bold">
                      {formatCurrency(tableTotals.revenue)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="subtitle2" fontWeight="bold">
                      {tableTotals.energy.toFixed(1)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="subtitle2" fontWeight="bold">
                      {tableTotals.sessions}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">&nbsp;</TableCell>
                  <TableCell align="center">&nbsp;</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdvancedAnalytics;
