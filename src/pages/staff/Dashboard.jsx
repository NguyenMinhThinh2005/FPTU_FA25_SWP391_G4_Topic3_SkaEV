/* eslint-disable */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  AlertTitle,
  Chip,
  Divider,
  Stack,
} from "@mui/material";
import {
  ElectricCar,
  BatteryChargingFull,
  Warning,
  CheckCircle,
  Build,
  PowerOff,
  Refresh,
  Notifications,
  Error,
  Bolt,
  AccessTime,
  MonetizationOn,
} from "@mui/icons-material";

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stationInfo, setStationInfo] = useState(null);
  const [connectors, setConnectors] = useState([]);
  const [dailyStats, setDailyStats] = useState({
    revenue: 0,
    completedSessions: 0,
    energyConsumed: 0,
  });
  const [alerts, setAlerts] = useState([]);

  // Mock data - TODO: Replace with API
  const mockStationInfo = {
    id: 1,
    name: "Trạm sạc FPT Complex",
    address: "Lô E2a-7, D1, KCN Cao, Q9, HCM",
    staffName: "Nguyễn Văn A",
  };

  const mockConnectors = [
    {
      id: "CON-01",
      stationId: 1,
      type: "AC",
      maxPower: 22,
      status: "Available",
      statusLabel: "Rảnh",
      statusColor: "success",
      currentSession: null,
    },
    {
      id: "CON-02",
      stationId: 1,
      type: "AC",
      maxPower: 22,
      status: "Charging",
      statusLabel: "Đang sạc",
      statusColor: "primary",
      currentSession: {
        id: "SES-001",
        startTime: new Date(Date.now() - 45 * 60 * 1000),
        energyConsumed: 15.5,
        estimatedCost: 77500,
        vehicleSOC: 65,
      },
    },
    {
      id: "CON-03",
      stationId: 1,
      type: "DC",
      maxPower: 50,
      status: "Available",
      statusLabel: "Rảnh",
      statusColor: "success",
      currentSession: null,
    },
    {
      id: "CON-04",
      stationId: 1,
      type: "DC",
      maxPower: 50,
      status: "Faulted",
      statusLabel: "Lỗi",
      statusColor: "error",
      currentSession: null,
    },
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // TODO: API calls
      setStationInfo(mockStationInfo);
      setConnectors(mockConnectors);
      setActiveSessions(
        mockConnectors.filter((c) => c.currentSession).map((c) => c.currentSession)
      );

      // Mock daily statistics
      setDailyStats({
        revenue: 2850000, // VNĐ
        completedSessions: 12,
        energyConsumed: 285.5, // kWh
      });

      // Mock alerts
      const mockAlerts = [
        {
          id: 1,
          type: "warning",
          message: "Điểm sạc CON-04 đang Offline",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          id: 2,
          type: "info",
          message: "Phiên sạc SES-096 chưa thanh toán",
          timestamp: new Date(Date.now() - 90 * 60 * 1000),
        },
      ];
      setAlerts(mockAlerts);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Available":
        return <CheckCircle color="success" />;
      case "Charging":
        return <BatteryChargingFull color="primary" />;
      case "Faulted":
        return <Warning color="error" />;
      case "Unavailable":
        return <PowerOff color="disabled" />;
      default:
        return <Build color="warning" />;
    }
  };

  // Statistics
  const totalConnectors = connectors.length;
  const availableConnectors = connectors.filter((c) => c.status === "Available").length;
  const chargingConnectors = connectors.filter((c) => c.status === "Charging").length;
  const faultedConnectors = connectors.filter((c) => c.status === "Faulted").length;
  const onlineConnectors = connectors.filter((c) => c.status === "Available" || c.status === "Charging").length;
  const offlineConnectors = connectors.filter((c) => c.status === "Faulted" || c.status === "Unavailable").length;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Quản lý Trạm sạc
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {stationInfo?.name} - {stationInfo?.address}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />} onClick={loadDashboardData}>
          Làm mới
        </Button>
      </Box>

      {/* Staff Info Alert */}
      {stationInfo && (
        <Alert severity="info" icon={<ElectricCar />} sx={{ mb: 3 }}>
          Nhân viên: <strong>{stationInfo.staffName}</strong> - Trạm:{" "}
          <strong>{stationInfo.name}</strong>
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <ElectricCar color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {totalConnectors}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng điểm sạc
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <CheckCircle color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {onlineConnectors}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Điểm sạc Online
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <PowerOff color="error" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="error.main">
                    {offlineConnectors}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Điểm sạc Offline
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <BatteryChargingFull color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {chargingConnectors}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Đang sạc
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Daily Statistics */}
      <Typography variant="h5" fontWeight={600} mb={2}>
        Thống kê nhanh trong ngày
      </Typography>
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: "success.50" }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <MonetizationOn sx={{ fontSize: 40, color: "success.main" }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    {dailyStats.revenue.toLocaleString()} ₫
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Doanh thu hôm nay
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: "primary.50" }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <AccessTime sx={{ fontSize: 40, color: "primary.main" }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="primary.main">
                    {dailyStats.completedSessions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Phiên sạc hoàn thành
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: "warning.50" }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Bolt sx={{ fontSize: 40, color: "warning.main" }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="warning.main">
                    {dailyStats.energyConsumed.toFixed(1)} kWh
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Năng lượng tiêu thụ
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alerts & Notifications */}
      {alerts.length > 0 && (
        <>
          <Typography variant="h5" fontWeight={600} mb={2}>
            Cảnh báo & Thông báo
          </Typography>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack spacing={2}>
                {alerts.map((alert) => (
                  <Alert
                    key={alert.id}
                    severity={alert.type}
                    action={
                      <Button
                        size="small"
                        onClick={() =>
                          alert.type === "warning"
                            ? navigate("/staff/monitoring")
                            : navigate("/staff/charging-sessions")
                        }
                      >
                        Xem
                      </Button>
                    }
                  >
                    <Typography variant="body2">{alert.message}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {alert.timestamp.toLocaleString("vi-VN")}
                    </Typography>
                  </Alert>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </>
      )}

      {/* Connectors by Status - Horizontal Layout */}
      <Typography variant="h5" fontWeight={600} mb={2} mt={4}>
        Danh sách Điểm sạc
      </Typography>
      <Grid container spacing={3}>
        {/* Available Connectors Column */}
        {connectors.filter((c) => c.status === "Available").length > 0 && (
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight={600} mb={2} color="success.main">
              🟢 Rảnh
            </Typography>
            <Stack spacing={2}>
              {connectors
                .filter((c) => c.status === "Available")
                .map((connector) => (
                  <Card
                    key={connector.id}
                    sx={{
                      border: 2,
                      borderColor: "success.light",
                    }}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start">
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {connector.id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {connector.type} - {connector.maxPower} kW
                          </Typography>
                        </Box>
                        <Chip
                          icon={getStatusIcon(connector.status)}
                          label={connector.statusLabel}
                          color={connector.statusColor}
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
            </Stack>
          </Grid>
        )}

        {/* Charging Connectors Column */}
        {connectors.filter((c) => c.status === "Charging").length > 0 && (
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight={600} mb={2} color="primary.main">
              🔵 Đang hoạt động
            </Typography>
            <Stack spacing={2}>
              {connectors
                .filter((c) => c.status === "Charging")
                .map((connector) => (
                  <Card
                    key={connector.id}
                    sx={{
                      border: 2,
                      borderColor: "primary.main",
                    }}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start">
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {connector.id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {connector.type} - {connector.maxPower} kW
                          </Typography>
                        </Box>
                        <Chip
                          icon={getStatusIcon(connector.status)}
                          label={connector.statusLabel}
                          color={connector.statusColor}
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
            </Stack>
          </Grid>
        )}

        {/* Faulted/Unavailable Connectors Column */}
        {connectors.filter((c) => c.status === "Faulted" || c.status === "Unavailable").length > 0 && (
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight={600} mb={2} color="error.main">
              🔴 Báo lỗi
            </Typography>
            <Stack spacing={2}>
              {connectors
                .filter((c) => c.status === "Faulted" || c.status === "Unavailable")
                .map((connector) => (
                  <Card
                    key={connector.id}
                    sx={{
                      border: 2,
                      borderColor: "error.main",
                    }}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start">
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {connector.id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {connector.type} - {connector.maxPower} kW
                          </Typography>
                        </Box>
                        <Chip
                          icon={getStatusIcon(connector.status)}
                          label={connector.statusLabel}
                          color={connector.statusColor}
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
            </Stack>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default StaffDashboard;
