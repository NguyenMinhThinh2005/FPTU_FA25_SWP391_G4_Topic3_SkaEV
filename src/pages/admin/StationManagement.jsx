import React, { useState, useEffect } from "react";
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
  Warning,
  CheckCircle,
  MapOutlined,
  Speed,
  Battery80,
  PowerSettingsNew,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import useStationStore from "../../store/stationStore";
import { mockData } from "../../data/mockData";
import { formatCurrency, formatDate } from "../../utils/helpers";

const StationManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { stations, addStation, updateStation, deleteStation, remoteDisableStation, remoteEnableStation } =
    useStationStore();
  const [selectedStation, setSelectedStation] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // 'list' | 'map'
  const [filterStatus, setFilterStatus] = useState("all");

  // Form state for station editing/creation
  const [stationForm, setStationForm] = useState({
    name: "",
    address: "",
    city: "",
    province: "",
    latitude: "",
    longitude: "",
    totalPorts: 4,
    fastChargePorts: 2,
    standardPorts: 2,
    pricePerKwh: 3500,
    operatingHours: "24/7",
    amenities: [],
    status: "active",
  });

  // Station analytics data
  const stationAnalytics = stations.map((station) => {
    const stationBookings = mockData.bookings.filter(
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
      avgSessionTime,
      efficiency: Math.random() * 20 + 80, // Mock efficiency
      issues: Math.floor(Math.random() * 3), // Mock issues count
    };
  });

  const handleStationClick = (station) => {
    setSelectedStation(station);
    setStationForm({
      name: station.name,
      address: station.location.address,
      city: station.location.city || "",
      province: station.location.province || "",
      latitude: station.location.coordinates?.lat || "",
      longitude: station.location.coordinates?.lng || "",
      totalPorts: station.charging.totalPorts,
      fastChargePorts: station.charging.fastChargePorts || 0,
      standardPorts:
        station.charging.standardPorts || station.charging.totalPorts,
      pricePerKwh: station.charging.pricePerKwh,
      operatingHours: station.operatingHours || "24/7",
      amenities: station.amenities || [],
      status: station.status,
    });
    setDialogOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedStation(null);
    setStationForm({
      name: "",
      address: "",
      city: "",
      province: "",
      latitude: "",
      longitude: "",
      totalPorts: 4,
      fastChargePorts: 2,
      standardPorts: 2,
      pricePerKwh: 3500,
      operatingHours: "24/7",
      amenities: [],
      status: "active",
    });
    setDialogOpen(true);
  };

  const handleSaveStation = () => {
    const stationData = {
      name: stationForm.name,
      location: {
        address: stationForm.address,
        city: stationForm.city,
        province: stationForm.province,
        coordinates: {
          lat: parseFloat(stationForm.latitude),
          lng: parseFloat(stationForm.longitude),
        },
      },
      charging: {
        totalPorts: parseInt(stationForm.totalPorts),
        availablePorts: parseInt(stationForm.totalPorts),
        fastChargePorts: parseInt(stationForm.fastChargePorts),
        standardPorts: parseInt(stationForm.standardPorts),
        pricePerKwh: parseFloat(stationForm.pricePerKwh),
      },
      operatingHours: stationForm.operatingHours,
      amenities: stationForm.amenities,
      status: stationForm.status,
    };

    if (selectedStation) {
      updateStation(selectedStation.id, stationData);
    } else {
      addStation(stationData);
    }

    setDialogOpen(false);
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
            Station Management ⚡
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor and manage your EV charging station network
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Filter Status</InputLabel>
            <Select
              value={filterStatus}
              label="Filter Status"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">All Stations</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
              <MenuItem value="offline">Offline</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateNew}
          >
            Add Station
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
                    Total Stations
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
                    Active Stations
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
                    Total Ports
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
                    Monthly Revenue
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
            Station Performance Overview
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Station</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Ports</TableCell>
                  <TableCell align="center">Utilization</TableCell>
                  <TableCell align="center">Monthly Revenue</TableCell>
                  <TableCell align="center">Sessions</TableCell>
                  <TableCell align="center">Avg Session</TableCell>
                  <TableCell align="center">Issues</TableCell>
                  <TableCell align="center">Actions</TableCell>
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
                        available
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
                      {station.issues > 0 ? (
                        <Chip
                          label={station.issues}
                          color="warning"
                          size="small"
                          icon={<Warning />}
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          None
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", gap: 0.5 }}>
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
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                        <IconButton size="small" color="error">
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
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedStation ? "Edit Station" : "Create New Station"}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Station Name"
                value={stationForm.name}
                onChange={(e) =>
                  setStationForm({ ...stationForm, name: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={stationForm.status}
                  label="Status"
                  onChange={(e) =>
                    setStationForm({ ...stationForm, status: e.target.value })
                  }
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="offline">Offline</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={stationForm.address}
                onChange={(e) =>
                  setStationForm({ ...stationForm, address: e.target.value })
                }
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="City"
                value={stationForm.city}
                onChange={(e) =>
                  setStationForm({ ...stationForm, city: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Province"
                value={stationForm.province}
                onChange={(e) =>
                  setStationForm({ ...stationForm, province: e.target.value })
                }
              />
            </Grid>

            {/* Coordinates */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Location Coordinates
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Latitude"
                type="number"
                value={stationForm.latitude}
                onChange={(e) =>
                  setStationForm({ ...stationForm, latitude: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Longitude"
                type="number"
                value={stationForm.longitude}
                onChange={(e) =>
                  setStationForm({ ...stationForm, longitude: e.target.value })
                }
              />
            </Grid>

            {/* Charging Configuration */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Charging Configuration
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Total Ports"
                type="number"
                value={stationForm.totalPorts}
                onChange={(e) =>
                  setStationForm({ ...stationForm, totalPorts: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Fast Charge Ports"
                type="number"
                value={stationForm.fastChargePorts}
                onChange={(e) =>
                  setStationForm({
                    ...stationForm,
                    fastChargePorts: e.target.value,
                  })
                }
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Standard Ports"
                type="number"
                value={stationForm.standardPorts}
                onChange={(e) =>
                  setStationForm({
                    ...stationForm,
                    standardPorts: e.target.value,
                  })
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Price per kWh (VND)"
                type="number"
                value={stationForm.pricePerKwh}
                onChange={(e) =>
                  setStationForm({
                    ...stationForm,
                    pricePerKwh: e.target.value,
                  })
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Operating Hours"
                value={stationForm.operatingHours}
                onChange={(e) =>
                  setStationForm({
                    ...stationForm,
                    operatingHours: e.target.value,
                  })
                }
                placeholder="e.g., 24/7 or 06:00 - 22:00"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveStation}>
            {selectedStation ? "Update Station" : "Create Station"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StationManagement;
