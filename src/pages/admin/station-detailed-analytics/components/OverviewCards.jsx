import React from "react";
import { Grid, Card, CardContent, Box, Typography } from "@mui/material";
import { Schedule, AttachMoney, ElectricBolt, TrendingUp } from "@mui/icons-material";
import { format } from "date-fns";
import { formatCurrency } from "../../../../utils/helpers";

const OverviewCards = ({ detailedAnalytics }) => {
  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="text.secondary" variant="body2">
                  Tổng đặt chỗ
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {detailedAnalytics.periodBookings}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Từ {format(new Date(detailedAnalytics.periodStartDate), "dd/MM/yyyy")}
                </Typography>
              </Box>
              <Schedule color="primary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="text.secondary" variant="body2">
                  Doanh thu
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {formatCurrency(detailedAnalytics.periodRevenue)}
                </Typography>
                <Typography variant="caption" color="success.main">
                  +{detailedAnalytics.completionRate.toFixed(1)}% hoàn thành
                </Typography>
              </Box>
              <AttachMoney color="success" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="text.secondary" variant="body2">
                  Năng lượng
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {detailedAnalytics.periodEnergy.toFixed(1)} kWh
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Trung bình {detailedAnalytics.averageSessionDuration.toFixed(0)} phút/lần
                </Typography>
              </Box>
              <ElectricBolt color="warning" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="text.secondary" variant="body2">
                  Tỷ lệ sử dụng
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {detailedAnalytics.currentOccupancyPercent.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {detailedAnalytics.totalSlots} cổng sạc
                </Typography>
              </Box>
              <TrendingUp color="info" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default OverviewCards;