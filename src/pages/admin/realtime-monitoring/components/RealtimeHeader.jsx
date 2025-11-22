import React from 'react';
import { Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { CheckCircle as CheckIcon, Error as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';

const RealtimeHeader = ({ connected, lastUpdate, onRefresh, loading }) => {
  return (
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
          <IconButton onClick={onRefresh} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default RealtimeHeader;
