import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import stationAnalyticsAPI from '../../services/stationAnalyticsAPI';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AdvancedCharts = ({ stationId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await stationAnalyticsAPI.getAllAnalytics(stationId);
      setAnalytics(data);
    } catch (err) {
      setError('Không thể tải dữ liệu phân tích. ' + err.message);
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!analytics) {
    return (
      <Alert severity="info">
        Không có dữ liệu phân tích
      </Alert>
    );
  }

  // Transform power usage data for chart
  const powerUsageData = analytics.powerUsage.labels.map((label, index) => ({
    date: label,
    energy: analytics.powerUsage.datasets[0].data[index],
    sessions: analytics.powerUsage.datasets[1].data[index]
  }));

  // Transform slot utilization data for chart
  const slotUtilizationData = analytics.slotUtilization.labels.map((label, index) => ({
    slot: label,
    utilization: analytics.slotUtilization.datasets[0].data[index]
  }));

  // Transform revenue data for pie chart
  const revenueData = analytics.revenue.labels.map((label, index) => ({
    name: label,
    value: analytics.revenue.datasets[0].data[index]
  }));

  // Transform session patterns data
  const sessionPatternsData = analytics.sessionPatterns.labels.map((label, index) => ({
    hour: label,
    sessions: analytics.sessionPatterns.datasets[0].data[index],
    avgDuration: analytics.sessionPatterns.datasets[1].data[index]
  }));

  return (
    <Box>
      {/* Summary Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tổng phiên sạc
              </Typography>
              <Typography variant="h4">
                {analytics.summary.totalBookings}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Tỷ lệ hoàn thành: {analytics.summary.completionRate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tổng năng lượng
              </Typography>
              <Typography variant="h4">
                {analytics.summary.totalEnergyKwh.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                kWh (30 ngày qua)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tổng doanh thu
              </Typography>
              <Typography variant="h4">
                {(analytics.summary.totalRevenue / 1000000).toFixed(1)}M
              </Typography>
              <Typography variant="caption" color="textSecondary">
                VNĐ (30 ngày qua)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Thời gian TB/phiên
              </Typography>
              <Typography variant="h4">
                {analytics.summary.averageSessionDuration.toFixed(0)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                phút
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Tabs */}
      <Card>
        <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
          <Tab label="Năng lượng tiêu thụ" />
          <Tab label="Sử dụng Slot" />
          <Tab label="Doanh thu" />
          <Tab label="Phân bố theo giờ" />
        </Tabs>

        <CardContent>
          {/* Power Usage Chart */}
          {currentTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Năng lượng tiêu thụ 30 ngày qua
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={powerUsageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" label={{ value: 'kWh', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Phiên sạc', angle: 90, position: 'insideRight' }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="energy" stroke="#8884d8" name="Năng lượng (kWh)" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="sessions" stroke="#82ca9d" name="Số phiên sạc" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}

          {/* Slot Utilization Chart */}
          {currentTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Tỷ lệ sử dụng theo Slot
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Tổng: {analytics.slotUtilization.totalBookings} bookings | 
                Hoàn thành: {analytics.slotUtilization.completedBookings}
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={slotUtilizationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="slot" />
                  <YAxis label={{ value: 'Tỷ lệ (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="utilization" fill="#8884d8" name="Tỷ lệ sử dụng (%)">
                    {slotUtilizationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}

          {/* Revenue Breakdown Chart */}
          {currentTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Phân bổ doanh thu theo phương thức thanh toán
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Tổng doanh thu: {(analytics.revenue.totalRevenue / 1000000).toFixed(2)}M VNĐ | 
                Giao dịch: {analytics.revenue.transactionCount}
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={revenueData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {revenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${(value / 1000000).toFixed(2)}M VNĐ`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          )}

          {/* Session Patterns Chart */}
          {currentTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Phân bố phiên sạc theo giờ
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Giờ cao điểm: {analytics.sessionPatterns.peakHour}:00 | 
                Tổng phiên: {analytics.sessionPatterns.totalSessions}
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={sessionPatternsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis yAxisId="left" label={{ value: 'Số phiên', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Phút', angle: 90, position: 'insideRight' }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="sessions" fill="#8884d8" name="Số phiên sạc" />
                  <Bar yAxisId="right" dataKey="avgDuration" fill="#82ca9d" name="Thời gian TB (phút)" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdvancedCharts;
