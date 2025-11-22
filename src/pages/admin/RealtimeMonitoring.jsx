import React from 'react';
import { Box, Alert, CircularProgress } from '@mui/material';
import { useRealtimeMonitoring } from './realtime-monitoring/hooks/useRealtimeMonitoring';
import RealtimeHeader from './realtime-monitoring/components/RealtimeHeader';
import RealtimeAlerts from './realtime-monitoring/components/RealtimeAlerts';
import StationGrid from './realtime-monitoring/components/StationGrid';

const RealtimeMonitoring = () => {
  const {
    connected,
    loading,
    stations,
    alerts,
    lastUpdate,
    handleRefresh,
    removeAlert
  } = useRealtimeMonitoring();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <RealtimeHeader 
        connected={connected} 
        lastUpdate={lastUpdate} 
        onRefresh={handleRefresh} 
        loading={loading} 
      />

      <RealtimeAlerts 
        alerts={alerts} 
        onRemoveAlert={removeAlert} 
      />

      {!connected && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Not connected to realtime monitoring service. Click refresh to reconnect.
        </Alert>
      )}

      <StationGrid stations={stations} />
    </Box>
  );
};

export default RealtimeMonitoring;
