import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  FilterList as FilterIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import incidentStore from '../../store/incidentStore';
import stationStore from '../../store/stationStore';
import axiosInstance from '../../services/axiosConfig';
import stationStaffAPI from '../../services/stationStaffAPI';

const IncidentManagement = () => {
  const {
    incidents,
    selectedIncident,
    stats,
    isLoading,
    error,
    filters,
    fetchIncidents,
    fetchIncidentById,
    createIncident,
    updateIncident,
    fetchStats,
    setFilters,
    clearFilters,
    clearSelectedIncident,
    clearError
  } = incidentStore();

  const { stations, fetchStations } = stationStore();

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('view'); // view, create, edit
  const [formData, setFormData] = useState({
    stationId: '',
    postId: null,
    slotId: null,
    reportedByUserId: null,
    incidentType: 'equipment_failure',
    severity: 'medium',
    title: '',
    description: ''
  });
  const [updateData, setUpdateData] = useState({
    status: '',
    resolutionNotes: '',
    assignedToStaffId: null,
    assignedToTeamId: null
  });

  const [staffOptions, setStaffOptions] = useState([]);
  const [teamOptions, setTeamOptions] = useState([]);

  useEffect(() => {
    fetchIncidents();
    fetchStats();
    fetchStations();
    // fetch staff and maintenance teams for assignment dropdown
    (async () => {
      try {
        // Use StationStaff API to fetch only operational staff (active + assigned stations)
        const [staffList, teamsRes] = await Promise.all([
          stationStaffAPI.getAvailableStaff(),
          axiosInstance.get('/maintenance/teams')
        ]);

        // Normalize returned shapes (support both camelCase and PascalCase from different endpoints)
        const normalizedStaff = (staffList || []).map((s) => ({
          userId: s.userId ?? s.UserId,
          fullName: s.fullName ?? s.FullName
        }));

        setStaffOptions(normalizedStaff);
        setTeamOptions(teamsRes.data || []);
      } catch (err) {
        // non-fatal: log and continue
        console.error('Failed to fetch staff/teams for assignment', err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (error) {
      setTimeout(() => clearError(), 5000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const handleOpenDialog = (mode, incident = null) => {
    setDialogMode(mode);
    if (mode === 'create') {
      setFormData({
        stationId: '',
        postId: null,
        slotId: null,
        reportedByUserId: null,
        incidentType: 'equipment_failure',
        severity: 'medium',
        title: '',
        description: ''
      });
    } else if (mode === 'view' || mode === 'edit') {
      fetchIncidentById(incident.incidentId);
      if (mode === 'edit') {
        setUpdateData({
          status: incident.status,
          resolutionNotes: '',
          assignedToStaffId: incident.assignedToStaffId,
          assignedToTeamId: incident.assignedToTeamId || null
        });
      }
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    clearSelectedIncident();
  };

  const handleCreateSubmit = async () => {
    try {
      await createIncident(formData);
      handleCloseDialog();
      fetchStats();
    } catch (error) {
      console.error('Create failed:', error);
    }
  };

  const handleUpdateSubmit = async () => {
    try {
      await updateIncident(selectedIncident.incidentId, updateData);
      handleCloseDialog();
      fetchStats();
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'error',
      high: 'error',
      medium: 'warning',
      low: 'success'
    };
    return colors[severity] || 'default';
  };

  const displaySeverityLabel = (severity) => {
    const labels = {
      critical: 'Nghiêm trọng',
      high: 'Nghiêm trọng',
      medium: 'Trung bình',
      low: 'Nhẹ'
    };
    return labels[severity] || severity || 'N/A';
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'error',
      in_progress: 'warning',
      resolved: 'success'
    };
    return colors[status] || 'default';
  };

  const displayStatusLabel = (status) => {
    const labels = {
      open: 'Chưa xử lý',
      in_progress: 'Đang xử lý',
      resolved: 'Đã xử lý'
    };
    return labels[status] || status || 'N/A';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header: responsive and balanced */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 1,
          mb: 3
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Quản lý Sự cố
          </Typography>
          {/* optional subtitle removed per request */}
        </Box>
        {/* right-side helper text intentionally removed to keep header clean and balanced */}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards - spread evenly across the row for balanced layout */}
      {stats && (
          <Grid container spacing={2} sx={{ mb: 3 }} justifyContent="space-between">
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Tổng số
                  </Typography>
                  <Typography variant="h4">{stats.totalIncidents}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderLeft: 4, borderColor: 'error.main' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Chưa xử lý
                  </Typography>
                  <Typography variant="h4" color="error">
                    {stats.openIncidents}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderLeft: 4, borderColor: 'warning.main' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Đang xử lý
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {stats.inProgressIncidents}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderLeft: 4, borderColor: 'success.main' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Đã xử lý
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {stats.resolvedIncidents}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
      )}

      {/* Filters - center and distribute controls for balanced layout */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={filters.status || ''}
                label="Trạng thái"
                onChange={(e) => setFilters({ status: e.target.value || null })}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="open">Chưa xử lý</MenuItem>
                <MenuItem value="in_progress">Đang xử lý</MenuItem>
                <MenuItem value="resolved">Đã xử lý</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Mức độ nghiêm trọng</InputLabel>
              <Select
                value={filters.severity || ''}
                label="Mức độ nghiêm trọng"
                onChange={(e) => setFilters({ severity: e.target.value || null })}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="critical">Nghiêm trọng</MenuItem>
                <MenuItem value="medium">Trung bình</MenuItem>
                <MenuItem value="low">Nhẹ</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={12} md={3}>
            <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Button size="large" variant="outlined" onClick={clearFilters}>
                Xóa bộ lọc
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Incidents Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Tiêu đề</TableCell>
              <TableCell>Trạm sạc</TableCell>
              <TableCell>Loại</TableCell>
              <TableCell>Mức độ</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Người phụ trách</TableCell>
              <TableCell>Thời gian</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : incidents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  Không có sự cố nào
                </TableCell>
              </TableRow>
            ) : (
              incidents.map((incident) => (
                <TableRow key={incident.incidentId} hover>
                  <TableCell>{incident.incidentId}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="500">
                      {incident.title}
                    </Typography>
                  </TableCell>
                  <TableCell>{incident.stationName}</TableCell>
                  <TableCell>
                    <Chip
                      label={incident.incidentType.replace('_', ' ')}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={displaySeverityLabel(incident.severity)}
                      size="small"
                      color={getSeverityColor(incident.severity)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={displayStatusLabel(incident.status)}
                      size="small"
                      color={getStatusColor(incident.status)}
                    />
                  </TableCell>
                  <TableCell>{incident.assignedToStaffName || incident.assignedToTeamName || 'Chưa gán'}</TableCell>
                  <TableCell>{formatDate(incident.reportedAt)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Xem chi tiết">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog('view', incident)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Cập nhật">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog('edit', incident)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog for Create/View/Edit */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {dialogMode === 'create' && 'Báo cáo Sự cố Mới'}
              {dialogMode === 'view' && 'Chi tiết Sự cố'}
              {dialogMode === 'edit' && 'Cập nhật Sự cố'}
            </Typography>
            <IconButton onClick={handleCloseDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {dialogMode === 'create' && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Trạm sạc</InputLabel>
                  <Select
                    value={formData.stationId}
                    label="Trạm sạc"
                    onChange={(e) => setFormData({ ...formData, stationId: e.target.value })}
                  >
                    {stations.map((station) => (
                      <MenuItem key={station.stationId} value={station.stationId}>
                        {station.stationName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Loại sự cố</InputLabel>
                  <Select
                    value={formData.incidentType}
                    label="Loại sự cố"
                    onChange={(e) => setFormData({ ...formData, incidentType: e.target.value })}
                  >
                    <MenuItem value="equipment_failure">Hỏng thiết bị</MenuItem>
                    <MenuItem value="safety_issue">Vấn đề an toàn</MenuItem>
                    <MenuItem value="vandalism">Phá hoại</MenuItem>
                    <MenuItem value="power_outage">Mất điện</MenuItem>
                    <MenuItem value="software_bug">Lỗi phần mềm</MenuItem>
                    <MenuItem value="other">Khác</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Mức độ nghiêm trọng</InputLabel>
                  <Select
                    value={formData.severity}
                    label="Mức độ nghiêm trọng"
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  >
                        <MenuItem value="critical">Nghiêm trọng</MenuItem>
                        <MenuItem value="medium">Trung bình</MenuItem>
                        <MenuItem value="low">Nhẹ</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Tiêu đề"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={4}
                  label="Mô tả chi tiết"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
            </Grid>
          )}

          {dialogMode === 'view' && selectedIncident && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Trạm sạc
                </Typography>
                <Typography variant="body1">{selectedIncident.stationName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Loại sự cố
                </Typography>
                <Chip label={selectedIncident.incidentType.replace('_', ' ')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Mức độ nghiêm trọng
                </Typography>
                <Chip
                  label={displaySeverityLabel(selectedIncident.severity)}
                  color={getSeverityColor(selectedIncident.severity)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Trạng thái
                </Typography>
                <Chip
                  label={displayStatusLabel(selectedIncident.status)}
                  color={getStatusColor(selectedIncident.status)}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">
                  Tiêu đề
                </Typography>
                <Typography variant="body1">{selectedIncident.title}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">
                  Mô tả
                </Typography>
                <Typography variant="body1">{selectedIncident.description}</Typography>
              </Grid>
                  {selectedIncident.resolutionNotes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Ghi chú giải quyết
                  </Typography>
                  <Typography variant="body1">{selectedIncident.resolutionNotes}</Typography>
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Người báo cáo
                </Typography>
                <Typography variant="body1">
                  {selectedIncident.reportedByUserName || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Người phụ trách
                </Typography>
                <Typography variant="body1">
                  {selectedIncident.assignedToStaffName || selectedIncident.assignedToTeamName || 'Chưa gán'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Thời gian báo cáo
                </Typography>
                <Typography variant="body1">
                  {formatDate(selectedIncident.reportedAt)}
                </Typography>
              </Grid>
              {selectedIncident.resolvedAt && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Thời gian giải quyết
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedIncident.resolvedAt)}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}

          {dialogMode === 'edit' && selectedIncident && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Cập nhật trạng thái và gán nhân viên xử lý sự cố
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Trạng thái</InputLabel>
                  <Select
                    value={updateData.status}
                    label="Trạng thái"
                    onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                  >
                    <MenuItem value="open">Chưa xử lý</MenuItem>
                    <MenuItem value="in_progress">Đang xử lý</MenuItem>
                    <MenuItem value="resolved">Đã xử lý</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Ghi chú giải quyết"
                  value={updateData.resolutionNotes}
                  onChange={(e) => setUpdateData({ ...updateData, resolutionNotes: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Người phụ trách (Staff hoặc Team)</InputLabel>
                  <Select
                    value={updateData.assignedToTeamId ? `team:${updateData.assignedToTeamId}` : updateData.assignedToStaffId ? `staff:${updateData.assignedToStaffId}` : ''}
                    label="Người phụ trách (Staff hoặc Team)"
                    onChange={(e) => {
                      const val = e.target.value || '';
                      if (val.startsWith('staff:')) {
                        const id = parseInt(val.split(':')[1], 10);
                        setUpdateData({ ...updateData, assignedToStaffId: id, assignedToTeamId: null });
                      } else if (val.startsWith('team:')) {
                        const id = parseInt(val.split(':')[1], 10);
                        setUpdateData({ ...updateData, assignedToTeamId: id, assignedToStaffId: null });
                      } else {
                        setUpdateData({ ...updateData, assignedToStaffId: null, assignedToTeamId: null });
                      }
                    }}
                  >
                    <MenuItem value="">Chưa gán</MenuItem>
                    {staffOptions.map((s) => (
                      <MenuItem key={`staff-${s.userId}`} value={`staff:${s.userId}`}>
                        {s.fullName} (Staff)
                      </MenuItem>
                    ))}
                    {teamOptions.map((t) => (
                      <MenuItem key={`team-${t.maintenanceTeamId}`} value={`team:${t.maintenanceTeamId}`}>
                        {t.name} (Team)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          {dialogMode === 'create' && (
            <Button
              variant="contained"
              onClick={handleCreateSubmit}
              disabled={!formData.stationId || !formData.title || !formData.description}
            >
              Tạo
            </Button>
          )}
          {dialogMode === 'edit' && (
            <Button variant="contained" onClick={handleUpdateSubmit}>
              Cập nhật
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IncidentManagement;
