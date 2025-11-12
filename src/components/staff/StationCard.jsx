import React from "react";
import { 
  Card, 
  CardContent, 
  Typography, 
  Chip, 
  Box,
  IconButton,
  Tooltip,
  LinearProgress
} from "@mui/material";
import { 
  LocationOn, 
  EvStation, 
  TrendingUp,
  Warning,
  ArrowForward 
} from "@mui/icons-material";

export default function StationCard({ station, compact = false, onOpen, showActions = false }) {
  const getStatusColor = (status) => {
    const statusMap = {
      operational: "success",
      charging: "info",
      available: "success",
      maintenance: "warning",
      offline: "error",
      warning: "warning",
      error: "error"
    };
    return statusMap[status] || "default";
  };

  const utilizationPercent = station.charging?.totalPorts > 0
    ? ((station.charging.totalPorts - station.charging.availablePorts) / station.charging.totalPorts * 100)
    : 0;

  return (
    <Card 
      onClick={() => onOpen?.(station)} 
      sx={{ 
        cursor: onOpen ? "pointer" : "default",
        height: "100%",
        "&:hover": onOpen ? {
          boxShadow: 4,
          transform: "translateY(-2px)",
          transition: "all 0.2s"
        } : {}
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box flex={1}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {station.name}
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5} mb={1}>
              <LocationOn fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {station.location?.address || station.location || "N/A"}
              </Typography>
            </Box>
          </Box>
          {showActions && (
            <Tooltip title="Xem chi tiết">
              <IconButton size="small" color="primary">
                <ArrowForward fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Box display="flex" gap={1} flexWrap="wrap" mb={compact ? 0 : 2}>
          <Chip 
            size="small" 
            label={station.statusLabel || station.status} 
            color={getStatusColor(station.status)}
          />
          <Chip 
            size="small" 
            icon={<EvStation />}
            label={`${station.charging?.availablePorts || 0}/${station.charging?.totalPorts || 0} cổng`}
            variant="outlined"
          />
        </Box>

        {!compact && (
          <>
            <Box mb={1}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Công suất sử dụng
                </Typography>
                <Typography variant="caption" fontWeight={600}>
                  {utilizationPercent.toFixed(0)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={utilizationPercent} 
                color={utilizationPercent > 80 ? "error" : utilizationPercent > 50 ? "warning" : "success"}
              />
            </Box>

            {station.alerts?.length > 0 && (
              <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                <Warning fontSize="small" color="warning" />
                <Typography variant="caption" color="warning.main">
                  {station.alerts.length} cảnh báo
                </Typography>
              </Box>
            )}

            {station.monthlyRevenue && (
              <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                <TrendingUp fontSize="small" color="success" />
                <Typography variant="caption" color="text.secondary">
                  Doanh thu: {station.monthlyRevenue.toLocaleString('vi-VN')} VNĐ
                </Typography>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
