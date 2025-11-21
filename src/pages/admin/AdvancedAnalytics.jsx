import React from "react";
import { Box, CircularProgress, Alert, Grid } from "@mui/material";
import { useAdvancedAnalytics } from "./analytics/hooks/useAdvancedAnalytics";
import AnalyticsHeader from "./analytics/components/AnalyticsHeader";
import KPICards from "./analytics/components/KPICards";
import RevenueChart from "./analytics/components/RevenueChart";
import RevenueByConnectorChart from "./analytics/components/RevenueByConnectorChart";
import UsageByHourChart from "./analytics/components/UsageByHourChart";
import EnergyUtilizationChart from "./analytics/components/EnergyUtilizationChart";
import StationPerformanceTable from "./analytics/components/StationPerformanceTable";

const AdvancedAnalytics = () => {
  const {
    loading,
    error,
    dateMode,
    selectedFrom,
    setSelectedFrom,
    selectedTo,
    setSelectedTo,
    fetchAnalyticsData,
    kpis,
    revenueSeries,
    revenueGranularity,
    energyUtilizationData,
    revenueByTypeData,
    peakHoursData,
    topStations,
    tableTotals,
    shouldShowPerStation,
    stationBars,
    setError
  } = useAdvancedAnalytics();

  const colors = {
    primary: "#1379FF",
    secondary: "#B5FF3D",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
  };

  const pieColors = [
    "#1379FF",
    "#B5FF3D",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
  ];

  if (loading && revenueSeries.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <AnalyticsHeader
        dateMode={dateMode}
        selectedFrom={selectedFrom}
        setSelectedFrom={setSelectedFrom}
        selectedTo={selectedTo}
        setSelectedTo={setSelectedTo}
        fetchAnalyticsData={fetchAnalyticsData}
        loading={loading}
      />

      {error && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <KPICards kpis={kpis} />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <RevenueChart
            shouldShowPerStation={shouldShowPerStation}
            stationBars={stationBars}
            revenueSeries={revenueSeries}
            revenueGranularity={revenueGranularity}
            colors={colors}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <RevenueByConnectorChart
            revenueByTypeData={revenueByTypeData}
            colors={colors}
            pieColors={pieColors}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <UsageByHourChart
            peakHoursData={peakHoursData}
            colors={colors}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <EnergyUtilizationChart
            energyUtilizationData={energyUtilizationData}
            colors={colors}
          />
        </Grid>
      </Grid>

      <StationPerformanceTable
        topStations={topStations}
        tableTotals={tableTotals}
      />
    </Box>
  );
};

export default AdvancedAnalytics;
