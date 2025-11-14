import React, { useState, useEffect, useCallback } from 'react';
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
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  TrendingUp,
  CheckCircle,
  Person,
  EvStation,
  Receipt,
  Schedule,
  Settings,
  Security
} from '@mui/icons-material';

const AdminDetailTabs = ({ userId, currentTab }) => {
  const [overview, setOverview] = useState(null);
  const [activities, setActivities] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      // Mock overview data
      setOverview({
        totalUsers: 156,
        totalStations: 30,
        totalBookings: 2547,
        totalRevenue: 125000000,
        lastLogin: new Date('2024-11-06T08:30:00'),
        accountCreated: new Date('2023-05-15')
      });
    } catch (error) {
      console.error('Error fetching overview:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      // Mock activities
      setActivities([
        {
          id: 1,
          action: 'Tạo người dùng mới',
          details: 'Email: newuser@example.com',
          timestamp: new Date('2024-11-06T10:30:00'),
          ipAddress: '192.168.1.100'
        },
        {
          id: 2,
          action: 'Cập nhật trạm sạc',
          details: 'Trạm: Lotte Mart Vũng Tàu',
          timestamp: new Date('2024-11-06T09:15:00'),
          ipAddress: '192.168.1.100'
        },
        {
          id: 3,
          action: 'Xóa booking',
          details: 'Booking ID: BK001234',
          timestamp: new Date('2024-11-05T16:45:00'),
          ipAddress: '192.168.1.100'
        }
      ]);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      // Admin permissions
      setPermissions([
        { id: 1, module: 'Quản lý người dùng', permissions: ['Xem', 'Tạo', 'Sửa', 'Xóa'], icon: <Person /> },
        { id: 2, module: 'Quản lý trạm sạc', permissions: ['Xem', 'Tạo', 'Sửa', 'Xóa'], icon: <EvStation /> },
        { id: 3, module: 'Quản lý booking', permissions: ['Xem', 'Sửa', 'Xóa'], icon: <Receipt /> },
        { id: 4, module: 'Quản lý hệ thống', permissions: ['Xem', 'Cấu hình'], icon: <Settings /> },
        { id: 5, module: 'Báo cáo & Thống kê', permissions: ['Xem', 'Xuất dữ liệu'], icon: <TrendingUp /> },
        { id: 6, module: 'Bảo mật', permissions: ['Quản lý quyền', 'Xem log'], icon: <Security /> }
      ]);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAuditLog = useCallback(async () => {
    try {
      setLoading(true);
      // Mock audit log
      setAuditLog([
        {
          id: 1,
          timestamp: new Date('2024-11-06T10:30:00'),
          action: 'USER_CREATE',
          description: 'Tạo người dùng mới: newuser@example.com',
          status: 'success',
          ipAddress: '192.168.1.100'
        },
        {
          id: 2,
          timestamp: new Date('2024-11-06T09:15:00'),
          action: 'STATION_UPDATE',
          description: 'Cập nhật trạm sạc ID: 1',
          status: 'success',
          ipAddress: '192.168.1.100'
        },
        {
          id: 3,
          timestamp: new Date('2024-11-05T16:45:00'),
          action: 'BOOKING_DELETE',
          description: 'Xóa booking: BK001234',
          status: 'success',
          ipAddress: '192.168.1.100'
        },
        {
          id: 4,
          timestamp: new Date('2024-11-05T14:20:00'),
          action: 'LOGIN',
          description: 'Đăng nhập thành công',
          status: 'success',
          ipAddress: '192.168.1.100'
        }
      ]);
    } catch (error) {
      console.error('Error fetching audit log:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentTab === 0) fetchOverview();
    if (currentTab === 1) fetchActivities();
    if (currentTab === 2) fetchPermissions();
    if (currentTab === 3) fetchAuditLog();
  }, [currentTab, userId, fetchOverview, fetchActivities, fetchPermissions, fetchAuditLog]);

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
      {/* Tab 0: Overview */}
      {currentTab === 0 && overview && (
        <Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Tổng quan hệ thống
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Person color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      Tổng người dùng
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {overview.totalUsers}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <EvStation color="success" />
                    <Typography variant="body2" color="text.secondary">
                      Tổng trạm sạc
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {overview.totalStations}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Receipt color="info" />
                    <Typography variant="body2" color="text.secondary">
                      Tổng bookings
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {overview.totalBookings.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TrendingUp color="warning" />
                    <Typography variant="body2" color="text.secondary">
                      Doanh thu
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {(overview.totalRevenue / 1000000).toFixed(1)}M
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card variant="outlined" sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Thông tin tài khoản
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Đăng nhập gần nhất
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDate(overview.lastLogin)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Ngày tạo tài khoản
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {new Date(overview.accountCreated).toLocaleDateString('vi-VN')}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tab 1: Activities */}
      {currentTab === 1 && (
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
                    <TableCell>Hành động</TableCell>
                    <TableCell>Chi tiết</TableCell>
                    <TableCell>Thời gian</TableCell>
                    <TableCell>IP Address</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {activity.action}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {activity.details}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(activity.timestamp)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {activity.ipAddress}
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

      {/* Tab 2: Permissions */}
      {currentTab === 2 && (
        <Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Quyền hạn Admin
          </Typography>

          <Grid container spacing={2}>
            {permissions.map((perm) => (
              <Grid item xs={12} md={6} key={perm.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      {perm.icon}
                      <Typography variant="h6" fontWeight="bold">
                        {perm.module}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {perm.permissions.map((p, idx) => (
                        <Chip
                          key={idx}
                          label={p}
                          color="primary"
                          size="small"
                          icon={<CheckCircle fontSize="small" />}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Tab 3: Audit Log */}
      {currentTab === 3 && (
        <Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Nhật ký hệ thống ({auditLog.length})
          </Typography>

          {auditLog.length === 0 ? (
            <Alert severity="info">Chưa có nhật ký nào</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Thời gian</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Mô tả</TableCell>
                    <TableCell align="center">Trạng thái</TableCell>
                    <TableCell>IP Address</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditLog.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(log.timestamp)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={log.action} size="small" color="default" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{log.description}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={log.status === 'success' ? 'Thành công' : 'Thất bại'}
                          color={log.status === 'success' ? 'success' : 'error'}
                          size="small"
                          icon={<CheckCircle fontSize="small" />}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {log.ipAddress}
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
    </>
  );
};

export default AdminDetailTabs;
