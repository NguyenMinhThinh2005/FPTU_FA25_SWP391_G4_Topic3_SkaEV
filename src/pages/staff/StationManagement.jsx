/* eslint-disable */
import React, { useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tab,
  Tabs,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import {
  LocationOn,
  Build,
  Settings,
  Visibility,
  PlayArrow,
  Stop,
  Warning,
  CheckCircle,
  Error,
  Schedule,
  PowerSettingsNew,
  ElectricBolt,
} from "@mui/icons-material";

// Mock data for stations and chargers
const mockStations = [
  {
    id: 1,
    name: "Vincom Royal City",
    location: "Thanh Xuân, Hà Nội",
    totalChargers: 8,
    activeChargers: 6,
    status: "operational",
    chargers: [
      {
        id: 1,
        name: "Charger #1",
        status: "charging",
        power: 22,
        currentUser: "User123",
        progress: 75,
      },
      {
        id: 2,
        name: "Charger #2",
        status: "available",
        power: 22,
        currentUser: null,
        progress: 0,
      },
      {
        id: 3,
        name: "Charger #3",
        status: "maintenance",
        power: 50,
        currentUser: null,
        progress: 0,
      },
      {
        id: 4,
        name: "Charger #4",
        status: "charging",
        power: 50,
        currentUser: "User456",
        progress: 45,
      },
      {
        id: 5,
        name: "Charger #5",
        status: "available",
        power: 22,
        currentUser: null,
        progress: 0,
      },
      {
        id: 6,
        name: "Charger #6",
        status: "charging",
        power: 22,
        currentUser: "User789",
        progress: 90,
      },
      {
        id: 7,
        name: "Charger #7",
        status: "offline",
        power: 50,
        currentUser: null,
        progress: 0,
      },
      {
        id: 8,
        name: "Charger #8",
        status: "available",
        power: 22,
        currentUser: null,
        progress: 0,
      },
    ],
  },
  {
    id: 2,
    name: "AEON Mall Long Biên",
    location: "Long Biên, Hà Nội",
    totalChargers: 12,
    activeChargers: 10,
    status: "operational",
    chargers: [
      {
        id: 9,
        name: "Charger #1",
        status: "charging",
        power: 22,
        currentUser: "UserABC",
        progress: 60,
      },
      {
        id: 10,
        name: "Charger #2",
        status: "available",
        power: 22,
        currentUser: null,
        progress: 0,
      },
      // ... more chargers
    ],
  },
];

const mockMaintenanceLog = [
  {
    id: 1,
    stationName: "Vincom Royal City",
    chargerName: "Charger #3",
    type: "Scheduled",
    description: "Regular maintenance check",
    technician: "Nguyễn Văn A",
    startTime: "2025-03-15 09:00",
    endTime: "2025-03-15 11:30",
    status: "completed",
  },
  {
    id: 2,
    stationName: "AEON Mall Long Biên",
    chargerName: "Charger #5",
    type: "Emergency",
    description: "Power connection issue",
    technician: "Trần Văn B",
    startTime: "2025-03-14 14:00",
    endTime: null,
    status: "in_progress",
  },
];

const StaffStationManagement = () => {
  const [stations, setStations] = useState(mockStations);
  const [selectedStation, setSelectedStation] = useState(stations[0]);
  const [tabValue, setTabValue] = useState(0);
  const [maintenanceDialog, setMaintenanceDialog] = useState(false);
  const [selectedCharger, setSelectedCharger] = useState(null);
  const [maintenanceForm, setMaintenanceForm] = useState({
    type: "scheduled",
    description: "",
    priority: "medium",
    technician: "",
  });
  const [controlDialog, setControlDialog] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case "charging":
        return "success";
      case "available":
        return "info";
      case "maintenance":
        return "warning";
      case "offline":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "charging":
        return <ElectricBolt />;
      case "available":
        return <CheckCircle />;
      case "maintenance":
        return <Build />;
      case "offline":
        return <Error />;
      default:
        return <PowerSettingsNew />;
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleScheduleMaintenance = (charger) => {
    setSelectedCharger(charger);
    setMaintenanceDialog(true);
  };

  const handleMaintenanceSubmit = () => {
    // Here you would send the maintenance request to your backend
    console.log("Maintenance request:", {
      charger: selectedCharger,
      ...maintenanceForm,
    });
    setMaintenanceDialog(false);
    setMaintenanceForm({
      type: "scheduled",
      description: "",
      priority: "medium",
      technician: "",
    });
  };

  const handleChargerControl = (charger, action) => {
    console.log(`${action} charger:`, charger);
    // Here you would send control commands to your backend
  };

  const handleViewDetails = (charger) => {
    setSelectedCharger(charger);
    setControlDialog(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Quản lý trạm sạc
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Giám sát và điều khiển các trạm sạc và thiết bị
        </Typography>
      </Box>

      {/* Station Selector */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stations.map((station) => (
          <Grid item xs={12} sm={6} md={4} key={station.id}>
            <Card
              sx={{
                cursor: "pointer",
                border: selectedStation?.id === station.id ? 2 : 1,
                borderColor:
                  selectedStation?.id === station.id
                    ? "primary.main"
                    : "grey.300",
              }}
              onClick={() => setSelectedStation(station)}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {station.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                      {station.location}
                    </Typography>
                  </Box>
                  <Chip
                    label={station.status}
                    color={getStatusColor(station.status)}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" gutterBottom>
                  Active: {station.activeChargers}/{station.totalChargers}{" "}
                  chargers
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(station.activeChargers / station.totalChargers) * 100}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Charger Status" />
          <Tab label="Maintenance Log" />
          <Tab label="Performance" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {tabValue === 0 && selectedStation && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {selectedStation.name} - Charger Status
            </Typography>

            <Grid container spacing={2}>
              {selectedStation.chargers?.map((charger) => (
                <Grid item xs={12} sm={6} md={4} key={charger.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 2,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          {getStatusIcon(charger.status)}
                          <Box sx={{ ml: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {charger.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {charger.power}kW
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={charger.status}
                          color={getStatusColor(charger.status)}
                          size="small"
                        />
                      </Box>

                      {charger.status === "charging" && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" gutterBottom>
                            User: {charger.currentUser}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={charger.progress}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {charger.progress}% Complete
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Tooltip title="Xem chi tiết">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(charger)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>

                        {charger.status === "available" && (
                          <Tooltip title="Start Test">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() =>
                                handleChargerControl(charger, "start")
                              }
                            >
                              <PlayArrow />
                            </IconButton>
                          </Tooltip>
                        )}

                        {charger.status === "charging" && (
                          <Tooltip title="Stop Charging">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                handleChargerControl(charger, "stop")
                              }
                            >
                              <Stop />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Tooltip title="Schedule Maintenance">
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => handleScheduleMaintenance(charger)}
                          >
                            <Build />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Settings">
                          <IconButton size="small">
                            <Settings />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Maintenance Log
            </Typography>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Station</TableCell>
                    <TableCell>Charger</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Technician</TableCell>
                    <TableCell>Start Time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockMaintenanceLog.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.stationName}</TableCell>
                      <TableCell>{log.chargerName}</TableCell>
                      <TableCell>
                        <Chip
                          label={log.type}
                          color={log.type === "Emergency" ? "error" : "info"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{log.description}</TableCell>
                      <TableCell>{log.technician}</TableCell>
                      <TableCell>{log.startTime}</TableCell>
                      <TableCell>
                        <Chip
                          label={log.status}
                          color={
                            log.status === "completed" ? "success" : "warning"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {tabValue === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Station Performance Metrics
            </Typography>
            <Alert severity="info">
              Performance analytics will be displayed here including usage
              statistics, energy consumption, revenue generation, and efficiency
              metrics.
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Maintenance Dialog */}
      <Dialog
        open={maintenanceDialog}
        onClose={() => setMaintenanceDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Schedule Maintenance - {selectedCharger?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={maintenanceForm.type}
                label="Type"
                onChange={(e) =>
                  setMaintenanceForm({
                    ...maintenanceForm,
                    type: e.target.value,
                  })
                }
              >
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="emergency">Emergency</MenuItem>
                <MenuItem value="preventive">Preventive</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={maintenanceForm.description}
              onChange={(e) =>
                setMaintenanceForm({
                  ...maintenanceForm,
                  description: e.target.value,
                })
              }
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={maintenanceForm.priority}
                label="Priority"
                onChange={(e) =>
                  setMaintenanceForm({
                    ...maintenanceForm,
                    priority: e.target.value,
                  })
                }
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Assigned Technician"
              value={maintenanceForm.technician}
              onChange={(e) =>
                setMaintenanceForm({
                  ...maintenanceForm,
                  technician: e.target.value,
                })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMaintenanceDialog(false)}>Cancel</Button>
          <Button onClick={handleMaintenanceSubmit} variant="contained">
            Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Charger Control Dialog */}
      <Dialog
        open={controlDialog}
        onClose={() => setControlDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Charger Control - {selectedCharger?.name}</DialogTitle>
        <DialogContent>
          {selectedCharger && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Status
                  </Typography>
                  <Chip
                    label={selectedCharger.status}
                    color={getStatusColor(selectedCharger.status)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Power Rating
                  </Typography>
                  <Typography variant="body2">
                    {selectedCharger.power}kW
                  </Typography>
                </Grid>
                {selectedCharger.currentUser && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Current User
                    </Typography>
                    <Typography variant="body2">
                      {selectedCharger.currentUser}
                    </Typography>
                  </Grid>
                )}
                {selectedCharger.status === "charging" && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Progress
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={selectedCharger.progress}
                      sx={{ height: 8, borderRadius: 4, mb: 1 }}
                    />
                    <Typography variant="body2">
                      {selectedCharger.progress}% Complete
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setControlDialog(false)}>Close</Button>
          {selectedCharger?.status === "charging" && (
            <Button
              color="error"
              onClick={() => {
                handleChargerControl(selectedCharger, "stop");
                setControlDialog(false);
              }}
            >
              Stop Charging
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffStationManagement;
