import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  AlertTitle,
  CircularProgress,
  Tabs,
  Tab,
  LinearProgress,
  Switch,
  FormControlLabel,
  Divider,
  Badge,
} from '@mui/material';
import {
  ArrowBack,
  Refresh,
  PowerSettingsNew,
  Settings,
  Warning,
  Error as ErrorIcon,
  CheckCircle,
  TrendingUp,
  ElectricBolt,
  Speed,
  BatteryCharging80,
  Schedule,
  Person,
  DirectionsCar,
  Edit,
  Save,
  Close,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import adminStationAPI from '../../services/adminStationAPI';
import adminAPI from '../../services/api/adminAPI';
import { formatCurrency } from '../../utils/helpers';
import StaffAssignment from '../../components/admin/StaffAssignment';
import AdvancedCharts from '../../components/admin/AdvancedCharts';

const StationDetailAnalytics = () => {
  const { stationId } = useParams();
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(true);
  const [stationDetail, setStationDetail] = useState(null);
  const [realtimeData, setRealtimeData] = useState(null);
  const [errors, setErrors] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);

  // Dialog states
  const [controlDialog, setControlDialog] = useState({ open: false, target: null, type: '' });
  const [configDialog, setConfigDialog] = useState({ open: false, postId: null, config: {} });
  const [errorDialog, setErrorDialog] = useState({ open: false, error: null });

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [managerOptions, setManagerOptions] = useState([]);
  const [managerLoading, setManagerLoading] = useState(false);
  const [managerError, setManagerError] = useState('');
  const [selectedManagerId, setSelectedManagerId] = useState(null);
  const [savingManager, setSavingManager] = useState(false);

  const showSnackbar = useCallback((message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchStationData = useCallback(async () => {
    try {
      const [detailRes, realtimeRes, errorsRes] = await Promise.all([
        adminStationAPI.getStationDetail(stationId),
        adminStationAPI.getStationRealTimeData(stationId),
        adminStationAPI.getStationErrors(stationId, false),
      ]);

      if (detailRes.success) setStationDetail(detailRes.data);
      if (realtimeRes.success) setRealtimeData(realtimeRes.data);
      if (errorsRes.success) setErrors(errorsRes.data);
    } catch (error) {
      console.error('Error fetching station data:', error);
      showSnackbar('Lỗi tải dữ liệu trạm', 'error');
    } finally {
      setLoading(false);
    }
  }, [stationId, showSnackbar]);

  useEffect(() => {
    fetchStationData();
  }, [fetchStationData]);

  const fetchManagerOptions = useCallback(async () => {
    setManagerLoading(true);
    setManagerError('');
    try {
      const response = await adminAPI.getAllUsers({ role: 'staff', page: 1, pageSize: 200 });
      const staffList = Array.isArray(response?.data) ? response.data : [];
      const sortedStaff = staffList.sort((a, b) => {
        const nameA = (a.fullName || a.email || '').toLowerCase();
        const nameB = (b.fullName || b.email || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      setManagerOptions(sortedStaff);
    } catch (error) {
      console.error('Error loading manager options:', error);
      setManagerError('Không thể tải danh sách nhân viên quản lý. Vui lòng thử lại.');
    } finally {
      setManagerLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchManagerOptions();
  }, [fetchManagerOptions]);

  useEffect(() => {
    if (stationDetail) {
      const managerId = stationDetail.managerUserId;
      setSelectedManagerId(managerId != null ? Number(managerId) : null);
    }
  }, [stationDetail]);

  const handleManagerSelect = (event) => {
    const value = event.target.value;
    setSelectedManagerId(value === '' ? null : Number(value));
  };

  const selectedManager = useMemo(() => {
    if (selectedManagerId == null) return null;
    return managerOptions.find((manager) => manager.userId === selectedManagerId) || null;
  }, [managerOptions, selectedManagerId]);

  const managerChanged = useMemo(() => {
    if (!stationDetail) return false;
    const currentId = stationDetail.managerUserId != null ? Number(stationDetail.managerUserId) : null;
    return currentId !== (selectedManagerId != null ? Number(selectedManagerId) : null);
  }, [stationDetail, selectedManagerId]);

  const updateManagerAssignment = useCallback(
    async (managerId) => {
      setSavingManager(true);
      try {
        const response = await adminStationAPI.updateStationManager(
          stationId,
          managerId != null ? Number(managerId) : null
        );

        if (response?.success) {
          showSnackbar(response.message || 'Cập nhật quản lý trạm thành công', 'success');
          await fetchStationData();
          await fetchManagerOptions();
        } else {
          showSnackbar(response?.message || 'Không thể cập nhật quản lý trạm', 'error');
        }
      } catch (error) {
        console.error('Update manager error:', error);
        showSnackbar('Không thể cập nhật quản lý trạm', 'error');
      } finally {
        setSavingManager(false);
      }
    },
    [stationId, showSnackbar, fetchStationData, fetchManagerOptions]
  );

  const handleSaveManager = useCallback(() => {
    if (!managerChanged && stationDetail?.managerUserId == null && selectedManagerId == null) {
      return;
    }
    return updateManagerAssignment(selectedManagerId);
  }, [managerChanged, stationDetail, selectedManagerId, updateManagerAssignment]);

  const handleClearManagerSelection = () => {
    setSelectedManagerId(null);
  };

  // ========== CONTROL FUNCTIONS ==========

  const handleControlPost = async (postId, command) => {
    try {
      const reason = `Admin manual ${command} from dashboard`;
      const response = await adminStationAPI.controlChargingPoint(postId, command, reason);
      
      if (response.success) {
        showSnackbar(response.data.message, 'success');
        fetchStationData();
      } else {
        showSnackbar('Lỗi điều khiển trụ sạc', 'error');
      }
    } catch (error) {
      console.error('Control error:', error);
      showSnackbar('Lỗi kết nối với server', 'error');
    }
    setControlDialog({ open: false, target: null, type: '' });
  };

  const handleControlStation = async (command) => {
    try {
      const reason = controlDialog.reason || `Admin ${command} entire station`;
      const response = await adminStationAPI.controlStation(stationId, command, reason);
      
      if (response.success) {
        showSnackbar(response.data.message, 'success');
        fetchStationData();
      } else {
        showSnackbar('Lỗi điều khiển trạm', 'error');
      }
    } catch (error) {
      console.error('Control error:', error);
      showSnackbar('Lỗi kết nối với server', 'error');
    }
    setControlDialog({ open: false, target: null, type: '' });
  };

  // Removed: openControlDialog (UI buttons removed)
  const _openControlDialog = (target, type, command = '') => {
    setControlDialog({ 
      open: true, 
      target, 
      type, 
      command,
      reason: '' 
    });
  };

  // ========== CONFIGURATION ==========

  const handleOpenConfigDialog = (post) => {
    setConfigDialog({
      open: true,
      postId: post.postId,
      config: {
        maxPowerLimit: post.powerOutput,
        maxSessionsPerDay: 50,
        maxSessionDurationMinutes: 180,
        enableLoadBalancing: true,
        firmwareVersion: post.firmwareVersion || 'v1.0.0',
      },
    });
  };

  const handleSaveConfig = async () => {
    try {
      const response = await adminStationAPI.configureChargingPoint(
        configDialog.postId,
        configDialog.config
      );
      
      if (response.success) {
        showSnackbar('Cấu hình đã được cập nhật', 'success');
        fetchStationData();
      } else {
        showSnackbar('Lỗi cập nhật cấu hình', 'error');
      }
    } catch (error) {
      console.error('Config error:', error);
      showSnackbar('Lỗi kết nối với server', 'error');
    }
    setConfigDialog({ open: false, postId: null, config: {} });
  };

  // ========== ERROR MANAGEMENT ==========

  const handleResolveError = async (errorLogId, resolution) => {
    try {
      const response = await adminStationAPI.resolveError(errorLogId, resolution);
      
      if (response.success) {
        showSnackbar('Lỗi đã được đánh dấu xử lý', 'success');
        fetchStationData();
      } else {
        showSnackbar('Lỗi cập nhật trạng thái', 'error');
      }
    } catch (error) {
      console.error('Resolve error:', error);
      showSnackbar('Lỗi kết nối với server', 'error');
    }
    setErrorDialog({ open: false, error: null });
  };

  // ========== RENDER HELPERS ==========

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'available':
        return 'success';
      case 'maintenance':
        return 'warning';
      case 'offline':
      case 'faulted':
        return 'error';
      case 'occupied':
      case 'charging':
        return 'info';
      default:
        return 'default';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!stationDetail) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          <AlertTitle>Không tìm thấy trạm sạc</AlertTitle>
          Trạm sạc với ID {stationId} không tồn tại hoặc đã bị xóa.
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/admin/stations')} sx={{ mt: 2 }}>
          Quay lại danh sách
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/admin/stations')}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {stationDetail.stationName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stationDetail.address}, {stationDetail.city}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last action: {stationDetail.lastManualAction || 'None'}
            </Typography>
          </Box>
          <Chip
            label={stationDetail.status}
            color={getStatusColor(stationDetail.status)}
            icon={stationDetail.isOnline ? <CheckCircle /> : <ErrorIcon />}
          />
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
          <Tab label="Giám sát Real-time" />
          <Tab label="Charging Points" />
          <Tab label="Lỗi & Cảnh báo" icon={<Badge badgeContent={errors.length} color="error"><ErrorIcon /></Badge>} iconPosition="end" />
          <Tab label="Cấu hình" />
          <Tab label="📊 Phân tích nâng cao" />
          <Tab label="👥 Quản lý Nhân viên" />
        </Tabs>
      </Box>

      {/* Tab 0: Real-time Monitoring */}
      {currentTab === 0 && realtimeData && (
        <Box>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ElectricBolt sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {realtimeData.currentPowerUsageKw.toFixed(1)} kW
                      </Typography>
                      <Typography variant="body2">
                        /{realtimeData.totalPowerCapacityKw.toFixed(0)} kW ({realtimeData.powerUsagePercentage.toFixed(0)}%)
                      </Typography>
                      <Typography variant="caption">Công suất hiện tại</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <BatteryCharging80 sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {realtimeData.activeSessions}
                      </Typography>
                      <Typography variant="body2">
                        /{realtimeData.totalSessions} phiên hôm nay
                      </Typography>
                      <Typography variant="caption">Phiên sạc đang hoạt động</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Speed sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {realtimeData.todayEnergyKwh.toFixed(1)} kWh
                      </Typography>
                      <Typography variant="caption">Điện năng hôm nay</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TrendingUp sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {formatCurrency(realtimeData.todayRevenue)}
                      </Typography>
                      <Typography variant="caption">Doanh thu hôm nay</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Availability Status */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Tình trạng cổng sạc
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="success.main" fontWeight="bold">
                      {realtimeData.availableSlots}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Có sẵn
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="info.main" fontWeight="bold">
                      {realtimeData.occupiedSlots}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Đang sạc
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="warning.main" fontWeight="bold">
                      {realtimeData.maintenanceSlots}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Bảo trì
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Tỷ lệ khả dụng: {realtimeData.availabilityRate.toFixed(1)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={realtimeData.availabilityRate}
                  color="success"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Power Chart */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Biểu đồ công suất 24 giờ qua
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={realtimeData.powerHistory}>
                  <defs>
                    <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  />
                  <YAxis label={{ value: 'Công suất (kW)', angle: -90, position: 'insideLeft' }} />
                  <ChartTooltip
                    labelFormatter={(value) => new Date(value).toLocaleString('vi-VN')}
                    formatter={(value) => [`${value.toFixed(2)} kW`, 'Công suất']}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="powerKw"
                    stroke="#8884d8"
                    fillOpacity={1}
                    fill="url(#colorPower)"
                    name="Thời gian (giờ)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          {realtimeData.activeSessionsList && realtimeData.activeSessionsList.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Phiên sạc đang hoạt động ({realtimeData.activeSessionsList.length})
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Cổng sạc</TableCell>
                        <TableCell>Người dùng</TableCell>
                        <TableCell>Xe</TableCell>
                        <TableCell>Bắt đầu</TableCell>
                        <TableCell>Thời lượng</TableCell>
                        <TableCell>Công suất</TableCell>
                        <TableCell>Điện năng</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {realtimeData.activeSessionsList.map((session) => (
                        <TableRow key={session.bookingId}>
                          <TableCell>
                            <Chip label={`${session.postNumber}-${session.slotNumber}`} size="small" />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Person fontSize="small" />
                              {session.userName}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <DirectionsCar fontSize="small" />
                              {session.vehicleInfo}
                            </Box>
                          </TableCell>
                          <TableCell>{formatDateTime(session.startTime)}</TableCell>
                          <TableCell>
                            <Chip label={`${session.durationMinutes} phút`} size="small" color="info" />
                          </TableCell>
                          <TableCell>{session.currentPowerKw.toFixed(1)} kW</TableCell>
                          <TableCell>{session.energyConsumedKwh.toFixed(2)} kWh</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* Tab 1: Charging Points */}
      {currentTab === 1 && (
        <Box>
          <Grid container spacing={3}>
            {stationDetail.chargingPoints.map((post) => (
              <Grid item xs={12} md={6} key={post.postId}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          Trụ {post.postNumber}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {post.postType} - {post.powerOutput} kW
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip label={post.status} color={getStatusColor(post.status)} size="small" />
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenConfigDialog(post)}
                          title="Cấu hình"
                        >
                          <Settings />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Connector: {post.connectorTypes}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Slots: {post.availableSlots}/{post.totalSlots} có sẵn
                      </Typography>
                    </Box>

                    {/* Control Buttons */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        color={post.status === 'available' ? 'error' : 'success'}
                        startIcon={<PowerSettingsNew />}
                        onClick={() => handleControlPost(post.postId, post.status === 'available' ? 'stop' : 'start')}
                      >
                        {post.status === 'available' ? 'Tắt' : 'Bật'}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleControlPost(post.postId, 'maintenance')}
                      >
                        Bảo trì
                      </Button>
                    </Box>

                    {/* Slots */}
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Các cổng sạc:
                    </Typography>
                    <Grid container spacing={1}>
                      {post.slots.map((slot) => (
                        <Grid item xs={6} key={slot.slotId}>
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 1,
                              bgcolor: slot.isAvailable ? 'success.light' : 'grey.300',
                              opacity: slot.isAvailable ? 1 : 0.6,
                            }}
                          >
                            <Typography variant="caption" fontWeight="bold">
                              {slot.slotNumber}
                            </Typography>
                            <Typography variant="caption" display="block">
                              {slot.connectorType} - {slot.maxPower} kW
                            </Typography>
                            {slot.currentUserName && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                User: {slot.currentUserName}
                              </Typography>
                            )}
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Tab 2: Errors & Warnings */}
      {currentTab === 2 && (
        <Box>
          {errors.length === 0 ? (
            <Alert severity="success">
              <AlertTitle>Không có lỗi</AlertTitle>
              Trạm sạc đang hoạt động bình thường, không có lỗi hoặc cảnh báo nào.
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Mức độ</TableCell>
                    <TableCell>Loại lỗi</TableCell>
                    <TableCell>Vị trí</TableCell>
                    <TableCell>Thông báo</TableCell>
                    <TableCell>Thời gian</TableCell>
                    <TableCell>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {errors.map((error) => (
                    <TableRow key={error.logId}>
                      <TableCell>
                        <Chip
                          icon={error.severity === 'critical' ? <ErrorIcon /> : <Warning />}
                          label={error.severity}
                          color={getSeverityColor(error.severity)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{error.errorType}</TableCell>
                      <TableCell>
                        {error.postNumber ? `Trụ ${error.postNumber}` : 'Trạm'}
                        {error.slotNumber && ` - Slot ${error.slotNumber}`}
                      </TableCell>
                      <TableCell>{error.message}</TableCell>
                      <TableCell>{formatDateTime(error.occurredAt)}</TableCell>
                      <TableCell>
                        {!error.isResolved && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            onClick={() => setErrorDialog({ open: true, error })}
                          >
                            Đánh dấu đã xử lý
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Tab 3: Configuration */}
      {currentTab === 3 && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Thông tin trạm
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Địa chỉ
                      </Typography>
                      <Typography variant="body1">{stationDetail.address}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Giờ hoạt động
                      </Typography>
                      <Typography variant="body1">
                        {stationDetail.operatingHours || '24/7'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Tiện ích
                      </Typography>
                      <Typography variant="body1">
                        {stationDetail.amenities || 'Không có'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Thống kê hôm nay
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Điện năng tiêu thụ
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {stationDetail.todayEnergyConsumedKwh.toFixed(2)} kWh
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Doanh thu
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {formatCurrency(stationDetail.todayRevenue)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Số phiên sạc
                      </Typography>
                      <Typography variant="h6">{stationDetail.todaySessionCount}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">
                      Phân công quản lý trạm
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={managerLoading ? <CircularProgress size={16} /> : <Refresh />}
                      onClick={fetchManagerOptions}
                      disabled={managerLoading}
                    >
                      Tải lại
                    </Button>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Quản lý hiện tại
                    </Typography>
                    {stationDetail.managerName ? (
                      <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {stationDetail.managerName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stationDetail.managerEmail || 'Không có email'}
                        </Typography>
                        {stationDetail.managerPhoneNumber && (
                          <Typography variant="body2" color="text.secondary">
                            {stationDetail.managerPhoneNumber}
                          </Typography>
                        )}
                      </Paper>
                    ) : (
                      <Chip label="Chưa phân công" color="default" sx={{ mt: 1 }} />
                    )}
                  </Box>

                  {managerError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {managerError}
                    </Alert>
                  )}

                  <FormControl fullWidth disabled={managerLoading || savingManager}>
                    <InputLabel>Chọn nhân viên</InputLabel>
                    <Select
                      label="Chọn nhân viên"
                      value={selectedManagerId != null ? selectedManagerId : ''}
                      onChange={handleManagerSelect}
                    >
                      <MenuItem value="">
                        <em>Bỏ phân công</em>
                      </MenuItem>
                      {managerOptions.map((manager) => {
                        const isAssignedElsewhere =
                          manager.managedStationId != null &&
                          manager.managedStationId !== stationDetail.stationId;
                        const displayName = manager.fullName || manager.email;
                        return (
                          <MenuItem
                            key={manager.userId}
                            value={manager.userId}
                            disabled={isAssignedElsewhere}
                          >
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="body2" fontWeight="medium">
                                {displayName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {manager.email}
                              </Typography>
                              {manager.phoneNumber && (
                                <Typography variant="caption" color="text.secondary">
                                  {manager.phoneNumber}
                                </Typography>
                              )}
                              {isAssignedElsewhere && (
                                <Typography variant="caption" sx={{ color: 'warning.main' }}>
                                  Đang quản lý: {manager.managedStationName || `Trạm #${manager.managedStationId}`}
                                </Typography>
                              )}
                            </Box>
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>

                  {managerChanged && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      {selectedManagerId == null
                        ? 'Lưu để bỏ phân công quản lý cho trạm này.'
                        : `Lưu để gán ${selectedManager?.fullName || selectedManager?.email || 'nhân viên'} làm quản lý.`}
                    </Alert>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                    <Button
                      variant="text"
                      onClick={handleClearManagerSelection}
                      disabled={savingManager || selectedManagerId == null}
                    >
                      Bỏ chọn
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={savingManager ? <CircularProgress size={16} /> : <Save />}
                      onClick={handleSaveManager}
                      disabled={!managerChanged || savingManager}
                    >
                      Lưu phân công
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Control Dialog */}
      <Dialog open={controlDialog.open} onClose={() => setControlDialog({ ...controlDialog, open: false })}>
        <DialogTitle>
          Xác nhận điều khiển {controlDialog.type === 'post' ? 'trụ sạc' : 'trạm'}
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Bạn có chắc chắn muốn thực hiện lệnh <strong>{controlDialog.command}</strong>?
          </Typography>
          <TextField
            fullWidth
            label="Lý do (tùy chọn)"
            multiline
            rows={2}
            value={controlDialog.reason || ''}
            onChange={(e) => setControlDialog({ ...controlDialog, reason: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setControlDialog({ ...controlDialog, open: false })}>Hủy</Button>
          <Button
            variant="contained"
            onClick={() =>
              controlDialog.type === 'post'
                ? handleControlPost(controlDialog.target, controlDialog.command)
                : handleControlStation(controlDialog.command)
            }
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      {/* Config Dialog */}
      <Dialog
        open={configDialog.open}
        onClose={() => setConfigDialog({ open: false, postId: null, config: {} })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cấu hình trụ sạc</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Công suất tối đa (kW)"
              type="number"
              value={configDialog.config.maxPowerLimit || ''}
              onChange={(e) =>
                setConfigDialog({
                  ...configDialog,
                  config: { ...configDialog.config, maxPowerLimit: parseFloat(e.target.value) },
                })
              }
            />
            <TextField
              fullWidth
              label="Số phiên sạc tối đa/ngày"
              type="number"
              value={configDialog.config.maxSessionsPerDay || ''}
              onChange={(e) =>
                setConfigDialog({
                  ...configDialog,
                  config: { ...configDialog.config, maxSessionsPerDay: parseInt(e.target.value) },
                })
              }
            />
            <TextField
              fullWidth
              label="Thời lượng phiên tối đa (phút)"
              type="number"
              value={configDialog.config.maxSessionDurationMinutes || ''}
              onChange={(e) =>
                setConfigDialog({
                  ...configDialog,
                  config: {
                    ...configDialog.config,
                    maxSessionDurationMinutes: parseInt(e.target.value),
                  },
                })
              }
            />
            <TextField
              fullWidth
              label="Phiên bản firmware"
              value={configDialog.config.firmwareVersion || ''}
              onChange={(e) =>
                setConfigDialog({
                  ...configDialog,
                  config: { ...configDialog.config, firmwareVersion: e.target.value },
                })
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={configDialog.config.enableLoadBalancing || false}
                  onChange={(e) =>
                    setConfigDialog({
                      ...configDialog,
                      config: { ...configDialog.config, enableLoadBalancing: e.target.checked },
                    })
                  }
                />
              }
              label="Cân bằng tải"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialog({ open: false, postId: null, config: {} })}>Hủy</Button>
          <Button variant="contained" startIcon={<Save />} onClick={handleSaveConfig}>
            Lưu cấu hình
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Resolution Dialog */}
      <Dialog
        open={errorDialog.open}
        onClose={() => setErrorDialog({ open: false, error: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Xử lý lỗi</DialogTitle>
        <DialogContent>
          {errorDialog.error && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Lỗi: <strong>{errorDialog.error.errorType}</strong>
              </Typography>
              <Typography variant="body2" gutterBottom>
                {errorDialog.error.message}
              </Typography>
              <TextField
                fullWidth
                label="Mô tả cách xử lý"
                multiline
                rows={3}
                value={errorDialog.resolution || ''}
                onChange={(e) => setErrorDialog({ ...errorDialog, resolution: e.target.value })}
                sx={{ mt: 2 }}
                placeholder="Mô tả ngắn gọn cách bạn đã xử lý lỗi này..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setErrorDialog({ open: false, error: null })}>Hủy</Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleResolveError(errorDialog.error?.logId, errorDialog.resolution)}
            disabled={!errorDialog.resolution}
          >
            Đánh dấu đã xử lý
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tab 4: Advanced Analytics */}
      {currentTab === 4 && (
        <AdvancedCharts stationId={stationId} />
      )}

      {/* Tab 5: Staff Assignment */}
      {currentTab === 5 && (
        <StaffAssignment 
          stationId={stationId} 
          stationName={stationDetail?.stationName || 'N/A'}
        />
      )}

      {/* Snackbar */}
      {snackbar.open && (
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}
        >
          {snackbar.message}
        </Alert>
      )}
    </Box>
  );
};

export default StationDetailAnalytics;
