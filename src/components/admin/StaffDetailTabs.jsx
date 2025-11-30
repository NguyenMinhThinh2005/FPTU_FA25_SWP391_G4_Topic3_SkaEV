import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  LinearProgress
} from '@mui/material';
import { EvStation, LocationOn } from '@mui/icons-material';
import axiosInstance from '../../services/axiosConfig';

const StaffDetailTabs = ({ userId, currentTab }) => {
  const [assignedStations, setAssignedStations] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAssignedStations = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/admin/AdminUsers/${userId}/staff/stations`);
      const payload = response?.data?.data ?? response?.data ?? [];
      setAssignedStations(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error('Error fetching assigned stations:', error);
      setAssignedStations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/admin/AdminUsers/${userId}/staff/schedule`);
      const payload = response?.data?.data ?? response?.data ?? [];
      setSchedule(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTab === 0) fetchAssignedStations();
    if (currentTab === 1) fetchSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab, userId]);

  const formatDate = (date) => {
    if (!date) return '-';

    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(Number(value) || 0);
  };

  if (loading) return <LinearProgress />;

  return (
    <>
      {/* Tab 0: Assigned Stations */}
      {currentTab === 0 && (
        <Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Trạm sạc được giao ({assignedStations.length})
          </Typography>

          {assignedStations.length === 0 ? (
            <Alert severity="info">Nhân viên chưa được giao trạm nào</Alert>
          ) : (
            <Grid container spacing={2}>
              {assignedStations.map((station) => (
                <Grid item xs={12} md={6} key={station.stationId}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EvStation color="primary" />
                          <Typography variant="h6" fontWeight="bold">
                            {station.stationName}
                          </Typography>
                        </Box>
                        <Chip
                          label={station.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                          color={station.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {station.address}
                        </Typography>
                      </Box>

                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Số trụ sạc
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {station.totalPosts ?? 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Số cổng sạc
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {station.totalSlots ?? 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Đang sạc
                          </Typography>
                          <Typography variant="body1" fontWeight="medium" color="info.main">
                            {station.activeSessions ?? 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Khả dụng
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {station.availableSlots ?? 0}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Hoàn thành hôm nay
                            </Typography>
                            <Typography variant="body2" fontWeight="medium" color="success.main">
                              {station.completedSessionsToday ?? 0}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Doanh thu hôm nay
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {formatCurrency(station.revenueToday)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Sự cố mở
                            </Typography>
                            <Typography variant="body2" fontWeight="medium" color="error.main">
                              {station.openIncidents ?? 0}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Gán cho bạn
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {station.assignedIncidents ?? 0}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">
                              Ngày phân công: {station.assignedAt ? formatDate(station.assignedAt) : '-'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Tab 1: Schedule */}
      {currentTab === 1 && (
        <Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Lịch làm việc tuần
          </Typography>

          {schedule.length === 0 ? (
            <Alert severity="info">Chưa có lịch làm việc</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                        <TableCell>Ngày</TableCell>
                        <TableCell>Ca</TableCell>
                        <TableCell>Giờ</TableCell>
                        <TableCell>Trạm</TableCell>
                        <TableCell>Phương tiện</TableCell>
                        <TableCell>Điểm sạc</TableCell>
                        <TableCell align="center">Trạng thái</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                      {schedule.map((item) => (
                        <TableRow key={item.bookingId} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {item.dayOfWeek}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                              label={item.shift}
                              color={item.shift === 'Ca sáng' ? 'primary' : item.shift === 'Ca chiều' ? 'secondary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                            <Typography variant="body2">{item.timeRange}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {item.stationName}
                        </Typography>
                      </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.vehicle || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {item.slotLabel || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={item.status} size="small" color={item.status === 'completed' ? 'success' : item.status === 'in_progress' ? 'info' : 'default'} />
                          </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}
    </>
  );
};

export default StaffDetailTabs;
