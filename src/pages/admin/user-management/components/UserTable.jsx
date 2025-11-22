import React from "react";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Typography,
  Avatar,
  Tooltip,
  IconButton,
  Chip,
} from "@mui/material";
import {
  Visibility,
  Edit,
  SwapHoriz,
  Delete,
  Shield,
  People,
} from "@mui/icons-material";
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

const UserTable = ({
  loading,
  filteredUsers,
  query,
  roleFilter,
  navigate,
  onEdit,
  onRoleChange,
  onDelete,
  onStaffEdit,
}) => {
  return (
    <Card>
      <CardContent>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Người dùng</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Số điện thoại</TableCell>
                  <TableCell align="center">Vai trò</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                      <Typography color="text.secondary">
                        {query || roleFilter !== "all"
                          ? "Không tìm thấy người dùng phù hợp"
                          : "Chưa có người dùng nào"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u) => (
                    <TableRow key={u.userId} hover>
                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
                        >
                          <Avatar src={u.avatarUrl}>
                            {(u.fullName || "?")[0].toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="medium">
                              {u.fullName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {u.userId}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.phoneNumber || "-"}</TableCell>
                      <TableCell align="center">{getRoleChip(u.role)}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Xem chi tiết">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => navigate(`/admin/users/${u.userId}`)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Chỉnh sửa">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              if (u.role === "staff") {
                                onStaffEdit(u);
                              } else {
                                onEdit(u);
                              }
                            }}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Thay đổi vai trò">
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => onRoleChange(u)}
                          >
                            <SwapHoriz />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onDelete(u)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

UserTable.propTypes = {
  loading: PropTypes.bool,
  filteredUsers: PropTypes.array.isRequired,
  query: PropTypes.string,
  roleFilter: PropTypes.string,
  navigate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onRoleChange: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onStaffEdit: PropTypes.func.isRequired,
};

export default UserTable;
