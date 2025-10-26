import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import { Search, Add, Edit, Delete, People, Shield, SwapHoriz, CheckCircle, Warning } from "@mui/icons-material";
import useUserStore from "../../store/userStore";

const roleOptions = [
  { value: "admin", label: "Admin", icon: <Shield />, color: "primary" },
  { value: "staff", label: "Staff", icon: <People />, color: "warning" },
  { value: "customer", label: "Customer", icon: <People />, color: "default" },
];

const UserManagement = () => {
  const { users, addUser, updateUser, deleteUser, fetchUsers, loading } = useUserStore();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToChangeRole, setUserToChangeRole] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "customer",
  });

  // Fetch users on component mount
  useEffect(() => {
    console.log("UserManagement mounted, fetching users...");
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    let filtered = users;
    
    // Filter by role
    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }
    
    // Filter by search query
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter((u) => {
        const fullName = (u.fullName || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const phone = (u.phoneNumber || "");
        return fullName.includes(q) || email.includes(q) || phone.includes(q);
      });
    }
    
    return filtered;
  }, [users, query, roleFilter]);

  const openCreate = () => {
    setEditUser(null);
    setForm({ email: "", firstName: "", lastName: "", phone: "", role: "customer" });
    setDialogOpen(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    const [firstName, ...lastNameParts] = (user.fullName || "").split(" ");
    setForm({
      email: user.email,
      firstName: firstName || "",
      lastName: lastNameParts.join(" ") || "",
      phone: user.phoneNumber || "",
      role: user.role,
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const openRoleDialog = (user) => {
    setUserToChangeRole(user);
    setNewRole(user.role);
    setRoleDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.email || !form.firstName || !form.role) {
      setSnackbar({ open: true, message: "Vui lòng điền đầy đủ thông tin bắt buộc", severity: "error" });
      return;
    }

    try {
      if (editUser) {
        const result = await updateUser(editUser.userId, {
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          role: form.role,
        });
        
        if (result.success) {
          setSnackbar({ open: true, message: "Cập nhật người dùng thành công!", severity: "success" });
          setDialogOpen(false);
        } else {
          setSnackbar({ open: true, message: result.error || "Lỗi cập nhật người dùng", severity: "error" });
        }
      } else {
        const result = await addUser({
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          role: form.role,
          password: "Temp123!", // Default password
        });
        
        if (result.success) {
          setSnackbar({ open: true, message: "Tạo người dùng thành công! Mật khẩu mặc định: Temp123!", severity: "success" });
          setDialogOpen(false);
        } else {
          setSnackbar({ open: true, message: result.error || "Lỗi tạo người dùng", severity: "error" });
        }
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.message || "Có lỗi xảy ra", severity: "error" });
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    
    try {
      const result = await deleteUser(userToDelete.userId);
      
      if (result.success) {
        setSnackbar({ open: true, message: "Xóa người dùng thành công!", severity: "success" });
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      } else {
        setSnackbar({ open: true, message: result.error || "Lỗi xóa người dùng", severity: "error" });
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.message || "Có lỗi xảy ra", severity: "error" });
    }
  };

  const handleChangeRole = async () => {
    if (!userToChangeRole || !newRole) return;
    
    try {
      const result = await updateUser(userToChangeRole.userId, { role: newRole });
      
      if (result.success) {
        setSnackbar({ open: true, message: `Đã thay đổi vai trò thành ${newRole}`, severity: "success" });
        setRoleDialogOpen(false);
        setUserToChangeRole(null);
      } else {
        setSnackbar({ open: true, message: result.error || "Lỗi thay đổi vai trò", severity: "error" });
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.message || "Có lỗi xảy ra", severity: "error" });
    }
  };

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

  const stats = [
    { label: "Tổng số người dùng", value: users.length, color: "primary" },
    { label: "Quản trị viên", value: users.filter(u => u.role === "admin").length, color: "primary" },
    { label: "Nhân viên", value: users.filter(u => u.role === "staff").length, color: "warning" },
    { label: "Khách hàng", value: users.filter(u => u.role === "customer").length, color: "success" },
  ];

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Quản lý người dùng
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Quản lý khách hàng, nhân viên và quản trị viên; phân quyền vai trò
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
          Thêm người dùng
        </Button>
      </Box>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((stat, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card>
              <CardContent>
                <Typography variant="h4" color={stat.color} fontWeight="bold">
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm theo tên, email hoặc số điện thoại"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Vai trò</InputLabel>
                <Select value={roleFilter} label="Vai trò" onChange={(e) => setRoleFilter(e.target.value)}>
                  <MenuItem value="all">Tất cả</MenuItem>
                  {roleOptions.map((r) => (
                    <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
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
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar src={u.avatarUrl}>{(u.fullName || "?")[0].toUpperCase()}</Avatar>
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
                        <TableCell align="center">
                          {getRoleChip(u.role)}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Chỉnh sửa">
                            <IconButton size="small" color="primary" onClick={() => openEdit(u)}>
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Thay đổi vai trò">
                            <IconButton size="small" color="warning" onClick={() => openRoleDialog(u)}>
                              <SwapHoriz />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa">
                            <IconButton size="small" color="error" onClick={() => openDeleteDialog(u)}>
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editUser ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}</DialogTitle>
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
                <InputLabel>Vai trò *</InputLabel>
                <Select value={form.role} label="Vai trò *" onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {roleOptions.map((r) => (
                    <MenuItem key={r.value} value={r.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {r.icon}
                        {r.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {!editUser && (
              <Grid item xs={12}>
                <Alert severity="info" icon={<CheckCircle />}>
                  Mật khẩu mặc định: <strong>Temp123!</strong>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSave}>
            {editUser ? "Lưu thay đổi" : "Tạo người dùng"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
            Hành động này không thể hoàn tác!
          </Alert>
          <Typography>
            Bạn có chắc chắn muốn xóa người dùng <strong>{userToDelete?.fullName}</strong> ({userToDelete?.email})?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)} maxWidth="xs" fullWidth>
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
            <Select value={newRole} label="Vai trò mới" onChange={(e) => setNewRole(e.target.value)}>
              {roleOptions.map((r) => (
                <MenuItem key={r.value} value={r.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {r.icon}
                    {r.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleChangeRole}>
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement;
