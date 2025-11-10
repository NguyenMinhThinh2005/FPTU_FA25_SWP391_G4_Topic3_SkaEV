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
  ListItemIcon,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  CheckCircle,
  Person,
  EvStation,
  Receipt,
  Settings,
  Security
} from '@mui/icons-material';
import axiosInstance from '../../services/axiosConfig';

const AdminDetailTabs = ({ userId, currentTab }) => {
  const [overview, setOverview] = useState(null);
  const [activities, setActivities] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [overviewError, setOverviewError] = useState(null);
  const [activitiesError, setActivitiesError] = useState(null);
  const [permissionsError, setPermissionsError] = useState(null);
  const [auditError, setAuditError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setOverviewError(null);
      const response = await axiosInstance.get(`/admin/AdminUsers/${userId}/admin/overview`);
      const payload = response?.data?.data ?? response?.data;

      if (!payload) {
        setOverview(null);
        return;
      }

      setOverview({
        totalUsers: payload.totalUsers ?? 0,
        activeUsers: payload.activeUsers ?? 0,
        totalStations: payload.totalStations ?? 0,
        activeStations: payload.activeStations ?? 0,
        totalBookings: payload.totalBookings30Days ?? payload.totalBookings ?? 0,
        revenue30Days: Number(payload.revenue30Days ?? payload.revenue ?? 0),
        newUsers30Days: payload.newUsers30Days ?? 0,
        openIncidents: payload.openIncidents ?? 0,
        lastLogin: payload.lastLoginAt ?? null,
        topStations: Array.isArray(payload.topStations) ? payload.topStations : []
      });
    } catch (error) {
      console.error('Error fetching overview:', error);
      setOverview(null);
      setOverviewError(error?.response?.data?.message || error.message || 'Lỗi khi tải tổng quan');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setActivitiesError(null);
      const response = await axiosInstance.get(`/admin/AdminUsers/${userId}/admin/activity-log`);
      const payload = response?.data?.data ?? response?.data ?? [];

      const normalized = Array.isArray(payload)
        ? payload.map((log) => ({
            id: log.logId ?? log.id,
            category: log.category,
            severity: log.severity,
            message: log.message,
            endpoint: log.endpoint,
            ipAddress: log.ipAddress,
            createdAt: log.createdAt
          }))
        : [];

      setActivities(normalized);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
      setActivitiesError(error?.response?.data?.message || error.message || 'Lỗi khi tải hoạt động');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setPermissionsError(null);
      const response = await axiosInstance.get(`/admin/AdminUsers/${userId}/admin/permissions`);
      const payload = response?.data?.data ?? response?.data ?? [];

      const normalized = Array.isArray(payload)
        ? payload.map((perm) => ({
            moduleKey: perm.moduleKey,
            moduleName: perm.moduleName,
            permissions: perm.permissions ?? []
          }))
        : [];

      setPermissions(normalized);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions([]);
      setPermissionsError(error?.response?.data?.message || error.message || 'Lỗi khi tải quyền hạn');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchAuditLog = useCallback(async () => {
    try {
      setLoading(true);
      setAuditError(null);
      const response = await axiosInstance.get(`/admin/AdminUsers/${userId}/admin/audit-log`);
      const payload = response?.data?.data ?? response?.data ?? [];

      const normalized = Array.isArray(payload)
        ? payload.map((log) => ({
            id: log.logId ?? log.id,
            category: log.category,
            severity: log.severity,
            message: log.message,
            endpoint: log.endpoint,
            ipAddress: log.ipAddress,
            createdAt: log.createdAt
          }))
        : [];

      setAuditLog(normalized);
    } catch (error) {
      console.error('Error fetching audit log:', error);
      setAuditLog([]);
      setAuditError(error?.response?.data?.message || error.message || 'Lỗi khi tải nhật ký');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (currentTab === 0) fetchOverview();
    if (currentTab === 1) fetchActivities();
    if (currentTab === 2) fetchPermissions();
    if (currentTab === 3) fetchAuditLog();
  }, [currentTab, fetchOverview, fetchActivities, fetchPermissions, fetchAuditLog]);

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

  const getSeverityColor = (severity) => {
    const normalized = (severity || '').toLowerCase();
    if (normalized === 'critical' || normalized === 'high') return 'error';
    if (normalized === 'medium') return 'warning';
    if (normalized === 'low') return 'info';
    return 'default';
  };

  const getModuleIcon = (moduleKey) => {
    const normalized = (moduleKey || '').toLowerCase();
    if (normalized.includes('user')) return <Person color="primary" />;
    if (normalized.includes('station')) return <EvStation color="success" />;
    if (normalized.includes('booking')) return <Receipt color="info" />;
    if (normalized.includes('report') || normalized.includes('analytic')) return <TrendingUp color="warning" />;
    if (normalized.includes('security') || normalized.includes('permission')) return <Security color="error" />;
    return <Settings color="action" />;
  };

  if (loading) return <LinearProgress />;

  return (
    <>
      {/* Tab 0: Overview */}
      {currentTab === 0 && (
        overview ? (
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
                      {overview.totalUsers.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Đang hoạt động: {overview.activeUsers.toLocaleString()}
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
                      {overview.totalStations.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Hoạt động: {overview.activeStations.toLocaleString()}
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
                        Booking 30 ngày
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold">
                      {overview.totalBookings.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Người dùng mới: {overview.newUsers30Days.toLocaleString()}
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
                        Doanh thu 30 ngày
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight="bold">
                      {formatCurrency(overview.revenue30Days)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Sự cố mở: {overview.openIncidents.toLocaleString()}
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
                      Ghi chú
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      Đủ điều kiện truy cập tất cả mô-đun quản trị.
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Top trạm theo doanh thu 30 ngày
                </Typography>
                {overview.topStations.length === 0 ? (
                  <Alert severity="info">Chưa có dữ liệu thống kê trạm.</Alert>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Trạm</TableCell>
                          <TableCell align="right">Phiên hoàn tất</TableCell>
                          <TableCell align="right">Doanh thu</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {overview.topStations.map((station) => (
                          <TableRow key={station.stationId} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {station.stationName}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              {station.completedSessions?.toLocaleString() ?? '0'}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(station.revenue)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Box>
        ) : (
          overviewError ? (
            <Alert severity="error" action={<Box><Button onClick={fetchOverview}>Thử lại</Button></Box>}>
              Lỗi tải dữ liệu tổng quan: {overviewError}
            </Alert>
          ) : (
            <Alert severity="info">Không có dữ liệu tổng quan để hiển thị.</Alert>
          )
        )
      )}

      {/* Tab 1: Activities */}
      {currentTab === 1 && (
        <Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Hoạt động gần đây ({activities.length})
          </Typography>

          {activities.length === 0 ? (
            activitiesError ? (
              <Alert severity="error" action={<Box><Button onClick={fetchActivities}>Thử lại</Button></Box>}>
                Lỗi tải hoạt động: {activitiesError}
              </Alert>
            ) : (
              <Alert severity="info">Chưa có hoạt động nào</Alert>
            )
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Danh mục</TableCell>
                    <TableCell>Nội dung</TableCell>
                    <TableCell>Endpoint</TableCell>
                    <TableCell align="center">Mức độ</TableCell>
                    <TableCell>Thời gian</TableCell>
                    <TableCell>IP Address</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {activity.category || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {activity.message || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {activity.endpoint || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={activity.severity || 'N/A'}
                          size="small"
                          color={getSeverityColor(activity.severity)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(activity.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {activity.ipAddress || '-'}
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

          {permissions.length === 0 ? (
            permissionsError ? (
              <Alert severity="error" action={<Box><Button onClick={fetchPermissions}>Thử lại</Button></Box>}>
                Lỗi tải quyền hạn: {permissionsError}
              </Alert>
            ) : (
              <Alert severity="info">Tài khoản chưa được cấu hình quyền riêng.</Alert>
            )
          ) : (
            <Grid container spacing={2}>
              {permissions.map((perm) => (
                <Grid item xs={12} md={6} key={perm.moduleKey || perm.moduleName}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {getModuleIcon(perm.moduleKey)}
                        </ListItemIcon>
                        <Typography variant="h6" fontWeight="bold">
                          {perm.moduleName}
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
          )}
        </Box>
      )}

      {/* Tab 3: Audit Log */}
      {currentTab === 3 && (
        <Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Nhật ký hệ thống ({auditLog.length})
          </Typography>

          {auditLog.length === 0 ? (
            auditError ? (
              <Alert severity="error" action={<Box><Button onClick={fetchAuditLog}>Thử lại</Button></Box>}>
                Lỗi tải nhật ký: {auditError}
              </Alert>
            ) : (
              <Alert severity="info">Chưa có nhật ký nào</Alert>
            )
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Thời gian</TableCell>
                    <TableCell>Danh mục</TableCell>
                    <TableCell>Nội dung</TableCell>
                    <TableCell>Endpoint</TableCell>
                    <TableCell align="center">Mức độ</TableCell>
                    <TableCell>IP Address</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditLog.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(log.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {log.category || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{log.message}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {log.endpoint || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={log.severity || 'N/A'}
                          color={getSeverityColor(log.severity)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {log.ipAddress || '-'}
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

