import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Paper,
  Avatar,
  LinearProgress,
} from "@mui/material";
import {
  LocationOn,
  ElectricCar,
  MonetizationOn,
} from "@mui/icons-material";
import PropTypes from 'prop-types';
import { formatCurrency } from "../../../../utils/helpers";

const StationList = ({ filteredStations, selectedStationForDetail, navigate }) => {
  
  const getStatusChip = (status) => {
    const statusLower = (status || '').toLowerCase();
    const configs = {
      active: { label: "Đang hoạt động", color: "success" },
      inactive: { label: "Không hoạt động", color: "error" },
      maintenance: { label: "Bảo trì", color: "warning" },
    };

    const config = configs[statusLower] || configs.inactive;
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Danh sách trạm sạc
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quản lý và giám sát các trạm sạc trong hệ thống
            </Typography>
          </Box>
          <Chip 
            label={`${filteredStations.length} trạm`} 
            color="primary" 
            size="medium"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>

        <Box sx={{ maxHeight: 650, overflowY: "auto", pr: 1 }}>
          {filteredStations.map((station) => (
            <Box key={station.id}>
              <Paper
                elevation={selectedStationForDetail?.id === station.id ? 4 : 1}
                sx={{
                  p: 2.5,
                  mb: 2,
                  border: 2,
                  borderColor:
                    selectedStationForDetail?.id === station.id
                      ? "primary.main"
                      : "transparent",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: "action.hover",
                    cursor: "pointer",
                    transform: "translateY(-2px)",
                    boxShadow: 3,
                  },
                }}
                role="button"
                tabIndex={0}
                aria-label={`Mở phân tích trạm ${station.name}`}
                onClick={() => {
                  navigate(`/admin/stations/${station.id}/analytics`);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/admin/stations/${station.id}/analytics`);
                  }
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: "primary.main",
                      width: 60,
                      height: 60,
                    }}
                  >
                    <LocationOn />
                  </Avatar>

                  <Box sx={{ flexGrow: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                        mb: 1,
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold">
                        {station.name}
                      </Typography>
                      {getStatusChip(station.status)}
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <LocationOn
                        sx={{ fontSize: 16, color: "text.secondary" }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {station.location.address}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <ElectricCar
                          sx={{ fontSize: 16, color: "primary.main" }}
                        />
                        <Typography variant="body2">
                          {station.charging?.totalPoles ?? station.totalPosts ?? station.chargingPostsCount ?? 0} trụ, {station.charging?.totalPorts ?? station.totalSlots ?? 0} cổng
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <MonetizationOn
                          sx={{ fontSize: 16, color: "success.main" }}
                        />
                        <Typography variant="body2">
                          {formatCurrency(station.revenue)} doanh thu hôm nay
                        </Typography>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Tỷ lệ sử dụng: {station.utilization.toFixed(0)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={station.utilization}
                          sx={{ width: 60, height: 4 }}
                        />
                      </Box>
                      <Chip
                        label={`${station.bookingsCount} phiên đang hoạt động`}
                        size="small"
                        variant="outlined"
                      />
                      {(station.status || '').toLowerCase() === 'active' ? (
                        <Chip
                          label={`${station.availableSlots} cổng khả dụng`}
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip
                          label="Không khả dụng"
                          color="error"
                          size="small"
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

StationList.propTypes = {
  filteredStations: PropTypes.array.isRequired,
  selectedStationForDetail: PropTypes.object,
  navigate: PropTypes.func.isRequired,
};

export default StationList;
