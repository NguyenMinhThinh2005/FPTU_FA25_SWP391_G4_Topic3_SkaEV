/* eslint-disable */
import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  LinearProgress,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  ElectricCar,
  LocationOn,
  Warning,
  CheckCircle,
  Build,
  Refresh,
  Add,
  Visibility,
  Edit,
  Search,
  Settings,
  MonetizationOn,
  PowerSettingsNew,
} from "@mui/icons-material";

// TODO: Fetch from backend API instead of mock data
const StaffDashboard = () => {
  const [stations, setStations] = useState([]);
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
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Staff Dashboard ⚡
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor and manage charging stations, poles (trụ), and ports (cổng)
        </Typography>
      </Box>

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
                  <MenuItem value="operational">Operational</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
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

      {/* Overview Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
                  <ElectricCar />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalPoles}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Trụ sạc (Poles)
                  </Typography>
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(stats.activePoles / Math.max(1, stats.totalPoles)) * 100}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                {stats.activePoles} active, {stats.maintenancePoles}{" "}
                maintenance, {stats.offlinePoles} offline • {stats.totalPorts}{" "}
                total ports
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar sx={{ bgcolor: "success.main", mr: 2 }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography
                    variant="h4"
                    fontWeight="bold"
                    color="success.main"
                  >
                    {stats.availablePorts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cổng có sẵn (Available Ports)
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={`${(
                  (stats.availablePorts / Math.max(1, stats.totalPorts)) *
                  100
                ).toFixed(1)}% Available`}
                color="success"
                size="small"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar sx={{ bgcolor: "info.main", mr: 2 }}>
                  {formatCurrency(totalRevenue).slice(0, -2)}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {formatCurrency(totalRevenue)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Today's Revenue
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                From {totalSessions} charging sessions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar sx={{ bgcolor: "warning.main", mr: 2 }}>
                  <Warning />
                </Avatar>
                <Box>
                  <Typography
                    variant="h4"
                    fontWeight="bold"
                    color="warning.main"
                  >
                    {alerts.filter((a) => a.priority === "high").length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    High Priority Alerts
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {alerts.length} total alerts
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
                  {filteredStations.length} Stations Found
                </Typography>
                <Button
                  startIcon={<Refresh />}
                  onClick={() => window.location.reload()}
                >
                  Refresh
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
                              label={station.status}
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
                              {station.location} •{" "}
                              {getDistanceToStation(station)}km away
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
                                {formatCurrency(station.dailyRevenue)} revenue
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
                                Available:{" "}
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
                              label={`${station.dailySessions} sessions`}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              label={`${
                                station.charging?.poles?.filter(
                                  (p) => p.status === "active" || p.status === "occupied"
                                ).length
                              } active poles`}
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
                            Monitor
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
                  Distance: {getDistanceToStation(selectedStationForDetail)}km
                  away
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Trạng thái Trụ & Cổng
                </Typography>
                {selectedStationForDetail.charging?.poles?.map((pole) => (
                    <Box key={pole.id} sx={{ fontSize: "0.875rem", mb: 1 }}>
                    • Trụ {pole.name}: {pole.availablePorts ?? (pole.ports || []).filter(p=>p.status==='available').length}/{pole.totalPorts ?? (pole.ports || []).length} cổng trống ({pole.status})
                  </Box>
                ))}

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Performance Today
                </Typography>
                <Box sx={{ fontSize: "0.875rem", mb: 1 }}>
                  • Revenue:{" "}
                  {formatCurrency(selectedStationForDetail.dailyRevenue)}
                </Box>
                <Box sx={{ fontSize: "0.875rem", mb: 1 }}>
                  • Sessions: {selectedStationForDetail.dailySessions}
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
                  perform maintenance actions.
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Quick Alerts */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Priority Alerts
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
                View All Alerts
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
          Schedule Maintenance: {actionDialog.station?.name}
        </DialogTitle>
        <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
            Schedule maintenance for poles and ports.
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Pole</InputLabel>
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
            label="Port ID"
            value={maintenanceForm.port}
            onChange={(e) =>
              setMaintenanceForm({ ...maintenanceForm, port: e.target.value })
            }
            sx={{ mb: 2 }}
            placeholder="e.g., Port 1, Port 2, All ports"
          />
          <TextField
            fullWidth
            label="Issue Description"
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
            label="Additional Notes"
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
    </Box>
  );
};

export default StaffDashboard;
