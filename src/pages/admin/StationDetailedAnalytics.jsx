import React from "react";
import { Box, CircularProgress, Alert, Button, Paper, Tabs, Tab } from "@mui/material";
import { Assessment, Schedule, TrendingUp, People } from "@mui/icons-material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useStationDetailedAnalytics } from "./station-detailed-analytics/hooks/useStationDetailedAnalytics";
import AnalyticsHeader from "./station-detailed-analytics/components/AnalyticsHeader";
import AnalyticsFilters from "./station-detailed-analytics/components/AnalyticsFilters";
import OverviewCards from "./station-detailed-analytics/components/OverviewCards";
import TimeSeriesTab from "./station-detailed-analytics/components/TimeSeriesTab";
import HourlyAnalysisTab from "./station-detailed-analytics/components/HourlyAnalysisTab";
import MonthlyAnalysisTab from "./station-detailed-analytics/components/MonthlyAnalysisTab";
import YearlyAnalysisTab from "./station-detailed-analytics/components/YearlyAnalysisTab";

const StationDetailedAnalytics = () => {
  const {
    loading,
    error,
    activeTab,
    dateRange,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    customDateMode,
    detailedAnalytics,
    monthlyAnalytics,
    yearlyAnalytics,
    granularity,
    handleTabChange,
    handleDateRangeChange,
    handleExport,
    loadAnalytics,
    navigate
  } = useStationDetailedAnalytics();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate("/admin/stations")}>
          Quay lại danh sách trạm
        </Button>
      </Box>
    );
  }

  if (!detailedAnalytics) {
    return (
      <Box p={3}>
        <Alert severity="warning">Không tìm thấy dữ liệu trạm</Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <AnalyticsHeader 
          detailedAnalytics={detailedAnalytics} 
          navigate={navigate} 
          onExport={handleExport} 
        />

        <AnalyticsFilters 
          dateRange={dateRange}
          handleDateRangeChange={handleDateRangeChange}
          customDateMode={customDateMode}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          onApply={loadAnalytics}
        />

        <OverviewCards detailedAnalytics={detailedAnalytics} />

        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
            <Tab label="Tổng quan theo thời gian" icon={<Assessment />} iconPosition="start" />
            <Tab label="Phân tích theo giờ" icon={<Schedule />} iconPosition="start" />
            <Tab label="Phân tích theo tháng" icon={<TrendingUp />} iconPosition="start" />
            <Tab label="Phân tích theo năm" icon={<People />} iconPosition="start" />
          </Tabs>
        </Paper>

        {activeTab === 0 && (
          <TimeSeriesTab 
            data={detailedAnalytics.dailyData} 
            granularity={granularity}
          />
        )}
        
        {activeTab === 1 && (
          <HourlyAnalysisTab 
            data={detailedAnalytics.hourlyDistribution}
            peakHour={detailedAnalytics.peakUsageHour}
          />
        )}
        
        {activeTab === 2 && monthlyAnalytics && (
          <MonthlyAnalysisTab data={monthlyAnalytics} />
        )}
        
        {activeTab === 3 && yearlyAnalytics && (
          <YearlyAnalysisTab data={yearlyAnalytics} />
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default StationDetailedAnalytics;
