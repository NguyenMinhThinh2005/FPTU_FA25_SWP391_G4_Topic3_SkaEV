import React from 'react';
import { 
  Box, Card, CardContent, Grid, Avatar, Typography, Chip, Divider, Button, Alert 
} from '@mui/material';
import { 
  ArrowBack, Email, Phone, CalendarToday, DirectionsCar, CheckCircle, EvStation 
} from '@mui/icons-material';

const UserDetailHeader = ({ user, vehicles, statistics, onBack }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const formatCurrency = (amount) => {
    const value = Number.isFinite(amount) ? amount : 0;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Button startIcon={<ArrowBack />} onClick={onBack} sx={{ mb: 2 }}>
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
  );
};

export default UserDetailHeader;
