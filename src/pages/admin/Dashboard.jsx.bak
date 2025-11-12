import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Snackbar,
  Divider,
} from "@mui/material";

import {
  Dashboard as DashboardIcon,
  ElectricCar,
  People,
  LocationOn,
  TrendingUp,
  Warning,
  CheckCircle,
  Add,
  MoreVert,
  Visibility,
  Edit,
  Delete,
  Analytics,
  PowerSettingsNew,
  MonetizationOn,
  Notifications,
  Settings,
  Download,
  FilterList,
  Search,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import useStationStore from "../../store/stationStore";
import useBookingStore from "../../store/bookingStore";
import { formatCurrency } from "../../utils/helpers";
import { STATION_STATUS, USER_ROLES } from "../../utils/constants";

const AdminDashboard = () => {
  const navigate = useNavigate();
  useAuthStore();
  const { stations } = useStationStore();
  const { bookingHistory } = useBookingStore();
  const [_anchorEl, _setAnchorEl] = useState(null);
  const [_openStationDialog, setOpenStationDialog] = useState(false);
  const [_selectedStation, _setSelectedStation] = useState(null);

  // New states for driver-like flow
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStationForDetail, setSelectedStationForDetail] =
    useState(null);
  const [actionDialog, setActionDialog] = useState({
    open: false,
    type: "",
    station: null,
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // System Overview Stats
  const totalStations = stations.length;
  const activeStations = stations.filter((s) => s.status === "active").length;
  const totalUsers = 0; // TODO: Fetch from user management API
  
  const todayBookings = bookingHistory.filter(
    (b) => new Date(b.createdAt).toDateString() === new Date().toDateString()
  ).length;
  const totalRevenue = bookingHistory.reduce(
    (sum, b) => sum + (b.totalAmount || 0),
    0
  );
  const activeChargingSessions = bookingHistory.filter(
    (b) => b.status === "in_progress"
  ).length;

      // Station Performance với poles/ports structure
  const stationPerformance = stations
    .map((station) => {
      const stationBookings = bookingHistory.filter(
        (b) => b.stationId === station.id
      );
      const revenue = stationBookings.reduce(
        (sum, b) => sum + (b.totalAmount || 0),
        0
      );

      // Tính utilization từ poles/ports
      let totalPorts = 0;
      let occupiedPorts = 0;

      if (station.charging?.poles) {
        station.charging.poles.forEach((pole) => {
          const ports = pole.totalPorts || (pole.ports || []).length;
          totalPorts += ports;
          const available = typeof pole.availablePorts === 'number' ? pole.availablePorts : (pole.ports || []).filter(p=>p.status==='available').length;
          occupiedPorts += Math.max(0, ports - available);
        });
      }

      const utilization =
        totalPorts > 0 ? (occupiedPorts / totalPorts) * 100 : 0;

      return {
        ...station,
        bookingsCount: stationBookings.length,
        revenue,
        utilization,
        totalSlots: totalPorts,
        occupiedSlots: occupiedPorts,
        chargingPostsCount: station.charging?.poles?.length || 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  // Filter stations based on search and status like driver flow
  const filteredStations = stationPerformance.filter((station) => {
    const matchesSearch =
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.location.address
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || station.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle station actions like driver flow
  const handleStationAction = (action, station) => {
    console.log(`${action} station:`, station.name);
    if (action === "view") {
      setSelectedStationForDetail(station);
    } else if (
      action === "edit" ||
      action === "maintenance" ||
      action === "delete"
    ) {
      setActionDialog({ open: true, type: action, station });
    }
  };

  const handleActionComplete = (actionType, stationName) => {
    setSuccessMessage(
      `${actionType} completed successfully for ${stationName}!`
    );
    setShowSuccess(true);
    setActionDialog({ open: false, type: "", station: null });
  };

  const getDistanceToStation = () => {
    // Mock distance calculation for admin view
    return (Math.random() * 10 + 1).toFixed(1);
  };

  // Recent Activities (ngữ cảnh: trụ sạc)
  const _recentActivities = [
    {
      id: 1,
      type: "booking",
  message: "New booking at Tech Park SuperCharger - Pole A",
      time: "5 minutes ago",
      severity: "info",
    },
    {
      id: 2,
      type: "station",
  message: 'Pole B at "Green Mall Hub" went offline',
      time: "15 minutes ago",
      severity: "warning",
    },
    {
      id: 3,
      type: "user",
      message: "New user registration: John Smith",
      time: "30 minutes ago",
      severity: "success",
    },
    {
      id: 4,
      type: "payment",
      message: "DC Fast Charging completed: ₫125,000",
      time: "1 hour ago",
      severity: "success",
    },
    {
      id: 5,
      type: "maintenance",
  message: "Maintenance scheduled for EcoPark Station - All Poles",
      time: "2 hours ago",
      severity: "info",
    },
    {
      id: 6,
      type: "port",
      message: "Port A01 at Tech Park SuperCharger - Pole C is now available",
      time: "3 hours ago",
      severity: "success",
    },
  ];

  const getStatusChip = (status) => {
    const configs = {
      active: { label: "Hoạt động", color: "success" },
      inactive: { label: "Không hoạt động", color: "error" },
      maintenance: { label: "Bảo trì", color: "warning" },
      construction: { label: "Construction", color: "info" },
    };

    const config = configs[status] || configs.inactive;
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const _getSeverityColor = (severity) => {
    switch (severity) {
      case "success":
        return "success.main";
      case "warning":
        return "warning.main";
      case "error":
        return "error.main";
      default:
        return "info.main";
    }
  };

  return (
    <Box>
      {/* Header */}
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
            Quản trị hệ thống 🔧
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Giám sát và quản lý mạng lưới sạc SkaEV
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate("/admin/stations/new")}
          >
            Thêm trạm sạc
          </Button>
        </Box>
      </Box>

      {/* Alert for Critical Issues */}
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Cảnh báo hệ thống:</strong> 2 trạm sạc cần được chú ý ngay lập
          tức.
          <Button size="small" sx={{ ml: 1 }}>
            Xem chi tiết
          </Button>
        </Typography>
      </Alert>

      {/* Search & Filters - Driver-like flow */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            {/* Search Bar */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search stations by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Search sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />
            </Grid>

            {/* Status Filter */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Station Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="construction">Construction</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Results Count */}
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                {filteredStations.length} stations found
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "linear-gradient(135deg, #1379FF 0%, #0D5FDD 100%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                  <LocationOn />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {totalStations}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Stations
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {activeStations} hoạt động
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {totalUsers}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Users
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    +12 this week
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                  <ElectricCar />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {activeChargingSessions}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Phiên hoạt động
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {todayBookings} today
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                  <MonetizationOn />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(totalRevenue)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Revenue
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    +18% vs last month
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Station List - Driver-like flow */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {filteredStations.length} Stations Found
              </Typography>

              <Box sx={{ maxHeight: 600, overflowY: "auto" }}>
                {filteredStations.map((station) => (
                  <Box key={station.id}>
                    <Paper
                      sx={{
                        p: 2,
                        mb: 2,
                        border:
                          selectedStationForDetail?.id === station.id ? 2 : 1,
                        borderColor:
                          selectedStationForDetail?.id === station.id
                            ? "primary.main"
                            : "divider",
                        "&:hover": {
                          backgroundColor: "grey.50",
                          cursor: "pointer",
                        },
                      }}
                      onClick={() => setSelectedStationForDetail(station)}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          mb: 2,
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: "primary.main",
                            width: 60,
                            height: 60,
                          }}
                        >
                          <LocationOn />
                        </Avatar>

                        <Box sx={{ flexGrow: 1 }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "start",
                              mb: 1,
                            }}
                          >
                            <Typography variant="h6" fontWeight="bold">
                              {station.name}
                            </Typography>
                            {getStatusChip(station.status)}
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1,
                            }}
                          >
                            <LocationOn
                              sx={{ fontSize: 16, color: "text.secondary" }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {station.location.address} •{" "}
                              {getDistanceToStation(station)}km from center
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                              mb: 1,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <ElectricCar
                                sx={{ fontSize: 16, color: "primary.main" }}
                              />
                              <Typography variant="body2">
                                {station.chargingPostsCount} trụ, {station.totalSlots} cổng
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <MonetizationOn
                                sx={{ fontSize: 16, color: "success.main" }}
                              />
                              <Typography variant="body2">
                                {formatCurrency(station.revenue)} revenue
                              </Typography>
                            </Box>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Utilization: {station.utilization.toFixed(0)}%
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={station.utilization}
                                sx={{ width: 60, height: 4 }}
                              />
                            </Box>
                            <Chip
                              label={`${station.bookingsCount} sessions`}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              label={`${
                                station.totalSlots - station.occupiedSlots
                              } available`}
                              color="success"
                              size="small"
                            />
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                          }}
                        >
                          <Button
                            variant="contained"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStationAction("edit", station);
                            }}
                            startIcon={<Edit />}
                          >
                            Manage
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStationAction("maintenance", station);
                            }}
                            startIcon={<Settings />}
                          >
                            Maintenance
                          </Button>
                        </Box>
                      </Box>
                    </Paper>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Station Details Panel - Driver-like flow */}
        <Grid item xs={12} md={4}>
          {selectedStationForDetail ? (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {selectedStationForDetail.name}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Avatar
                    sx={{
                      width: "100%",
                      height: 150,
                      borderRadius: 2,
                      bgcolor: "primary.main",
                    }}
                  >
                    <LocationOn sx={{ fontSize: 40 }} />
                  </Avatar>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    color: "text.secondary",
                    fontSize: "0.875rem",
                    mb: 1,
                  }}
                >
                  <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                  {selectedStationForDetail.location.address}
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Distance: {getDistanceToStation(selectedStationForDetail)}km
                  from center
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Station Information
                </Typography>
                <Box sx={{ fontSize: "0.875rem", mb: 1 }}>
                  • Status: {selectedStationForDetail.status}
                </Box>
                <Box sx={{ fontSize: "0.875rem", mb: 1 }}>
                  • Trụ: {selectedStationForDetail.chargingPostsCount}
                </Box>
                <Box sx={{ fontSize: "0.875rem", mb: 1 }}>
                  • Tổng số cổng: {selectedStationForDetail.totalSlots}
                </Box>
                <Box sx={{ fontSize: "0.875rem", mb: 1 }}>
                  • Cổng khả dụng: {selectedStationForDetail.totalSlots - selectedStationForDetail.occupiedSlots}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Performance
                </Typography>
                <Box sx={{ fontSize: "0.875rem", mb: 1 }}>
                  • Utilization:{" "}
                  {selectedStationForDetail.utilization.toFixed(1)}%
                </Box>
                <Box sx={{ fontSize: "0.875rem", mb: 1 }}>
                  • Sessions: {selectedStationForDetail.bookingsCount}
                </Box>
                <Box sx={{ fontSize: "0.875rem", mb: 1 }}>
                  • Revenue: {formatCurrency(selectedStationForDetail.revenue)}
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    mt: 2,
                  }}
                >
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() =>
                      handleStationAction("edit", selectedStationForDetail)
                    }
                  >
                    Manage Station
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() =>
                      handleStationAction(
                        "maintenance",
                        selectedStationForDetail
                      )
                    }
                  >
                    Schedule Maintenance
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Select a Station
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose a station from the list to see detailed information and
                  management options.
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Quick Actions
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Analytics />}
                  fullWidth
                  onClick={() => navigate("/admin/analytics")}
                >
                  View Analytics
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<People />}
                  fullWidth
                  onClick={() => navigate("/admin/users")}
                >
                  Manage Users
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<LocationOn />}
                  fullWidth
                  onClick={() => navigate("/admin/stations")}
                >
                  Manage Stations
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Settings />}
                  fullWidth
                  onClick={() => navigate("/admin/settings")}
                >
                  System Settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Dialogs - Driver-like flow */}
      <Dialog
        open={actionDialog.open && actionDialog.type === "edit"}
        onClose={() =>
          setActionDialog({ open: false, type: "", station: null })
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Station: {actionDialog.station?.name}</DialogTitle>
        <DialogContent>
                <Typography variant="body2" sx={{ mb: 2 }}>
            Manage station settings, trụ sạc, and operational parameters.
          </Typography>
          <TextField
            fullWidth
            label="Station Name"
            defaultValue={actionDialog.station?.name}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select defaultValue={actionDialog.station?.status}>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setActionDialog({ open: false, type: "", station: null })
            }
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() =>
              handleActionComplete(
                "Station management",
                actionDialog.station?.name
              )
            }
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={actionDialog.open && actionDialog.type === "maintenance"}
        onClose={() =>
          setActionDialog({ open: false, type: "", station: null })
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Schedule Maintenance: {actionDialog.station?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Schedule maintenance for poles and ports.
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Pole</InputLabel>
            <Select>
              {actionDialog.station?.charging?.poles?.map((pole) => (
                <MenuItem key={pole.id} value={pole.id}>
                  {pole.name} ({pole.type} - {pole.power}kW)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Issue Description"
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setActionDialog({ open: false, type: "", station: null })
            }
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() =>
              handleActionComplete(
                "Maintenance scheduling",
                actionDialog.station?.name
              )
            }
          >
            Schedule Maintenance
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={actionDialog.open && actionDialog.type === "delete"}
        onClose={() =>
          setActionDialog({ open: false, type: "", station: null })
        }
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Station</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone!
          </Alert>
          <Typography variant="body2">
            Are you sure you want to delete{" "}
            <strong>{actionDialog.station?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setActionDialog({ open: false, type: "", station: null })
            }
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() =>
              handleActionComplete(
                "Station deletion",
                actionDialog.station?.name
              )
            }
          >
            Delete Station
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar - Driver-like flow */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={4000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setShowSuccess(false)}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: "fixed", bottom: 24, right: 24 }}
        onClick={() => setOpenStationDialog(true)}
      >
        <Notifications />
      </Fab>
    </Box>
  );
};

export default AdminDashboard;
