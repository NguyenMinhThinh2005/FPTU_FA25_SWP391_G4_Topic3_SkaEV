import React from "react";
import { Card, CardContent, Typography, Divider, Grid, Box, Chip } from "@mui/material";
import { CheckCircle, EvStation, Speed, Schedule } from "@mui/icons-material";

const StationInfo = ({ realtimeData }) => {
  const getStatusColor = (status) => {
    const statusMap = {
      active: "success",
      operational: "success",
      online: "success",
      inactive: "error",
      offline: "error",
      maintenance: "warning",
    };
    return statusMap[status?.toLowerCase()] || "default";
  };

  const totalSlots =
    (realtimeData?.availableSlots || 0) +
    (realtimeData?.occupiedSlots || 0) +
    (realtimeData?.maintenanceSlots || 0);

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Thông tin trạm
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <CheckCircle color="success" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Trạng thái
                </Typography>
                <Chip
                  label={realtimeData?.status || "Unknown"}
                  color={getStatusColor(realtimeData?.status)}
                  size="small"
                />
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <EvStation color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Tổng cổng sạc
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {totalSlots}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <Speed color="info" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Công suất tối đa
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {realtimeData?.maxPowerCapacity || "N/A"} kW
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <Schedule color="action" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Cập nhật lúc
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {new Date().toLocaleTimeString("vi-VN")}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default StationInfo;