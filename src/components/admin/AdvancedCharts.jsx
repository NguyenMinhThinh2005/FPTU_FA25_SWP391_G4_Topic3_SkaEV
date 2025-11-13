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
  Tab,
  TextField,
  Button
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
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
import reportsAPI from '../../services/api/reportsAPI';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AdvancedCharts = ({ stationId, showEnergy = true }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  
  // Date range state (local to this component)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [appliedDateRange, setAppliedDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  // Time-series data state
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [loadingTimeSeries, setLoadingTimeSeries] = useState(false);

  const handleApplyDateRange = () => {
    setAppliedDateRange({ ...dateRange });
  };

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

  const loadTimeSeriesData = async (start, end) => {
    try {
      setLoadingTimeSeries(true);
      const data = await reportsAPI.getStationDailyAnalytics(stationId, start, end);
      
      // Transform data for chart
      const chartData = data.map(day => ({
        date: new Date(day.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        energyKwh: day.totalEnergyKwh,
        sessions: day.totalBookings,
        revenue: day.totalRevenue,
        completedSessions: day.completedSessions
      }));
      
      setTimeSeriesData(chartData);
    } catch (err) {
      console.error('Error loading time series data:', err);
      setError('Không thể tải dữ liệu theo thời gian. ' + err.message);
    } finally {
      setLoadingTimeSeries(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
    // Load time-series data when appliedDateRange changes
    if (appliedDateRange?.startDate && appliedDateRange?.endDate) {
      loadTimeSeriesData(appliedDateRange.startDate, appliedDateRange.endDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationId, appliedDateRange]);

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
      {/* Date Range Picker - use MUI DatePicker for calendar popover */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Từ ngày"
            value={dateRange.startDate ? new Date(dateRange.startDate) : null}
            onChange={(d) => setDateRange({ ...dateRange, startDate: d ? d.toISOString().split('T')[0] : '' })}
            maxDate={new Date()}
            renderInput={(params) => <TextField {...params} size="small" />}
          />

          <DatePicker
            label="Đến ngày"
            value={dateRange.endDate ? new Date(dateRange.endDate) : null}
            onChange={(d) => setDateRange({ ...dateRange, endDate: d ? d.toISOString().split('T')[0] : '' })}
            maxDate={new Date()}
            renderInput={(params) => <TextField {...params} size="small" />}
          />
        </LocalizationProvider>

        <Button 
          variant="contained" 
          onClick={handleApplyDateRange}
          disabled={loadingTimeSeries}
        >
          Áp dụng
        </Button>
      </Box>

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
          {showEnergy && <Tab label="NĂNG LƯỢNG TIÊU THỤ" />}
          <Tab label="SỬ DỤNG SLOT" />
          <Tab label="DOANH THU" />
          <Tab label="PHÂN BỐ THEO GIỜ" />
        </Tabs>

        <CardContent>
          {/* Tab contents (index order follows the rendered Tabs above) */}

          {/* Energy tab (only when showEnergy is true) */}
          {showEnergy && currentTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Năng lượng tiêu thụ 
              </Typography>

              {loadingTimeSeries ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : timeSeriesData.length === 0 ? (
                <Alert severity="info">Không có dữ liệu trong khoảng thời gian này</Alert>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" label={{ value: 'kWh', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Số phiên sạc', angle: 90, position: 'insideRight' }} />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'Năng lượng (kWh)') return value.toFixed(2) + ' kWh';
                        return value;
                      }}
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="energyKwh" stroke="#8884d8" name="Năng lượng (kWh)" strokeWidth={2} dot={{ r: 4 }} />
                    <Line yAxisId="right" type="monotone" dataKey="sessions" stroke="#82ca9d" name="Số phiên sạc" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Box>
          )}

          {/* Slot Utilization Chart */}
          {/* Note: When showEnergy is false this becomes tab index 0 */}
          {((showEnergy && currentTab === 1) || (!showEnergy && currentTab === 0)) && (
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
          {((showEnergy && currentTab === 2) || (!showEnergy && currentTab === 1)) && (
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
          {((showEnergy && currentTab === 3) || (!showEnergy && currentTab === 2)) && (
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
