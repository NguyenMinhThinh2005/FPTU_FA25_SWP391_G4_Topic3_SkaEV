import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Tab,
  Tabs,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  LinearProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import {
  ArrowBack,
  Phone,
  Email,
  LocationOn,
  CalendarToday,
  DirectionsCar,
  BatteryChargingFull,
  EvStation,
  Payment,
  TrendingUp,
  AttachMoney,
  AccessTime,
  Speed,
  Edit,
  Add,
  NotificationsActive,
  CheckCircle,
  Cancel,
  Schedule,
  Receipt,
  CreditCard,
} from "@mui/icons-material";
import axiosInstance from "../../services/axiosConfig";
import StaffDetailTabs from "../../components/admin/StaffDetailTabs";
import AdminDetailTabs from "../../components/admin/AdminDetailTabs";

const UserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [chargingHistory, setChargingHistory] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    type: "system_alert",
    title: "",
    message: "",
  });

  const fetchVehicles = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/admin/AdminUsers/${userId}/vehicles`);
      const payload = response?.data?.data ?? response?.data;

      const normalized = Array.isArray(payload)
        ? payload.map((vehicle) => ({
            vehicleId: vehicle.vehicleId,
            brand: vehicle.brand || vehicle.vehicleMake || vehicle.vehicleType || "N/A",
            model: vehicle.model || vehicle.vehicleModel || "",
            vehicleType: vehicle.vehicleType || vehicle.vehicleName || "",
            licensePlate: vehicle.licensePlate || "",
            batteryCapacity: vehicle.batteryCapacity ?? null,
            connectorType: vehicle.connectorType || vehicle.chargingPortType || "",
            status: vehicle.status || (vehicle.isDefault ? "active" : "inactive"),
            isDefault: vehicle.isDefault ?? vehicle.isPrimary ?? false,
            createdAt: vehicle.createdAt,
          }))
        : [];

      setVehicles(normalized);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      setVehicles([]);
    }
  }, [userId]);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/admin/AdminUsers/${userId}/statistics`);
      const payload = response?.data?.data ?? response?.data;

      if (!payload) {
        setStatistics(null);
        return;
      }

      const totalSessions = payload.totalChargingSessions ?? payload.totalSessions ?? 0;
      const completedSessions = payload.completedSessions ?? 0;
      const totalEnergy = Number(payload.totalEnergyConsumedKwh ?? payload.totalEnergyKwh ?? 0);
      const totalSpent = Number(payload.totalSpent ?? payload.totalSpentVnd ?? 0);

      setStatistics({
        totalSessions,
        completedSessions,
        cancelledSessions: payload.cancelledSessions ?? 0,
        totalEnergyKwh: totalEnergy,
        totalSpentVnd: totalSpent,
        averageDurationMinutes: Number(payload.averageSessionDurationMinutes ?? payload.averageDurationMinutes ?? 0),
        averageEnergyPerSessionKwh:
          completedSessions > 0 ? totalEnergy / completedSessions : Number(payload.averageEnergyPerSessionKwh ?? 0),
        averageSpendingPerSessionVnd:
          completedSessions > 0 ? totalSpent / completedSessions : Number(payload.averageSpendingPerSessionVnd ?? 0),
        preferredPaymentMethod: payload.preferredPaymentMethod || "N/A",
        mostUsedStationName: payload.mostUsedStation ?? payload.mostUsedStationName ?? "",
        mostUsedStationAddress: payload.mostUsedStationAddress ?? "",
        totalVehicles: payload.totalVehicles ?? payload.vehicleCount ?? 0,
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
      setStatistics(null);
    }
  }, [userId]);

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/admin/AdminUsers/${userId}`);
      const userData = response?.data?.success ? response.data.data : response?.data;

      if (userData && userData.userId) {
        setUser(userData);

        if (userData.role === "customer") {
          await Promise.all([fetchVehicles(), fetchStatistics()]);
          setChargingHistory([]);
          setPaymentHistory([]);
        } else {
          setVehicles([]);
          setChargingHistory([]);
          setPaymentHistory([]);
          setStatistics(null);
        }
      } else {
        setUser(null);
        setVehicles([]);
        setChargingHistory([]);
        setPaymentHistory([]);
        setStatistics(null);
      }
    } catch (error) {
      console.error("Error fetching user detail:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [userId, fetchVehicles, fetchStatistics]);

  const fetchChargingHistory = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/admin/AdminUsers/${userId}/charging-history?pageNumber=1&pageSize=20`);

      const payload = response?.data?.data ?? response?.data;
      const sessions = Array.isArray(payload?.sessions)
        ? payload.sessions
        : Array.isArray(payload)
        ? payload
        : [];

      const normalized = sessions.map((session) => {
        const bookingId = session.bookingId ?? session.bookingID; // support legacy casing
        const totalAmount = Number(session.totalAmount ?? session.totalAmountVnd ?? 0);
        const energy = Number(session.energyConsumedKwh ?? session.energyConsumed ?? 0);

        return {
          bookingId,
          bookingCode: session.bookingCode || (bookingId ? `BK${String(bookingId).padStart(6, "0")}` : "-"),
          stationName: session.stationName || "-",
          stationAddress: session.stationAddress || "",
          postNumber: session.postNumber || "",
          slotNumber: session.slotNumber || "",
          status: session.status || "unknown",
          energyConsumedKwh: energy,
          totalAmountVnd: totalAmount,
          startTime: session.startTime,
          endTime: session.endTime,
          durationMinutes: session.durationMinutes,
          paymentStatus: session.paymentStatus || "pending",
        };
      });

      setChargingHistory(normalized);
    } catch (error) {
      console.error("Error fetching charging history:", error);
      setChargingHistory([]);
    }
  }, [userId]);

  const fetchPaymentHistory = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/admin/AdminUsers/${userId}/payment-history?pageNumber=1&pageSize=20`);

      const payload = response?.data?.data ?? response?.data;
      const payments = Array.isArray(payload?.payments)
        ? payload.payments
        : Array.isArray(payload)
        ? payload
        : [];

      const normalized = payments.map((payment) => ({
        paymentId: payment.paymentId ?? payment.invoiceId,
        invoiceId: payment.invoiceId,
        transactionId: payment.transactionId || "",
        paymentMethod: payment.paymentMethod || "unknown",
        amount: Number(payment.amount ?? 0),
        status: payment.status || payment.paymentStatus || "pending",
        paidDate: payment.paymentDate || payment.paidDate,
        stationName: payment.stationName,
      }));

      setPaymentHistory(normalized);
    } catch (error) {
      console.error("Error fetching payment history:", error);
      setPaymentHistory([]);
    }
  }, [userId]);


  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    setCurrentTab(0);
  }, [userId, user?.role]);

  useEffect(() => {
    if (user?.role !== "customer") return;

    if (currentTab === 0 && chargingHistory.length === 0) fetchChargingHistory();
    if (currentTab === 1 && paymentHistory.length === 0) fetchPaymentHistory();
    if (currentTab === 2 && !statistics) fetchStatistics();
  }, [
    currentTab,
    user?.role,
    chargingHistory.length,
    paymentHistory.length,
    statistics,
    fetchChargingHistory,
    fetchPaymentHistory,
    fetchStatistics,
  ]);

  const handleSendNotification = async () => {
    try {
      const response = await axiosInstance.post(`/admin/AdminUsers/notifications`, {
        userIds: [parseInt(userId)],
        type: notificationForm.type,
        title: notificationForm.title,
        message: notificationForm.message,
      });

      if (response.data.success) {
        setNotificationDialogOpen(false);
        setNotificationForm({ type: "system_alert", title: "", message: "" });
        alert("Gửi thông báo thành công!");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      alert("Lỗi gửi thông báo!");
    }
  };

  const getStatusChip = (status) => {
    const statusMap = {
      completed: { label: "Hoàn thành", color: "success", icon: <CheckCircle /> },
      cancelled: { label: "Đã hủy", color: "error", icon: <Cancel /> },
      in_progress: { label: "Đang sạc", color: "info", icon: <BatteryChargingFull /> },
      scheduled: { label: "Đã đặt", color: "warning", icon: <Schedule /> },
    };
    
    const config = statusMap[status] || { label: status, color: "default" };
    return <Chip label={config.label} color={config.color} size="small" icon={config.icon} />;
  };

  const getPaymentStatusChip = (status) => {
    const statusMap = {
      paid: { label: "Đã thanh toán", color: "success" },
      pending: { label: "Chờ thanh toán", color: "warning" },
      failed: { label: "Thất bại", color: "error" },
      refunded: { label: "Đã hoàn tiền", color: "info" },
    };
    
    const config = statusMap[status] || { label: status, color: "default" };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const formatCurrency = (amount) => {
    const value = Number.isFinite(amount) ? amount : 0;

    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Không tìm thấy người dùng!</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate("/admin/users")} sx={{ mt: 2 }}>
          Quay lại danh sách
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate("/admin/users")} sx={{ mb: 2 }}>
          Quay lại danh sách
        </Button>
        
        <Card sx={{ bgcolor: "primary.50" }}>
          <CardContent>
            <Grid container spacing={3}>
              {/* User Info */}
              <Grid item xs={12} md={4}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar
                    src={user.avatarUrl}
                    sx={{ width: 80, height: 80, bgcolor: "primary.main", fontSize: 32 }}
                  >
                    {(user.fullName || "?")[0].toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {user.fullName}
                    </Typography>
                    <Chip
                      label={user.role === "customer" ? "Khách hàng" : user.role === "staff" ? "Nhân viên" : "Admin"}
                      color={user.role === "admin" ? "primary" : user.role === "staff" ? "warning" : "default"}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Email fontSize="small" color="action" />
                    <Typography variant="body2">{user.email}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Phone fontSize="small" color="action" />
                    <Typography variant="body2">{user.phoneNumber || "Chưa cập nhật"}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CalendarToday fontSize="small" color="action" />
                    <Typography variant="body2">Tham gia: {formatDate(user.createdAt)}</Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Vehicles - Only for Customer */}
              {user.role === "customer" && (
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Phương tiện ({vehicles.length})
                  </Typography>
                  {vehicles.length === 0 ? (
                    <Alert severity="info" icon={<DirectionsCar />}>
                      Chưa có phương tiện
                    </Alert>
                  ) : (
                    vehicles.map((vehicle) => (
                      <Card key={vehicle.vehicleId} variant="outlined" sx={{ mb: 1 }}>
                        <CardContent sx={{ py: 1.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <DirectionsCar color="primary" />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight="medium">
                                {vehicle.brand} {vehicle.model}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {vehicle.licensePlate} • {vehicle.connectorType} • {vehicle.batteryCapacity} kWh
                              </Typography>
                            </Box>
                            <Chip
                              label={vehicle.status === "active" ? "Hoạt động" : "Không hoạt động"}
                              color={vehicle.status === "active" ? "success" : "default"}
                              size="small"
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </Grid>
              )}

              {/* Quick Stats - Only for Customer */}
              {user.role === "customer" && (
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Thống kê nhanh
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: "center", py: 1.5 }}>
                          <Typography variant="h6" color="primary" fontWeight="bold">
                            {statistics?.totalSessions || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Lượt sạc
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: "center", py: 1.5 }}>
                          <Typography variant="h6" color="success.main" fontWeight="bold">
                            {(statistics?.totalEnergyKwh || 0).toFixed(2)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            kWh
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: "center", py: 1.5 }}>
                          <Typography variant="h6" color="info.main" fontWeight="bold">
                            {formatCurrency(statistics?.totalSpentVnd || 0)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Tổng chi
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: "center", py: 1.5 }}>
                          <Typography variant="h6" color="warning.main" fontWeight="bold">
                            {(statistics?.averageDurationMinutes || 0).toFixed(0)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Phút/lần
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Grid>
              )}

              {/* Admin/Staff Info Section */}
              {(user.role === "admin" || user.role === "staff") && (
                <Grid item xs={12} md={8}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Thông tin chi tiết
                      </Typography>
                      
                      {user.role === "admin" && (
                        <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 2 }}>
                          Tài khoản quản trị hệ thống với quyền hạn đầy đủ
                        </Alert>
                      )}
                      
                      {user.role === "staff" && (
                        <Alert severity="info" icon={<EvStation />} sx={{ mb: 2 }}>
                          Nhân viên quản lý trạm sạc
                        </Alert>
                      )}

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Trạng thái hoạt động
                          </Typography>
                          <Chip
                            label={user.isActive ? "Đang hoạt động" : "Tạm ngưng"}
                            color={user.isActive ? "success" : "default"}
                            icon={<CheckCircle />}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Vai trò
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {user.role === "admin" ? "Quản trị viên" : "Nhân viên"}
                          </Typography>
                        </Grid>
                        {user.role === "staff" && (
                          <>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Trạm đang quản lý
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {user.assignedStationsCount || 0} trạm
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Lịch làm việc
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                Xem chi tiết trong tab bên dưới
                              </Typography>
                            </Grid>
                          </>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs - Role-Specific */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
            {/* Customer Tabs */}
            {user.role === "customer" && [
              <Tab key="customer-history" label="Lịch sử sạc" icon={<BatteryChargingFull />} iconPosition="start" />,
              <Tab key="customer-payments" label="Lịch sử thanh toán" icon={<Payment />} iconPosition="start" />,
              <Tab key="customer-stats" label="Thống kê chi tiết" icon={<TrendingUp />} iconPosition="start" />,
              <Tab key="customer-vehicles" label="Phương tiện" icon={<DirectionsCar />} iconPosition="start" />,
            ]}
            
            {/* Staff Tabs */}
            {user.role === "staff" && [
              <Tab key="staff-stations" label="Trạm được giao" icon={<EvStation />} iconPosition="start" />,
              <Tab key="staff-schedule" label="Lịch làm việc" icon={<Schedule />} iconPosition="start" />,
            ]}
            
            {/* Admin Tabs */}
            {user.role === "admin" && [
              <Tab key="admin-activities" label="Hoạt động" icon={<AccessTime />} iconPosition="start" />,
              <Tab key="admin-perms" label="Quyền hạn" icon={<CheckCircle />} iconPosition="start" />,
              // 'Nhật ký' tab intentionally removed per request
            ]}
          </Tabs>
        </Box>

        <CardContent>
          {/* Customer Tabs Content */}
          {user.role === "customer" && (
            <>
              {/* Tab 0: Charging History */}
              {currentTab === 0 && (
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Lịch sử sạc điện ({chargingHistory.length})
                </Typography>
              </Box>

              {chargingHistory.length === 0 ? (
                <Alert severity="info">Chưa có lịch sử sạc điện</Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Mã booking</TableCell>
                        <TableCell>Trạm sạc</TableCell>
                        <TableCell>Vị trí</TableCell>
                        <TableCell align="center">Trạng thái</TableCell>
                        <TableCell align="right">Năng lượng (kWh)</TableCell>
                        <TableCell align="right">Thành tiền</TableCell>
                        <TableCell align="right">Thời gian</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {chargingHistory.map((session) => (
                        <TableRow key={session.bookingId} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {session.bookingCode}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{session.stationName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {session.postNumber} / {session.slotNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {session.stationAddress}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">{getStatusChip(session.status)}</TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="medium" color="success.main">
                              {session.energyConsumedKwh?.toFixed(2) || "0.00"}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="medium">
                              {formatCurrency(session.totalAmountVnd || 0)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(session.startTime)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* Tab 1: Payment History */}
          {currentTab === 1 && (
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Lịch sử thanh toán ({paymentHistory.length})
                </Typography>
              </Box>

              {paymentHistory.length === 0 ? (
                <Alert severity="info">Chưa có lịch sử thanh toán</Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Mã giao dịch</TableCell>
                        <TableCell align="center">Phương thức</TableCell>
                        <TableCell align="right">Số tiền</TableCell>
                        <TableCell align="center">Trạng thái</TableCell>
                        <TableCell align="right">Ngày thanh toán</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paymentHistory.map((payment) => (
                        <TableRow key={payment.paymentId} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {payment.transactionId}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Invoice: {payment.invoiceId}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={payment.paymentMethod === "credit_card" ? "Thẻ tín dụng" : payment.paymentMethod === "momo" ? "MoMo" : "Chuyển khoản"}
                              size="small"
                              icon={<CreditCard />}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold" color="primary">
                              {formatCurrency(payment.amount)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">{getPaymentStatusChip(payment.status)}</TableCell>
                          <TableCell align="right">
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(payment.paidDate)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* Tab 2: Statistics */}
          {currentTab === 2 && (
            <Box>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Thống kê chi tiết
              </Typography>

              {!statistics ? (
                <CircularProgress />
              ) : (
                <Grid container spacing={3}>
                  {/* Session Stats */}
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                          Phiên sạc
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                            <Typography variant="body2">Tổng số phiên:</Typography>
                            <Typography variant="body2" fontWeight="bold">{statistics.totalSessions}</Typography>
                          </Box>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                            <Typography variant="body2">Hoàn thành:</Typography>
                            <Typography variant="body2" fontWeight="bold" color="success.main">
                              {statistics.completedSessions}
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                            <Typography variant="body2">Đã hủy:</Typography>
                            <Typography variant="body2" fontWeight="bold" color="error.main">
                              {statistics.cancelledSessions}
                            </Typography>
                          </Box>
                          <Divider sx={{ my: 1 }} />
                          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="body2">Tỷ lệ hoàn thành:</Typography>
                            <Typography variant="body2" fontWeight="bold" color="primary">
                              {statistics.totalSessions > 0 
                                ? ((statistics.completedSessions / statistics.totalSessions) * 100).toFixed(1) 
                                : 0}%
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Energy Stats */}
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                          Năng lượng
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                            <Typography variant="body2">Tổng năng lượng:</Typography>
                            <Typography variant="body2" fontWeight="bold" color="success.main">
                              {statistics.totalEnergyKwh?.toFixed(2)} kWh
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                            <Typography variant="body2">Trung bình/phiên:</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {statistics.averageEnergyPerSessionKwh?.toFixed(2)} kWh
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="body2">Thời gian TB:</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {statistics.averageDurationMinutes?.toFixed(0)} phút
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Spending Stats */}
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                          Chi tiêu
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                            <Typography variant="body2">Tổng chi tiêu:</Typography>
                            <Typography variant="body2" fontWeight="bold" color="primary">
                              {formatCurrency(statistics.totalSpentVnd)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                            <Typography variant="body2">Trung bình/phiên:</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {formatCurrency(statistics.averageSpendingPerSessionVnd || 0)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="body2">Phương thức ưa thích:</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {statistics.preferredPaymentMethod || "N/A"}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Favorite Station */}
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                          Trạm sạc yêu thích
                        </Typography>
                        {statistics.mostUsedStationName ? (
                          <Box sx={{ mt: 2 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                              <EvStation color="primary" />
                              <Typography variant="body2" fontWeight="bold">
                                {statistics.mostUsedStationName}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {statistics.mostUsedStationAddress}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Chưa có dữ liệu
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
            </Box>
          )}

          {/* Tab 3: Vehicles for Customer */}
          {currentTab === 3 && (
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Phương tiện ({vehicles.length})
                </Typography>
              </Box>

              {vehicles.length === 0 ? (
                <Alert severity="info">Chưa đăng ký phương tiện nào</Alert>
              ) : (
                <Grid container spacing={2}>
                  {vehicles.map((vehicle) => (
                    <Grid item xs={12} md={6} key={vehicle.vehicleId}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                            <DirectionsCar color="primary" sx={{ fontSize: 40 }} />
                            <Box>
                              <Typography variant="h6" fontWeight="bold">
                                {vehicle.brand} {vehicle.model}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {vehicle.licensePlate}
                              </Typography>
                            </Box>
                            <Chip
                              label={vehicle.status === "active" ? "Hoạt động" : "Không hoạt động"}
                              color={vehicle.status === "active" ? "success" : "default"}
                              size="small"
                              sx={{ ml: "auto" }}
                            />
                          </Box>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Dung lượng pin
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {vehicle.batteryCapacity} kWh
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Loại cổng
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {vehicle.connectorType}
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
            </>
          )}

          {/* Staff Tabs Content */}
          {user.role === "staff" && (
            <StaffDetailTabs userId={userId} currentTab={currentTab} />
          )}

          {/* Admin Tabs Content */}
          {user.role === "admin" && (
            <AdminDetailTabs userId={userId} currentTab={currentTab} />
          )}
        </CardContent>
      </Card>

      {/* Send Notification Dialog (for Customer only) */}
      {user.role === "customer" && (
        <Dialog open={notificationDialogOpen} onClose={() => setNotificationDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Gửi thông báo cho {user.fullName}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Loại thông báo"
                value={notificationForm.type}
                onChange={(e) => setNotificationForm({ ...notificationForm, type: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="system_alert">Cảnh báo hệ thống</option>
                <option value="promotion">Khuyến mãi</option>
                <option value="booking_confirmed">Xác nhận booking</option>
                <option value="charging_complete">Sạc hoàn tất</option>
                <option value="payment_reminder">Nhắc thanh toán</option>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tiêu đề"
                value={notificationForm.title}
                onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nội dung"
                multiline
                rows={4}
                value={notificationForm.message}
                onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotificationDialogOpen(false)}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleSendNotification}
            disabled={!notificationForm.title || !notificationForm.message}
          >
            Gửi thông báo
          </Button>
        </DialogActions>
      </Dialog>
      )}
    </Box>
  );
};

export default UserDetail;
