import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Button,
  Alert
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import PropTypes from 'prop-types';

const IncidentDialog = ({
  open,
  onClose,
  mode,
  selectedIncident,
  formData,
  setFormData,
  updateData,
  setUpdateData,
  stations,
  staffOptions,
  teamOptions,
  onCreateSubmit,
  onUpdateSubmit
}) => {
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {mode === 'create' && 'Báo cáo Sự cố Mới'}
            {mode === 'view' && 'Chi tiết Sự cố'}
            {mode === 'edit' && 'Cập nhật Sự cố'}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {mode === 'create' && (
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

        {mode === 'view' && selectedIncident && (
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

        {mode === 'edit' && selectedIncident && (
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
        <Button onClick={onClose}>Hủy</Button>
        {mode === 'create' && (
          <Button
            variant="contained"
            onClick={onCreateSubmit}
            disabled={!formData.stationId || !formData.title || !formData.description}
          >
            Tạo
          </Button>
        )}
        {mode === 'edit' && (
          <Button variant="contained" onClick={onUpdateSubmit}>
            Cập nhật
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

IncidentDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(['view', 'create', 'edit']).isRequired,
  selectedIncident: PropTypes.object,
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired,
  updateData: PropTypes.object.isRequired,
  setUpdateData: PropTypes.func.isRequired,
  stations: PropTypes.array.isRequired,
  staffOptions: PropTypes.array.isRequired,
  teamOptions: PropTypes.array.isRequired,
  onCreateSubmit: PropTypes.func.isRequired,
  onUpdateSubmit: PropTypes.func.isRequired
};

export default IncidentDialog;
