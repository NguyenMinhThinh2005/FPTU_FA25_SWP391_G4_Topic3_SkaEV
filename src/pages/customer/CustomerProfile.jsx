import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Avatar,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Chip,
  Container,
  Tabs,
  Tab,
  Stack,
  LinearProgress,
  Paper,
} from "@mui/material";
import {
  Person,
  Email,
  Phone,
  LocationOn,
  Edit,
  ElectricCar,
  History,
  Analytics,
  TrendingUp,
  BatteryFull,
  Speed,
  EmojiNature,
  CalendarToday,
  Payment,
  CreditCard,
  AccountBalanceWallet,
  Add,
} from "@mui/icons-material";
import useAuthStore from "../../store/authStore";
import useBookingStore from "../../store/bookingStore";
import { formatCurrency } from "../../utils/helpers";

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const CustomerProfile = () => {
  const { user, updateProfile } = useAuthStore();
  const { bookingHistory, initializeMockData, getBookingStats } = useBookingStore();
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || "Nguyễn Văn An",
    email: user?.email || "customer@skaev.com",
    phone: "+84 901 234 567",
    address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
  });

  // Mock vehicle data
  const [vehicles] = useState([
    {
      id: "VF001",
      make: "VinFast",
      model: "VF8",
      year: 2024,
      licensePlate: "51A-123.45",
      batteryCapacity: 87.7, // kWh
      range: 420, // km
      efficiency: 4.8, // km/kWh
      isDefault: true,
    },
    {
      id: "VF002",
      make: "Tesla",
      model: "Model Y",
      year: 2023,
      licensePlate: "51B-678.90",
      batteryCapacity: 75.0, // kWh
      range: 380, // km
      efficiency: 5.1, // km/kWh
      isDefault: false,
    },
  ]);

  // Initialize booking data
  useEffect(() => {
    if (bookingHistory.length === 0) {
      initializeMockData();
    }
  }, [bookingHistory.length, initializeMockData]);

  const bookingStats = getBookingStats();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSaveProfile = () => {
    updateProfile(profileData);
    setEditMode(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: "bold" }}>
        Hồ sơ cá nhân
      </Typography>

      {/* Tabs Navigation */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
        >
          <Tab icon={<Person />} label="Thông tin cá nhân" />
          <Tab icon={<ElectricCar />} label="Quản lý xe" />
          <Tab icon={<History />} label="Lịch sử sạc" />
          <Tab icon={<Analytics />} label="Thống kê & Báo cáo" />
          <Tab icon={<Payment />} label="Thanh toán" />
        </Tabs>
      </Card>

      {/* Tab 1: Profile Information */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Profile Card */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: "center", p: 3 }}>
                <Avatar
                  sx={{ width: 120, height: 120, mx: "auto", mb: 2 }}
                  src="/assets/avatar-customer.jpg"
                >
                  <Person sx={{ fontSize: 60 }} />
                </Avatar>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {profileData.name}
                </Typography>
                <Chip label="Tài xế" color="primary" />
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant={editMode ? "contained" : "outlined"}
                    startIcon={<Edit />}
                    onClick={() => setEditMode(!editMode)}
                    fullWidth
                  >
                    {editMode ? "Lưu thay đổi" : "Chỉnh sửa"}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Profile Details */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Thông tin chi tiết
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Họ và tên"
                      value={profileData.name}
                      disabled={!editMode}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      InputProps={{
                        startAdornment: <Person sx={{ mr: 1, color: "text.secondary" }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={profileData.email}
                      disabled={!editMode}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      InputProps={{
                        startAdornment: <Email sx={{ mr: 1, color: "text.secondary" }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Số điện thoại"
                      value={profileData.phone}
                      disabled={!editMode}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      InputProps={{
                        startAdornment: <Phone sx={{ mr: 1, color: "text.secondary" }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Địa chỉ"
                      value={profileData.address}
                      disabled={!editMode}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                      InputProps={{
                        startAdornment: <LocationOn sx={{ mr: 1, color: "text.secondary" }} />,
                      }}
                    />
                  </Grid>
                </Grid>

                {editMode && (
                  <Box sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "flex-end" }}>
                    <Button variant="outlined" onClick={() => setEditMode(false)}>
                      Hủy
                    </Button>
                    <Button variant="contained" onClick={handleSaveProfile}>
                      Lưu thay đổi
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 2: Vehicle Management */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {vehicles.map((vehicle) => (
            <Grid item xs={12} md={6} key={vehicle.id}>
              <Card sx={{ position: "relative" }}>
                <CardContent>
                  {vehicle.isDefault && (
                    <Chip
                      label="Xe chính"
                      color="primary"
                      size="small"
                      sx={{ position: "absolute", top: 16, right: 16 }}
                    />
                  )}

                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar sx={{ bgcolor: "primary.light", mr: 2 }}>
                      <ElectricCar />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {vehicle.make} {vehicle.model}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {vehicle.year} • {vehicle.licensePlate}
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: "center", p: 1 }}>
                        <BatteryFull color="success" />
                        <Typography variant="body2" fontWeight="medium">
                          {vehicle.batteryCapacity} kWh
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Dung lượng pin
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: "center", p: 1 }}>
                        <Speed color="info" />
                        <Typography variant="body2" fontWeight="medium">
                          {vehicle.range} km
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Quãng đường
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ textAlign: "center", p: 1 }}>
                        <EmojiNature color="primary" />
                        <Typography variant="body2" fontWeight="medium">
                          {vehicle.efficiency} km/kWh
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Hiệu suất năng lượng
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
                    Chỉnh sửa thông tin
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}

          <Grid item xs={12} md={6}>
            <Card sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 280 }}>
              <CardContent sx={{ textAlign: "center" }}>
                <Avatar sx={{ bgcolor: "grey.100", width: 80, height: 80, mx: "auto", mb: 2 }}>
                  <ElectricCar sx={{ fontSize: 40, color: "grey.400" }} />
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  Thêm xe mới
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Đăng ký thêm xe điện để quản lý tốt hơn
                </Typography>
                <Button variant="contained" startIcon={<ElectricCar />}>
                  Thêm xe
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 3: Charging History */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          {/* Statistics Cards */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="primary.main" fontWeight="bold">
                  {bookingStats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng phiên sạc
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {bookingStats.completed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hoàn thành
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="info.main" fontWeight="bold">
                  {bookingStats.totalEnergyCharged} kWh
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng năng lượng
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {formatCurrency(bookingStats.totalAmount)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng chi phí
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* History List */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Lịch sử sạc gần đây
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <List>
                  {bookingHistory.slice(0, 5).map((booking) => (
                    <ListItem key={booking.id} sx={{ border: 1, borderColor: "divider", borderRadius: 1, mb: 1 }}>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: "primary.light" }}>
                          <ElectricCar />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={booking.stationName}
                        secondary={
                          <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                            <Chip
                              icon={<CalendarToday />}
                              label={new Date(booking.createdAt).toLocaleDateString("vi-VN")}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              label={`${booking.energyDelivered || 0} kWh`}
                              size="small"
                              color="info"
                            />
                            <Chip
                              label={formatCurrency(booking.totalAmount || 0)}
                              size="small"
                              color="success"
                            />
                          </Stack>
                        }
                      />
                      <Chip
                        label={booking.status === "completed" ? "Hoàn thành" : "Đã hủy"}
                        color={booking.status === "completed" ? "success" : "error"}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 4: Analytics & Reports */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          {/* Monthly Summary */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tóm tắt tháng này
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Stack spacing={2}>
                  <Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="body2">Phiên sạc</Typography>
                      <Typography variant="body2" fontWeight="bold">{bookingStats.completed} phiên</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={75} />
                  </Box>

                  <Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="body2">Năng lượng sạc</Typography>
                      <Typography variant="body2" fontWeight="bold">{bookingStats.totalEnergyCharged} kWh</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={60} color="success" />
                  </Box>

                  <Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="body2">Chi phí</Typography>
                      <Typography variant="body2" fontWeight="bold">{formatCurrency(bookingStats.totalAmount)}</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={45} color="warning" />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Efficiency Metrics */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Chỉ số hiệu quả
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: "center" }}>
                      <TrendingUp color="success" sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold">6,857</Typography>
                      <Typography variant="caption" color="text.secondary">
                        VNĐ/kWh trung bình
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: "center" }}>
                      <Speed color="info" sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold">{(parseFloat(bookingStats.totalEnergyCharged) / parseFloat(bookingStats.completed) || 20.4).toFixed(1)}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        kWh/phiên trung bình
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        💡 <strong>Mẹo tiết kiệm:</strong> Sạc vào khung giờ thấp điểm (22:00-06:00) để được giá ưu đãi!
                      </Typography>
                    </Alert>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Usage Patterns Analysis */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Thống kê thói quen sạc
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={3}>
                  {/* Charging Time Patterns */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Thời gian sạc yêu thích
                    </Typography>
                    <Stack spacing={1}>
                      {[
                        { time: "22:00-06:00", percent: 45, label: "Đêm (Giá ưu đãi)" },
                        { time: "06:00-10:00", percent: 25, label: "Sáng sớm" },
                        { time: "10:00-16:00", percent: 20, label: "Giữa trưa" },
                        { time: "16:00-22:00", percent: 10, label: "Chiều tối" },
                      ].map((slot, index) => (
                        <Box key={index}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                            <Typography variant="body2">{slot.label}</Typography>
                            <Typography variant="body2" fontWeight="bold">{slot.percent}%</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={slot.percent} sx={{ height: 6, borderRadius: 3 }} />
                        </Box>
                      ))}
                    </Stack>
                  </Grid>

                  {/* Favorite Stations */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Trạm sạc yêu thích
                    </Typography>
                    <Stack spacing={1}>
                      {[
                        { name: "SkaEV Trung tâm", visits: 12, percent: 40 },
                        { name: "AEON Mall Bình Tân", visits: 8, percent: 27 },
                        { name: "Lotte Mart Gò Vấp", visits: 6, percent: 20 },
                        { name: "Big C Thăng Long", visits: 4, percent: 13 },
                      ].map((station, index) => (
                        <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar sx={{ bgcolor: "primary.light", width: 32, height: 32 }}>
                            <LocationOn sx={{ fontSize: 18 }} />
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body2" fontWeight="medium">{station.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{station.visits} lần ({station.percent}%)</Typography>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Cost Analysis */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Phân tích chi phí theo tháng
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Alert severity="success" sx={{ mb: 2 }}>
                  Bạn đã tiết kiệm được <strong>15%</strong> so với tháng trước nhờ sử dụng hiệu quả các trạm sạc!
                </Alert>

                <Grid container spacing={2}>
                  {[
                    { month: "Tháng 7", amount: 1850000, energy: 280, sessions: 14 },
                    { month: "Tháng 8", amount: 1750000, energy: 265, sessions: 13 },
                    { month: "Tháng 9", amount: bookingStats.totalAmount, energy: bookingStats.totalEnergyCharged, sessions: bookingStats.completed },
                  ].map((data, index) => (
                    <Grid item xs={12} sm={4} key={index}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                          {data.month}
                        </Typography>
                        <Typography variant="body2">
                          Chi phí: <strong>{formatCurrency(data.amount)}</strong>
                        </Typography>
                        <Typography variant="body2">
                          Năng lượng: <strong>{data.energy} kWh</strong>
                        </Typography>
                        <Typography variant="body2">
                          Phiên sạc: <strong>{data.sessions} lần</strong>
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 5: Payment Methods */}
      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={3}>
          {/* Payment Overview */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Avatar sx={{ bgcolor: "success.light", width: 80, height: 80, mx: "auto", mb: 2 }}>
                  <AccountBalanceWallet sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {formatCurrency(2450000)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Số dư ví SkaEV
                </Typography>
                <Button variant="contained" sx={{ mt: 2 }} fullWidth>
                  Nạp tiền
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Payment Statistics */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Thống kê thanh toán
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="h6" color="primary.main" fontWeight="bold">
                        {bookingStats.completed}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Giao dịch tháng này
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="h6" color="success.main" fontWeight="bold">
                        {formatCurrency(bookingStats.totalAmount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tổng chi tiêu
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="h6" color="info.main" fontWeight="bold">
                        5%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tiết kiệm
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="h6" color="warning.main" fontWeight="bold">
                        98%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tỷ lệ thành công
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Payment Methods */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Phương thức thanh toán
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={3}>
                  {/* Existing Payment Methods */}
                  {[
                    { type: "SkaEV Wallet", number: "****2450", isDefault: true, icon: <AccountBalanceWallet />, color: "primary" },
                    { type: "Visa", number: "****1234", isDefault: false, icon: <CreditCard />, color: "info" },
                    { type: "Mastercard", number: "****5678", isDefault: false, icon: <CreditCard />, color: "warning" },
                  ].map((method, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card variant="outlined" sx={{ position: "relative" }}>
                        <CardContent>
                          {method.isDefault && (
                            <Chip
                              label="Mặc định"
                              color="primary"
                              size="small"
                              sx={{ position: "absolute", top: 8, right: 8 }}
                            />
                          )}

                          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                            <Avatar sx={{ bgcolor: `${method.color}.light`, mr: 2 }}>
                              {method.icon}
                            </Avatar>
                            <Box>
                              <Typography variant="h6" fontWeight="bold">
                                {method.type}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {method.number}
                              </Typography>
                            </Box>
                          </Box>

                          <Stack direction="row" spacing={1}>
                            <Button variant="outlined" size="small" fullWidth>
                              Chỉnh sửa
                            </Button>
                            <Button variant="outlined" size="small" color="error">
                              Xóa
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}

                  {/* Add New Payment Method */}
                  <Grid item xs={12} sm={6} md={4}>
                    <Card variant="outlined" sx={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 150,
                      cursor: "pointer",
                      "&:hover": { bgcolor: "action.hover" }
                    }}>
                      <CardContent sx={{ textAlign: "center" }}>
                        <Avatar sx={{ bgcolor: "grey.100", width: 60, height: 60, mx: "auto", mb: 2 }}>
                          <Add sx={{ fontSize: 30, color: "grey.400" }} />
                        </Avatar>
                        <Typography variant="h6" gutterBottom>
                          Thêm phương thức
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Thêm thẻ hoặc ví điện tử mới
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Subscription Packages */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Gói thuê bao
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  {[
                    { name: "Gói Cơ bản", price: 199000, sessions: 10, discount: 5, color: "info" },
                    { name: "Gói Tiết kiệm", price: 399000, sessions: 25, discount: 10, color: "success", popular: true },
                    { name: "Gói Cao cấp", price: 699000, sessions: 50, discount: 15, color: "warning" },
                  ].map((pkg, index) => (
                    <Grid item xs={12} sm={4} key={index}>
                      <Card
                        variant="outlined"
                        sx={{
                          position: "relative",
                          border: pkg.popular ? 2 : 1,
                          borderColor: pkg.popular ? "success.main" : "divider"
                        }}
                      >
                        {pkg.popular && (
                          <Chip
                            label="Phổ biến"
                            color="success"
                            size="small"
                            sx={{ position: "absolute", top: -8, right: 16 }}
                          />
                        )}
                        <CardContent sx={{ textAlign: "center", p: 3 }}>
                          <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {pkg.name}
                          </Typography>
                          <Typography variant="h4" color={`${pkg.color}.main`} fontWeight="bold">
                            {formatCurrency(pkg.price)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">/ tháng</Typography>

                          <List dense sx={{ mt: 2 }}>
                            <ListItem>
                              <ListItemText
                                primary={`${pkg.sessions} phiên sạc/tháng`}
                                primaryTypographyProps={{ fontSize: "0.9rem" }}
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemText
                                primary={`Giảm ${pkg.discount}% mọi phiên sạc`}
                                primaryTypographyProps={{ fontSize: "0.9rem" }}
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemText
                                primary="Hỗ trợ 24/7"
                                primaryTypographyProps={{ fontSize: "0.9rem" }}
                              />
                            </ListItem>
                          </List>

                          <Button
                            variant={pkg.popular ? "contained" : "outlined"}
                            color={pkg.color}
                            fullWidth
                            sx={{ mt: 2 }}
                          >
                            {pkg.popular ? "Đăng ký ngay" : "Chọn gói"}
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Transactions */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Giao dịch gần đây
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <List>
                  {bookingHistory.slice(0, 5).map((booking) => (
                    <ListItem key={booking.id} sx={{ border: 1, borderColor: "divider", borderRadius: 1, mb: 1 }}>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: booking.status === "completed" ? "success.light" : "error.light" }}>
                          <Payment />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={`Sạc tại ${booking.stationName}`}
                        secondary={
                          <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                            <Chip
                              icon={<CalendarToday />}
                              label={new Date(booking.createdAt).toLocaleDateString("vi-VN")}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              label="SkaEV Wallet"
                              size="small"
                              color="primary"
                            />
                          </Stack>
                        }
                      />
                      <Box sx={{ textAlign: "right" }}>
                        <Typography variant="h6" fontWeight="bold" color={booking.status === "completed" ? "success.main" : "error.main"}>
                          -{formatCurrency(booking.totalAmount || 0)}
                        </Typography>
                        <Chip
                          label={booking.status === "completed" ? "Thành công" : "Thất bại"}
                          color={booking.status === "completed" ? "success" : "error"}
                          size="small"
                        />
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Container>
  );
};

export default CustomerProfile;
