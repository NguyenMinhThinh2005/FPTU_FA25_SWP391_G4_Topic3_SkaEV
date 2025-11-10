import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Tooltip,
  CircularProgress,
  Tab,
  Tabs,
  Divider,
} from "@mui/material";
import { Search, Add, Edit, Delete, People, Shield, SwapHoriz, CheckCircle, Warning, LocationOn, AdminPanelSettings, Work, Badge, Phone, Email, Person, CalendarToday, Visibility } from "@mui/icons-material";
import useUserStore from "../../store/userStore";
import useStationStore from "../../store/stationStore";

const roleOptions = [
  { value: "admin", label: "Admin", icon: <Shield />, color: "primary" },
  { value: "staff", label: "Staff", icon: <People />, color: "warning" },
  { value: "customer", label: "Customer", icon: <People />, color: "default" },
];

const UserManagement = () => {
  const navigate = useNavigate();
  const { users, addUser, updateUser, deleteUser, fetchUsers, loading } = useUserStore();
  const { stations, fetchStations } = useStationStore();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [staffEditDialogOpen, setStaffEditDialogOpen] = useState(false); // Dialog chỉnh sửa Staff
  const [staffEditTab, setStaffEditTab] = useState(0); // Tab trong Staff edit dialog
  const [editUser, setEditUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToChangeRole, setUserToChangeRole] = useState(null);
  const [selectedStationId, setSelectedStationId] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "customer",
    managedStationId: null,
  });

  const selectedStation = useMemo(() => {
    if (!selectedStationId) return null;
    return stations.find((s) => (s.stationId ?? s.id) === selectedStationId) || null;
  }, [stations, selectedStationId]);

  const currentSelectionId = useMemo(() => {
    if (selectedStationId != null) return selectedStationId;
    if (form.managedStationId != null) return form.managedStationId;
    return null;
  }, [selectedStationId, form.managedStationId]);

  const getStationManager = useCallback((station) => {
    if (!station) return null;
    const userId = station.manager?.userId ?? station.managerUserId ?? null;
    const name = station.manager?.name ?? station.managerName ?? null;
    const email = station.manager?.email ?? station.managerEmail ?? null;
    const phone = station.manager?.phone ?? station.managerPhoneNumber ?? null;
    return userId || name || email || phone
      ? { userId: userId ?? null, name: name ?? null, email: email ?? null, phone: phone ?? null }
      : null;
  }, []);

  const isStationDisabled = useCallback(
    (station) => {
      const manager = getStationManager(station);
      if (!manager) return false;

      const stationKey = station.stationId ?? station.id;

      if (currentSelectionId != null && stationKey === currentSelectionId) {
        return false;
      }

      if (manager.userId && editUser && manager.userId === editUser.userId) {
        return false;
      }

      return true;
    },
    [currentSelectionId, editUser, getStationManager]
  );

  const availableStationsCount = useMemo(
    () => stations.filter((station) => !isStationDisabled(station)).length,
    [stations, isStationDisabled]
  );

  // Fetch users and stations on component mount
  useEffect(() => {
    console.log("UserManagement mounted, fetching users...");
    fetchUsers();
    fetchStations();
  }, [fetchUsers, fetchStations]);

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
        const phone = u.phoneNumber || "";
        return fullName.includes(q) || email.includes(q) || phone.includes(q);
      });
    }

    return filtered;
  }, [users, query, roleFilter]);

  const openCreate = () => {
    setEditUser(null);
    setForm({ email: "", firstName: "", lastName: "", phone: "", role: "customer", managedStationId: null });
    setSelectedStationId(null);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      const result = await deleteUser(userToDelete.userId);
      if (result && result.success) {
        setSnackbar({ open: true, message: "Xóa người dùng thành công", severity: "success" });
        setDeleteDialogOpen(false);
        setUserToDelete(null);
        await fetchUsers();
      } else {
        setSnackbar({ open: true, message: (result && result.error) || "Lỗi xóa người dùng", severity: "error" });
      }
    } catch (error) {
      setSnackbar({ open: true, message: error?.message || "Có lỗi xảy ra", severity: "error" });
    }
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
      managedStationId: user.managedStationId != null ? Number(user.managedStationId) : null,
    });
    setSelectedStationId(user.managedStationId != null ? Number(user.managedStationId) : null);
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

  const handleRoleChange = (nextRole) => {
    setForm((prev) => ({
      ...prev,
      role: nextRole,
      managedStationId: nextRole === "staff" ? prev.managedStationId : null,
    }));

    if (nextRole !== "staff") {
      setSelectedStationId(null);
    } else if (selectedStationId == null && form.managedStationId != null) {
      setSelectedStationId(form.managedStationId);
    }
  };

  const handleManagedStationChange = (value) => {
    const parsedValue = value === "" || value === null ? null : Number(value);
    setForm((prev) => ({ ...prev, managedStationId: parsedValue }));
    setSelectedStationId(parsedValue);
  };

  const handleSave = async () => {
    if (!form.email || !form.firstName || !form.role) {
      setSnackbar({ open: true, message: "Vui lòng điền đầy đủ thông tin bắt buộc", severity: "error" });
      return;
    }

    if (form.role === "staff" && !form.managedStationId) {
      setSnackbar({ open: true, message: "Vui lòng chọn trạm mà nhân viên sẽ quản lý", severity: "error" });
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
          managedStationId: form.role === "staff" ? form.managedStationId : undefined,
        });

        if (result && result.success) {
          setSnackbar({ open: true, message: "Cập nhật người dùng thành công!", severity: "success" });
          setDialogOpen(false);
          fetchUsers();
        } else {
          setSnackbar({ open: true, message: (result && result.error) || "Lỗi cập nhật người dùng", severity: "error" });
        }
      } else {
        const result = await addUser({
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          role: form.role,
          password: form.password || "Temp123!",
          managedStationId: form.role === "staff" ? form.managedStationId : undefined,
        });

        if (result && result.success) {
          setSnackbar({ open: true, message: `Tạo người dùng thành công! Mật khẩu: ${form.password || "Temp123!"}`, severity: "success" });
          setDialogOpen(false);
          fetchUsers();
        } else {
          setSnackbar({ open: true, message: (result && result.error) || "Lỗi tạo người dùng", severity: "error" });
        }
      }
    } catch (error) {
      setSnackbar({ open: true, message: error?.message || "Có lỗi xảy ra", severity: "error" });
    }
  };

  const handleChangeRole = async () => {
    if (!userToChangeRole || !newRole) return;

    try {
      const result = await updateUser(userToChangeRole.userId, { role: newRole });
      if (result && result.success) {
        setSnackbar({ open: true, message: `Đã thay đổi vai trò thành ${newRole}`, severity: "success" });
        setRoleDialogOpen(false);
        setUserToChangeRole(null);
        setNewRole("");
        await fetchUsers();
      } else {
        setSnackbar({ open: true, message: (result && result.error) || "Lỗi thay đổi vai trò", severity: "error" });
      }
    } catch (error) {
      setSnackbar({ open: true, message: error?.message || "Có lỗi xảy ra", severity: "error" });
    }
  };

  // Deprecated functions - kept for backwards compatibility but not used
  // const openStationAssignDialog = (user) => {
  //   // Tích hợp vào dialog Staff edit rồi
  //   setEditUser(user);
  //   setForm({
  //     email: user.email,
  //     firstName: user.fullName?.split(" ")[0] || "",
  //     lastName: user.fullName?.split(" ").slice(1).join(" ") || "",
  //     phone: user.phoneNumber || "",
  //     role: user.role,
  //     employeeId: user.employeeId || "",
  //     department: user.department || "",
  //     position: user.position || "",
  //     joinDate: user.joinDate || "",
  //     location: user.location || "Hà Nội",
  //   });
  //   setSelectedStations(user.assignedStationIds || []);
  //   setStaffEditTab(1); // Mở tab Phân quyền trạm sạc
  //   setStaffEditDialogOpen(true);
  // };

  // const handleAssignStations = async () => {
  //   // Dùng handleSaveStaff thay thế
  //   return handleSaveStaff();
  // };

  const handleSaveStaff = async () => {
    if (!editUser) return;

    if (!selectedStationId) {
      setSnackbar({ open: true, message: "Vui lòng chọn trạm quản lý cho nhân viên", severity: "error" });
      return;
    }
    
    try {
      // Save staff info and station assignments
      const result = await updateUser(editUser.userId, {
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        role: form.role,
        employeeId: form.employeeId,
        department: form.department,
        position: form.position,
        joinDate: form.joinDate,
        location: form.location,
        managedStationId: selectedStationId,
      });

      if (result.success) {
        setSnackbar({ 
          open: true, 
          message: selectedStation
            ? `Đã phân quyền trạm ${selectedStation.name || selectedStation.stationName} cho ${form.firstName} ${form.lastName}`
            : `Đã cập nhật thông tin nhân viên`, 
          severity: "success" 
        });
        setStaffEditDialogOpen(false);
        setEditUser(null);
        setSelectedStationId(null);
        fetchUsers();
      } else {
        setSnackbar({
          open: true,
          message: result.error || "Lỗi cập nhật thông tin nhân viên",
          severity: "error",
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || "Có lỗi xảy ra",
        severity: "error",
      });
    }
  };

  const toggleStationSelection = (stationId) => {
    const normalizedId = Number(stationId);
    const station = stations.find((s) => (s.stationId ?? s.id) === normalizedId);

    if (station && isStationDisabled(station)) {
      return;
    }

    setSelectedStationId((prev) => {
      const nextValue = prev === normalizedId ? null : normalizedId;
      setForm((current) => ({ ...current, managedStationId: nextValue }));
      return nextValue;
    });
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
    {
      label: "Quản trị viên",
      value: users.filter((u) => u.role === "admin").length,
      color: "primary",
    },
    {
      label: "Nhân viên",
      value: users.filter((u) => u.role === "staff").length,
      color: "warning",
    },
    {
      label: "Khách hàng",
      value: users.filter((u) => u.role === "customer").length,
      color: "success",
    },
  ];

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
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
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

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
                              <Typography
                                variant="subtitle2"
                                fontWeight="medium"
                              >
                                {u.fullName}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
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
                                  // Mở dialog đặc biệt cho Staff
                                  setEditUser(u);
                                  setForm({
                                    ...form,
                                    email: u.email,
                                    firstName: u.fullName?.split(" ")[0] || "",
                                    lastName:
                                      u.fullName
                                        ?.split(" ")
                                        .slice(1)
                                        .join(" ") || "",
                                    phone: u.phoneNumber || "",
                                    role: u.role,
                                    employeeId: u.employeeId || "",
                                    department: u.department || "",
                                    position: u.position || "",
                                    joinDate: u.joinDate || "",
                                    location: u.location || "Hà Nội",
                                  });
                                  // Load assigned stations
                                  setSelectedStationId(u.managedStationId || null);
                                  setStaffEditTab(0);
                                  setStaffEditDialogOpen(true);
                                } else {
                                  // Mở dialog bình thường cho Customer/Admin
                                  openEdit(u);
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
                              onClick={() => openRoleDialog(u)}
                            >
                              <SwapHoriz />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => openDeleteDialog(u)}
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

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
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
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
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
                      const station = stations.find((s) => (s.stationId ?? s.id) === Number(value));
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
                        <MenuItem key={labelId} value={labelId} disabled={disabled}>
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
                    Không còn trạm trống để phân công. Hãy cập nhật phân quyền của nhân viên hiện tại trước khi tạo mới.
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
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
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
                    Bạn có thể đặt mật khẩu tùy chỉnh hoặc sử dụng mật khẩu mẫu: <strong>Temp123!</strong>
                  </Alert>
                </Grid>
              </>
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
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
            Hành động này không thể hoàn tác!
          </Alert>
          <Typography>
            Bạn có chắc chắn muốn xóa người dùng{" "}
            <strong>{userToDelete?.fullName}</strong> ({userToDelete?.email})?
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
      <Dialog
        open={roleDialogOpen}
        onClose={() => setRoleDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
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
          <Button onClick={() => setRoleDialogOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleChangeRole}>
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog chỉnh sửa Staff - Giống trang Profile */}
      <Dialog
        open={staffEditDialogOpen}
        onClose={() => setStaffEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Quản lý thông tin cá nhân và cài đặt công việc
        </DialogTitle>
        <DialogContent dividers>
          {/* Header Card với Avatar và Stats */}
          <Card sx={{ mb: 3, bgcolor: "primary.50" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    mr: 3,
                    bgcolor: "primary.main",
                    fontSize: 40,
                  }}
                >
                  {(form.firstName || "N")[0].toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" fontWeight="bold">
                    {form.firstName} {form.lastName}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    gutterBottom
                  >
                    {form.position || "Kỹ thuật viên trạm sạc"} •{" "}
                    {form.department || "Vận hành"}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                    <Chip
                      icon={<Badge />}
                      label={`ID: ${form.employeeId || "ST001"}`}
                      size="small"
                      color="primary"
                    />
                    <Chip
                      icon={<LocationOn />}
                      label={form.location || "Hà Nội"}
                      size="small"
                      color="info"
                    />
                  </Box>
                </Box>
              </Box>

              {/* Stats Row */}
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <Box
                    sx={{
                      textAlign: "center",
                      p: 1.5,
                      bgcolor: "white",
                      borderRadius: 1,
                    }}
                  >
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      color="success.main"
                    >
                      8
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Trạm quản lý
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box
                    sx={{
                      textAlign: "center",
                      p: 1.5,
                      bgcolor: "white",
                      borderRadius: 1,
                    }}
                  >
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      color="primary.main"
                    >
                      45
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Bảo trì hoàn thành
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box
                    sx={{
                      textAlign: "center",
                      p: 1.5,
                      bgcolor: "white",
                      borderRadius: 1,
                    }}
                  >
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      color="info.main"
                    >
                      12m
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Thời gian phản hồi TB
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box
                    sx={{
                      textAlign: "center",
                      p: 1.5,
                      bgcolor: "white",
                      borderRadius: 1,
                    }}
                  >
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      color="warning.main"
                    >
                      4.8/5
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Đánh giá khách hàng
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
            <Tabs value={staffEditTab} onChange={(e, v) => setStaffEditTab(v)}>
              <Tab label="THÔNG TIN CÁ NHÂN & CÔNG VIỆC" />
              <Tab label="PHÂN QUYỀN TRẠM SẠC" />
              <Tab label="NHẬT KÝ HOẠT ĐỘNG" />
            </Tabs>
          </Box>

          {/* Tab 0: Thông tin cá nhân & Công việc */}
          {staffEditTab === 0 && (
            <Box>
              {/* Phần Thông tin cá nhân */}
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Thông tin cá nhân
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Họ"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                    InputProps={{
                      startAdornment: (
                        <Person sx={{ mr: 1, color: "text.secondary" }} />
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Tên"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
                    }
                    InputProps={{
                      startAdornment: (
                        <Person sx={{ mr: 1, color: "text.secondary" }} />
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    InputProps={{
                      startAdornment: (
                        <Email sx={{ mr: 1, color: "text.secondary" }} />
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Số điện thoại"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    InputProps={{
                      startAdornment: (
                        <Phone sx={{ mr: 1, color: "text.secondary" }} />
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Địa điểm"
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                    InputProps={{
                      startAdornment: (
                        <LocationOn sx={{ mr: 1, color: "text.secondary" }} />
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Ngày vào làm"
                    type="date"
                    value={form.joinDate}
                    onChange={(e) =>
                      setForm({ ...form, joinDate: e.target.value })
                    }
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <CalendarToday
                          sx={{ mr: 1, color: "text.secondary" }}
                        />
                      ),
                    }}
                  />
                </Grid>
              </Grid>

              {/* Divider */}
              <Divider sx={{ my: 3 }}>
                <Chip label="Chi tiết công việc" icon={<Work />} />
              </Divider>

              {/* Phần Chi tiết công việc */}
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Chi tiết công việc
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Mã nhân viên"
                    value={form.employeeId}
                    onChange={(e) =>
                      setForm({ ...form, employeeId: e.target.value })
                    }
                    InputProps={{
                      startAdornment: (
                        <Badge sx={{ mr: 1, color: "text.secondary" }} />
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phòng ban"
                    value={form.department}
                    onChange={(e) =>
                      setForm({ ...form, department: e.target.value })
                    }
                    InputProps={{
                      startAdornment: (
                        <Work sx={{ mr: 1, color: "text.secondary" }} />
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Chức vụ"
                    value={form.position}
                    onChange={(e) =>
                      setForm({ ...form, position: e.target.value })
                    }
                    InputProps={{
                      startAdornment: (
                        <Work sx={{ mr: 1, color: "text.secondary" }} />
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Tab 1: Phân quyền trạm sạc */}
          {staffEditTab === 1 && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Phân quyền trạm sạc cho nhân viên
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Chọn trạm sạc mà nhân viên <strong>{form.firstName} {form.lastName}</strong> sẽ quản lý
                </Typography>
                <Chip 
                  label={selectedStation ? `Trạm: ${selectedStation.name || selectedStation.stationName}` : "Chưa chọn trạm"} 
                  color={selectedStation ? "success" : "default"} 
                  size="small" 
                  sx={{ mt: 1 }}
                  icon={<CheckCircle />}
                />
              </Box>

              {stations.length === 0 ? (
                <Alert severity="info">
                  Chưa có trạm sạc nào trong hệ thống
                </Alert>
              ) : (
                <Grid container spacing={2}>
                  {stations.map((station) => {
                    const stationKey = station.stationId ?? station.id;
                    const manager = getStationManager(station);
                    const disabled = isStationDisabled(station);
                    const isSelected = selectedStationId === stationKey;
                    const totalPorts = station.charging?.totalPorts ?? station.totalChargers ?? 0;
                    const availablePorts = station.charging?.availablePorts ?? station.availablePosts ?? 0;

                    return (
                      <Grid item xs={12} sm={6} key={stationKey}>
                        <Tooltip
                          title={
                            disabled && manager
                              ? `Đã phân công cho ${manager.name || manager.email || "nhân viên khác"}`
                              : ""
                          }
                          disableHoverListener={!disabled || isSelected}
                        >
                          <Box>
                            <Card 
                              variant="outlined"
                              sx={{ 
                                cursor: disabled ? 'not-allowed' : 'pointer',
                                border: isSelected ? 2 : 1,
                                borderColor: isSelected ? 'success.main' : 'divider',
                                bgcolor: isSelected ? 'success.50' : 'transparent',
                                opacity: disabled && !isSelected ? 0.6 : 1,
                                transition: 'all 0.2s',
                                '&:hover': disabled ? {} : {
                                  borderColor: 'success.main',
                                  transform: 'translateY(-2px)',
                                  boxShadow: 2
                                }
                              }}
                              onClick={() => {
                                if (!disabled) {
                                  toggleStationSelection(stationKey);
                                }
                              }}
                            >
                              <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                  <Box sx={{ flex: 1, pr: 1 }}>
                                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                      {station.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <LocationOn fontSize="inherit" />
                                      {station.location?.address || station.address}
                                    </Typography>
                                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                      <Chip 
                                        label={`${totalPorts} cổng`} 
                                        size="small" 
                                        variant="outlined"
                                      />
                                      <Chip 
                                        label={`Trống: ${availablePorts}`} 
                                        size="small" 
                                        variant="outlined"
                                        color="info"
                                      />
                                    </Box>
                                    <Chip
                                      icon={<Person fontSize="small" />}
                                      label={
                                        manager
                                          ? `Quản lý: ${manager.name || manager.email || "Nhân viên khác"}`
                                          : "Chưa phân công nhân viên"
                                      }
                                      size="small"
                                      color={manager ? (disabled && !isSelected ? "default" : "success") : "primary"}
                                      variant={manager ? "filled" : "outlined"}
                                      sx={{ mt: 1, maxWidth: '100%' }}
                                    />
                                  </Box>
                                  {isSelected && (
                                    <CheckCircle color="success" />
                                  )}
                                </Box>
                              </CardContent>
                            </Card>
                          </Box>
                        </Tooltip>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Box>
          )}

          {/* Tab 2: Nhật ký hoạt động */}
          {staffEditTab === 2 && (
            <Box>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Hoạt động gần đây
              </Typography>
              <Alert severity="info" sx={{ mt: 2 }}>
                Chức năng nhật ký hoạt động đang được phát triển.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStaffEditDialogOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSaveStaff}>
            Lưu thay đổi
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement;
