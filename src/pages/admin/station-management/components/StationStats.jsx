import React from "react";
import { Grid, Card, CardContent, Box, Avatar, Typography, Tooltip } from "@mui/material";
import { LocationOn, CheckCircle, ElectricCar, Battery80 } from "@mui/icons-material";
import PropTypes from "prop-types";

const StationStats = ({ filteredStations, lastUpdated }) => {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }} alignItems="stretch">
      <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
        <Card
          sx={{
            background: "linear-gradient(135deg, #1379FF 0%, #0D5FDD 100%)",
            color: "white",
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: 120,
          }}
        >
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'space-between', height: '100%' }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width:48, height:48 }}>
                <LocationOn />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="700">
                  {filteredStations.length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Tổng số trạm
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
        <Card
          sx={{
            background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
            color: "white",
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: 120,
          }}
        >
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'space-between', height: '100%' }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width:48, height:48 }}>
                <CheckCircle />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="700">
                  {filteredStations.filter((s) => s.status === "active").length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Trạm đang hoạt động
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
        <Card
          sx={{
            background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
            color: "white",
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: 120,
          }}
        >
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'space-between', height: '100%' }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width:48, height:48 }}>
                <ElectricCar />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="700">
                  {filteredStations.reduce((sum, s) => {
                    const charging = s.charging ?? {};
                    const availablePorts = charging.availablePorts ?? charging.totalPorts ?? 0;
                    return sum + (Number.isFinite(availablePorts) ? availablePorts : 0);
                  }, 0)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Tổng số cổng khả dụng hiện tại
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
        <Card
          sx={{
            background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
            color: "white",
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: 120,
          }}
        >
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'space-between', height: '100%' }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width:48, height:48 }}>
                <Battery80 />
              </Avatar>
              <Box>
                <Tooltip title={`Cập nhật: ${lastUpdated}`} arrow>
                  <Typography variant="h5" fontWeight="700" aria-label="active-sessions-count">
                    {new Intl.NumberFormat().format(filteredStations.reduce((sum, s) => sum + (s.activeSessions ?? 0), 0))}
                  </Typography>
                </Tooltip>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Phiên sạc đang hoạt động
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

StationStats.propTypes = {
  filteredStations: PropTypes.array.isRequired,
  lastUpdated: PropTypes.string.isRequired,
};

export default StationStats;
