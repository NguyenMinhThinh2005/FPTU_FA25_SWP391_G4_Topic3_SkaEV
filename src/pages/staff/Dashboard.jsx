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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  CircularProgress,
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
  Cancel,
  Construction,
} from "@mui/icons-material";
import staffAPI from "../../services/api/staffAPI";

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stationInfo, setStationInfo] = useState(null);
  const [connectors, setConnectors] = useState([]);
  const [dailyStats, setDailyStats] = useState({
    revenue: 0,
    completedSessions: 0,
    energyConsumed: 0,
    activeSessions: 0,
  });
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);

  // Dialog states for Emergency Stop and Maintenance
  const [emergencyDialog, setEmergencyDialog] = useState({ open: false, connector: null });
  const [maintenanceDialog, setMaintenanceDialog] = useState({ open: false, connector: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [maintenanceDuration, setMaintenanceDuration] = useState(2);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await staffAPI.getDashboardOverview();
      console.log("📊 Dashboard API Response:", response);

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

      console.log("📈 Daily Stats from API:", dailyStatsPayload);
      console.log("🔌 Connectors from API:", connectorPayload);

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

      // Calculate comprehensive stats
      let calculatedStats = {
        revenue: 0,
        completedSessions: 0,
        energyConsumed: 0,
        activeSessions: 0,
      };

      // Start with API stats if provided
      if (dailyStatsPayload) {
        calculatedStats.revenue = Number(dailyStatsPayload.revenue || 0);
        calculatedStats.completedSessions = Number(dailyStatsPayload.completedSessions || 0);
        calculatedStats.energyConsumed = Number(dailyStatsPayload.energyDeliveredKwh || 0);
        calculatedStats.activeSessions = Number(dailyStatsPayload.activeSessions || 0);
      }

      // Calculate current active sessions from connectors
      let currentActiveSessions = 0;
      let currentActiveEnergy = 0;
      let currentActiveRevenue = 0;

      normalizedConnectors.forEach((connector) => {
        console.log("🔍 Checking connector:", connector.code, "hasActiveSession:", !!connector.activeSession);
        if (connector.activeSession) {
          currentActiveSessions += 1;
          const session = connector.activeSession;
          console.log("  ✅ Active session found:", session);
          
          // Calculate energy consumed from SOC change or direct value
          const energyKwh = Number(session.energyConsumedKwh || 0);
          currentActiveEnergy += energyKwh;
          
          // Calculate revenue based on energy and rate
          const rate = Number(session.unitPrice || 5000); // Default rate VND/kWh
          currentActiveRevenue += energyKwh * rate;
        }
      });

      console.log("📊 Calculated from connectors:", {
        activeSessions: currentActiveSessions,
        energy: currentActiveEnergy,
        revenue: currentActiveRevenue
      });

      // Update stats with current active data
      calculatedStats.activeSessions = currentActiveSessions;
      
      // Add active session energy to total (if not already counted in dailyStats)
      if (!dailyStatsPayload || dailyStatsPayload.energyDeliveredKwh === 0) {
        calculatedStats.energyConsumed += currentActiveEnergy;
      }

      // If no revenue from API, use calculated from active sessions
      if (calculatedStats.revenue === 0 && currentActiveRevenue > 0) {
        calculatedStats.revenue = currentActiveRevenue;
      }

      console.log("✅ Final calculated stats:", calculatedStats);
      setDailyStats(calculatedStats);

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

  // ==================== CONNECTOR CONTROL HANDLERS ====================

  const handleEmergencyStopClick = (connector) => {
    setEmergencyDialog({ open: true, connector });
    setActionReason(`Dừng khẩn cấp connector ${connector.code}`);
  };

  const handleMaintenanceClick = (connector) => {
    setMaintenanceDialog({ open: true, connector });
    setActionReason(`Bảo trì định kỳ connector ${connector.code}`);
    setMaintenanceDuration(2);
  };

  const handleEmergencyStopConfirm = async () => {
    const { connector } = emergencyDialog;
    if (!connector || !connector.slotId) {
      alert('Không tìm thấy thông tin connector');
      return;
    }

    setActionLoading(true);
    try {
      await staffAPI.emergencyStop(connector.slotId, actionReason);
      
      // Close dialog
      setEmergencyDialog({ open: false, connector: null });
      setActionReason('');

      // Show success message
      alert(`✅ Đã dừng khẩn cấp connector ${connector.code}`);

      // Reload dashboard to reflect changes
      await loadDashboardData();
    } catch (error) {
      console.error('Emergency stop failed:', error);
      alert(`❌ Lỗi khi dừng khẩn cấp: ${error.response?.data?.message || error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMaintenanceConfirm = async () => {
    const { connector } = maintenanceDialog;
    if (!connector || !connector.slotId) {
      alert('Không tìm thấy thông tin connector');
      return;
    }

    setActionLoading(true);
    try {
      await staffAPI.setMaintenance(connector.slotId, actionReason, maintenanceDuration);
      
      // Close dialog
      setMaintenanceDialog({ open: false, connector: null });
      setActionReason('');
      setMaintenanceDuration(2);

      // Show success message
      alert(`✅ Đã chuyển connector ${connector.code} sang chế độ bảo trì`);

      // Reload dashboard to reflect changes
      await loadDashboardData();
    } catch (error) {
      console.error('Maintenance mode failed:', error);
      alert(`❌ Lỗi khi chuyển sang bảo trì: ${error.response?.data?.message || error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDialogClose = () => {
    if (!actionLoading) {
      setEmergencyDialog({ open: false, connector: null });
      setMaintenanceDialog({ open: false, connector: null });
      setActionReason('');
      setMaintenanceDuration(2);
    }
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
      code: connector.connectorCode || `SLOT-${connector.slotId}`, // For display in dialogs
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

      {/* Statistics Cards - 4 chỉ số chính */}
      <Grid container spacing={3} mb={3}>
        {/* Doanh thu hôm nay */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            height: '100%',
            minHeight: 140
          }}>
            <CardContent sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                <Box flex={1}>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1, fontSize: '0.875rem' }}>
                    Doanh thu hôm nay (VNĐ)
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
                    {Number(dailyStats.revenue || 0).toLocaleString('vi-VN')}
                  </Typography>
                </Box>
                <MonetizationOn sx={{ fontSize: { xs: 40, md: 48 }, opacity: 0.8, ml: 1 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Phiên hoàn thành */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            height: '100%',
            minHeight: 140
          }}>
            <CardContent sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                <Box flex={1}>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1, fontSize: '0.875rem' }}>
                    Phiên hoàn thành
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
                    {Number(dailyStats.completedSessions || 0).toLocaleString('vi-VN')}
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: { xs: 40, md: 48 }, opacity: 0.8, ml: 1 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Năng lượng tiêu thụ */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            height: '100%',
            minHeight: 140
          }}>
            <CardContent sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                <Box flex={1}>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1, fontSize: '0.875rem' }}>
                    Năng lượng tiêu thụ (kWh)
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
                    {Number(dailyStats.energyConsumed || 0).toFixed(1)}
                  </Typography>
                </Box>
                <Bolt sx={{ fontSize: { xs: 40, md: 48 }, opacity: 0.8, ml: 1 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Số lượng Xe đang sạc */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            height: '100%',
            minHeight: 140
          }}>
            <CardContent sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                <Box flex={1}>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1, fontSize: '0.875rem' }}>
                    Số lượng Xe đang sạc
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
                    {Number(dailyStats.activeSessions || chargingConnectors || 0).toLocaleString('vi-VN')}
                  </Typography>
                </Box>
                <BatteryChargingFull sx={{ fontSize: { xs: 40, md: 48 }, opacity: 0.8, ml: 1 }} />
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

                      {/* Control Buttons */}
                      <Box mt="auto" pt={2} display="flex" gap={1} flexDirection="column">
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          startIcon={<Cancel />}
                          onClick={() => handleEmergencyStopClick(connector)}
                          disabled={connector.status === 'Unavailable' || connector.status === 'Faulted'}
                          fullWidth
                        >
                          Dừng khẩn cấp
                        </Button>
                        <Button
                          variant="outlined"
                          color="warning"
                          size="small"
                          startIcon={<Construction />}
                          onClick={() => handleMaintenanceClick(connector)}
                          disabled={connector.status === 'Unavailable' || connector.status === 'Faulted'}
                          fullWidth
                        >
                          Bảo trì
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>

      {/* Emergency Stop Dialog */}
      <Dialog
        open={emergencyDialog.open}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>
          <Cancel sx={{ mr: 1, verticalAlign: 'middle' }} />
          Xác nhận Dừng Khẩn Cấp
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText sx={{ mb: 2 }}>
            Bạn có chắc chắn muốn <strong>DỪNG KHẨN CẤP</strong> connector{' '}
            <strong>{emergencyDialog.connector?.code}</strong>?
          </DialogContentText>
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>Cảnh báo</AlertTitle>
            - Điện sẽ bị ngắt ngay lập tức<br />
            - Phiên sạc sẽ kết thúc<br />
            - Khách hàng sẽ nhận thông báo
          </Alert>
          <TextField
            label="Lý do dừng khẩn cấp"
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            multiline
            rows={3}
            fullWidth
            required
            placeholder="Vui lòng nhập lý do..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={actionLoading}>
            Hủy
          </Button>
          <Button
            onClick={handleEmergencyStopConfirm}
            variant="contained"
            color="error"
            disabled={actionLoading || !actionReason.trim()}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <Cancel />}
          >
            {actionLoading ? 'Đang xử lý...' : 'Dừng ngay'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Maintenance Dialog */}
      <Dialog
        open={maintenanceDialog.open}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'warning.main', color: 'white' }}>
          <Construction sx={{ mr: 1, verticalAlign: 'middle' }} />
          Chuyển sang Chế độ Bảo trì
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText sx={{ mb: 2 }}>
            Chuyển connector <strong>{maintenanceDialog.connector?.code}</strong> sang chế độ bảo trì
          </DialogContentText>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>Lưu ý</AlertTitle>
            - Connector sẽ không khả dụng<br />
            - Khách hàng sẽ thấy trạng thái "Đang bảo trì"<br />
            - Sự cố sẽ được tự động tạo trong hệ thống
          </Alert>
          <TextField
            label="Lý do bảo trì"
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            multiline
            rows={3}
            fullWidth
            required
            placeholder="Vui lòng mô tả công việc bảo trì..."
            sx={{ mb: 2 }}
          />
          <TextField
            label="Thời gian dự kiến (giờ)"
            type="number"
            value={maintenanceDuration}
            onChange={(e) => setMaintenanceDuration(Number(e.target.value))}
            fullWidth
            inputProps={{ min: 0.5, max: 48, step: 0.5 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={actionLoading}>
            Hủy
          </Button>
          <Button
            onClick={handleMaintenanceConfirm}
            variant="contained"
            color="warning"
            disabled={actionLoading || !actionReason.trim()}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <Construction />}
          >
            {actionLoading ? 'Đang xử lý...' : 'Xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffDashboard;
