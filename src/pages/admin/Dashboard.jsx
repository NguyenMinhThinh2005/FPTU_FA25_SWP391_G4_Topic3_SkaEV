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
import { mockData } from "../../data/mockData";
import {
  formatCurrency,
} from "../../utils/helpers";
import { STATION_STATUS, USER_ROLES } from "../../utils/constants";
import EditStationModal from "../../components/admin/EditStationModal";
import ScheduleMaintenanceModal from "../../components/admin/ScheduleMaintenanceModal";

const AdminDashboard = () => {
  const navigate = useNavigate();
  useAuthStore();
  const { stations, updateStation, addStation, deleteStation } = useStationStore();
  useState("today");
  const [anchorEl, setAnchorEl] = useState(null);
  const [openStationDialog, setOpenStationDialog] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [inlineEdit, setInlineEdit] = useState(false);
  const [inlineForm, setInlineForm] = useState({ name: "", address: "", totalPorts: 0, fastChargePorts: 0, standardPorts: 0, pricePerKwh: 0, status: "active" });
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [addForm, setAddForm] = useState({
    name: "",
    address: "",
    totalPorts: 4,
    fastChargePorts: 2,
    standardPorts: 2,
    pricePerKwh: 3500,
    operatingHours: "24/7",
    status: "active",
  });
  const [addErrors, setAddErrors] = useState({});

  // Debug: Log when stations change
  useEffect(() => {
    console.log('🔄 Stations updated in Dashboard:', stations.length);
    stations.forEach(station => {
      console.log(`Station ${station.name}:`, {
        id: station.id,
        status: station.status,
        totalPorts: station.charging?.totalPorts,
        lastUpdated: station.lastUpdated
      });
    });
  }, [stations]);

  // System Overview Stats (recalculated when stations change)
  const totalStations = stations.length;
  const activeStations = stations.filter((s) => s.status === "active").length;
  const totalUsers = mockData.users.length;
  mockData.bookings.length;
  const todayBookings = mockData.bookings.filter(
    (b) => new Date(b.date).toDateString() === new Date().toDateString()
  ).length;
  const totalRevenue = mockData.bookings.reduce((sum, b) => sum + b.cost, 0);
  const activeChargingSessions = mockData.bookings.filter(
    (b) => b.status === "in_progress"
  ).length;

  // Station Performance với chargingPosts structure
  const stationPerformance = stations
    .map((station) => {
      const stationBookings = mockData.bookings.filter(
        (b) => b.stationId === station.id
      );
      const revenue = stationBookings.reduce((sum, b) => sum + b.cost, 0);

      // Tính utilization từ chargingPosts hoặc totalPorts
      let totalSlots = 0;
      let occupiedSlots = 0;
      let chargingPostsCount = 0;

      if (station.charging?.totalPorts) {
        // Ưu tiên totalPorts nếu đã được cập nhật từ UI
        totalSlots = station.charging.totalPorts;
        if (station.charging?.availablePorts != null) {
          occupiedSlots = Math.max(0, totalSlots - station.charging.availablePorts);
        } else if (station.charging?.chargingPosts) {
          station.charging.chargingPosts.forEach(post => {
            occupiedSlots += (post.totalSlots - post.availableSlots);
          });
        } else {
          occupiedSlots = 0;
        }
        chargingPostsCount = station.charging?.chargingPosts?.length || Math.ceil(totalSlots / 2);
      } else if (station.charging?.chargingPosts) {
        // Backward-compatible: tính từ chargingPosts nếu không có totalPorts
        station.charging.chargingPosts.forEach(post => {
          totalSlots += post.totalSlots;
          occupiedSlots += (post.totalSlots - post.availableSlots);
        });
        chargingPostsCount = station.charging.chargingPosts.length;
      }

      const utilization = totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0;

      return {
        ...station,
        bookingsCount: stationBookings.length,
        revenue,
        utilization,
        totalSlots,
        occupiedSlots,
        chargingPostsCount,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  // Recent Activities với chargingPosts context
  const recentActivities = [
    {
      id: 1,
      type: "booking",
      message: "New booking at Tech Park SuperCharger - Charging Post A",
      time: "5 minutes ago",
      severity: "info",
    },
    {
      id: 2,
      type: "station",
      message: 'Charging Post B at "Green Mall Hub" went offline',
      time: "15 minutes ago",
      severity: "warning",
    },
    {
      id: 3,
      type: "user",
      message: "New user registration: Nguyễn Văn An",
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
      message: "Maintenance scheduled for EcoPark Station - All Charging Posts",
      time: "2 hours ago",
      severity: "info",
    },
    {
      id: 6,
      type: "slot",
      message: "Slot 1 at Tech Park SuperCharger - Post C is now available",
      time: "3 hours ago",
      severity: "success",
    },
  ];

  const handleStationAction = (action, station) => {
    console.log(`${action} station:`, station.name);
    setSelectedStation(station);
    
    switch (action) {
      case "view":
        setOpenStationDialog(true);
        break;
      case "edit":
        // Open inline edit inside details dialog
        setOpenStationDialog(true);
        setInlineEdit(true);
        setInlineForm({
          name: station.name || "",
          address: station.location?.address || "",
          totalPorts: station.charging?.totalPorts || 0,
          fastChargePorts: station.charging?.fastChargePorts || 0,
          standardPorts: station.charging?.standardPorts || 0,
          pricePerKwh: station.charging?.pricePerKwh || 0,
          status: station.status || "active",
        });
        break;
      case "maintenance":
        setMaintenanceModalOpen(true);
        break;
      case "delete":
        if (window.confirm(`Bạn có chắc chắn muốn xóa trạm sạc "${station.name}"?`)) {
          deleteStation(station.id).then((res) => {
            if (res?.success) {
              setSelectedStation(null);
              setOpenStationDialog(false);
            } else {
              alert("Xóa trạm thất bại. Vui lòng thử lại.");
            }
          });
        }
        break;
      default:
        break;
    }
  };

  const handleSaveStation = async (stationId, updatedData) => {
    try {
      const result = await updateStation(stationId, updatedData);
      if (result.success) {
        alert("Cập nhật trạm sạc thành công!");
        // Force component re-render by updating selectedStation if it's the same station
        if (selectedStation && selectedStation.id === stationId) {
          const updatedStation = stations.find(s => s.id === stationId);
          setSelectedStation(updatedStation);
        }
      } else {
        throw new Error(result.error || "Update failed");
      }
    } catch (error) {
      console.error("Error updating station:", error);
      alert("Có lỗi xảy ra khi cập nhật trạm sạc.");
    }
  };

  const handleScheduleMaintenance = async (maintenanceData) => {
    try {
      // Add to maintenance schedules
      setMaintenanceSchedules(prev => [...prev, {
        id: `maintenance-${Date.now()}`,
        ...maintenanceData
      }]);
      
      // Update station status if needed
      if (maintenanceData.type === "emergency" || maintenanceData.priority === "critical") {
        await updateStation(maintenanceData.stationId, { status: "maintenance" });
      }
      
      alert("Lên lịch bảo trì thành công!");
      console.log("Maintenance scheduled:", maintenanceData);
    } catch (error) {
      console.error("Error scheduling maintenance:", error);
      alert("Có lỗi xảy ra khi lên lịch bảo trì.");
    }
  };

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

  const getSeverityColor = (severity) => {
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
            variant="outlined"
            startIcon={<Download />}
            onClick={() => console.log("Export report")}
          >
            Xuất báo cáo
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAddDialogOpen(true)}
          >
            Thêm trạm sạc
          </Button>
        </Box>
      </Box>

      {/* Alert for Critical Issues */}
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Cảnh báo hệ thống:</strong> 2 trạm sạc cần được chú ý ngay lập tức.
          <Button size="small" sx={{ ml: 1 }}>
            Xem chi tiết
          </Button>
        </Typography>
      </Alert>

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
        {/* Station Performance Table */}
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
                  Station Performance
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <IconButton size="small">
                    <FilterList />
                  </IconButton>
                  <IconButton size="small">
                    <Search />
                  </IconButton>
                </Box>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Station</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="center">Charging Posts</TableCell>
                      <TableCell align="center">Utilization</TableCell>
                      <TableCell align="center">Sessions</TableCell>
                      <TableCell align="center">Revenue</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stationPerformance.slice(0, 6).map((station) => (
                      <TableRow key={`${station.id}-${station.lastUpdated}`} hover>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Avatar
                              sx={{
                                bgcolor: "primary.main",
                                width: 40,
                                height: 40,
                              }}
                            >
                              <ElectricCar />
                            </Avatar>
                            <Box>
                              <Typography
                                variant="subtitle2"
                                fontWeight="medium"
                              >
                                {station.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {station.location.address}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          {getStatusChip(station.status)}
                        </TableCell>
                        <TableCell align="center">
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {station.chargingPostsCount} Posts
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {Math.max(0, station.totalSlots - station.occupiedSlots)}/{station.totalSlots} slots
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ minWidth: 60 }}>
                            <LinearProgress
                              variant="determinate"
                              value={station.utilization}
                              sx={{ mb: 0.5 }}
                            />
                            <Typography variant="caption">
                              {station.utilization.toFixed(0)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight="medium">
                            {station.bookingsCount}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(station.revenue)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              setAnchorEl(e.currentTarget);
                              setSelectedStation(station);
                            }}
                          >
                            <MoreVert />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
              >
                <MenuItem
                  onClick={() => {
                    handleStationAction("view", selectedStation);
                    setAnchorEl(null);
                  }}
                >
                  <Visibility sx={{ mr: 1 }} />
                  Xem chi tiết
                </MenuItem>
              {/* Removed separate Edit Station to encourage inline editing inside details */}
                <MenuItem
                  onClick={() => {
                    handleStationAction("maintenance", selectedStation);
                    setAnchorEl(null);
                  }}
                >
                  <Settings sx={{ mr: 1 }} />
                  Schedule Maintenance
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleStationAction("delete", selectedStation);
                    setAnchorEl(null);
                  }}
                  sx={{ color: "error.main" }}
                >
                  <Delete sx={{ mr: 1 }} />
                  Delete Station
                </MenuItem>
              </Menu>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Recent Activities
              </Typography>

              <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
                {recentActivities.map((activity) => (
                  <Paper
                    key={activity.id}
                    sx={{
                      p: 2,
                      mb: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      borderLeft: 4,
                      borderLeftColor: getSeverityColor(activity.severity),
                    }}
                  >
                    <Typography variant="body2" gutterBottom>
                      {activity.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {activity.time}
                    </Typography>
                  </Paper>
                ))}
              </Box>

              <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
                View All Activities
              </Button>
            </CardContent>
          </Card>

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

      {/* Station Detail Dialog */}
      <Dialog
        open={openStationDialog}
        onClose={() => { setOpenStationDialog(false); setInlineEdit(false); }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {inlineEdit ? `Chỉnh sửa: ${selectedStation?.name}` : `Station Details: ${selectedStation?.name || ''}`}
        </DialogTitle>
        <DialogContent>
          {selectedStation && !inlineEdit && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>Location</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedStation.location.address}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>Status</Typography>
                  {getStatusChip(selectedStation.status)}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>Charging Posts</Typography>
                  <Typography variant="body2">
                    {(selectedStation.charging?.chargingPosts?.length) || Math.ceil((selectedStation.charging?.totalPorts || 0)/2)} posts, {(selectedStation.charging?.totalPorts || 0)} total slots
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>Slot có sẵn</Typography>
                  <Typography variant="body2">{selectedStation.charging?.availablePorts ?? 0} có sẵn</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>Max Power (per post)</Typography>
                  <Typography variant="body2">{selectedStation.charging?.chargingPosts?.[0]?.power || 'Không có'}kW</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>Revenue (Month)</Typography>
                  <Typography variant="body2">{formatCurrency(stationPerformance.find((s) => s.id === selectedStation.id)?.revenue || 0)}</Typography>
                </Grid>
              </Grid>
              <Box sx={{ mt: 2 }}>
                <Button variant="contained" onClick={() => {
                  setInlineEdit(true);
                  setInlineForm({
                    name: selectedStation.name || '',
                    address: selectedStation.location?.address || '',
                    totalPorts: selectedStation.charging?.totalPorts || 0,
                    fastChargePorts: selectedStation.charging?.fastChargePorts || 0,
                    standardPorts: selectedStation.charging?.standardPorts || 0,
                    pricePerKwh: selectedStation.charging?.pricePerKwh || 0,
                    status: selectedStation.status || 'active',
                  });
                }}>Chỉnh sửa tại đây</Button>
              </Box>
            </Box>
          )}

          {selectedStation && inlineEdit && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Tên trạm sạc" value={inlineForm.name} onChange={(e)=>setInlineForm({...inlineForm, name:e.target.value})} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Trạng thái</InputLabel>
                    <Select label="Trạng thái" value={inlineForm.status} onChange={(e)=>setInlineForm({...inlineForm, status:e.target.value})}>
                      <MenuItem value="active">Hoạt động</MenuItem>
                      <MenuItem value="maintenance">Bảo trì</MenuItem>
                      <MenuItem value="offline">Tạm ngưng</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Địa chỉ" value={inlineForm.address} onChange={(e)=>setInlineForm({...inlineForm, address:e.target.value})} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth type="number" label="Tổng cổng" value={inlineForm.totalPorts} onChange={(e)=>setInlineForm({...inlineForm, totalPorts: parseInt(e.target.value)||0})} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth type="number" label="Sạc nhanh (DC)" value={inlineForm.fastChargePorts} onChange={(e)=>setInlineForm({...inlineForm, fastChargePorts: parseInt(e.target.value)||0})} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth type="number" label="Sạc tiêu chuẩn (AC)" value={inlineForm.standardPorts} onChange={(e)=>setInlineForm({...inlineForm, standardPorts: parseInt(e.target.value)||0})} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth type="number" label="Giá (VND/kWh)" value={inlineForm.pricePerKwh} onChange={(e)=>setInlineForm({...inlineForm, pricePerKwh: parseFloat(e.target.value)||0})} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth type="number" label="Slot có sẵn" value={selectedStation?.charging?.availablePorts ?? 0}
                    onChange={(e)=> setSelectedStation(prev => prev ? ({...prev, charging: { ...(prev.charging||{}), availablePorts: Math.max(0, Math.min(inlineForm.totalPorts, parseInt(e.target.value)||0)) }}) : prev)} />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenStationDialog(false); setInlineEdit(false); }}>Đóng</Button>
          {inlineEdit && (
            <Button variant="contained" onClick={async () => {
              if (!selectedStation) return;
              // Preserve available slots as much as possible
              const prevAvail = (selectedStation?.charging?.availablePorts != null)
                ? selectedStation.charging.availablePorts
                : Math.max(0, (selectedStation?.totalSlots || inlineForm.totalPorts) - (selectedStation?.occupiedSlots || 0));
              const newAvailablePorts = Math.min(inlineForm.totalPorts, prevAvail);

              const updated = {
                name: inlineForm.name,
                location: { ...(selectedStation.location||{}), address: inlineForm.address },
                charging: {
                  ...(selectedStation.charging||{}),
                  totalPorts: inlineForm.totalPorts,
                  availablePorts: newAvailablePorts,
                  fastChargePorts: inlineForm.fastChargePorts,
                  standardPorts: inlineForm.standardPorts,
                  pricePerKwh: inlineForm.pricePerKwh,
                },
                status: inlineForm.status,
              };
              await handleSaveStation(selectedStation.id, updated);
              // Optimistically update detail view immediately
              setSelectedStation(prev => prev ? ({
                ...prev,
                ...updated,
                location: { ...(prev.location||{}), ...(updated.location||{}) },
                charging: { ...(prev.charging||{}), ...(updated.charging||{}) },
                lastUpdated: new Date().toISOString(),
              }) : prev);
              setRefreshTick((t)=>t+1);
              setInlineEdit(false);
            }}>Lưu</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Edit Station Modal */}
      <EditStationModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        station={selectedStation}
        onSave={handleSaveStation}
      />

      {/* Schedule Maintenance Modal */}
      <ScheduleMaintenanceModal
        open={maintenanceModalOpen}
        onClose={() => setMaintenanceModalOpen(false)}
        station={selectedStation}
        onSchedule={handleScheduleMaintenance}
      />

      {/* Quick Add Station Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm trạm sạc nhanh</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Tên trạm sạc *"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              error={!!addErrors.name}
              helperText={addErrors.name}
              fullWidth
            />
            <TextField
              label="Địa chỉ *"
              value={addForm.address}
              onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
              error={!!addErrors.address}
              helperText={addErrors.address}
              fullWidth
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Tổng cổng"
                  type="number"
                  value={addForm.totalPorts}
                  onChange={(e) => setAddForm({ ...addForm, totalPorts: parseInt(e.target.value) || 0 })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Sạc nhanh (DC)"
                  type="number"
                  value={addForm.fastChargePorts}
                  onChange={(e) => setAddForm({ ...addForm, fastChargePorts: parseInt(e.target.value) || 0 })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Sạc tiêu chuẩn (AC)"
                  type="number"
                  value={addForm.standardPorts}
                  onChange={(e) => setAddForm({ ...addForm, standardPorts: parseInt(e.target.value) || 0 })}
                  fullWidth
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Giá (VND/kWh)"
                  type="number"
                  value={addForm.pricePerKwh}
                  onChange={(e) => setAddForm({ ...addForm, pricePerKwh: parseFloat(e.target.value) || 0 })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Trạng thái</InputLabel>
                  <Select
                    label="Trạng thái"
                    value={addForm.status}
                    onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                  >
                    <MenuItem value="active">Hoạt động</MenuItem>
                    <MenuItem value="maintenance">Bảo trì</MenuItem>
                    <MenuItem value="offline">Tạm ngưng</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Hủy</Button>
          <Button
            variant="contained"
            onClick={async () => {
              const errs = {};
              if (!addForm.name.trim()) errs.name = "Tên trạm sạc là bắt buộc";
              if (!addForm.address.trim()) errs.address = "Địa chỉ là bắt buộc";
              setAddErrors(errs);
              if (Object.keys(errs).length) return;

              const stationData = {
                name: addForm.name,
                location: {
                  address: addForm.address,
                  city: "TP. Hồ Chí Minh",
                  province: "TP. Hồ Chí Minh",
                  coordinates: { lat: 10.7769, lng: 106.7009 },
                },
                charging: {
                  totalPorts: addForm.totalPorts,
                  availablePorts: addForm.totalPorts,
                  fastChargePorts: addForm.fastChargePorts,
                  standardPorts: addForm.standardPorts,
                  pricePerKwh: addForm.pricePerKwh,
                },
                operatingHours: addForm.operatingHours,
                amenities: [],
                status: addForm.status,
              };

              const res = await addStation(stationData);
              if (res?.success) {
                setAddDialogOpen(false);
              } else {
                alert("Không thể thêm trạm sạc. Vui lòng thử lại.");
              }
            }}
          >
            Tạo trạm sạc
          </Button>
        </DialogActions>
      </Dialog>

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
