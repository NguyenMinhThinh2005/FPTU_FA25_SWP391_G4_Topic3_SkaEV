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
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  EvStation,
  LocationOn,
  Phone,
  CheckCircle,
  Warning,
  Visibility
} from '@mui/icons-material';
import axiosInstance from '../../services/axiosConfig';

const StaffDetailTabs = ({ userId, currentTab }) => {
  const [assignedStations, setAssignedStations] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAssignedStations = async () => {
    try {
      setLoading(true);
      // Get assigned stations for this staff member
      const response = await axiosInstance.get(`/admin/staff/${userId}/stations`);
      setAssignedStations(response.data || []);
    } catch (error) {
      console.error('Error fetching assigned stations:', error);
      // Mock data for now
      setAssignedStations([
        {
          stationId: 1,
          stationName: 'Trạm sạc Lotte Mart Vũng Tàu',
          address: '01 Đường 3/2, Phường 8, TP Vũng Tàu',
          totalPosts: 10,
          totalSlots: 20,
          status: 'active',
          assignedDate: new Date('2024-01-15')
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      // Mock schedule data - replace with real API
      setSchedule([
        {
          id: 1,
          dayOfWeek: 'Thứ Hai',
          shift: 'Sáng',
          timeRange: '08:00 - 12:00',
          stationName: 'Trạm sạc Lotte Mart Vũng Tàu'
        },
        {
          id: 2,
          dayOfWeek: 'Thứ Ba',
          shift: 'Chiều',
          timeRange: '13:00 - 17:00',
          stationName: 'Trạm sạc Lotte Mart Vũng Tàu'
        },
        {
          id: 3,
          dayOfWeek: 'Thứ Tư',
          shift: 'Sáng',
          timeRange: '08:00 - 12:00',
          stationName: 'Trạm sạc Lotte Mart Vũng Tàu'
        },
        {
          id: 4,
          dayOfWeek: 'Thứ Năm',
          shift: 'Chiều',
          timeRange: '13:00 - 17:00',
          stationName: 'Trạm sạc Lotte Mart Vũng Tàu'
        },
        {
          id: 5,
          dayOfWeek: 'Thứ Sáu',
          shift: 'Sáng',
          timeRange: '08:00 - 12:00',
          stationName: 'Trạm sạc Lotte Mart Vũng Tàu'
        }
      ]);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      setLoading(true);
      // Mock activities data - replace with real API
      setActivities([
        {
          id: 1,
          type: 'maintenance',
          description: 'Bảo trì trụ sạc Post 5',
          stationName: 'Trạm sạc Lotte Mart Vũng Tàu',
          timestamp: new Date('2024-11-05T10:30:00'),
          status: 'completed'
        },
        {
          id: 2,
          type: 'support',
          description: 'Hỗ trợ khách hàng tại Slot 12',
          stationName: 'Trạm sạc Lotte Mart Vũng Tàu',
          timestamp: new Date('2024-11-05T14:15:00'),
          status: 'completed'
        },
        {
          id: 3,
          type: 'inspection',
          description: 'Kiểm tra an toàn định kỳ',
          stationName: 'Trạm sạc Lotte Mart Vũng Tàu',
          timestamp: new Date('2024-11-04T09:00:00'),
          status: 'completed'
        }
      ]);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTab === 0) fetchAssignedStations();
    if (currentTab === 1) fetchSchedule();
    if (currentTab === 2) fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab, userId]);

  const getActivityTypeChip = (type) => {
    const config = {
      maintenance: { label: 'Bảo trì', color: 'warning' },
      support: { label: 'Hỗ trợ', color: 'info' },
      inspection: { label: 'Kiểm tra', color: 'success' }
    };
    const { label, color } = config[type] || { label: type, color: 'default' };
    return <Chip label={label} color={color} size="small" />;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                            {station.totalPosts}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Số cổng sạc
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {station.totalSlots}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary">
                          Ngày bắt đầu: {new Date(station.assignedDate).toLocaleDateString('vi-VN')}
                        </Typography>
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
                    <TableCell>Ca làm</TableCell>
                    <TableCell>Giờ làm việc</TableCell>
                    <TableCell>Trạm</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schedule.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {item.dayOfWeek}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.shift}
                          color={item.shift === 'Sáng' ? 'primary' : 'secondary'}
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Tab 2: Activities */}
      {currentTab === 2 && (
        <Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Hoạt động gần đây ({activities.length})
          </Typography>

          {activities.length === 0 ? (
            <Alert severity="info">Chưa có hoạt động nào</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Loại</TableCell>
                    <TableCell>Mô tả</TableCell>
                    <TableCell>Trạm</TableCell>
                    <TableCell>Thời gian</TableCell>
                    <TableCell align="center">Trạng thái</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id} hover>
                      <TableCell>{getActivityTypeChip(activity.type)}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{activity.description}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {activity.stationName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(activity.timestamp)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={<CheckCircle fontSize="small" />}
                          label="Hoàn thành"
                          color="success"
                          size="small"
                        />
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
