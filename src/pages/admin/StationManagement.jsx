import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
} from "@mui/material";
import {
  LocationOn,
  ElectricCar,
  Settings,
  Add,
  Edit,
  Delete,
  Visibility,
  TrendingUp,
  CheckCircle,
  MapOutlined,
  Speed,
  Battery80,
  PowerSettingsNew,
  Close,
  Save
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import useAuthStore from "../../store/authStore";
import useStationStore from "../../store/stationStore";
import useBookingStore from "../../store/bookingStore";
import { formatCurrency } from "../../utils/helpers";

const StationManagement = () => {
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  // eslint-disable-next-line no-unused-vars
  const { user } = useAuthStore();
  const { stations, addStation, updateStation, deleteStation, remoteDisableStation, remoteEnableStation } =
    useStationStore();
  const { bookings } = useBookingStore();
  const [selectedStation, setSelectedStation] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [viewMode, setViewMode] = useState("list"); // 'list' | 'map'
  const [filterStatus, setFilterStatus] = useState("all");
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    stationId: null,
    stationName: ""
  });

  // Form state for station editing/creation
  const [stationForm, setStationForm] = useState({
    name: "",
    address: "",
    totalPorts: 4,
    fastChargePorts: 2,
    standardPorts: 2,
    pricePerKwh: 3500,
    status: "active",
    availableSlots: 4,
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  // Station analytics data
  const stationAnalytics = stations.map((station) => {
    const stationBookings = bookings.filter(
      (b) => b.stationId === station.id
    );
    const thisMonthBookings = stationBookings.filter((b) => {
      const bookingDate = new Date(b.startTime);
      const now = new Date();
      return (
        bookingDate.getMonth() === now.getMonth() &&
        bookingDate.getFullYear() === now.getFullYear()
      );
    });

    const revenue = thisMonthBookings.reduce((sum, b) => sum + b.cost, 0);
    const utilization =
      ((station.charging.totalPorts - station.charging.availablePorts) /
        station.charging.totalPorts) *
      100;
    const avgSessionTime =
      stationBookings.length > 0
        ? stationBookings.reduce((sum, b) => sum + (b.duration || 60), 0) /
          stationBookings.length
        : 0;

    return {
      ...station,
      monthlyRevenue: revenue,
      monthlyBookings: thisMonthBookings.length,
      utilization: utilization || 0,
      avgSessionTime
    };
  });

  const handleStationClick = (station) => {
    setSelectedStation(station);
    setStationForm({
      name: station.name,
      address: station.location.address,
      totalPorts: station.charging.totalPorts,
      fastChargePorts: station.charging.fastChargePorts || 0,
      standardPorts: station.charging.standardPorts || station.charging.totalPorts,
      pricePerKwh: station.charging.pricePerKwh,
      status: station.status,
      availableSlots: station.charging.availablePorts || station.charging.totalPorts,
    });
    setDialogOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedStation(null);
    setStationForm({
      name: "",
      address: "",
      totalPorts: 4,
      fastChargePorts: 2,
      standardPorts: 2,
      pricePerKwh: 3500,
      status: "active",
      availableSlots: 4,
    });
    setDialogOpen(true);
    setErrors({});
  };

  const handleDeleteClick = (station) => {
    setDeleteDialog({
      open: true,
      stationId: station.id,
      stationName: station.name
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteStation(deleteDialog.stationId);
      setDeleteDialog({ open: false, stationId: null, stationName: "" });
    } catch (error) {
      console.error("Error deleting station:", error);
      alert("Có lỗi xảy ra khi xóa trạm sạc. Vui lòng thử lại.");
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!stationForm.name.trim()) newErrors.name = "Tên trạm sạc là bắt buộc";
    if (!stationForm.address.trim()) newErrors.address = "Địa chỉ là bắt buộc";
    
    if (stationForm.totalPorts < 1) newErrors.totalPorts = "Tổng số cổng sạc phải lớn hơn 0";
    if (stationForm.fastChargePorts < 0) newErrors.fastChargePorts = "Số cổng sạc nhanh không được âm";
    if (stationForm.standardPorts < 0) newErrors.standardPorts = "Số cổng sạc tiêu chuẩn không được âm";
    if (stationForm.fastChargePorts + stationForm.standardPorts !== stationForm.totalPorts) {
      newErrors.totalPorts = "Tổng số cổng sạc nhanh và tiêu chuẩn phải bằng tổng số cổng";
    }
    if (stationForm.availableSlots > stationForm.totalPorts) {
      newErrors.availableSlots = "Số slot có sẵn không được vượt quá tổng số cổng";
    }
    if (stationForm.pricePerKwh < 0) newErrors.pricePerKwh = "Giá mỗi kWh không được âm";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveStation = async () => {
    if (!validateForm()) return;

    const stationData = {
      name: stationForm.name,
      location: {
        address: stationForm.address
      },
      charging: {
        totalPorts: parseInt(stationForm.totalPorts),
        availablePorts: parseInt(stationForm.availableSlots),
        fastChargePorts: parseInt(stationForm.fastChargePorts),
        standardPorts: parseInt(stationForm.standardPorts),
        pricePerKwh: parseFloat(stationForm.pricePerKwh)
      },
      status: stationForm.status,
      lastUpdated: new Date().toISOString(),
    };

    try {
      if (selectedStation) {
        await updateStation(selectedStation.id, stationData);
      } else {
        await addStation({
          ...stationData,
          createdAt: new Date().toISOString(),
        });
      }
      setDialogOpen(false);
    } catch (error) {
      console.error("Error saving station:", error);
      alert("Có lỗi xảy ra khi lưu trạm sạc. Vui lòng thử lại.");
    }
  };

  const filteredStations = stationAnalytics.filter((station) => {
    if (filterStatus === "all") return true;
    return station.status === filterStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "success";
      case "maintenance":
        return "warning";
      case "offline":
        return "error";
      default:
        return "default";
    }
  };

  const getUtilizationColor = (utilization) => {
    if (utilization > 80) return "error";
    if (utilization > 60) return "warning";
    return "success";
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
            Quản lý trạm sạc ⚡
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Giám sát và quản lý mạng lưới trạm sạc xe điện của bạn
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Lọc trạng thái</InputLabel>
            <Select
              value={filterStatus}
              label="Lọc trạng thái"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">Tất cả trạm</MenuItem>
              <MenuItem value="active">Hoạt động</MenuItem>
              <MenuItem value="maintenance">Bảo trì</MenuItem>
              <MenuItem value="offline">Ngoại tuyến</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateNew}
          >
            Thêm trạm sạc
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
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
                    {filteredStations.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Tổng số trạm
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
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {
                      filteredStations.filter((s) => s.status === "active")
                        .length
                    }
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Trạm hoạt động
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
                    {filteredStations.reduce(
                      (sum, s) => sum + s.charging.totalPorts,
                      0
                    )}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Tổng số cổng
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
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(
                      filteredStations.reduce(
                        (sum, s) => sum + s.monthlyRevenue,
                        0
                      )
                    )}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Doanh thu tháng
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Stations Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Tổng quan hiệu suất trạm sạc
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="25%">Trạm sạc</TableCell>
                  <TableCell align="center" width="10%">Trạng thái</TableCell>
                  <TableCell align="center" width="12%">Cổng</TableCell>
                  <TableCell align="center" width="12%">Sử dụng</TableCell>
                  <TableCell align="center" width="15%">Doanh thu tháng</TableCell>
                  <TableCell align="center" width="8%">Phiên</TableCell>
                  <TableCell align="center" width="8%">Phiên TB</TableCell>
                  <TableCell align="center" width="10%">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStations.map((station) => (
                  <TableRow key={station.id} hover>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
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
                          <Typography variant="subtitle2" fontWeight="medium">
                            {station.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {station.location.address}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={station.status}
                        color={getStatusColor(station.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {station.charging.availablePorts}/
                        {station.charging.totalPorts}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        có sẵn
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ minWidth: 80 }}>
                        <LinearProgress
                          variant="determinate"
                          value={station.utilization}
                          color={getUtilizationColor(station.utilization)}
                          sx={{ mb: 0.5 }}
                        />
                        <Typography variant="caption">
                          {station.utilization.toFixed(0)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(station.monthlyRevenue)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {station.monthlyBookings}
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {station.avgSessionTime.toFixed(0)}m
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                        <IconButton
                          size="small"
                          onClick={() => handleStationClick(station)}
                        >
                          <Edit />
                        </IconButton>
                        {station.status !== 'offline' ? (
                          <IconButton size="small" color="warning" onClick={() => remoteDisableStation(station.id)}>
                            <PowerSettingsNew />
                          </IconButton>
                        ) : (
                          <IconButton size="small" color="success" onClick={() => remoteEnableStation(station.id)}>
                            <PowerSettingsNew />
                          </IconButton>
                        )}
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteClick(station)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Station Edit/Create Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedStation ? "Chỉnh sửa: " + selectedStation.name : "Thêm trạm sạc nhanh"}
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tên trạm sạc *"
                  value={stationForm.name}
                  onChange={(e) => {
                    setStationForm({ ...stationForm, name: e.target.value });
                    if (errors.name) setErrors({...errors, name: ""});
                  }}
                  error={!!errors.name}
                  helperText={errors.name}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Địa chỉ *" 
                  value={stationForm.address}
                  onChange={(e) => {
                    setStationForm({ ...stationForm, address: e.target.value });
                    if (errors.address) setErrors({...errors, address: ""});
                  }}
                  error={!!errors.address}
                  helperText={errors.address}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tổng cổng"
                  type="number"
                  value={stationForm.totalPorts}
                  onChange={(e) => {
                    setStationForm({ ...stationForm, totalPorts: parseInt(e.target.value) || 0 });
                    if (errors.totalPorts) setErrors({...errors, totalPorts: ""});
                  }}
                  error={!!errors.totalPorts}
                  helperText={errors.totalPorts}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Sạc nhanh (DC)"
                  type="number"
                  value={stationForm.fastChargePorts}
                  onChange={(e) => {
                    setStationForm({ ...stationForm, fastChargePorts: parseInt(e.target.value) || 0 });
                    if (errors.fastChargePorts) setErrors({...errors, fastChargePorts: ""});
                  }}
                  error={!!errors.fastChargePorts}
                  helperText={errors.fastChargePorts}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Sạc tiêu chuẩn (AC)"
                  type="number" 
                  value={stationForm.standardPorts}
                  onChange={(e) => {
                    setStationForm({ ...stationForm, standardPorts: parseInt(e.target.value) || 0 });
                    if (errors.standardPorts) setErrors({...errors, standardPorts: ""});
                  }}
                  error={!!errors.standardPorts}
                  helperText={errors.standardPorts}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Giá (VND/kWh)"
                  type="number"
                  value={stationForm.pricePerKwh}
                  onChange={(e) => {
                    setStationForm({ ...stationForm, pricePerKwh: parseFloat(e.target.value) || 0 });
                    if (errors.pricePerKwh) setErrors({...errors, pricePerKwh: ""});
                  }}
                  error={!!errors.pricePerKwh}
                  helperText={errors.pricePerKwh}
                />
              </Grid>

              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Trạng thái</InputLabel>
                  <Select
                    value={stationForm.status}
                    label="Trạng thái"
                    onChange={(e) => setStationForm({ ...stationForm, status: e.target.value })}
                  >
                    <MenuItem value="active">Hoạt động</MenuItem>
                    <MenuItem value="maintenance">Bảo trì</MenuItem>
                    <MenuItem value="offline">Ngoại tuyến</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Slot có sẵn"
                  type="number"
                  value={stationForm.availableSlots}
                  onChange={(e) => {
                    setStationForm({ ...stationForm, availableSlots: parseInt(e.target.value) || 0 });
                    if (errors.availableSlots) setErrors({...errors, availableSlots: ""});
                  }}
                  error={!!errors.availableSlots}
                  helperText={errors.availableSlots}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Đóng</Button>
          <Button variant="contained" onClick={handleSaveStation}>
            {selectedStation ? "Lưu" : "Tạo trạm sạc"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa trạm sạc "${deleteDialog.stationName}"? Hành động này không thể hoàn tác.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog({ open: false, stationId: null, stationName: "" })}
      />
    </Box>
  );
};

export default StationManagement;
