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
  Notifications,
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
      // Mock vehicles data - replace with actual API when available
      setVehicles([
        {
          vehicleId: 1,
          brand: "VinFast",
          model: "VF 8",
          licensePlate: "30A-12345",
          batteryCapacity: 87.7,
          connectorType: "CCS2",
          status: "active",
        },
      ]);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      console.log("=== FETCHING USER DETAIL ===");
      console.log("User ID:", userId);
      
      // Use direct endpoint to get user by ID with auth token automatically added
      const response = await axiosInstance.get(`/admin/AdminUsers/${userId}`);
      
      console.log("Response status:", response.status);
      console.log("Response data:", response.data);
      console.log("Response data type:", typeof response.data);
      console.log("Has userId?", response.data?.userId);
      console.log("Has success?", response.data?.success);
      
      if (response.data) {
        // Handle both response formats: direct data or wrapped in success object
        const userData = response.data.success ? response.data.data : response.data;
        
        console.log("Processed userData:", userData);
        console.log("userData has userId?", userData?.userId);
        
        if (userData && userData.userId) {
          console.log("✓ Setting user data:", userData);
          setUser(userData);
          // Fetch vehicles
          fetchVehicles();
        } else {
          console.error("✗ No valid user data found in response");
          console.error("userData:", userData);
          setUser(null);
        }
      } else {
        console.error("✗ No response data");
        setUser(null);
      }
    } catch (error) {
      console.error("=== ERROR FETCHING USER ===");
      console.error("Error:", error);
      console.error("Error message:", error.message);
      console.error("Error response:", error.response);
      console.error("Error response status:", error.response?.status);
      console.error("Error response data:", error.response?.data);
      
      // If 404, user not found
      if (error.response?.status === 404) {
        console.error("User not found (404)");
        setUser(null);
      } else {
        console.error("Other error occurred");
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, fetchVehicles]);

  const fetchChargingHistory = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/admin/AdminUsers/${userId}/charging-history?pageNumber=1&pageSize=20`);
      
      if (response.data.success) {
        setChargingHistory(response.data.data?.sessions ?? []);
      } else {
        setChargingHistory([]);
      }
    } catch (error) {
      console.error("Error fetching charging history:", error);
      setChargingHistory([]);
    }
  }, [userId]);

  const fetchPaymentHistory = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/admin/AdminUsers/${userId}/payment-history?pageNumber=1&pageSize=20`);
      
      if (response.data.success) {
        setPaymentHistory(response.data.data?.payments ?? []);
      } else {
        setPaymentHistory([]);
      }
    } catch (error) {
      console.error("Error fetching payment history:", error);
      setPaymentHistory([]);
    }
  }, [userId]);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/admin/AdminUsers/${userId}/statistics`);
      
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    if (currentTab === 0) fetchChargingHistory();
    if (currentTab === 1) fetchPaymentHistory();
    if (currentTab === 2) fetchStatistics();
  }, [currentTab, fetchChargingHistory, fetchPaymentHistory, fetchStatistics]);

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
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
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

              {/* Vehicles */}
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

              {/* Quick Stats */}
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
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs - Role-Specific */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
            {/* Customer Tabs */}
            {user.role === "customer" && (
              <>
                <Tab label="Lịch sử sạc" icon={<BatteryChargingFull />} iconPosition="start" />
                <Tab label="Lịch sử thanh toán" icon={<Payment />} iconPosition="start" />
                <Tab label="Thống kê chi tiết" icon={<TrendingUp />} iconPosition="start" />
                <Tab label="Phương tiện" icon={<DirectionsCar />} iconPosition="start" />
              </>
            )}
            
            {/* Staff Tabs */}
            {user.role === "staff" && (
              <>
                <Tab label="Trạm được giao" icon={<EvStation />} iconPosition="start" />
                <Tab label="Lịch làm việc" icon={<Schedule />} iconPosition="start" />
                <Tab label="Hoạt động" icon={<TrendingUp />} iconPosition="start" />
                <Tab label="Thông báo" icon={<Notifications />} iconPosition="start" />
              </>
            )}
            
            {/* Admin Tabs */}
            {user.role === "admin" && (
              <>
                <Tab label="Tổng quan" icon={<TrendingUp />} iconPosition="start" />
                <Tab label="Hoạt động" icon={<AccessTime />} iconPosition="start" />
                <Tab label="Quyền hạn" icon={<CheckCircle />} iconPosition="start" />
                <Tab label="Nhật ký" icon={<Receipt />} iconPosition="start" />
              </>
            )}
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
