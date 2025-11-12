/* eslint-disable */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Typography,
  Button,
  Alert,
  Container,
} from "@mui/material";
import {
  ElectricCar,
  Warning,
  TrendingUp,
  PowerOff,
  Refresh,
  ArrowForward,
  Map as MapIcon,
} from "@mui/icons-material";
import {
  KpiCard,
  StationCard,
  AlertsPanel,
  TrendChart,
} from "../../components/staff";

// TODO: Fetch from backend API instead of mock data
const StaffDashboard = () => {
  // Get current user info (assuming stored in auth or user store)
  const currentUser = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
  const assignedStationIds = currentUser.assignedStationIds || []; // Staff's assigned station IDs
  
  const [stations, setStations] = useState([]);
  const [allStations, setAllStations] = useState([]); // All stations from API
  const [alerts, setAlerts] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [maintenanceDialog, setMaintenanceDialog] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    pole: "",
    port: "",
    issue: "",
    notes: "",
  });

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

  // Load stations and filter by assigned stations
  useEffect(() => {
    const loadStations = async () => {
      // TODO: Replace with real API call
      // const response = await stationsAPI.getAll();
      // const allStationsData = response.data || [];
      
      // Mock data for now
      const allStationsData = [
        {
          id: 1,
          stationId: 1,
          name: "Trạm sạc FPT Complex",
          location: "Lô E2a-7, Đường D1, Khu Công nghệ cao, Quận 9, TP.HCM",
          status: "operational",
          dailyRevenue: 2500000,
          dailySessions: 45,
          charging: {
            poles: [
              {
                id: 1,
                name: "Trụ AC 1",
                type: "AC",
                power: 7,
                status: "active",
                ports: [
                  { id: 1, status: "occupied", sessionId: "S001" },
                  { id: 2, status: "available", sessionId: null },
                ],
              },
              {
                id: 2,
                name: "Trụ DC 1",
                type: "DC",
                power: 50,
                status: "active",
                ports: [
                  { id: 3, status: "available", sessionId: null },
                  { id: 4, status: "occupied", sessionId: "S002" },
                ],
              },
            ],
          },
        },
        {
          id: 2,
          stationId: 2,
          name: "Trạm sạc Landmark 81",
          location: "720A Điện Biên Phủ, Bình Thạnh, TP.HCM",
          status: "warning",
          dailyRevenue: 3200000,
          dailySessions: 52,
          charging: {
            poles: [
              {
                id: 3,
                name: "Trụ AC 2",
                type: "AC",
                power: 11,
                status: "maintenance",
                ports: [
                  { id: 5, status: "available", sessionId: null },
                  { id: 6, status: "available", sessionId: null },
                ],
              },
            ],
          },
        },
        {
          id: 3,
          stationId: 3,
          name: "Trạm sạc Vincom Center",
          location: "72 Lê Thánh Tôn, Quận 1, TP.HCM",
          status: "operational",
          dailyRevenue: 1800000,
          dailySessions: 38,
          charging: {
            poles: [
              {
                id: 4,
                name: "Trụ AC 3",
                type: "AC",
                power: 7,
                status: "active",
                ports: [
                  { id: 7, status: "occupied", sessionId: "S003" },
                  { id: 8, status: "available", sessionId: null },
                ],
              },
            ],
          },
        },
      ];

      setAllStations(allStationsData);

      // Filter stations based on staff's assigned stations
      if (assignedStationIds && assignedStationIds.length > 0) {
        const filteredStations = allStationsData.filter(station => 
          assignedStationIds.includes(station.stationId)
        );
        setStations(filteredStations);
      } else {
        // If no assigned stations, show all (for demo purposes)
        // In production, should show empty or error message
        setStations(allStationsData);
      }

      // Mock alerts
      setAlerts([
        {
          id: 1,
          stationName: "Trạm sạc FPT Complex",
          severity: "warning",
          message: "Trụ DC 1 - Cổng 4 đang sạc chậm hơn bình thường",
          time: "5 phút trước",
        },
        {
          id: 2,
          stationName: "Trạm sạc Landmark 81",
          severity: "error",
          message: "Trụ AC 2 cần bảo trì khẩn cấp",
          time: "15 phút trước",
        },
      ]);
    };

    loadStations();
  }, [assignedStationIds]);

  // Calculate overall statistics from poles/ports
  const calculateStationStats = (stations) => {
    let totalPoles = 0;
    let activePoles = 0;
    let maintenancePoles = 0;
    let offlinePoles = 0;
    let totalPorts = 0;
    let occupiedPorts = 0;

    stations.forEach((station) => {
      (station.charging?.poles || []).forEach((pole) => {
        totalPoles++;
        const portsCount = pole.totalPorts || (pole.ports || []).length;
        totalPorts += portsCount;
        const available = typeof pole.availablePorts === 'number' ? pole.availablePorts : (pole.ports || []).filter(p=>p.status==='available').length;
        occupiedPorts += Math.max(0, portsCount - available);

        switch (pole.status) {
          case "active":
          case "occupied":
            activePoles++;
            break;
          case "maintenance":
            maintenancePoles++;
            break;
          case "offline":
            offlinePoles++;
            break;
        }
      });
    });

    return {
      totalPoles,
      activePoles,
      maintenancePoles,
      offlinePoles,
      totalPorts,
      occupiedPorts,
      availablePorts: totalPorts - occupiedPorts,
    };
  };

  const stats = calculateStationStats(stations);
  const totalRevenue = stations.reduce(
    (sum, station) => sum + station.dailyRevenue,
    0
  );
  const totalSessions = stations.reduce(
    (sum, station) => sum + station.dailySessions,
    0
  );

  // Filter stations based on search and status like driver flow
  const filteredStations = stations.filter((station) => {
    const matchesSearch =
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || station.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle station actions like driver flow
  const handleStationAction = (action, station) => {
    if (action === "view") {
      setSelectedStationForDetail(station);
    } else if (action === "maintenance") {
      setActionDialog({ open: true, type: "maintenance", station });
    }
  };

  const handleActionComplete = (actionType, stationName) => {
    setSuccessMessage(
      `${actionType} completed successfully for ${stationName}!`
    );
    setShowSuccess(true);
    setActionDialog({ open: false, type: "", station: null });
    setMaintenanceDialog(false);
  };

  const getDistanceToStation = (station) => {
    // Mock distance calculation for staff view
    return (Math.random() * 5 + 0.5).toFixed(1);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "operational":
        return "success";
      case "warning":
        return "warning";
      case "error":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "operational":
        return "Đang hoạt động";
      case "warning":
        return "Cảnh báo";
      case "error":
        return "Lỗi";
      case "maintenance":
        return "Bảo trì";
      case "charging":
        return "Đang sạc";
      case "available":
        return "Sẵn sàng";
      case "active":
        return "Hoạt động";
      case "occupied":
        return "Đang sử dụng";
      case "offline":
        return "Ngoại tuyến";
      default:
        return status;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "info";
      default:
        return "default";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Quản lý trạm sạc
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Giám sát và điều khiển các trạm sạc và thiết bị
        </Typography>
      </Box>

      {/* Assigned Stations Info */}
      {assignedStationIds && assignedStationIds.length > 0 && (
        <Alert severity="info" icon={<AdminPanelSettings />} sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            Trạm được phân công: {stations.length} / {allStations.length} trạm
          </Typography>
          <Typography variant="caption">
            Bạn chỉ có quyền quản lý các trạm đã được phân công. Liên hệ Admin để thay đổi.
          </Typography>
        </Alert>
      )}

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
                  <MenuItem value="operational">Hoạt động</MenuItem>
                  <MenuItem value="warning">Cảnh báo</MenuItem>
                  <MenuItem value="error">Lỗi</MenuItem>
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

      {/* Overview Statistics */}
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
                <ElectricCar />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {stats.totalPoles}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Trụ sạc
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats.activePoles} hoạt động • {stats.totalPorts} cổng
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
                <CheckCircle />
              </Avatar>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {stats.availablePorts}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Cổng có sẵn
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {((stats.availablePorts / Math.max(1, stats.totalPorts)) * 100).toFixed(1)}% khả dụng
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
                {formatCurrency(totalRevenue)}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Doanh thu hôm nay
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {totalSessions} phiên sạc
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
                <Warning />
              </Avatar>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {alerts.filter((a) => a.priority === "high").length}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Cảnh báo ưu tiên cao
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {alerts.length} tổng cảnh báo
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Station List & Details - Driver-like flow */}
      <Grid container spacing={3}>
        {/* Station List */}
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
                <Typography variant="h6" gutterBottom>
                  {filteredStations.length} trạm được tìm thấy
                </Typography>
                <Button
                  startIcon={<Refresh />}
                  onClick={() => window.location.reload()}
                >
                  Làm mới
                </Button>
              </Box>

              <Box sx={{ maxHeight: 600, overflowY: "auto" }}>
                {filteredStations.map((station, index) => (
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
                            bgcolor: "success.main",
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
                            <Chip
                              label={getStatusLabel(station.status)}
                              color={getStatusColor(station.status)}
                              size="small"
                            />
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
                              {station.location} • {getDistanceToStation(station)} km
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
                                          {station.charging?.poles?.length || 0} trụ,{" "}
                                          {(station.charging?.poles || []).reduce(
                                            (sum, pole) => sum + (pole.totalPorts || (pole.ports || []).length),
                                            0
                                          )}{" "}
                                          cổng
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
                                {formatCurrency(station.dailyRevenue)} doanh thu
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
                                Sẵn sàng:{" "}
                                {station.charging?.poles?.reduce(
                                  (sum, pole) =>
                                    sum + (pole.availablePorts ?? (pole.ports || []).filter(p=>p.status==='available').length),
                                  0
                                )}
                                /
                                {station.charging?.poles?.reduce(
                                  (sum, pole) => sum + (pole.totalPorts ?? (pole.ports || []).length),
                                  0
                                )}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={
                                  (station.charging?.poles?.reduce(
                                    (sum, pole) =>
                                      sum + ((pole.totalPorts ?? (pole.ports || []).length) - (pole.availablePorts ?? (pole.ports || []).filter(p=>p.status==='available').length)),
                                    0
                                  ) /
                                    Math.max(1, station.charging?.poles?.reduce(
                                      (sum, pole) => sum + (pole.totalPorts ?? (pole.ports || []).length),
                                      0
                                    ))) *
                                  100
                                }
                                sx={{ width: 60, height: 4 }}
                              />
                            </Box>
                            <Chip
                              label={`${station.dailySessions} phiên sạc`}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              label={`${
                                station.charging?.poles?.filter(
                                  (p) => p.status === "active" || p.status === "occupied"
                                ).length
                              } trụ hoạt động`}
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
                              handleStationAction("view", station);
                            }}
                            startIcon={<Visibility />}
                          >
                            Giám sát
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStationAction("maintenance", station);
                            }}
                            startIcon={<Build />}
                          >
                            Bảo trì
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

        {/* Station Details & Alerts Panel */}
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
                      height: 120,
                      borderRadius: 2,
                      bgcolor: "success.main",
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
                  {selectedStationForDetail.location}
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Khoảng cách: {getDistanceToStation(selectedStationForDetail)}km
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Trạng thái bộ sạc
                </Typography>
                {selectedStationForDetail.charging?.poles?.map((pole) => (
                    <Box key={pole.id} sx={{ fontSize: "0.875rem", mb: 1 }}>
                    • Trụ {pole.name}: {pole.availablePorts ?? (pole.ports || []).filter(p=>p.status==='available').length}/{pole.totalPorts ?? (pole.ports || []).length} cổng trống ({getStatusLabel(pole.status)})
                  </Box>
                ))}

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Hiệu suất hôm nay
                </Typography>
                <Box sx={{ fontSize: "0.875rem", mb: 1 }}>
                  • Doanh thu:{" "}
                  {formatCurrency(selectedStationForDetail.dailyRevenue)}
                </Box>
                <Box sx={{ fontSize: "0.875rem", mb: 1 }}>
                  • Phiên sạc: {selectedStationForDetail.dailySessions}
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
                      handleStationAction(
                        "maintenance",
                        selectedStationForDetail
                      )
                    }
                  >
                    Lên lịch bảo trì
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Chọn một trạm
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Chọn trạm từ danh sách để xem thông tin chi tiết và thực hiện bảo trì
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Quick Alerts */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Cảnh báo ưu tiên
              </Typography>
              {alerts.slice(0, 3).map((alert) => (
                <Alert
                  key={alert.id}
                  severity={getPriorityColor(alert.priority)}
                  sx={{ mb: 1 }}
                  size="small"
                >
                  <Typography variant="caption" fontWeight="bold">
                    {alert.station} - Trụ: {alert.pole || alert.chargingPost}
                  </Typography>
                  <Typography variant="caption" display="block">
                    {alert.message}
                  </Typography>
                </Alert>
              ))}
              <Button variant="outlined" fullWidth size="small" sx={{ mt: 1 }}>
                Xem tất cả cảnh báo
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Dialogs - Driver-like flow */}
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
            Lên lịch bảo trì cho trụ và cổng sạc
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Trụ</InputLabel>
            <Select
              value={maintenanceForm.pole}
              onChange={(e) =>
                setMaintenanceForm({
                  ...maintenanceForm,
                  pole: e.target.value,
                })
              }
            >
              {actionDialog.station?.charging?.poles?.map((pole) => (
                <MenuItem key={pole.id} value={pole.id}>
                  {pole.name} ({pole.type} - {pole.power}kW)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Mã cổng"
            value={maintenanceForm.port}
            onChange={(e) =>
              setMaintenanceForm({ ...maintenanceForm, port: e.target.value })
            }
            sx={{ mb: 2 }}
            placeholder="Ví dụ: Cổng 1, Cổng 2, Tất cả cổng"
          />
          <TextField
            fullWidth
            label="Mô tả sự cố"
            value={maintenanceForm.issue}
            onChange={(e) =>
              setMaintenanceForm({ ...maintenanceForm, issue: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Ghi chú thêm"
            value={maintenanceForm.notes}
            onChange={(e) =>
              setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })
            }
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
                "Maintenance scheduling",
                actionDialog.station?.name
              )
            }
          >
            Lên lịch bảo trì
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
    </Container>
  );
};

export default StaffDashboard;
