import React from "react";
import { Grid, Card, CardContent, Box, Typography, Button, LinearProgress } from "@mui/material";
import { Download } from "@mui/icons-material";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

const RevenueAnalysis = ({ revenueData, onExport }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Xu hướng doanh thu (theo thời gian)
              </Typography>
              <Button
                startIcon={<Download />}
                variant="outlined"
                onClick={onExport}
              >
                Xuất báo cáo
              </Button>
            </Box>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip
                  formatter={(value, name) => [
                    name === "revenue" ? formatCurrency(value) : value,
                    name === "revenue" ? "Doanh thu" : "Số phiên",
                  ]}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                  name="Doanh thu"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Biểu đồ phiên truy cập và người dùng
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sessions"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Phiên truy cập"
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="Người dùng"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Phân tích doanh thu
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Phí sạc (85%)
              </Typography>
              <LinearProgress
                variant="determinate"
                value={85}
                sx={{ height: 8, borderRadius: 4, mb: 1 }}
              />

              <Typography variant="body2" gutterBottom>
                Phí thuê bao (10%)
              </Typography>
              <LinearProgress
                variant="determinate"
                value={10}
                sx={{ height: 8, borderRadius: 4, mb: 1 }}
              />

              <Typography variant="body2" gutterBottom>
                Doanh thu từ đối tác (5%)
              </Typography>
              <LinearProgress
                variant="determinate"
                value={5}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default RevenueAnalysis;
