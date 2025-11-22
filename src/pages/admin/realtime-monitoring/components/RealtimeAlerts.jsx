import React from 'react';
import { Box, Alert } from '@mui/material';

const RealtimeAlerts = ({ alerts, onRemoveAlert }) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <Box mb={3}>
      {alerts.map((alert, index) => (
        <Alert
          key={index}
          severity={alert.severity || 'info'}
          sx={{ mb: 1 }}
          onClose={() => onRemoveAlert(index)}
        >
          {alert.message} - {new Date(alert.timestamp).toLocaleTimeString()}
        </Alert>
      ))}
    </Box>
  );
};

export default RealtimeAlerts;
