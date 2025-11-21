import React from "react";
import { Box, Typography, Grid, Card, CardContent } from "@mui/material";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

const UsageTab = ({ usageData, dateRangeLabel }) => {
  if (!usageData) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Báo cáo sử dụng - {dateRangeLabel}
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {usageData.totalSessions || 0}
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
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {usageData.completedSessions || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hoàn thành
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h4" color="error.main" fontWeight="bold">
                {usageData.cancelledSessions || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Đã hủy
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {(usageData.averageDurationMinutes || 0).toFixed(0)} phút
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Thời gian TB
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Usage Trend Chart */}
      {usageData.timeSeriesData && usageData.timeSeriesData.length > 0 && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Xu hướng sử dụng
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={usageData.timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatDate} />
                <YAxis />
                <Tooltip labelFormatter={formatDate} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sessions"
                  name="Phiên sạc"
                  stroke="#8884d8"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="Hoàn thành"
                  stroke="#82ca9d"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Status Breakdown */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Phân bố trạng thái
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Hoàn thành", value: usageData.completedSessions || 0 },
                      { name: "Đã hủy", value: usageData.cancelledSessions || 0 },
                      { name: "Đang sạc", value: usageData.inProgressSessions || 0 },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: "Hoàn thành", value: usageData.completedSessions || 0 },
                      { name: "Đã hủy", value: usageData.cancelledSessions || 0 },
                      { name: "Đang sạc", value: usageData.inProgressSessions || 0 },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Người dùng hoạt động
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2">Tổng người dùng:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {usageData.totalUsers || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2">Hoạt động:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    {usageData.activeUsers || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">Tỷ lệ hoạt động:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    {usageData.totalUsers > 0
                      ? ((usageData.activeUsers / usageData.totalUsers) * 100).toFixed(1)
                      : 0}
                    %
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UsageTab;
