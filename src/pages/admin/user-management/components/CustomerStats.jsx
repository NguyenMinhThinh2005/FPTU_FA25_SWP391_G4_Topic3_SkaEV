import React from 'react';
import { Box, Typography, Grid, Card, CardContent, CircularProgress, Divider } from '@mui/material';
import { EvStation } from '@mui/icons-material';

const CustomerStats = ({ statistics }) => {
  const formatCurrency = (amount) => {
    const value = Number.isFinite(amount) ? amount : 0;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  if (!statistics) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Thống kê chi tiết
      </Typography>

      <Grid container spacing={3}>
        {/* Session Stats */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Phiên sạc
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2">Tổng số phiên:</Typography>
                  <Typography variant="body2" fontWeight="bold">{statistics.totalSessions}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2">Hoàn thành:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    {statistics.completedSessions}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2">Đã hủy:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="error.main">
                    {statistics.cancelledSessions}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">Tỷ lệ hoàn thành:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    {statistics.totalSessions > 0 
                      ? ((statistics.completedSessions / statistics.totalSessions) * 100).toFixed(1) 
                      : 0}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Energy Stats */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Năng lượng
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2">Tổng năng lượng:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    {statistics.totalEnergyKwh?.toFixed(2)} kWh
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2">Trung bình/phiên:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {statistics.averageEnergyPerSessionKwh?.toFixed(2)} kWh
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">Thời gian TB:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {statistics.averageDurationMinutes?.toFixed(0)} phút
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Spending Stats */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Chi tiêu
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2">Tổng chi tiêu:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    {formatCurrency(statistics.totalSpentVnd)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2">Trung bình/phiên:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(statistics.averageSpendingPerSessionVnd || 0)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">Phương thức ưa thích:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {statistics.preferredPaymentMethod || "N/A"}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Favorite Station */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Trạm sạc yêu thích
              </Typography>
              {statistics.mostUsedStationName ? (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <EvStation color="primary" />
                    <Typography variant="body2" fontWeight="bold">
                      {statistics.mostUsedStationName}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {statistics.mostUsedStationAddress}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Chưa có dữ liệu
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CustomerStats;
