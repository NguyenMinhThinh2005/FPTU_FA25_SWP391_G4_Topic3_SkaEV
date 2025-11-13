import React, { useState, useEffect, useCallback } from 'react';
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
  // LinearProgress previously used in removed Real-time tab
  Divider,
  Badge,
} from '@mui/material';
import {
  ArrowBack,
  Refresh,
  PowerSettingsNew,
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
  
  Close,
} from '@mui/icons-material';
// Charting removed from station detail per UX request
import adminStationAPI from '../../services/adminStationAPI';
// formatCurrency removed: not used in this view after Real-time removal
import StaffAssignment from '../../components/admin/StaffAssignment';
import AdvancedCharts from '../../components/admin/AdvancedCharts';

const TAB_INDEX = {
  CHARGING: 0,
  ERRORS: 1,
  ANALYTICS: 2,
  STAFF: 3,
};

const StationDetailAnalytics = () => {
  const { stationId } = useParams();
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(true);
  const [stationDetail, setStationDetail] = useState(null);
  // realtimeData removed per UX: Real-time tab hidden
  const [errors, setErrors] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);

  // Dialog states
  const [controlDialog, setControlDialog] = useState({ open: false, target: null, type: '' });
  const [errorDialog, setErrorDialog] = useState({ open: false, error: null });

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const showSnackbar = useCallback((message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchStationData = useCallback(async () => {
    try {
      const [detailRes, errorsRes] = await Promise.all([
        adminStationAPI.getStationDetail(stationId),
        adminStationAPI.getStationErrors(stationId, false),
      ]);

      if (detailRes.success) setStationDetail(detailRes.data);
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
      const reason = `Admin manual ${command} from station detail`;
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
        
        {/* Station On/Off Control */}
        <Button
          variant="contained"
          color={stationDetail.status === 'active' ? 'error' : 'success'}
          startIcon={<PowerSettingsNew />}
          onClick={() => handleControlStation(stationDetail.status === 'active' ? 'stop' : 'start')}
          disabled={loading}
        >
          {stationDetail.status === 'active' ? 'Tắt trạm' : 'Bật trạm'}
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
          <Tab label="Charging Points" />
          <Tab
            label="Lỗi & Cảnh báo"
            icon={<Badge badgeContent={errors.length} color="error"><ErrorIcon /></Badge>}
            iconPosition="end"
          />
          <Tab label="📊 Phân tích tổng quan" />
          <Tab label="👥 Quản lý Nhân viên" />
        </Tabs>
      </Box>

      {/* Real-time monitoring removed from station detail view per UX */}

      {/* Tab 1: Charging Points */}
  {currentTab === TAB_INDEX.CHARGING && (
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
                      <Chip label={post.status} color={getStatusColor(post.status)} size="small" />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Connector: {post.connectorTypes}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Slots: {post.availableSlots}/{post.totalSlots} có sẵn
                      </Typography>
                    </Box>

                    {/* Control Button - Chỉ Bật/Tắt */}
                    <Box sx={{ mt: 2 }}>
                      <Button
                        size="small"
                        variant="contained"
                        color={post.status === 'available' ? 'error' : 'success'}
                        startIcon={<PowerSettingsNew />}
                        onClick={() => handleControlPost(post.postId, post.status === 'available' ? 'stop' : 'start')}
                      >
                        {post.status === 'available' ? 'Tắt trụ' : 'Bật trụ'}
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
  {currentTab === TAB_INDEX.ERRORS && (
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
                        {error.classificationSource && (
                          <Chip
                            label={error.classificationSource === 'auto' ? 'Tự phân loại' : 'Thủ công'}
                            size="small"
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        )}
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
      {currentTab === TAB_INDEX.ANALYTICS && (
        <Box>
          <AdvancedCharts stationId={stationId} showEnergy={false} />
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
      {/* Tab 5: Staff Assignment */}
      {currentTab === TAB_INDEX.STAFF && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Card>
            <CardContent>
              <StaffAssignment 
                stationId={stationId} 
                stationName={stationDetail?.stationName || 'N/A'}
              />
            </CardContent>
          </Card>
        </Box>
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
