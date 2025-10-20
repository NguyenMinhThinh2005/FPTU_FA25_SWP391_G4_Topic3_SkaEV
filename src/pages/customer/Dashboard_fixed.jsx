/* eslint-disable */
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Paper,
  CardActions,
  Tooltip,
} from "@mui/material";
import {
  ElectricCar,
  Schedule,
  Payment,
  Star,
  LocationOn,
  TrendingUp,
  MoreVert,
  Notifications,
  Speed,
  Battery80,
  Timer,
  CheckCircle,
  Warning,
  Cancel,
  Navigation,
  LocalGasStation,
  Nature,
  BatteryChargingFull,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import useStationStore from "../../store/stationStore";
import {
  formatCurrency,
  formatDate,
  formatTime,
  calculateDistance,
} from "../../utils/helpers";
import { BOOKING_STATUS, STATION_STATUS } from "../../utils/constants";

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { stations, nearbyStations, fetchNearbyStations } = useStationStore();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  // Get user's booking data
  const userBookings = bookings.filter(
    (booking) => booking.userId === user?.id
  );
  const recentBookings = userBookings.slice(0, 4);
  const activeBooking = userBookings.find(
    (booking) => booking.status === "in_progress"
  );

  // Enhanced stats
  const totalSessions = userBookings.length;
  const totalSpent = userBookings.reduce(
    (sum, booking) => sum + booking.cost,
    0
  );
  const completedSessions = userBookings.filter(
    (booking) => booking.status === "completed"
  ).length;
  const totalEnergyCharged = userBookings.reduce(
    (sum, booking) => sum + (booking.energyDelivered || 0),
    0
  );
  const avgSessionDuration =
    userBookings.length > 0
      ? Math.round(
        userBookings.reduce((sum, booking) => sum + booking.duration, 0) /
        userBookings.length
      )
      : 0;

  // Environmental impact
  const co2Saved = Math.round(totalEnergyCharged * 0.5); // Rough calculation: 0.5kg CO2 saved per kWh

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          fetchNearbyStations && fetchNearbyStations(position.coords, 10);
        },
        (error) => {
          console.warn("Location access denied");
          setUserLocation({ lat: 10.7769, lng: 106.7009 }); // Default to Ho Chi Minh City
        }
      );
    }

    // Mock notifications
    setNotifications([
      {
        id: 1,
        type: "success",
        message:
          "Your last charging session at Tech Park SuperCharger completed successfully!",
        time: "5 mins ago",
      },
      {
        id: 2,
        type: "info",
        message: "New fast charging station opened near your location",
        time: "1 hour ago",
      },
    ]);

    return () => clearTimeout(timer);
  }, [fetchNearbyStations]);

  const handleNotificationClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setAnchorEl(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle color="success" />;
      case "in_progress":
        return <BatteryChargingFull color="info" />;
      case "cancelled":
        return <Cancel color="error" />;
      default:
        return <Schedule color="warning" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "success";
      case "in_progress":
        return "info";
      case "cancelled":
        return "error";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Welcome Header with Notifications */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Chào mừng trở lại, {user?.profile?.firstName || 'Tài xế'}! ✨
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your electric journey dashboard - Let's charge up your day!
          </Typography>
        </Box>
        <Box>
          <Tooltip title="Notifications">
            <IconButton
              onClick={handleNotificationClick}
              sx={{ position: "relative" }}
            >
              <Notifications />
              {notifications.length > 0 && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 5,
                    right: 5,
                    width: 12,
                    height: 12,
                    backgroundColor: "error.main",
                    borderRadius: "50%",
                  }}
                />
              )}
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleNotificationClose}
            PaperProps={{ sx: { width: 300, maxHeight: 400 } }}
          >
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <MenuItem
                  key={notification.id}
                  onClick={handleNotificationClose}
                >
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {notification.time}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            ) : (
              <MenuItem onClick={handleNotificationClose}>
                <Typography variant="body2" color="text.secondary">
                  No new notifications
                </Typography>
              </MenuItem>
            )}
          </Menu>
        </Box>
      </Box>

      {/* Active Session Alert */}
      {activeBooking && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small">
              Xem chi tiáº¿t
            </Button>
          }
        >
          <Typography variant="body2">
            <strong>Active Charging Session:</strong>{" "}
            {activeBooking.stationName} -{activeBooking.duration} minutes
            remaining
          </Typography>
        </Alert>
      )}

      {/* Enhanced Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              height: "100%",
              background: "linear-gradient(135deg, #1379FF 0%, #0D5FDD 100%)",
            }}
          >
            <CardContent sx={{ color: "white" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                  <ElectricCar />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {totalSessions}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Sessions
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              height: "100%",
              background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
            }}
          >
            <CardContent sx={{ color: "white" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                  <Payment />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(totalSpent)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Spent
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              height: "100%",
              background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
            }}
          >
            <CardContent sx={{ color: "white" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                  <Battery80 />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {totalEnergyCharged.toFixed(1)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    kWh Charged
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              height: "100%",
              background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
            }}
          >
            <CardContent sx={{ color: "white" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                  <Timer />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {avgSessionDuration}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Avg Minutes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              height: "100%",
              background: "linear-gradient(135deg, #B5FF3D 0%, #84CC16 100%)",
            }}
          >
            <CardContent sx={{ color: "black" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "rgba(0,0,0,0.1)" }}>
                  <Nature />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {co2Saved}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    kg CO₂ Saved
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Bookings */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6" fontWeight="bold">
                  Recent Charging Sessions
                </Typography>
                <Button size="small" variant="outlined">
                  View All
                </Button>
              </Box>
              <List>
                {recentBookings.map((booking, index) => (
                  <React.Fragment key={booking.id}>
                    <ListItem
                      sx={{
                        borderRadius: 2,
                        mb: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        "&:hover": { backgroundColor: "grey.50" },
                      }}
                    >
                      <ListItemIcon>
                        {getStatusIcon(booking.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "start",
                            }}
                          >
                            <Box>
                              <Typography
                                variant="subtitle1"
                                fontWeight="medium"
                              >
                                {booking.stationName}
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  mt: 0.5,
                                }}
                              >
                                <LocationOn
                                  sx={{ fontSize: 14, color: "text.secondary" }}
                                />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Port {booking.portNumber} â€¢{" "}
                                  {booking.connectorType}
                                </Typography>
                              </Box>
                            </Box>
                            <Chip
                              label={booking.status.replace("_", " ")}
                              color={getStatusColor(booking.status)}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(booking.date)} â€¢ {booking.duration}{" "}
                              minutes
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mt: 0.5,
                              }}
                            >
                              <Typography variant="body2" fontWeight="medium">
                                {booking.energyDelivered?.toFixed(1)} kWh â€¢{" "}
                                {formatCurrency(booking.cost)}
                              </Typography>
                              {booking.status === "completed" && (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  <Star
                                    sx={{ fontSize: 14, color: "warning.main" }}
                                  />
                                  <Typography variant="caption">
                                    {booking.rating || "Đánh giá phiên này"}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        }
                      />
                      <IconButton size="small">
                        <MoreVert />
                      </IconButton>
                    </ListItem>
                    {index < recentBookings.length - 1 && (
                      <Divider sx={{ my: 1 }} />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Quick Actions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<LocationOn />}
                  fullWidth
                  size="large"
                  onClick={() => navigate("/customer/find-stations")}
                >
                  Find Nearby Stations
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Schedule />}
                  fullWidth
                  onClick={() => navigate("/customer/bookings")}
                >
                  Book New Session
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Payment />}
                  fullWidth
                  onClick={() => navigate("/customer/payment")}
                >
                  Payment History
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Star />}
                  fullWidth
                  onClick={() => navigate("/customer/reviews")}
                >
                  Rate & Review
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Nearby Stations */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Nearby Stations
              </Typography>
              {stations.slice(0, 3).map((station) => (
                <Paper
                  key={station.id}
                  sx={{
                    p: 2,
                    mb: 2,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight="medium">
                      {station.name}
                    </Typography>
                    <Chip
                      label={
                        station.charging.availablePorts > 0
                          ? "Available"
                          : "Full"
                      }
                      color={
                        station.charging.availablePorts > 0
                          ? "success"
                          : "warning"
                      }
                      size="small"
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    {userLocation &&
                      calculateDistance &&
                      `${calculateDistance(
                        userLocation.lat,
                        userLocation.lng,
                        station.location.coordinates.lat,
                        station.location.coordinates.lng
                      ).toFixed(1)}km away`}{" "}
                    â€¢ Up to {station.charging.maxPower}kW
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mt: 1,
                    }}
                  >
                    <Typography variant="caption">
                      {formatCurrency(station.charging.pricing.acRate)}/kWh
                    </Typography>
                    <Button size="small" variant="outlined">
                      Book
                    </Button>
                  </Box>
                </Paper>
              ))}
              <Button variant="text" fullWidth size="small">
                View All Stations
              </Button>
            </CardContent>
          </Card>

          {/* Profile Card */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Your Profile
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <Avatar sx={{ width: 60, height: 60, bgcolor: "primary.main" }}>
                  {user?.profile?.firstName?.charAt(0) || 'N'}
                </Avatar>
                <Box>
                                  <Typography variant="subtitle1" fontWeight="medium">
                          {user?.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'Khách hàng'}
                        </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.email}
                  </Typography>
                  <Chip
                    label={user?.role}
                    size="small"
                    color="primary"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={75}
                sx={{ mb: 1, borderRadius: 2 }}
              />
              <Typography variant="caption" color="text.secondary">
                Profile Completeness: 75%
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" fullWidth variant="outlined">
                Edit Profile
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CustomerDashboard;

