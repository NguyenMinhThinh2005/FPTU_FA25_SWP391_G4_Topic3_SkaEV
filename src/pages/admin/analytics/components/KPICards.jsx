import React from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
} from "@mui/material";
import {
  TrendingUp,
  ElectricCar,
  MonetizationOn,
  Battery80,
} from "@mui/icons-material";
import PropTypes from 'prop-types';
import { formatCurrency } from "../../../../utils/helpers";

const KPICards = ({ kpis }) => {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }} alignItems="stretch">
      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            background: "linear-gradient(135deg, #1379FF 0%, #0D5FDD 100%)",
            color: "white",
            height: "100%",
          }}
        >
          <CardContent sx={{ height: "100%", display: "flex", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                <MonetizationOn />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(kpis.totalRevenue)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Tổng doanh thu
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
            color: "white",
            height: "100%",
          }}
        >
          <CardContent sx={{ height: "100%", display: "flex", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                <ElectricCar />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {kpis.totalSessions.toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Phiên hoàn thành
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
            color: "white",
            height: "100%",
          }}
        >
          <CardContent sx={{ height: "100%", display: "flex", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                <Battery80 />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {kpis.totalSessions > 0 ? formatCurrency(kpis.arps) : "N/A"}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Doanh thu trung bình / phiên (ARPS)
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
            color: "white",
            height: "100%",
          }}
        >
          <CardContent sx={{ height: "100%", display: "flex", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                <TrendingUp />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {kpis.avgUtilization.toFixed(1)}%
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Tỷ lệ sử dụng trung bình
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

KPICards.propTypes = {
  kpis: PropTypes.shape({
    totalRevenue: PropTypes.number,
    totalSessions: PropTypes.number,
    arps: PropTypes.number,
    avgUtilization: PropTypes.number,
  }).isRequired,
};

export default KPICards;
