import React from 'react';
import { Card, CardContent, Box, Typography, Chip, Grid } from '@mui/material';
import { PowerSettingsNew as PowerIcon } from '@mui/icons-material';

const StationStatusCard = ({ station }) => {
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

  return (
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
  );
};

export default StationStatusCard;
