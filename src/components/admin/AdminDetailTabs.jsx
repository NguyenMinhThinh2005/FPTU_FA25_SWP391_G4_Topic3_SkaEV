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
  const [activities, setActivities] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [activitiesError, setActivitiesError] = useState(null);
  const [permissionsError, setPermissionsError] = useState(null);
  const [auditError, setAuditError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setActivitiesError(null);
      // Primary activity log endpoint
      const combined = [];
      try {
        const response = await axiosInstance.get(`/admin/AdminUsers/${userId}/admin/activity-log`);
        const payload = response?.data?.data ?? response?.data ?? [];

        if (Array.isArray(payload)) {
          const normalized = payload.map((log) => ({
            id: log.logId ?? log.id,
            category: log.category || 'activity',
            severity: log.severity,
            message: log.message,
            endpoint: log.endpoint,
            ipAddress: log.ipAddress,
            createdAt: log.createdAt
          }));
          combined.push(...normalized);
        }
      } catch (err) {
        // ignore - we'll attempt to gather sessions too
        console.warn('activity-log endpoint failed or missing for user:', userId, err?.message || err);
      }

      // Try to fetch login/session records (best-effort; multiple possible endpoints)
      const sessionEndpoints = [
        `/admin/AdminUsers/${userId}/sessions`,
        `/admin/AdminUsers/${userId}/admin/sessions`,
        `/admin/sessions?userId=${userId}`
      ];

      for (const ep of sessionEndpoints) {
        try {
          const resp = await axiosInstance.get(ep);
          const payload2 = resp?.data?.data ?? resp?.data ?? [];
          if (Array.isArray(payload2) && payload2.length > 0) {
            const mapped = payload2.map((s) => ({
              id: s.sessionId ?? s.id ?? `${ep}-${s.createdAt}`,
              category: 'Login Session',
              severity: 'low',
              message: s.description || s.action || (s.status ? `Session ${s.status}` : 'Đăng nhập/phiên'),
              endpoint: s.endpoint || '/auth/login',
              ipAddress: s.ipAddress || s.ip || '-',
              createdAt: s.createdAt || s.loggedAt || s.startTime
            }));
            combined.push(...mapped);
          }
        } catch (e) {
          // endpoint may not exist; ignore
          void e;
        }
      }

      // Sort combined by createdAt desc
      combined.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setActivities(combined);
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

      // Also try to fetch any admin action lists if available and merge
      const combined = [...normalized];
      const actionEndpoints = [
        `/admin/AdminUsers/${userId}/admin/actions`,
        `/admin/AdminUsers/${userId}/actions`,
        `/admin/actions?userId=${userId}`
      ];

      for (const ep of actionEndpoints) {
        try {
          const r2 = await axiosInstance.get(ep);
          const p2 = r2?.data?.data ?? r2?.data ?? [];
          if (Array.isArray(p2) && p2.length > 0) {
            const mapped2 = p2.map((a) => ({
              id: a.id ?? a.actionId ?? `${ep}-${a.createdAt}`,
              category: a.type || a.category || 'action',
              severity: a.severity || 'medium',
              message: a.message || a.description || a.action || JSON.stringify(a),
              endpoint: a.endpoint || a.resource || '-',
              ipAddress: a.ipAddress || a.ip || '-',
              createdAt: a.createdAt || a.timestamp
            }));
            combined.push(...mapped2);
          }
        } catch (e) {
          // ignore missing endpoints
          void e;
        }
      }

      combined.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setAuditLog(combined);
    } catch (error) {
      console.error('Error fetching audit log:', error);
      setAuditLog([]);
      setAuditError(error?.response?.data?.message || error.message || 'Lỗi khi tải nhật ký');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // New tab order: 0 = Hoạt động, 1 = Quyền hạn, 2 = Nhật ký
  useEffect(() => {
    if (currentTab === 0) fetchActivities();
    if (currentTab === 1) fetchPermissions();
    if (currentTab === 2) fetchAuditLog();
  }, [currentTab, fetchActivities, fetchPermissions, fetchAuditLog]);

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
      {/* Tab 0: Activities (login/session + activity log) */}
      {currentTab === 0 && (
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

  {/* Tab 1: Permissions */}
  {currentTab === 1 && (
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

  {/* Tab 2: Audit Log */}
  {currentTab === 2 && (
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

