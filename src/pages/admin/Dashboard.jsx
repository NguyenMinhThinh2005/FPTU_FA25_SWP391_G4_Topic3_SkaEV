import React, { useState, useEffect } from "react";
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
  Container,
  Stack,
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
import { formatCurrency } from "../../utils/helpers";
import { STATION_STATUS, USER_ROLES } from "../../utils/constants";
import reportsAPI from "../../services/api/reportsAPI";
import staffAPI from "../../services/api/staffAPI";

const AdminDashboard = () => {
  const navigate = useNavigate();
  useAuthStore();
  const { stations, fetchStations } = useStationStore();
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

  // Real-time stats from API
  const [dashboardStats, setDashboardStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    todayBookings: 0,
    todayRevenue: 0,
    totalEnergy: 0,
    activeChargingSessions: 0,
    totalUsers: 0,
  });
  const [stationPerformance, setStationPerformance] = useState([]);
  const [_loading, setLoading] = useState(true);

  // Fetch stations and stats on component mount
  useEffect(() => {
    console.log("🔄 Admin Dashboard mounted - fetching data...");
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch stations
        await fetchStations();
        
        // Fetch real stats from API
        const stats = await reportsAPI.getDashboardSummary();
        console.log("✅ Dashboard stats from API:", stats);
        
        // Fetch active sessions
        const activeSessions = await staffAPI.getActiveSessions();
        
        setDashboardStats({
          totalRevenue: stats.totalRevenue || 0,
          totalBookings: stats.totalBookings || 0,
          todayBookings: stats.todayBookings || 0,
          todayRevenue: stats.todayRevenue || 0,
          totalEnergy: stats.totalEnergy || 0,
          activeChargingSessions: activeSessions?.length || 0,
          totalUsers: stats.totalUsers || 0, // TODO: Add to backend
        });
        
        setLoading(false);
      } catch (error) {
        console.error("❌ Error loading dashboard data:", error);
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, [fetchStations]);

  // Calculate station performance from stations data
  useEffect(() => {
    if (stations.length > 0) {
      const performance = stations.map((station) => {
        // Calculate utilization from poles/ports
        let totalPorts = 0;
        let occupiedPorts = 0;

        if (station.charging?.poles) {
          station.charging.poles.forEach((pole) => {
            const ports = pole.totalPorts || (pole.ports || []).length;
            totalPorts += ports;
            const available = typeof pole.availablePorts === 'number' 
              ? pole.availablePorts 
              : (pole.ports || []).filter(p => p.status === 'available').length;
            occupiedPorts += Math.max(0, ports - available);
          });
        }

        const utilization = totalPorts > 0 ? (occupiedPorts / totalPorts) * 100 : 0;

        return {
          ...station,
          bookingsCount: 0, // Will be updated from API if needed
          revenue: 0, // Will be updated from API if needed
          utilization,
          totalSlots: totalPorts,
          occupiedSlots: occupiedPorts,
          chargingPostsCount: station.charging?.poles?.length || 0,
        };
      });
      
      setStationPerformance(performance);
    }
  }, [stations]);

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
  const _handleStationAction = (action, station) => {
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
      construction: { label: "Đang xây dựng", color: "info" },
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
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Quản trị hệ thống
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Giám sát và quản lý mạng lưới sạc SkaEV
        </Typography>
      </Box>

      {/* Alert for Critical Issues */}
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Cảnh báo hệ thống:</strong> 2 trạm sạc cần được chú ý ngay lập
          tức
        </Typography>
      </Alert>

      {/* Search & Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm trạm theo tên hoặc địa điểm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Search sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái trạm</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="active">Hoạt động</MenuItem>
                  <MenuItem value="inactive">Không hoạt động</MenuItem>
                  <MenuItem value="maintenance">Bảo trì</MenuItem>
                  <MenuItem value="construction">Đang xây dựng</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                Tìm thấy {filteredStations.length} trạm
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  mx: "auto",
                  mb: 2,
                  width: 56,
                  height: 56,
                }}
              >
                <LocationOn />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {stations.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tổng số trạm
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stations.filter((s) => s.status === "active").length} hoạt động
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Avatar
                sx={{
                  bgcolor: "success.main",
                  mx: "auto",
                  mb: 2,
                  width: 56,
                  height: 56,
                }}
              >
                <People />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {dashboardStats.totalUsers || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tổng người dùng
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {dashboardStats.totalBookings || 0} bookings
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Avatar
                sx={{
                  bgcolor: "warning.main",
                  mx: "auto",
                  mb: 2,
                  width: 56,
                  height: 56,
                }}
              >
                <ElectricCar />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {dashboardStats.activeChargingSessions}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Phiên hoạt động
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {dashboardStats.todayBookings} hôm nay
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Avatar
                sx={{
                  bgcolor: "info.main",
                  mx: "auto",
                  mb: 2,
                  width: 56,
                  height: 56,
                }}
              >
                <MonetizationOn />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(dashboardStats.totalRevenue)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tổng doanh thu
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatCurrency(dashboardStats.todayRevenue)} hôm nay
              </Typography>
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
                Tìm thấy {filteredStations.length} trạm
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
                              {getDistanceToStation(station)}km từ trung tâm
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
                                {formatCurrency(station.revenue)} doanh thu
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
                                Tỷ lệ sử dụng: {station.utilization.toFixed(0)}%
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={station.utilization}
                                sx={{ width: 60, height: 4 }}
                              />
                            </Box>
                            <Chip
                              label={`${station.bookingsCount} phiên`}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              label={`${
                                station.totalSlots - station.occupiedSlots
                              } khả dụng`}
                              color="success"
                              size="small"
                            />
                          </Box>
                        </Box>

                        {/* Removed Manage and Maintenance buttons */}
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
                  Khoảng cách: {getDistanceToStation(selectedStationForDetail)}km
                  từ trung tâm
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Thông tin trạm
                </Typography>
                <Box sx={{ fontSize: "0.875rem", mb: 1 }}>
                  • Trạng thái: {selectedStationForDetail.status}
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
                  Hiệu suất
                </Typography>
                <Box sx={{ fontSize: "0.875rem", mb: 1 }}>
                  • Tỷ lệ sử dụng:{" "}
                  {selectedStationForDetail.utilization.toFixed(1)}%
                </Box>
                <Box sx={{ fontSize: "0.875rem", mb: 1 }}>
                  • Phiên: {selectedStationForDetail.bookingsCount}
                </Box>
                <Box sx={{ fontSize: "0.875rem", mb: 1 }}>
                  • Doanh thu: {formatCurrency(selectedStationForDetail.revenue)}
                </Box>

                {/* Removed Manage Station and Schedule Maintenance buttons */}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Chọn một trạm
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Chọn trạm từ danh sách để xem thông tin chi tiết.
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Thao tác nhanh
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Analytics />}
                  fullWidth
                  onClick={() => navigate("/admin/analytics")}
                >
                  Xem phân tích
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<People />}
                  fullWidth
                  onClick={() => navigate("/admin/users")}
                >
                  Quản lý người dùng
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<LocationOn />}
                  fullWidth
                  onClick={() => navigate("/admin/stations")}
                >
                  Quản lý trạm
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
    </Container>
  );
};

export default AdminDashboard;
