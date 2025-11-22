import React from "react";
import { Grid, Card, CardContent, Box, Typography } from "@mui/material";
import { PowerSettingsNew, BatteryChargingFull, TrendingUp, Speed } from "@mui/icons-material";

const SummaryCards = ({ realtimeData }) => {
  const getUtilizationColor = (percent) => {
    if (percent >= 80) return "#ff4444";
    if (percent >= 60) return "#ffbb28";
    return "#00c49f";
  };

  const totalSlots =
    (realtimeData?.availableSlots || 0) +
    (realtimeData?.occupiedSlots || 0) +
    (realtimeData?.maintenanceSlots || 0);
  
  const utilizationPercent = totalSlots > 0
    ? Math.round(((realtimeData?.occupiedSlots || 0) / totalSlots) * 100)
    : 0;

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {/* Current Power */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: "primary.light",
                  borderRadius: 2,
                }}
              >
                <PowerSettingsNew sx={{ fontSize: 32, color: "white" }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Công suất hiện tại
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {(realtimeData?.currentPowerUsage || 0).toFixed(1)} kW
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Active Sessions */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: "success.light",
                  borderRadius: 2,
                }}
              >
                <BatteryChargingFull sx={{ fontSize: 32, color: "white" }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Phiên sạc đang hoạt động
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {realtimeData?.activeSessions || 0}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Energy Today */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: "warning.light",
                  borderRadius: 2,
                }}
              >
                <TrendingUp sx={{ fontSize: 32, color: "white" }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Năng lượng hôm nay
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {(realtimeData?.totalEnergyToday || 0).toFixed(1)} kWh
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Utilization */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: "info.light",
                  borderRadius: 2,
                }}
              >
                <Speed sx={{ fontSize: 32, color: "white" }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Tỷ lệ sử dụng
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{ color: getUtilizationColor(utilizationPercent) }}
                >
                  {utilizationPercent}%
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default SummaryCards;