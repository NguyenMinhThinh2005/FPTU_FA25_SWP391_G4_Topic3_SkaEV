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
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await staffAPI.getDashboardOverview();

      if (!response || typeof response !== "object") {
        throw new Error("Không nhận được dữ liệu dashboard");
      }

      const {
        hasAssignment,
        station,
        staff,
        connectors: connectorPayload = [],
        dailyStats: dailyStatsPayload,
        alerts: alertPayload = [],
      } = response;

      if (hasAssignment && station) {
        setStationInfo({
          id: station.stationId,
          name: station.stationName,
          address: `${station.address}${station.city ? `, ${station.city}` : ""}`,
          staffName: staff?.fullName || "",
        });
      } else {
        setStationInfo(null);
      }

      const normalizedConnectors = Array.isArray(connectorPayload)
        ? connectorPayload
            .map((connector) => mapConnectorForDisplay(connector))
            .filter(Boolean)
        : [];
      setConnectors(normalizedConnectors);

      if (dailyStatsPayload) {
        setDailyStats({
          revenue: Number(dailyStatsPayload.revenue || 0),
          completedSessions: Number(dailyStatsPayload.completedSessions || 0),
          energyConsumed: Number(dailyStatsPayload.energyDeliveredKwh || 0),
        });
      } else {
        setDailyStats({ revenue: 0, completedSessions: 0, energyConsumed: 0 });
      }

      const normalizedAlerts = Array.isArray(alertPayload)
        ? alertPayload.map((alert) => ({
            id: alert.alertId ?? safeRandomId(),
            type: normalizeAlertSeverity(alert.severity),
            message: alert.message,
            timestamp: alert.createdAtUtc ? new Date(alert.createdAtUtc) : new Date(),
          }))
        : [];
      setAlerts(normalizedAlerts);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      setError(error.message || "Không thể tải dashboard nhân viên");
      setStationInfo(null);
      setConnectors([]);
      setDailyStats({ revenue: 0, completedSessions: 0, energyConsumed: 0 });
      setAlerts([]);
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

  const safeRandomId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `alert-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const normalizeAlertSeverity = (severity) => {
    const normalized = (severity || "info").toString().toLowerCase();
    if (normalized === "error" || normalized === "critical") return "error";
    if (normalized === "warning" || normalized === "warn") return "warning";
    return "info";
  };

  const mapConnectorForDisplay = (connector) => {
    if (!connector) return null;

    const rawStatus = (connector.operationalStatus || connector.technicalStatus || "").trim();
    const statusKey = rawStatus.toLowerCase();

    const statusMap = {
      available: { status: "Available", label: "Rảnh", color: "success" },
      charging: { status: "Charging", label: "Đang sạc", color: "primary" },
      in_use: { status: "Charging", label: "Đang sạc", color: "primary" },
      maintenance: { status: "Faulted", label: "Bảo trì", color: "warning" },
      faulted: { status: "Faulted", label: "Lỗi", color: "error" },
      offline: { status: "Faulted", label: "Offline", color: "error" },
      unavailable: { status: "Unavailable", label: "Không khả dụng", color: "default" },
      reserved: { status: "Reserved", label: "Đã giữ chỗ", color: "info" },
    };

    const mapped = statusMap[statusKey] || {
      status: "Unknown",
      label: rawStatus || "Không xác định",
      color: "default",
    };

    let currentSession = null;
    if (connector.activeSession) {
      const session = connector.activeSession;
      currentSession = {
        id: `SES-${session.bookingId}`,
        startTime: session.startedAt ? new Date(session.startedAt) : null,
        energyConsumed: Number(session.energyDelivered || 0),
        vehicleSOC:
          session.currentSoc !== undefined && session.currentSoc !== null
            ? Number(session.currentSoc)
            : null,
        customerName: session.customerName,
        vehicleInfo: session.vehicleInfo,
      };
    }

    return {
      id: connector.connectorCode || `SLOT-${connector.slotId}`,
      slotId: connector.slotId,
      type: connector.connectorType,
      maxPower: Number(connector.maxPower || 0),
      status: mapped.status,
      statusLabel: mapped.label,
      statusColor: mapped.color,
      technicalStatus: connector.technicalStatus,
      voltage: connector.voltage,
      current: connector.current,
      temperature: connector.temperature,
      currentSession,
    };
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
          {stationInfo ? (
            <Typography variant="body1" color="text.secondary">
              {stationInfo.name} - {stationInfo.address}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Chưa có trạm được giao phụ trách
            </Typography>
          )}
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadDashboardData}
          disabled={loading}
        >
          Làm mới
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Staff Info Alert */}
      {stationInfo && (
        <Alert severity="info" icon={<ElectricCar />} sx={{ mb: 3 }}>
          Nhân viên: <strong>{stationInfo.staffName}</strong> - Trạm:{" "}
          <strong>{stationInfo.name}</strong>
        </Alert>
      )}

      {/* Statistics Cards - THAY THẾ VÀ SẮP XẾP LẠI CÁC CHỈ SỐ */}
      <Grid container spacing={3} mb={3}>
        {/* Doanh thu hôm nay */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <MonetizationOn color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {Number(dailyStats.revenue || 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Doanh thu hôm nay (VNĐ)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Phiên hoàn thành */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <CheckCircle color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {dailyStats.completedSessions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Phiên hoàn thành
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Năng lượng tiêu thụ */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Bolt color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {Number(dailyStats.energyConsumed || 0).toFixed(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Năng lượng tiêu thụ (kWh)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Số lượng Xe đang sạc - Thay thế "Tích hợp bình chỗ sạc" */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <BatteryChargingFull color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {chargingConnectors}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Số lượng Xe đang sạc
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* THÊM PHẦN BÁO LỖI - Đặt thẻ Báo lỗi */}
      <Typography variant="h5" fontWeight={600} mb={2}>
        Báo lỗi
      </Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {alerts.length === 0 ? (
            <Alert severity="success" icon={<CheckCircle />}>
              Không có lỗi nào. Tất cả điểm sạc đang hoạt động bình thường.
            </Alert>
          ) : (
            <Stack spacing={2}>
              {alerts.map((alert) => (
                <Alert
                  key={alert.id}
                  severity={alert.type}
                  icon={alert.type === "warning" ? <Warning /> : alert.type === "error" ? <Error /> : <Notifications />}
                  action={
                    <Button
                      size="small"
                      onClick={() => {
                        // Điểm sạc Offline (hiện tại là 1) và Điểm sạc có lỗi/Cảnh báo
                        if (alert.type === "warning" && alert.message.includes("Offline")) {
                          navigate("/staff/monitoring");
                        } else {
                          navigate("/staff/charging-sessions");
                        }
                      }}
                    >
                      Chi tiết
                    </Button>
                  }
                >
                  <AlertTitle sx={{ fontWeight: 600 }}>
                    {alert.type === "warning" ? "Cảnh báo" : alert.type === "error" ? "Lỗi" : "Thông báo"}
                  </AlertTitle>
                  <Typography variant="body2">{alert.message}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {alert.timestamp.toLocaleString("vi-VN")}
                  </Typography>
                </Alert>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* DANH SÁCH ĐIỂM SẠC - Góp thành một danh sách duy nhất và dùng ký hiệu trực quan */}
      <Typography variant="h5" fontWeight={600} mb={2}>
        Danh sách Điểm sạc
      </Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Liệt kê tất cả các Điểm sạc (CON-01, CON-02, CON-03, CON-04) theo thứ tự và sử dụng{" "}
            <strong>màu sắc/biểu tượng lớn hơn</strong> để thể hiện trạng thái (Xanh lá – Rảnh, Xanh dương = Đang sạc, 
            Đỏ = Lỗi/Offline).
          </Typography>
          <Grid container spacing={2}>
            {connectors.map((connector) => {
              // Xác định màu và biểu tượng dựa trên status
              let cardBgColor = "white";
              let borderColor = "grey.300";
              let icon = getStatusIcon(connector.status);
              let statusText = connector.statusLabel;
              let textColor = "text.primary";

              if (connector.status === "Available") {
                cardBgColor = "success.50";
                borderColor = "success.main";
                statusText = "🟢 Rảnh";
                textColor = "success.main";
              } else if (connector.status === "Charging") {
                cardBgColor = "primary.50";
                borderColor = "primary.main";
                statusText = "🔵 Đang sạc";
                textColor = "primary.main";
              } else if (connector.status === "Faulted" || connector.status === "Unavailable") {
                cardBgColor = "error.50";
                borderColor = "error.main";
                statusText = "🔴 Lỗi/Offline";
                textColor = "error.main";
              }

              return (
                <Grid item xs={12} sm={6} md={3} key={connector.id}>
                  <Card
                    sx={{
                      bgcolor: cardBgColor,
                      border: 2,
                      borderColor: borderColor,
                      height: '100%', // Chiều cao 100% của Grid item
                      minHeight: 180, // Chiều cao tối thiểu cố định
                      display: 'flex',
                      flexDirection: 'column',
                      transition: "all 0.3s",
                      "&:hover": {
                        boxShadow: 4,
                        transform: "translateY(-4px)",
                      },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Typography variant="h5" fontWeight="bold" color={textColor}>
                          {connector.id}
                        </Typography>
                        <Box sx={{ fontSize: 40 }}>{icon}</Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {connector.type} - {connector.maxPower} kW
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle1" fontWeight={600} color={textColor}>
                        {statusText}
                      </Typography>
                      {connector.currentSession && (
                        <Box mt={1}>
                          <Typography variant="body2" color="text.secondary">
                            Phiên: {connector.currentSession.id}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            SOC: {connector.currentSession.vehicleSOC}%
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default StaffDashboard;
