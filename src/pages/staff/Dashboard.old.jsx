/* eslint-disable */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Typography,
  Button,
  Alert,
  Container,
  Paper,
  Stack,
} from "@mui/material";
import {
  ElectricCar,
  Warning,
  TrendingUp,
  PowerOff,
  Refresh,
  ArrowForward,
  Map as MapIcon,
  Speed,
} from "@mui/icons-material";
import {
  KpiCard,
  StationCard,
  AlertsPanel,
  TrendChart,
} from "../../components/staff";

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assignedStations, setAssignedStations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [trendPeriod, setTrendPeriod] = useState("week");
  const [trendData, setTrendData] = useState([]);

  // Mock assigned station ID từ user profile (mỗi staff chỉ quản lý 1 trạm)
  const assignedStationId = 1; // TODO: Lấy từ API user profile

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    loadTrendData(trendPeriod);
  }, [trendPeriod]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // TODO: Replace với real API calls
      // const [stationsRes, alertsRes] = await Promise.all([
      //   stationsAPI.getByIds(assignedStationIds),
      //   alertsAPI.getRecent()
      // ]);

      // Mock data - lấy trạm được phân công
      const mockStation = {
        id: 1,
        name: "Trạm sạc FPT Complex",
        location: { address: "Lô E2a-7, D1, KCN Cao, Q9, HCM" },
        status: "operational",
        statusLabel: "Đang hoạt động",
        charging: { availablePorts: 2, totalPorts: 4 },
        alerts: [],
        monthlyRevenue: 45000000,
      };

      const mockAlerts = [
        {
          id: 1,
          stationName: "Trạm sạc FPT Complex",
          severity: "warning",
          type: "Bảo trì",
          message: "Trụ AC 2 cần bảo trì định kỳ",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          id: 2,
          stationName: "Trạm sạc FPT Complex",
          severity: "info",
          type: "Thông báo",
          message: "Phiên sạc S001 hoàn thành",
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
        },
      ];

      setAssignedStations([mockStation]);
      setAlerts(mockAlerts);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrendData = (period) => {
    // Mock trend data
    const labels =
      period === "day"
        ? ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"]
        : period === "week"
        ? ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
        : ["T1", "T2", "T3", "T4", "T5", "T6"];

    const mockData = labels.map((label, i) => ({
      label,
      sessions: Math.floor(Math.random() * 50) + 20,
      revenue: Math.floor(Math.random() * 5000000) + 2000000,
      utilization: Math.floor(Math.random() * 40) + 40,
    }));

    setTrendData(mockData);
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const handleViewAllAlerts = () => {
    navigate("/staff/station-management");
  };

  const handleAlertClick = (alert) => {
    const station = assignedStations.find(
      (s) => s.name === alert.stationName
    );
    if (station) {
      navigate("/staff/station-management", { state: { selectedStation: station } });
    }
  };

  const handleViewStation = (station) => {
    navigate("/staff/station-management", { state: { selectedStation: station } });
  };

  // Calculate KPIs
  const totalStations = assignedStations.length;
  const offlineStations = assignedStations.filter(
    (s) => s.status === "offline"
  ).length;
  const todayAlerts = alerts.filter((a) => {
    const today = new Date();
    const alertDate = new Date(a.timestamp);
    return (
      alertDate.getDate() === today.getDate() &&
      alertDate.getMonth() === today.getMonth()
    );
  }).length;

  const totalPorts = assignedStations.reduce(
    (sum, s) => sum + (s.charging?.totalPorts || 0),
    0
  );
  const availablePorts = assignedStations.reduce(
    (sum, s) => sum + (s.charging?.availablePorts || 0),
    0
  );
  const utilization =
    totalPorts > 0 ? ((totalPorts - availablePorts) / totalPorts) * 100 : 0;

  return (
    <Container maxWidth="xl">
      <Box>
        {/* Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Tổng quan hoạt động trạm sạc được phân công
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<MapIcon />}
              onClick={() => navigate("/staff/station-management")}
            >
              Xem bản đồ
            </Button>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={handleRefresh}
            >
              Làm mới
            </Button>
          </Stack>
        </Box>

        {/* Alert if has assigned station */}
        {assignedStations.length > 0 && (
          <Alert
            severity="info"
            icon={<ElectricCar />}
            sx={{ mb: 3 }}
            action={
              <Button
                size="small"
                onClick={() => navigate("/staff/station-management")}
                endIcon={<ArrowForward />}
              >
                Quản lý trạm
              </Button>
            }
          >
            Bạn được phân công quản lý trạm:{" "}
            <strong>{assignedStations[0]?.name}</strong>
            {assignedStations[0]?.location?.address && (
              <> - {assignedStations[0].location.address}</>
            )}
          </Alert>
        )}

        {/* KPI Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              icon={<ElectricCar />}
              label="Trạm được phân công"
              value={totalStations}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              icon={<PowerOff />}
              label="Trạm offline"
              value={offlineStations}
              color="error"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              icon={<Warning />}
              label="Cảnh báo hôm nay"
              value={todayAlerts}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              icon={<Speed />}
              label="Công suất sử dụng"
              value={`${utilization.toFixed(0)}%`}
              color={utilization > 80 ? "error" : utilization > 50 ? "warning" : "success"}
            />
          </Grid>
        </Grid>

        {/* Trend Charts */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={6}>
            <TrendChart
              title="Phiên sạc theo thời gian"
              data={trendData}
              dataKeys={[{ key: "sessions", name: "Phiên sạc" }]}
              period={trendPeriod}
              onPeriodChange={setTrendPeriod}
              type="line"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TrendChart
              title="Doanh thu theo thời gian"
              data={trendData}
              dataKeys={[{ key: "revenue", name: "Doanh thu (VNĐ)" }]}
              period={trendPeriod}
              onPeriodChange={setTrendPeriod}
              type="bar"
            />
          </Grid>
        </Grid>

        {/* Quick Actions - Xem trạm cần bảo trì */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12}>
            <Paper
              sx={{
                p: 3,
                textAlign: "center",
                cursor: "pointer",
                "&:hover": { boxShadow: 4 },
              }}
              onClick={() =>
                navigate("/staff/station-management", {
                  state: { filterStatus: "maintenance" },
                })
              }
            >
              <Warning sx={{ fontSize: 48, color: "warning.main", mb: 1 }} />
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Xem trạm cần bảo trì
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Danh sách trạm có cảnh báo hoặc cần bảo trì
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Alerts & Quick View Station */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <AlertsPanel
              alerts={alerts}
              onViewAll={handleViewAllAlerts}
              onAlertClick={handleAlertClick}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6" fontWeight={600}>
                  Trạm sạc nhanh
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate("/staff/station-management")}
                >
                  Xem chi tiết
                </Button>
              </Box>
              {assignedStations.length > 0 && (
                <StationCard
                  station={assignedStations[0]}
                  compact={true}
                  onOpen={handleViewStation}
                  showActions={true}
                />
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default StaffDashboard;
