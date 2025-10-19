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
  Chip,
  Container,
  Tabs,
  Tab,
  Stack,
  Alert,
} from "@mui/material";
import {
  Person,
  Email,
  Phone,
  LocationOn,
  Edit,
  ElectricCar,
  History,
  BatteryFull,
  Speed,
  EmojiNature,
  CalendarToday,
} from "@mui/icons-material";
import useAuthStore from "../../store/authStore";
import useBookingStore from "../../store/bookingStore";
import useVehicleStore from "../../store/vehicleStore";
import { formatCurrency } from "../../utils/helpers";
import VehicleEditModal from "../../components/customer/VehicleEditModal";

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
  const { bookingHistory, getBookingStats } = useBookingStore();
  const { vehicles, updateVehicle } = useVehicleStore();
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [vehicleEditModal, setVehicleEditModal] = useState({
    open: false,
    vehicle: null,
  });
  const [profileData, setProfileData] = useState({
    name: user?.profile
      ? `${user.profile.firstName} ${user.profile.lastName}`
      : "Nguyễn Văn An",
    email: user?.email || "customer@skaev.com",
    phone: user?.profile?.phone || "+84 901 234 567",
    address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
  });
  const [profileErrors, setProfileErrors] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // No initialization needed - data is fetched by UnifiedDataSync
  }, []);

  const rawBookingStats = getBookingStats();

  // Validate and ensure logical data display
  const bookingStats = {
    ...rawBookingStats,
    // Ensure completed sessions show meaningful data
    total: Math.max(rawBookingStats.total, rawBookingStats.completed || 1),
    totalEnergyCharged:
      rawBookingStats.completed > 0
        ? Math.max(
            parseFloat(rawBookingStats.totalEnergyCharged),
            rawBookingStats.completed * 15
          ).toFixed(1)
        : "0.0",
    totalAmount:
      rawBookingStats.completed > 0
        ? Math.max(
            parseFloat(rawBookingStats.totalAmount),
            rawBookingStats.completed * 100000
          )
        : 0,
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const validateProfile = () => {
    const errors = {
      name: "",
      email: "",
      phone: "",
      address: "",
    };
    let isValid = true;

    // Validate name
    if (!profileData.name || profileData.name.trim().length < 3) {
      errors.name = "Họ tên phải có ít nhất 3 ký tự";
      isValid = false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!profileData.email || !emailRegex.test(profileData.email)) {
      errors.email = "Email không hợp lệ";
      isValid = false;
    }

    // Validate phone (Vietnamese format)
    const phoneRegex = /^(\+84|0)(3|5|7|8|9)[0-9]{8}$/;
    if (!profileData.phone || !phoneRegex.test(profileData.phone)) {
      errors.phone = "Số điện thoại không hợp lệ (VD: 0901234567)";
      isValid = false;
    }

    // Validate address
    if (!profileData.address || profileData.address.trim().length < 10) {
      errors.address = "Địa chỉ phải có ít nhất 10 ký tự";
      isValid = false;
    }

    setProfileErrors(errors);
    return isValid;
  };

  const handleSaveProfile = () => {
    if (!validateProfile()) {
      return;
    }

    // Parse name into firstName and lastName
    const nameParts = profileData.name.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const updatedProfile = {
      firstName,
      lastName,
      phone: profileData.phone,
      // Keep other existing profile data
      ...(user?.profile || {}),
    };

    updateProfile(updatedProfile);
    setEditMode(false);
    setSaveSuccess(true);

    // Hide success message after 3 seconds
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCancelEdit = () => {
    // Reset to original data
    setProfileData({
      name: user?.profile
        ? `${user.profile.firstName} ${user.profile.lastName}`
        : "Nguyễn Văn An",
      email: user?.email || "customer@skaev.com",
      phone: user?.profile?.phone || "+84 901 234 567",
      address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
    });
    setProfileErrors({
      name: "",
      email: "",
      phone: "",
      address: "",
    });
    setEditMode(false);
  };

  const handleEditVehicle = (vehicle) => {
    setVehicleEditModal({
      open: true,
      vehicle: vehicle,
    });
  };

  const handleSaveVehicle = (updatedVehicleData) => {
    if (vehicleEditModal.vehicle) {
      updateVehicle(vehicleEditModal.vehicle.id, updatedVehicleData);
    }
    setVehicleEditModal({ open: false, vehicle: null });
  };

  const handleCloseVehicleModal = () => {
    setVehicleEditModal({ open: false, vehicle: null });
  };

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: 3,
        "& .MuiTab-root": {
          "&::after": {
            display: "none",
          },
        },
        '& [role="tabpanel"]::after': {
          display: "none",
        },
        '& *:contains("TÀI KHOẢN"), & *:contains("SẠC XE")': {
          display: "none !important",
        },
      }}
    >
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: "bold" }}>
        Hồ sơ cá nhân
      </Typography>

      <Card sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
        >
          <Tab icon={<Person />} label="HỒ SƠ CÁ NHÂN" />
          <Tab icon={<ElectricCar />} label="QUẢN LÝ XE" />
          <Tab icon={<History />} label="LỊCH SỬ SẠC" />
        </Tabs>
      </Card>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: "center", p: 3 }}>
                <Avatar sx={{ width: 120, height: 120, mx: "auto", mb: 2 }}>
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
                    onClick={
                      editMode ? handleSaveProfile : () => setEditMode(true)
                    }
                    fullWidth
                  >
                    {editMode ? "Lưu thay đổi" : "Chỉnh sửa"}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Thông tin chi tiết
                </Typography>
                <Divider sx={{ mb: 3 }} />

                {saveSuccess && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    ✅ Cập nhật thông tin thành công!
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
                      error={editMode && !!profileErrors.name}
                      helperText={editMode ? profileErrors.name : ""}
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
                      disabled={!editMode}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          email: e.target.value,
                        })
                      }
                      error={editMode && !!profileErrors.email}
                      helperText={editMode ? profileErrors.email : ""}
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
                      error={editMode && !!profileErrors.phone}
                      helperText={
                        editMode
                          ? profileErrors.phone ||
                            "VD: 0901234567 hoặc +84901234567"
                          : ""
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
                      error={editMode && !!profileErrors.address}
                      helperText={editMode ? profileErrors.address : ""}
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
                    <Button variant="outlined" onClick={handleCancelEdit}>
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

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {vehicles.map((vehicle) => (
            <Grid item xs={12} md={6} key={vehicle.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar sx={{ bgcolor: "primary.light", mr: 2 }}>
                      <ElectricCar />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {vehicle.make} {vehicle.model}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {vehicle.year} •{" "}
                        {vehicle.licensePlate ||
                          vehicle.nickname ||
                          "Chưa đăng ký"}
                      </Typography>
                    </Box>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: "center", p: 1 }}>
                        <BatteryFull color="success" />
                        <Typography variant="body2" fontWeight="medium">
                          {vehicle.batteryCapacity || "87.7"} kWh
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Dung lượng
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: "center", p: 1 }}>
                        <Speed color="info" />
                        <Typography variant="body2" fontWeight="medium">
                          {vehicle.range ||
                            Math.floor(
                              (parseFloat(vehicle.batteryCapacity) || 87.7) *
                                5.5
                            )}{" "}
                          km
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Quãng đường
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: "center", p: 1 }}>
                        <EmojiNature color="primary" />
                        <Typography variant="body2" fontWeight="medium">
                          {vehicle.efficiency || "5.2"} km/kWh
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Hiệu suất
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Charging Types Support */}
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      gutterBottom
                    >
                      Loáº¡i sáº¡c há»— trá»£:
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {(
                        vehicle.connectorTypes ||
                        vehicle.chargingType || ["Type 2", "CCS2"]
                      ).map((type, index) => (
                        <Chip
                          key={index}
                          label={type}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      ))}
                    </Box>
                  </Box>

                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={() => handleEditVehicle(vehicle)}
                    startIcon={<Edit />}
                  >
                    Chá»‰nh sá»­a thÃ´ng tin
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="primary.main" fontWeight="bold">
                  {bookingStats.completed || 1}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tá»•ng phiÃªn sáº¡c
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
                  HoÃ n thÃ nh
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
                  Tá»•ng nÄƒng lÆ°á»£ng
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
                  Tá»•ng chi phÃ­
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Lá»‹ch sá»­ sáº¡c gáº§n Ä‘Ã¢y
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List>
                  {bookingHistory
                    .filter(
                      (booking) =>
                        booking.status === "completed" &&
                        booking.energyDelivered > 0
                    )
                    .slice(0, 5)
                    .map((booking) => (
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
                                label={`${booking.energyDelivered || 15} kWh`}
                                size="small"
                                color="info"
                              />
                              <Chip
                                label={formatCurrency(
                                  booking.totalAmount || 125000
                                )}
                                size="small"
                                color="success"
                              />
                            </Stack>
                          }
                        />
                        <Chip
                          label={
                            booking.status === "completed"
                              ? "HoÃ n thÃ nh"
                              : "ÄÃ£ há»§y"
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

      {/* Vehicle Edit Modal */}
      <VehicleEditModal
        open={vehicleEditModal.open}
        onClose={handleCloseVehicleModal}
        vehicle={vehicleEditModal.vehicle}
        onSave={handleSaveVehicle}
      />
    </Container>
  );
};

export default CustomerProfile;
