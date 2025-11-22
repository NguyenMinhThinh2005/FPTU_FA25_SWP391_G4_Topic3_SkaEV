import React from "react";
import { Box, Typography, Grid, Card, CardContent, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Chip } from "@mui/material";
import { TrendingUp } from "@mui/icons-material";
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area } from "recharts";

const RevenueTab = ({ revenueData, dateRangeLabel }) => {
  if (!revenueData) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Báo cáo doanh thu - {dateRangeLabel}
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {formatCurrency(revenueData.totalRevenue || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tổng doanh thu
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {formatCurrency(revenueData.averageRevenuePerSession || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                TB/phiên sạc
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {revenueData.totalSessions || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tổng phiên sạc
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {revenueData.growthRate >= 0 ? (
                  <TrendingUp color="success" />
                ) : (
                  <TrendingUp color="error" sx={{ transform: "rotate(180deg)" }} />
                )}
                <Typography
                  variant="h4"
                  color={revenueData.growthRate >= 0 ? "success.main" : "error"}
                  fontWeight="bold"
                >
                  {revenueData.growthRate?.toFixed(1) || 0}%
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Tăng trưởng
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Revenue Chart */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Biểu đồ doanh thu theo thời gian
          </Typography>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={revenueData.timeSeriesData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatDate} />
              <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                labelFormatter={formatDate}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Doanh thu"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Stations */}
      {revenueData.topStations && revenueData.topStations.length > 0 && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Top trạm sạc theo doanh thu
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Thứ hạng</TableCell>
                    <TableCell>Trạm sạc</TableCell>
                    <TableCell align="right">Doanh thu</TableCell>
                    <TableCell align="right">Phiên sạc</TableCell>
                    <TableCell align="right">TB/phiên</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {revenueData.topStations.map((station, index) => (
                    <TableRow key={station.stationId}>
                      <TableCell>
                        <Chip
                          label={`#${index + 1}`}
                          size="small"
                          color={index === 0 ? "primary" : "default"}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {station.stationName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {station.address}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          {formatCurrency(station.totalRevenue)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{station.sessionCount}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(station.avgRevenuePerSession)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default RevenueTab;
