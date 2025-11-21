import React from "react";
import { Box, Card, CardContent, Tabs, Tab, CircularProgress } from "@mui/material";
import { AttachMoney, BatteryChargingFull, TrendingUp, Schedule, LocationOn } from "@mui/icons-material";
import { useReportsAnalytics } from "./reports-analytics/hooks/useReportsAnalytics";
import ReportsHeader from "./reports-analytics/components/ReportsHeader";
import ReportsFilters from "./reports-analytics/components/ReportsFilters";
import RevenueTab from "./reports-analytics/components/RevenueTab";
import EnergyTab from "./reports-analytics/components/EnergyTab";
import UsageTab from "./reports-analytics/components/UsageTab";
import PeakHoursTab from "./reports-analytics/components/PeakHoursTab";
import StationComparisonTab from "./reports-analytics/components/StationComparisonTab";

const ReportsAnalytics = () => {
  const {
    loading,
    currentTab,
    setCurrentTab,
    dateRange,
    setDateRange,
    granularity,
    setGranularity,
    revenueData,
    energyData,
    usageData,
    peakHoursData,
    stationComparison,
    exportMenuAnchor,
    fetchData,
    getDateRangeLabel,
    handleExportClick,
    handleExportClose,
    handleExport
  } = useReportsAnalytics();

  return (
    <Box>
      <ReportsHeader 
        onExportClick={handleExportClick}
        exportMenuAnchor={exportMenuAnchor}
        onExportClose={handleExportClose}
        onExport={handleExport}
        onRefresh={fetchData}
      />

      <ReportsFilters 
        dateRange={dateRange}
        setDateRange={setDateRange}
        granularity={granularity}
        setGranularity={setGranularity}
        dateRangeLabel={getDateRangeLabel()}
      />

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
            <Tab label="Doanh thu" icon={<AttachMoney />} iconPosition="start" />
            <Tab label="Năng lượng" icon={<BatteryChargingFull />} iconPosition="start" />
            <Tab label="Sử dụng" icon={<TrendingUp />} iconPosition="start" />
            <Tab label="Giờ cao điểm" icon={<Schedule />} iconPosition="start" />
            <Tab label="So sánh trạm" icon={<LocationOn />} iconPosition="start" />
          </Tabs>
        </Box>

        <CardContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {currentTab === 0 && (
                <RevenueTab 
                  revenueData={revenueData} 
                  dateRangeLabel={getDateRangeLabel()} 
                />
              )}

              {currentTab === 1 && (
                <EnergyTab 
                  energyData={energyData} 
                  dateRangeLabel={getDateRangeLabel()} 
                />
              )}

              {currentTab === 2 && (
                <UsageTab 
                  usageData={usageData} 
                  dateRangeLabel={getDateRangeLabel()} 
                />
              )}

              {currentTab === 3 && (
                <PeakHoursTab 
                  peakHoursData={peakHoursData} 
                  dateRangeLabel={getDateRangeLabel()} 
                />
              )}

              {currentTab === 4 && (
                <StationComparisonTab 
                  stationComparison={stationComparison} 
                  dateRangeLabel={getDateRangeLabel()} 
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReportsAnalytics;
