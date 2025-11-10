import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Divider,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  PowerSettingsNew,
  BatteryChargingFull,
  Speed,
  TrendingUp,
  EvStation,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import axiosInstance from "../../services/axiosConfig";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const RealtimeMonitoringDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState(null);
  const [stations, setStations] = useState([]);
  const [realtimeData, setRealtimeData] = useState(null);
  const [powerHistory, setPowerHistory] = useState([]);
  const [error, setError] = useState(null);

  // Fetch stations list
  const fetchStations = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/admin/stations`);

      if (response.data.success) {
        setStations(response.data.data || []);
        if (!selectedStation && response.data.data.length > 0) {
          setSelectedStation(response.data.data[0].stationId);
        }
      }
    } catch (err) {
      console.error("Error fetching stations:", err);
      setError("Không thể tải danh sách trạm");
    }
  }, [selectedStation]);

  // Fetch realtime data for selected station
  const fetchRealtimeData = useCallback(async () => {
    if (!selectedStation) return;

    try {
      const response = await axiosInstance.get(
        `/admin/stations/${selectedStation}/realtime`
      );

      if (response.data.success) {
        const data = response.data.data;
        setRealtimeData(data);

        // Add to power history for chart (keep last 20 points)
        const newPoint = {
          time: new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          power: data.currentPowerUsage || 0,
          sessions: data.activeSessions || 0,
        };

        setPowerHistory((prev) => {
          const updated = [...prev, newPoint];
          return updated.slice(-20); // Keep last 20 points
        });

        setError(null);
      }
    } catch (err) {
      console.error("Error fetching realtime data:", err);
      setError("Không thể tải dữ liệu real-time");
    } finally {
      setLoading(false);
    }
  }, [selectedStation]);

  // Initial load
  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  // Load realtime data when station changes
  useEffect(() => {
    if (selectedStation) {
      setPowerHistory([]); // Reset history when changing station
      fetchRealtimeData();
    }
  }, [selectedStation, fetchRealtimeData]);

  const handleRefresh = () => {
    setLoading(true);
    fetchRealtimeData();
  };

  const getStatusColor = (status) => {
    const statusMap = {
      active: "success",
      operational: "success",
      online: "success",
      inactive: "error",
      offline: "error",
      maintenance: "warning",
    };
    return statusMap[status?.toLowerCase()] || "default";
  };

  const getUtilizationColor = (percent) => {
    if (percent >= 80) return "#ff4444";
    if (percent >= 60) return "#ffbb28";
    return "#00c49f";
  };

  // Prepare capacity data for pie chart
  const capacityData = realtimeData
    ? [
        {
          name: "Đang sử dụng",
          value: realtimeData.occupiedSlots || 0,
          color: "#ff8042",
        },
        {
          name: "Khả dụng",
          value: realtimeData.availableSlots || 0,
          color: "#00c49f",
        },
        {
          name: "Bảo trì",
          value: realtimeData.maintenanceSlots || 0,
          color: "#ffbb28",
        },
      ]
    : [];

  // Calculate utilization percentage
  const totalSlots =
    (realtimeData?.availableSlots || 0) +
    (realtimeData?.occupiedSlots || 0) +
    (realtimeData?.maintenanceSlots || 0);
  const utilizationPercent = totalSlots > 0
    ? Math.round(((realtimeData?.occupiedSlots || 0) / totalSlots) * 100)
    : 0;

  if (loading && !realtimeData) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
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
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Giám sát Thời gian Thực
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Theo dõi công suất, phiên sạc và trạng thái trạm
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel>Chọn trạm</InputLabel>
            <Select
              value={selectedStation || ""}
              label="Chọn trạm"
              onChange={(e) => setSelectedStation(e.target.value)}
            >
              {stations.map((station) => (
                <MenuItem key={station.stationId} value={station.stationId}>
                  {station.stationName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Làm mới ngay">
            <IconButton color="primary" onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!realtimeData && !loading ? (
        <Alert severity="warning">
          Không có dữ liệu real-time. Vui lòng chọn trạm khác.
        </Alert>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Current Power */}
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: "primary.light",
                        borderRadius: 2,
                      }}
                    >
                      <PowerSettingsNew sx={{ fontSize: 32, color: "white" }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Công suất hiện tại
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {(realtimeData?.currentPowerUsage || 0).toFixed(1)} kW
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Active Sessions */}
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: "success.light",
                        borderRadius: 2,
                      }}
                    >
                      <BatteryChargingFull sx={{ fontSize: 32, color: "white" }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Phiên sạc đang hoạt động
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {realtimeData?.activeSessions || 0}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Energy Today */}
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: "warning.light",
                        borderRadius: 2,
                      }}
                    >
                      <TrendingUp sx={{ fontSize: 32, color: "white" }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Năng lượng hôm nay
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {(realtimeData?.totalEnergyToday || 0).toFixed(1)} kWh
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Utilization */}
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: "info.light",
                        borderRadius: 2,
                      }}
                    >
                      <Speed sx={{ fontSize: 32, color: "white" }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Tỷ lệ sử dụng
                      </Typography>
                      <Typography
                        variant="h5"
                        fontWeight="bold"
                        sx={{ color: getUtilizationColor(utilizationPercent) }}
                      >
                        {utilizationPercent}%
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts Section */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Power Usage Over Time - Line Chart */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Công suất theo thời gian (20 điểm gần nhất)
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={powerHistory}>
                      <defs>
                        <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="time"
                        stroke="#888"
                        style={{ fontSize: 12 }}
                      />
                      <YAxis
                        stroke="#888"
                        style={{ fontSize: 12 }}
                        label={{ value: "kW", angle: -90, position: "insideLeft" }}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #ccc",
                          borderRadius: 8,
                        }}
                        formatter={(value) => [`${value.toFixed(1)} kW`, "Công suất"]}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="power"
                        stroke="#8884d8"
                        fill="url(#colorPower)"
                        strokeWidth={2}
                        name="Công suất"
                        dot={{ fill: "#8884d8", r: 3 }}
                        activeDot={{ r: 5 }}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Capacity Utilization - Pie Chart */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Phân bổ cổng sạc
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={capacityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {capacityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={1}>
                      <Grid item xs={4}>
                        <Paper sx={{ p: 1, textAlign: "center", bgcolor: "#ff804220" }}>
                          <Typography variant="h6" fontWeight="bold">
                            {realtimeData?.occupiedSlots || 0}
                          </Typography>
                          <Typography variant="caption">Đang dùng</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={4}>
                        <Paper sx={{ p: 1, textAlign: "center", bgcolor: "#00c49f20" }}>
                          <Typography variant="h6" fontWeight="bold">
                            {realtimeData?.availableSlots || 0}
                          </Typography>
                          <Typography variant="caption">Khả dụng</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={4}>
                        <Paper sx={{ p: 1, textAlign: "center", bgcolor: "#ffbb2820" }}>
                          <Typography variant="h6" fontWeight="bold">
                            {realtimeData?.maintenanceSlots || 0}
                          </Typography>
                          <Typography variant="caption">Bảo trì</Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Recent Sessions */}
          {realtimeData?.recentSessions && realtimeData.recentSessions.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Phiên sạc gần đây
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  {realtimeData.recentSessions.map((session, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Paper sx={{ p: 2 }} variant="outlined">
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          mb={1}
                        >
                          <Chip
                            label={session.status || "active"}
                            color={
                              session.status === "in_progress"
                                ? "success"
                                : "default"
                            }
                            size="small"
                          />
                          <EvStation color="action" />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Người dùng: {session.userName || "N/A"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Năng lượng: {session.energyConsumed?.toFixed(2) || 0} kWh
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Bắt đầu:{" "}
                          {session.startTime
                            ? new Date(session.startTime).toLocaleTimeString(
                                "vi-VN"
                              )
                            : "N/A"}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Station Status Info */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Thông tin trạm
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircle color="success" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Trạng thái
                      </Typography>
                      <Chip
                        label={realtimeData?.status || "Unknown"}
                        color={getStatusColor(realtimeData?.status)}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <EvStation color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Tổng cổng sạc
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {totalSlots}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Speed color="info" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Công suất tối đa
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {realtimeData?.maxPowerCapacity || "N/A"} kW
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Schedule color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Cập nhật lúc
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {new Date().toLocaleTimeString("vi-VN")}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default RealtimeMonitoringDashboard;
