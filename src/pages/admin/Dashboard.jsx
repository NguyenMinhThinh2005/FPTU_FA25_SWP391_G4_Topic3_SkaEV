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
import useAdminDashboard from '../../hooks/useAdminDashboard';

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
  const [stationPerformance, setStationPerformance] = useState([]);
  const [_loading, setLoading] = useState(true);
  const { recentActivities, isLoading: dashboardLoading, error: dashboardError } = useAdminDashboard();

  // Fetch stations on component mount
  useEffect(() => {
    console.log("🔄 Admin Dashboard mounted - fetching stations...");
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        await fetchStations();
        setLoading(false);
        console.log("✅ Stations loaded successfully");
      } catch (error) {
        console.error("❌ Error loading stations:", error);
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, [fetchStations]);

  // Tính toán hiệu suất trạm từ dữ liệu trạm
  useEffect(() => {
    if (stations.length > 0) {
      const performance = stations.map((station) => {
        // Lấy dữ liệu THỰC từ backend (không tính toán lại)
        const totalPosts = station.totalPosts || station.charging?.totalPosts || 0;
        
        // Logic: Mỗi trụ có 2 cổng
        const totalSlots = totalPosts * 2;
        
        // Active sessions từ backend
        const activeSessions = station.activeSessions || station.charging?.activeSessions || 0;
        
        // Số cổng khả dụng = Tổng cổng - Số phiên đang hoạt động
        const availableSlots = Math.max(0, totalSlots - activeSessions);
        
        // Tỷ lệ sử dụng từ backend (nếu có) hoặc tính từ activeSessions
        const utilization = station.utilizationRate !== undefined 
          ? station.utilizationRate 
          : (totalSlots > 0 ? (activeSessions / totalSlots) * 100 : 0);

        // Doanh thu từ backend
        const revenue = station.todayRevenue || station.revenue || 0;

        return {
          ...station,
          bookingsCount: activeSessions,  // Số phiên đang hoạt động
          revenue: revenue,
          utilization: utilization,
          totalSlots: totalSlots,          // Tổng cổng = trụ * 2
          availableSlots: availableSlots,  // Khả dụng = total - active
          occupiedSlots: activeSessions,   // Đang sử dụng = active sessions
          chargingPostsCount: totalPosts,  // Số trụ từ backend
        };
      });
      
      setStationPerformance(performance);
    }
  }, [stations]);

  // Lọc trạm dựa trên tìm kiếm và trạng thái
  const filteredStations = stationPerformance.filter((station) => {
    const matchesSearch =
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.location.address
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    
    // So sánh trạng thái không phân biệt chữ hoa chữ thường
    const stationStatus = (station.status || '').toLowerCase();
    const filterStatus = (statusFilter || '').toLowerCase();
    const matchesStatus =
      filterStatus === "all" || stationStatus === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Xử lý hành động trạm
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
      `${actionType} đã hoàn thành thành công cho ${stationName}!`
    );
    setShowSuccess(true);
    setActionDialog({ open: false, type: "", station: null });
  };

  // Use recent activities computed from live data
  const _recentActivities = recentActivities || [];

  const getStatusChip = (status) => {
    // Ánh xạ trạng thái không phân biệt chữ hoa chữ thường
    const statusLower = (status || '').toLowerCase();
    const configs = {
      active: { label: "Đang hoạt động", color: "success" },
      inactive: { label: "Không hoạt động", color: "error" },
      maintenance: { label: "Bảo trì", color: "warning" },
    };

    const config = configs[statusLower] || configs.inactive;
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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <DashboardIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 0 }}>
              Quản trị hệ thống
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Giám sát và quản lý mạng lưới sạc SkaEV
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Search & Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={9}>
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                }
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Trạng thái trạm</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ bgcolor: 'background.paper' }}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="active">Đang hoạt động</MenuItem>
                <MenuItem value="inactive">Không hoạt động</MenuItem>
                <MenuItem value="maintenance">Bảo trì</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

  {/* Show a thin loading bar while dashboard data loads */}
  {dashboardLoading && <LinearProgress color="primary" sx={{ mb: 2 }} />}

  <Grid container spacing={3}>
        {/* Station List */}
        <Grid item xs={12} lg={9}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Danh sách trạm sạc
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Quản lý và giám sát các trạm sạc trong hệ thống
                  </Typography>
                </Box>
                <Chip 
                  label={`${filteredStations.length} trạm`} 
                  color="primary" 
                  size="medium"
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>

              <Box sx={{ maxHeight: 650, overflowY: "auto", pr: 1 }}>
                {filteredStations.map((station) => (
                  <Box key={station.id}>
                    <Paper
                      elevation={selectedStationForDetail?.id === station.id ? 4 : 1}
                      sx={{
                        p: 2.5,
                        mb: 2,
                        border: 2,
                        borderColor:
                          selectedStationForDetail?.id === station.id
                            ? "primary.main"
                            : "transparent",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          backgroundColor: "action.hover",
                          cursor: "pointer",
                          transform: "translateY(-2px)",
                          boxShadow: 3,
                        },
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Mở phân tích trạm ${station.name}`}
                      onClick={() => {
                        // Navigate to the station analytics/detail page (same target as in StationManagement)
                        navigate(`/admin/stations/${station.id}/analytics`);
                      }}
                      onKeyDown={(e) => {
                        // Allow Enter or Space to activate navigation for keyboard users
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(`/admin/stations/${station.id}/analytics`);
                        }
                      }}
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
                              {station.location.address}
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
                                {formatCurrency(station.revenue)} doanh thu hôm nay
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
                              label={`${station.bookingsCount} phiên đang hoạt động`}
                              size="small"
                              variant="outlined"
                            />
                            {/* Only show available slots if station is active */}
                            {(station.status || '').toLowerCase() === 'active' ? (
                              <Chip
                                label={`${station.availableSlots} cổng khả dụng`}
                                color="success"
                                size="small"
                              />
                            ) : (
                              <Chip
                                label="Không khả dụng"
                                color="error"
                                size="small"
                              />
                            )}
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

        {/* Station Details Panel */}
        <Grid item xs={12} lg={3}>
          {selectedStationForDetail ? (
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Chi tiết trạm
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
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

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ mb: 1.5 }}>
                  Thông tin trạm
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Trạng thái:</Typography>
                    {getStatusChip(selectedStationForDetail.status)}
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Số trụ:</Typography>
                    <Typography variant="body2" fontWeight="bold">{selectedStationForDetail.chargingPostsCount}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Tổng cổng:</Typography>
                    <Typography variant="body2" fontWeight="bold">{selectedStationForDetail.totalSlots}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Cổng khả dụng:</Typography>
                    {(selectedStationForDetail.status || '').toLowerCase() === 'active' ? (
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        {selectedStationForDetail.availableSlots}
                      </Typography>
                    ) : (
                      <Typography variant="body2" fontWeight="bold" color="error.main">
                        0 (Trạm không hoạt động)
                      </Typography>
                    )}
                  </Box>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ mb: 1.5 }}>
                  Hiệu suất
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Phiên sạc:</Typography>
                    <Typography variant="body2" fontWeight="bold">{selectedStationForDetail.bookingsCount}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Tỷ lệ sử dụng:</Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      {selectedStationForDetail.utilization.toFixed(1)}%
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Doanh thu:</Typography>
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      {formatCurrency(selectedStationForDetail.revenue)}
                    </Typography>
                  </Box>
                </Stack>

                {/* Removed Manage Station and Schedule Maintenance buttons */}
              </CardContent>
            </Card>
          ) : (
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <LocationOn sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Chọn một trạm
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Nhấp vào trạm bất kỳ để xem thông tin chi tiết
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card elevation={2} sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Thao tác nhanh
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Button
                  variant="contained"
                  startIcon={<Analytics />}
                  fullWidth
                  size="large"
                  onClick={() => navigate("/admin/analytics")}
                  sx={{ py: 1.5 }}
                >
                  Xem phân tích
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<People />}
                  fullWidth
                  size="large"
                  onClick={() => navigate("/admin/users")}
                  sx={{ py: 1.5 }}
                >
                  Quản lý người dùng
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<LocationOn />}
                  fullWidth
                  size="large"
                  onClick={() => navigate("/admin/stations")}
                  sx={{ py: 1.5 }}
                >
                  Quản lý trạm
                </Button>
              </Stack>
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
        <DialogTitle>Chỉnh sửa trạm: {actionDialog.station?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Quản lý cài đặt trạm, trụ sạc và các thông số vận hành.
          </Typography>
          <TextField
            fullWidth
            label="Tên trạm"
            defaultValue={actionDialog.station?.name}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Trạng thái</InputLabel>
            <Select defaultValue={actionDialog.station?.status}>
              <MenuItem value="active">Đang hoạt động</MenuItem>
              <MenuItem value="inactive">Không hoạt động</MenuItem>
              <MenuItem value="maintenance">Bảo trì</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setActionDialog({ open: false, type: "", station: null })
            }
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={() =>
              handleActionComplete(
                "Quản lý trạm",
                actionDialog.station?.name
              )
            }
          >
            Lưu thay đổi
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
          Lên lịch bảo trì: {actionDialog.station?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Lên lịch bảo trì cho các trụ và cổng sạc.
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Trụ</InputLabel>
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
            label="Mô tả vấn đề"
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
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={() =>
              handleActionComplete(
                "Lên lịch bảo trì",
                actionDialog.station?.name
              )
            }
          >
            Lên lịch bảo trì
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
        <DialogTitle>Xóa trạm</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Hành động này không thể hoàn tác!
          </Alert>
          <Typography variant="body2">
            Bạn có chắc chắn muốn xóa{" "}
            <strong>{actionDialog.station?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setActionDialog({ open: false, type: "", station: null })
            }
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() =>
              handleActionComplete(
                "Xóa trạm",
                actionDialog.station?.name
              )
            }
          >
            Xóa trạm
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
