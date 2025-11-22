import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import { Shield, People } from "@mui/icons-material";
import PropTypes from "prop-types";

const roleOptions = [
  { value: "admin", label: "Admin", icon: <Shield />, color: "primary" },
  { value: "staff", label: "Staff", icon: <People />, color: "warning" },
  { value: "customer", label: "Customer", icon: <People />, color: "default" },
];

const getRoleChip = (role) => {
  const roleOption = roleOptions.find((r) => r.value === role);
  if (!roleOption) return <Chip label={role} size="small" />;

  return (
    <Chip
      label={roleOption.label}
      color={roleOption.color}
      size="small"
      icon={roleOption.icon}
    />
  );
};

const ChangeRoleDialog = ({
  open,
  onClose,
  userToChangeRole,
  newRole,
  setNewRole,
  handleChangeRole,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Thay đổi vai trò</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Người dùng: <strong>{userToChangeRole?.fullName}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Vai trò hiện tại: {getRoleChip(userToChangeRole?.role)}
          </Typography>
        </Box>
        <FormControl fullWidth>
          <InputLabel>Vai trò mới</InputLabel>
          <Select
            value={newRole}
            label="Vai trò mới"
            onChange={(e) => setNewRole(e.target.value)}
          >
            {roleOptions.map((r) => (
              <MenuItem key={r.value} value={r.value}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {r.icon}
                  {r.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={handleChangeRole}>
          Xác nhận
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ChangeRoleDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  userToChangeRole: PropTypes.object,
  newRole: PropTypes.string.isRequired,
  setNewRole: PropTypes.func.isRequired,
  handleChangeRole: PropTypes.func.isRequired,
};

export default ChangeRoleDialog;
