import React from "react";
import { Box, Tabs, Tab, CircularProgress } from "@mui/material";
import { useSystemReports } from "./system-reports/hooks/useSystemReports";
import SystemReportsHeader from "./system-reports/components/SystemReportsHeader";
import SystemReportsKPI from "./system-reports/components/SystemReportsKPI";
import RevenueAnalysis from "./system-reports/components/RevenueAnalysis";
import StationPerformance from "./system-reports/components/StationPerformance";
import UserAnalysis from "./system-reports/components/UserAnalysis";
import SystemHealth from "./system-reports/components/SystemHealth";

const AdminSystemReports = () => {
  const {
    tabValue,
    dateRange,
    setDateRange,
    loading,
    revenueData,
    stationUsage,
    userGrowth,
    systemHealth,
    dashboardStats,
    handleTabChange,
    handleExportReport
  } = useSystemReports();

  if (loading && !dashboardStats) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <SystemReportsHeader 
        dateRange={dateRange} 
        setDateRange={setDateRange} 
        onRefresh={() => window.location.reload()} 
      />

      <SystemReportsKPI 
        revenueData={revenueData} 
        dashboardStats={dashboardStats} 
      />

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Phân tích doanh thu" />
          <Tab label="Hiệu suất trạm" />
          <Tab label="Phân tích người dùng" />
          <Tab label="Tình trạng hệ thống" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <RevenueAnalysis 
          revenueData={revenueData} 
          onExport={handleExportReport} 
        />
      )}

      {tabValue === 1 && (
        <StationPerformance 
          loading={loading} 
          stationUsage={stationUsage} 
        />
      )}

      {tabValue === 2 && (
        <UserAnalysis 
          loading={loading} 
          userGrowth={userGrowth} 
        />
      )}

      {tabValue === 3 && (
        <SystemHealth 
          loading={loading} 
          systemHealth={systemHealth} 
        />
      )}
    </Box>
  );
};

export default AdminSystemReports;
