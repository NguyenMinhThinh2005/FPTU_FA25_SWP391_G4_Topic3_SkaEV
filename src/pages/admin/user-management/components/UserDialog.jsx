import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  InputAdornment,
  Box,
  Typography,
} from "@mui/material";
import { Visibility, CheckCircle } from "@mui/icons-material";
import PropTypes from "prop-types";

const UserDialog = ({
  open,
  onClose,
  editUser,
  form,
  setForm,
  handleSave,
  handleRoleChange,
  handleManagedStationChange,
  stations,
  availableStationsCount,
  getStationManager,
  isStationDisabled,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editUser ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Tên *"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Họ"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email *"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              disabled={!!editUser}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Số điện thoại"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Vai trò</InputLabel>
              <Select
                value={form.role}
                label="Vai trò"
                onChange={(e) => handleRoleChange(e.target.value)}
              >
                <MenuItem value="customer">Khách hàng</MenuItem>
                <MenuItem value="staff">Nhân viên</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {form.role === "staff" && (
            <Grid item xs={12}>
              <FormControl
                fullWidth
                required
                error={stations.length > 0 && !form.managedStationId}
                disabled={stations.length === 0 || availableStationsCount === 0}
              >
                <InputLabel>Trạm quản lý</InputLabel>
                <Select
                  value={form.managedStationId ?? ""}
                  label="Trạm quản lý"
                  onChange={(e) => handleManagedStationChange(e.target.value)}
                  displayEmpty
                  renderValue={(value) => {
                    if (!value) return "Chọn trạm";
                    const station = stations.find(
                      (s) => (s.stationId ?? s.id) === Number(value)
                    );
                    return station?.name || `Trạm #${value}`;
                  }}
                >
                  <MenuItem value="">
                    <em>Chưa chọn</em>
                  </MenuItem>
                  {stations.map((station) => {
                    const manager = getStationManager(station);
                    const disabled = isStationDisabled(station);
                    const labelId = station.stationId ?? station.id;
                    return (
                      <MenuItem
                        key={labelId}
                        value={labelId}
                        disabled={disabled}
                      >
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {station.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {manager?.name
                              ? `Quản lý hiện tại: ${manager.name}`
                              : "Chưa có nhân viên quản lý"}
                          </Typography>
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
                <FormHelperText>
                  {stations.length === 0
                    ? "Đang tải danh sách trạm..."
                    : availableStationsCount === 0
                    ? "Tất cả trạm đã được phân công. Vui lòng thu hồi từ nhân viên khác trước."
                    : form.managedStationId
                    ? "Nhân viên sẽ quản lý trạm đã chọn"
                    : "Bắt buộc: chọn 1 trạm để phân công quản lý"}
                </FormHelperText>
              </FormControl>
              {stations.length > 0 && availableStationsCount === 0 && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  Không còn trạm trống để phân công. Hãy cập nhật phân quyền của
                  nhân viên hiện tại trước khi tạo mới.
                </Alert>
              )}
            </Grid>
          )}
          {!editUser && (
            <>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Mật khẩu *"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                  helperText="Tối thiểu 6 ký tự. Ví dụ: Temp123!"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Visibility />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info" icon={<CheckCircle />}>
                  Bạn có thể đặt mật khẩu tùy chỉnh hoặc sử dụng mật khẩu mẫu:{" "}
                  <strong>Temp123!</strong>
                </Alert>
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={handleSave}>
          {editUser ? "Lưu thay đổi" : "Tạo người dùng"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

UserDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  editUser: PropTypes.object,
  form: PropTypes.object.isRequired,
  setForm: PropTypes.func.isRequired,
  handleSave: PropTypes.func.isRequired,
  handleRoleChange: PropTypes.func.isRequired,
  handleManagedStationChange: PropTypes.func.isRequired,
  stations: PropTypes.array.isRequired,
  availableStationsCount: PropTypes.number.isRequired,
  getStationManager: PropTypes.func.isRequired,
  isStationDisabled: PropTypes.func.isRequired,
};

export default UserDialog;
