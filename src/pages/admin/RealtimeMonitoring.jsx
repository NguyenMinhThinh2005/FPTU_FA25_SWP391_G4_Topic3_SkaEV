import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  PowerSettingsNew as PowerIcon,
  SignalCellularAlt as SignalIcon,
  Refresh as RefreshIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import signalRService from '../../services/signalRService';

const RealtimeMonitoring = () => {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    // Connect to SignalR
    const initSignalR = async () => {
      try {
        await signalRService.connect();
        setConnected(true);
        setLoading(false);
      } catch (error) {
        console.error('Failed to connect to SignalR:', error);
        setConnected(false);
        setLoading(false);
      }
    };

    initSignalR();

    // Subscribe to events
    const unsubscribeStationStatus = signalRService.onStationStatus((data) => {
      setStations((prev) => {
        const index = prev.findIndex((s) => s.stationID === data.stationID);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = data;
          return updated;
        }
        return [...prev, data];
      });
      setLastUpdate(new Date());
    });

    const unsubscribeSlotStatus = signalRService.onSlotStatus((data) => {
      // Update slot in station
      setStations((prev) => {
        return prev.map((station) => {
          if (station.stationID === data.stationID) {
            // Update slot info if needed
            return { ...station, lastSlotUpdate: data };
          }
          return station;
        });
      });
      setLastUpdate(new Date());
    });

    const unsubscribeAlert = signalRService.onAlert((data) => {
      setAlerts((prev) => [data, ...prev].slice(0, 5)); // Keep last 5 alerts
    });

    // Cleanup on unmount
    return () => {
      unsubscribeStationStatus();
      unsubscribeSlotStatus();
      unsubscribeAlert();
      signalRService.disconnect();
    };
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'available':
        return 'success';
      case 'maintenance':
        return 'warning';
      case 'inactive':
      case 'occupied':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Reconnect if needed
      if (!signalRService.isConnected()) {
        await signalRService.connect();
        setConnected(true);
      }
    } catch (error) {
      console.error('Refresh failed:', error);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h4">Realtime Monitoring</Typography>
          <Chip
            icon={connected ? <CheckIcon /> : <ErrorIcon />}
            label={connected ? 'Connected' : 'Disconnected'}
            color={connected ? 'success' : 'error'}
            size="small"
          />
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          {lastUpdate && (
            <Typography variant="body2" color="text.secondary">
              Last update: {lastUpdate.toLocaleTimeString()}
            </Typography>
          )}
          <Tooltip title="Refresh connection">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Box mb={3}>
          {alerts.map((alert, index) => (
            <Alert
              key={index}
              severity={alert.severity || 'info'}
              sx={{ mb: 1 }}
              onClose={() => setAlerts((prev) => prev.filter((_, i) => i !== index))}
            >
              {alert.message} - {new Date(alert.timestamp).toLocaleTimeString()}
            </Alert>
          ))}
        </Box>
      )}

      {/* Connection Status */}
      {!connected && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Not connected to realtime monitoring service. Click refresh to reconnect.
        </Alert>
      )}

      {/* Station Status Cards */}
      <Grid container spacing={3}>
        {stations.length === 0 ? (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="body1" color="text.secondary" textAlign="center">
                  No realtime station data available. Stations will appear here when updates are received.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          stations.map((station) => (
            <Grid item xs={12} sm={6} md={4} key={station.stationID}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="div">
                      {station.stationName}
                    </Typography>
                    <Chip
                      label={station.status}
                      color={getStatusColor(station.status)}
                      size="small"
                    />
                  </Box>

                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <PowerIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Total Slots: {station.totalSlots || 0}
                    </Typography>
                  </Box>

                  <Grid container spacing={1} mt={1}>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="h6" color="success.main">
                          {station.availableSlots || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Available
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="h6" color="error.main">
                          {station.occupiedSlots || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Occupied
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="h6" color="warning.main">
                          {station.maintenanceSlots || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Maintenance
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {station.updatedAt && (
                    <Typography variant="caption" color="text.secondary" display="block" mt={2}>
                      Updated: {new Date(station.updatedAt).toLocaleTimeString()}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
};

export default RealtimeMonitoring;
