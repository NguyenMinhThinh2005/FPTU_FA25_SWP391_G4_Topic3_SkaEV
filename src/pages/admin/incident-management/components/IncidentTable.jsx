import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  IconButton,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import PropTypes from 'prop-types';

const IncidentTable = ({ incidents, isLoading, onOpenDialog }) => {
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
                      onClick={() => onOpenDialog('view', incident)}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Cập nhật">
                    <IconButton
                      size="small"
                      onClick={() => onOpenDialog('edit', incident)}
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
  );
};

IncidentTable.propTypes = {
  incidents: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
  onOpenDialog: PropTypes.func.isRequired
};

export default IncidentTable;
