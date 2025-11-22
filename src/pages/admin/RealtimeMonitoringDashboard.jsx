import React from "react";
import { Box, CircularProgress, Alert, Grid } from "@mui/material";
import useRealtimeMonitoringDashboard from "./realtime-monitoring-dashboard/hooks/useRealtimeMonitoringDashboard";
import DashboardHeader from "./realtime-monitoring-dashboard/components/DashboardHeader";
import SummaryCards from "./realtime-monitoring-dashboard/components/SummaryCards";
import PowerChart from "./realtime-monitoring-dashboard/components/PowerChart";
import CapacityChart from "./realtime-monitoring-dashboard/components/CapacityChart";
import RecentSessions from "./realtime-monitoring-dashboard/components/RecentSessions";
import StationInfo from "./realtime-monitoring-dashboard/components/StationInfo";

const RealtimeMonitoringDashboard = () => {
  const {
    loading,
    selectedStation,
    stations,
    realtimeData,
    powerHistory,
    error,
    setSelectedStation,
    handleRefresh,
  } = useRealtimeMonitoringDashboard();

  if (loading && !realtimeData) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <DashboardHeader
        stations={stations}
        selectedStation={selectedStation}
        onStationChange={setSelectedStation}
        onRefresh={handleRefresh}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!realtimeData && !loading ? (
        <Alert severity="warning">
          Không có dữ liệu real-time. Vui lòng chọn trạm khác.
        </Alert>
      ) : (
        <>
          <SummaryCards realtimeData={realtimeData} />

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={8}>
              <PowerChart powerHistory={powerHistory} />
            </Grid>
            <Grid item xs={12} md={4}>
              <CapacityChart realtimeData={realtimeData} />
            </Grid>
          </Grid>

          <RecentSessions realtimeData={realtimeData} />

          <StationInfo realtimeData={realtimeData} />
        </>
      )}
    </Box>
  );
};

export default RealtimeMonitoringDashboard;
