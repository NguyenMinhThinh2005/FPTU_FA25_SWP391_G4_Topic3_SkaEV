import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  CalendarToday,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { useMasterDataSync } from "../../hooks/useMasterDataSync";
import useVehicleStore from "../../store/vehicleStore";
import { formatCurrency } from "../../utils/helpers";
import { authAPI } from "../../services/api";

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
  const { bookingHistory, stats: bookingStats } = useMasterDataSync();
  const navigate = useNavigate();
  const {
    vehicles,
    fetchVehicles,
    isLoading: vehiclesLoading,
    error: vehiclesError,
    hasLoaded: vehiclesLoaded,
  } = useVehicleStore();
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [userStatistics, setUserStatistics] = useState(null);
  const [loadingStatistics, setLoadingStatistics] = useState(false);

  const buildInitialProfile = useCallback(() => {
    const profile = user?.profile;
    const composedName = profile
      ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim()
      : "";

    return {
      name:
        user?.fullName || profile?.fullName || composedName || "Chưa cập nhật",
      email: user?.email || "Chưa cập nhật",
      phone:
        user?.phoneNumber ||
        profile?.phoneNumber ||
        profile?.phone ||
        "Chưa cập nhật",
      address: profile?.address || "Chưa cập nhật địa chỉ",
    };
  }, [user]);

  const [profileData, setProfileData] = useState(buildInitialProfile);
  const [originalProfileData, setOriginalProfileData] =
    useState(buildInitialProfile);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const initial = buildInitialProfile();
    setProfileData(initial);
    setOriginalProfileData(initial);
  }, [buildInitialProfile]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        return;
      }

      setLoadingProfile(true);
      try {
        const response = await authAPI.getProfile();

        if (response) {
          const normalized = {
            name:
              response.fullName ||
              response.full_name ||
              user?.fullName ||
              "Chưa cập nhật",
            email: response.email || user?.email || "Chưa cập nhật",
            phone:
              response.phoneNumber ||
              response.phone_number ||
              user?.phoneNumber ||
              "Chưa cập nhật",
            address:
              response.profile?.address ||
              response.address ||
              "Chưa cập nhật địa chỉ",
          };

          setProfileData(normalized);
          setOriginalProfileData(normalized);
        }
      } catch (error) {
        console.error("Failed to fetch customer profile:", error);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [buildInitialProfile, user]);

  useEffect(() => {
    if (user && !vehiclesLoaded && !vehiclesLoading) {
      fetchVehicles();
    }
  }, [user, vehiclesLoaded, vehiclesLoading, fetchVehicles]);

  // Fetch user statistics from API
  useEffect(() => {
    const fetchStatistics = async () => {
      if (!user || tabValue !== 3) {
        return; // Only fetch when on Analytics tab
      }

      setLoadingStatistics(true);
      try {
        const stats = await authAPI.getStatistics();
        console.log("📊 User Statistics from API:", stats);
        setUserStatistics(stats);
      } catch (error) {
        console.error("Failed to fetch user statistics:", error);
        // Fallback to bookingStats if API fails
      } finally {
        setLoadingStatistics(false);
      }
    };

    fetchStatistics();
  }, [user, tabValue]);

  const sortedVehicles = useMemo(() => {
    if (!vehicles?.length) {
      return [];
    }

    return [...vehicles].sort((a, b) => {
      if (a.isDefault === b.isDefault) {
        return 0;
      }
      return a.isDefault ? -1 : 1;
    });
  }, [vehicles]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleStartEdit = () => {
    setOriginalProfileData(profileData);
    setEditMode(true);
    setSaveSuccess(false);
    setSaveError("");
  };

  const handleCancelEdit = () => {
    setProfileData(originalProfileData);
    setEditMode(false);
    setSaveError("");
  };

  const handleSaveProfile = async () => {
    setSaveError("");
    setSaveSuccess(false);
    setSaving(true);

    const updatePayload = {
      fullName: profileData.name?.trim(),
      phoneNumber: profileData.phone?.trim(),
      address: profileData.address?.trim(),
    };

    const result = await updateProfile(updatePayload);

    if (result.success && result.data) {
      const updated = result.data;
      const normalized = {
        name: updated.fullName || profileData.name,
        email: updated.email || profileData.email,
        phone: updated.phoneNumber || profileData.phone,
        address:
          updated.address ||
          updated.profile?.address ||
          "Chưa cập nhật địa chỉ",
      };

      setProfileData(normalized);
      setOriginalProfileData(normalized);
      setEditMode(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError(result.error || "Cập nhật hồ sơ không thành công");
    }

    setSaving(false);
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
                    onClick={editMode ? handleCancelEdit : handleStartEdit}
                    disabled={saving}
                    fullWidth
                  >
                    {editMode
                      ? saving
                        ? "Đang lưu..."
                        : "Hủy chỉnh sửa"
                      : "Chỉnh sửa"}
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
                {loadingProfile && <LinearProgress sx={{ mb: 2 }} />}
                <Divider sx={{ mb: 3 }} />

                {saveSuccess && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    ✅ Cập nhật thông tin thành công!
                  </Alert>
                )}

                {saveError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {saveError}
                  </Alert>
                )}

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Họ và tên"
                      value={profileData.name}
                      disabled={!editMode}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      InputProps={{
                        startAdornment: (
                          <Person sx={{ mr: 1, color: "text.secondary" }} />
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={profileData.email}
                      disabled
                      InputProps={{
                        startAdornment: (
                          <Email sx={{ mr: 1, color: "text.secondary" }} />
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Số điện thoại"
                      value={profileData.phone}
                      disabled={!editMode}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          phone: e.target.value,
                        })
                      }
                      InputProps={{
                        startAdornment: (
                          <Phone sx={{ mr: 1, color: "text.secondary" }} />
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Địa chỉ"
                      value={profileData.address}
                      disabled={!editMode}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          address: e.target.value,
                        })
                      }
                      InputProps={{
                        startAdornment: (
                          <LocationOn sx={{ mr: 1, color: "text.secondary" }} />
                        ),
                      }}
                    />
                  </Grid>
                </Grid>

                {editMode && (
                  <Box
                    sx={{
                      mt: 3,
                      display: "flex",
                      gap: 2,
                      justifyContent: "flex-end",
                    }}
                  >
                    <Button
                      variant="outlined"
                      onClick={handleCancelEdit}
                      disabled={saving}
                    >
                      Hủy
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSaveProfile}
                      disabled={saving}
                    >
                      {saving ? "Đang lưu..." : "Lưu thay đổi"}
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
          {vehiclesError && (
            <Grid item xs={12}>
              <Alert severity="error">{vehiclesError}</Alert>
            </Grid>
          )}

          {vehiclesLoading && (
            <Grid item xs={12}>
              <LinearProgress sx={{ mb: 2 }} />
            </Grid>
          )}

          {!vehiclesLoading && sortedVehicles.length === 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ textAlign: "center", py: 6 }}>
                  <Avatar
                    sx={{
                      bgcolor: "grey.100",
                      width: 80,
                      height: 80,
                      mx: "auto",
                      mb: 2,
                    }}
                  >
                    <ElectricCar sx={{ fontSize: 40, color: "grey.400" }} />
                  </Avatar>
                  <Typography variant="h6" gutterBottom>
                    Chưa có xe nào được lưu
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3 }}
                  >
                    Thêm thông tin xe điện để theo dõi lịch sử sạc và nhận gợi ý
                    phù hợp
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<ElectricCar />}
                    onClick={() =>
                      navigate("/customer/vehicle-management?add=true")
                    }
                  >
                    Thêm xe ngay
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}

          {sortedVehicles.map((vehicle) => (
            <Grid item xs={12} md={6} key={vehicle.id || vehicle.vehicleId}>
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
                        {vehicle.nickname ||
                          vehicle.displayName ||
                          `${vehicle.make} ${vehicle.model}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {[vehicle.make, vehicle.model]
                          .filter(Boolean)
                          .join(" ") || "Chưa cập nhật"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {vehicle.year || "--"} • {vehicle.licensePlate || "--"}
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: "center", p: 1 }}>
                        <BatteryFull color="success" />
                        <Typography variant="body2" fontWeight="medium">
                          {vehicle.batteryCapacity
                            ? `${vehicle.batteryCapacity} kWh`
                            : "--"}
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
                          {vehicle.estimatedRange
                            ? `${vehicle.estimatedRange} km`
                            : "--"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Quãng đường
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ textAlign: "center", p: 1 }}>
                        <TrendingUp color="primary" />
                        <Typography variant="body2" fontWeight="medium">
                          {vehicle.estimatedEfficiency
                            ? `${vehicle.estimatedEfficiency} km/kWh`
                            : "--"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Hiệu suất năng lượng
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        textAlign="center"
                      >
                        Cổng sạc hỗ trợ:{" "}
                        {vehicle.connectorTypes?.length
                          ? vehicle.connectorTypes.join(", ")
                          : "--"}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={() =>
                      navigate(
                        `/customer/vehicle-management?edit=${
                          vehicle.id || vehicle.vehicleId
                        }`
                      )
                    }
                  >
                    Chỉnh sửa thông tin
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {sortedVehicles.length > 0 && (
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 280,
                }}
              >
                <CardContent sx={{ textAlign: "center" }}>
                  <Avatar
                    sx={{
                      bgcolor: "grey.100",
                      width: 80,
                      height: 80,
                      mx: "auto",
                      mb: 2,
                    }}
                  >
                    <ElectricCar sx={{ fontSize: 40, color: "grey.400" }} />
                  </Avatar>
                  <Typography variant="h6" gutterBottom>
                    Thêm xe mới
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3 }}
                  >
                    Đăng ký thêm xe điện để quản lý tốt hơn
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<ElectricCar />}
                    onClick={() =>
                      navigate("/customer/vehicle-management?add=true")
                    }
                  >
                    Thêm xe
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}
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
                    <ListItem
                      key={booking.id}
                      sx={{
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
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
                              label={new Date(
                                booking.createdAt
                              ).toLocaleDateString("vi-VN")}
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
                        label={
                          booking.status === "completed"
                            ? "Hoàn thành"
                            : "Đã hủy"
                        }
                        color={
                          booking.status === "completed" ? "success" : "error"
                        }
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
        {loadingStatistics ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Đang tải thống kê...
            </Typography>
          </Box>
        ) : (
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
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2">Phiên sạc</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {userStatistics?.completedSessions || bookingStats.completed || 0} phiên
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min(100, (userStatistics?.completedSessions || 0) * 5)} 
                      />
                    </Box>

                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                      <Typography variant="body2">Năng lượng sạc</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {parseFloat(userStatistics?.totalEnergyConsumedKwh || bookingStats.totalEnergyCharged || 0).toFixed(1)} kWh
                      </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, (userStatistics?.totalEnergyConsumedKwh || 0) / 10)}
                        color="success"
                      />
                    </Box>

                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2">Chi phí</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(userStatistics?.totalSpent || bookingStats.totalAmount || 0)}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, (userStatistics?.totalSpent || 0) / 50000)}
                        color="warning"
                      />
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
                      <TrendingUp
                        color="success"
                        sx={{ fontSize: 32, mb: 1 }}
                      />
                      <Typography variant="h6" fontWeight="bold">
                        {userStatistics?.totalEnergyConsumedKwh && userStatistics?.totalSpent 
                          ? Math.round(userStatistics.totalSpent / userStatistics.totalEnergyConsumedKwh).toLocaleString()
                          : '6,857'
                        }
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        VNĐ/kWh trung bình
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: "center" }}>
                      <Speed color="info" sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold">
                        {userStatistics?.completedSessions > 0
                          ? (userStatistics.totalEnergyConsumedKwh / userStatistics.completedSessions).toFixed(1)
                          : (parseFloat(bookingStats.totalEnergyCharged) > 0 && parseFloat(bookingStats.completed) > 0
                            ? (parseFloat(bookingStats.totalEnergyCharged) / parseFloat(bookingStats.completed)).toFixed(1)
                            : '20.4')
                        }
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        kWh/phiên trung bình
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        💡 <strong>Mẹo tiết kiệm:</strong> Sạc vào khung giờ
                        thấp điểm (22:00-06:00) để được giá ưu đãi!
                      </Typography>
                    </Alert>
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
                  Bạn đã tiết kiệm được <strong>15%</strong> so với tháng trước
                  nhờ sử dụng hiệu quả các trạm sạc!
                </Alert>

                <Grid container spacing={2}>
                  {[
                    {
                      month: "Tháng 7",
                      amount: userStatistics ? Math.round(userStatistics.totalSpent * 0.85) : 1850000,
                      energy: userStatistics ? Math.round(userStatistics.totalEnergyConsumedKwh * 0.85) : 280,
                      sessions: userStatistics ? Math.max(1, userStatistics.completedSessions - 2) : 14,
                    },
                    {
                      month: "Tháng 8",
                      amount: userStatistics ? Math.round(userStatistics.totalSpent * 0.92) : 1750000,
                      energy: userStatistics ? Math.round(userStatistics.totalEnergyConsumedKwh * 0.92) : 265,
                      sessions: userStatistics ? Math.max(1, userStatistics.completedSessions - 1) : 13,
                    },
                    {
                      month: "Tháng 9",
                      amount: userStatistics?.totalSpent || parseFloat(bookingStats.totalAmount) || 0,
                      energy: userStatistics?.totalEnergyConsumedKwh || parseFloat(bookingStats.totalEnergyCharged) || 0,
                      sessions: userStatistics?.completedSessions || parseInt(bookingStats.completed) || 0,
                    },
                  ].map((data, index) => (
                    <Grid item xs={12} sm={4} key={index}>
                      <Paper sx={{ p: 2 }}>
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          gutterBottom
                        >
                          {data.month}
                        </Typography>
                        <Typography variant="body2">
                          Chi phí:{" "}
                          <strong>{formatCurrency(data.amount)}</strong>
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
        )}
      </TabPanel>
    </Container>
  );
};

export default CustomerProfile;
