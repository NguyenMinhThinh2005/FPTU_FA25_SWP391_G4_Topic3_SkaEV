import React from "react";
import { Grid, Card, CardContent, Box, Avatar, Typography } from "@mui/material";
import {
  MonetizationOn,
  TrendingUp,
  ElectricCar,
  People,
  LocationOn
} from "@mui/icons-material";

const SystemReportsKPI = ({ revenueData, dashboardStats }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
                <MonetizationOn />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {revenueData.length > 0 
                    ? formatCurrency(revenueData[revenueData.length - 1]?.revenue || 0)
                    : formatCurrency(0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Doanh thu tháng
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <TrendingUp sx={{ color: "success.main", mr: 1 }} />
              <Typography variant="body2" color="success.main">
                Theo dữ liệu thực
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Avatar sx={{ bgcolor: "success.main", mr: 2 }}>
                <ElectricCar />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {dashboardStats?.bookings?.total || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng booking
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Hoàn thành: {dashboardStats?.bookings?.completed || 0}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Avatar sx={{ bgcolor: "info.main", mr: 2 }}>
                <People />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {dashboardStats?.users?.total || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng người dùng
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Khách hàng: {dashboardStats?.users?.customers || 0}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Avatar sx={{ bgcolor: "warning.main", mr: 2 }}>
                <LocationOn />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {dashboardStats?.stations?.active || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Trạm đang hoạt động
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Tổng: {dashboardStats?.stations?.total || 0}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default SystemReportsKPI;
