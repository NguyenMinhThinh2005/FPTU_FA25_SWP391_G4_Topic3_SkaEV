import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import { Add, Delete, Person, Email, Phone } from '@mui/icons-material';
import stationStaffAPI from '../../services/stationStaffAPI';
import useUserStore from '../../store/userStore';

const StaffAssignment = ({ stationId, stationName }) => {
  const [availableStaff, setAvailableStaff] = useState([]);
  const [assignedStaff, setAssignedStaff] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Ensure canonical admin users are loaded first so we can restrict the available staff to
      // the same set shown in user management (avoids showing legacy/test/group accounts).
      await fetchUsers();

      const [staffList, assignments] = await Promise.all([
        stationStaffAPI.getAvailableStaff(),
        stationStaffAPI.getStationStaff(stationId)
      ]);

      // Build a set of canonical staff userIds from the user store (admin user management)
      const canonicalStaffIds = new Set(
        (users || [])
          .filter((u) => u.role === 'staff' && u.isActive !== false)
          .map((u) => u.userId)
      );

      // If canonical list is empty (rare), fall back to server-provided staffList
      const filteredStaff = canonicalStaffIds.size > 0
        ? (staffList || []).filter(s => canonicalStaffIds.has(s.userId))
        : (staffList || []);

      setAvailableStaff(filteredStaff);
      setAssignedStaff(assignments);
    } catch (err) {
      setError('Không thể tải danh sách nhân viên: ' + err.message);
      console.error('Error loading staff data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stationId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationId]);

  // Ensure canonical users are loaded so we can filter availableStaff
  const { users, fetchUsers } = useUserStore();
  React.useEffect(() => {
    // fetchUsers is idempotent in the store
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAssignStaff = async () => {
    if (!selectedStaffId) {
      setError('Vui lòng chọn nhân viên');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const result = await stationStaffAPI.assignStaff(parseInt(selectedStaffId), stationId);
      setSuccess(result.message || 'Phân công nhân viên thành công!');
      setSelectedStaffId('');
      
      // Reload data
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể phân công nhân viên');
      console.error('Error assigning staff:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignStaff = async (assignmentId, staffName) => {
    if (!window.confirm(`Bạn có chắc muốn hủy phân công nhân viên ${staffName}?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const result = await stationStaffAPI.unassignStaff(assignmentId);
      setSuccess(result.message || 'Hủy phân công thành công!');
      
      // Reload data
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể hủy phân công');
      console.error('Error unassigning staff:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter out already assigned staff, dedupe, and ensure the user exists and has role === 'staff'.
  // Also exclude obvious group/team accounts to avoid cluttering the dropdown.
  const seen = new Set();
  const unassignedStaff = availableStaff
    .filter((staff) => {
      // Normalize id (backend may return userId or UserId depending on serializer)
      const id = staff.userId ?? staff.UserId ?? null;
      if (!id) return false;

      if (seen.has(id)) return false;
      seen.add(id);

      const isAssigned = assignedStaff.some((assigned) => assigned.staffUserId === id);
      if (isAssigned) return false;

      const canonical = users.find((u) => u.userId === id);
      if (!canonical) return false;
      if (canonical.role !== 'staff') return false;
      if (canonical.isActive === false) return false;

      const name = (staff.fullName || staff.FullName || '').toString().toLowerCase();
      // Exclude generic team/group accounts that should not be assigned as individuals
      if (name.includes('team') || name.includes('(team)') || name.includes('on-call') || name.includes('team -')) return false;

      return true;
    })
    .map((s) => ({
      userId: s.userId ?? s.UserId,
      fullName: s.fullName ?? s.FullName,
      email: s.email ?? s.Email,
      phoneNumber: s.phoneNumber ?? s.PhoneNumber,
      assignedStations: s.assignedStations ?? s.AssignedStations ?? []
    }));

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Quản lý Nhân viên - {stationName}
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Assign Staff Section */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <FormControl fullWidth>
          <InputLabel>Chọn nhân viên để phân công</InputLabel>
          <Select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            label="Chọn nhân viên để phân công"
            disabled={loading || unassignedStaff.length === 0}
          >
            {unassignedStaff.length === 0 ? (
              <MenuItem disabled value="">
                Không có nhân viên khả dụng
              </MenuItem>
            ) : (
              unassignedStaff.map((staff) => (
                <MenuItem key={staff.userId} value={staff.userId}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person fontSize="small" />
                    <Box>
                      <Typography variant="body2">{staff.fullName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {staff.email}
                        {staff.assignedStations && staff.assignedStations.length > 0 && 
                          ` • Đã có ${staff.assignedStations.length} trạm`
                        }
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
        
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} /> : <Add />}
          onClick={handleAssignStaff}
          disabled={loading || !selectedStaffId}
          sx={{ minWidth: 150 }}
        >
          Phân công
        </Button>
      </Box>

      {/* Assigned Staff Table */}
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Nhân viên đã phân công ({assignedStaff.length})
      </Typography>

      {loading && assignedStaff.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : assignedStaff.length === 0 ? (
        <Alert severity="info">
          Chưa có nhân viên nào được phân công cho trạm này
        </Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nhân viên</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Số điện thoại</TableCell>
                <TableCell>Ngày phân công</TableCell>
                <TableCell align="center">Trạng thái</TableCell>
                <TableCell align="center">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignedStaff.map((assignment) => (
                <TableRow key={assignment.assignmentId} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person color="primary" />
                      <Typography variant="body2" fontWeight="medium">
                        {assignment.staffName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email fontSize="small" color="action" />
                      <Typography variant="body2">{assignment.staffEmail}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Phone fontSize="small" color="action" />
                      <Typography variant="body2">{assignment.staffPhone || 'N/A'}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(assignment.assignedAt).toLocaleDateString('vi-VN')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={assignment.isActive ? 'Hoạt động' : 'Không hoạt động'}
                      color={assignment.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Hủy phân công">
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleUnassignStaff(assignment.assignmentId, assignment.staffName)}
                        disabled={loading}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default StaffAssignment;
