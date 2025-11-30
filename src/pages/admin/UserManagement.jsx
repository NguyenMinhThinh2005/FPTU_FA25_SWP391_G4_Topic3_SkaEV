import React from "react";
import { Box, Snackbar, Alert } from "@mui/material";
import { useUserManagement } from "./user-management/hooks/useUserManagement";
import UserManagementHeader from "./user-management/components/UserManagementHeader";
import UserStats from "./user-management/components/UserStats";
import UserFilters from "./user-management/components/UserFilters";
import UserTable from "./user-management/components/UserTable";
import UserDialog from "./user-management/components/UserDialog";
import DeleteUserDialog from "./user-management/components/DeleteUserDialog";
import ChangeRoleDialog from "./user-management/components/ChangeRoleDialog";
import StaffEditDialog from "./user-management/components/StaffEditDialog";

const UserManagement = () => {
<<<<<<< HEAD
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
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
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
        const phone = (u.phoneNumber || "");
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
          managedStationId: form.role === "staff" ? form.managedStationId : undefined,
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
        setSnackbar({ open: true, message: result.error || "Lỗi cập nhật thông tin nhân viên", severity: "error" });
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.message || "Có lỗi xảy ra", severity: "error" });
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
    { label: "Quản trị viên", value: users.filter(u => u.role === "admin").length, color: "primary" },
    { label: "Nhân viên", value: users.filter(u => u.role === "staff").length, color: "warning" },
    { label: "Khách hàng", value: users.filter(u => u.role === "customer").length, color: "success" },
  ];
=======
  const {
    users,
    loading,
    stations,
    query,
    setQuery,
    roleFilter,
    setRoleFilter,
    dialogOpen,
    setDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    roleDialogOpen,
    setRoleDialogOpen,
    staffEditDialogOpen,
    setStaffEditDialogOpen,
    staffEditTab,
    setStaffEditTab,
    editUser,
    userToDelete,
    userToChangeRole,
    selectedStationId,
    newRole,
    setNewRole,
    snackbar,
    form,
    setForm,
    selectedStation,
    availableStationsCount,
    filteredUsers,
    openCreate,
    openEdit,
    openDeleteDialog,
    openRoleDialog,
    openStaffEditDialog,
    handleDelete,
    handleRoleChange,
    handleManagedStationChange,
    handleSave,
    handleChangeRole,
    handleSaveStaff,
    toggleStationSelection,
    getStationManager,
    isStationDisabled,
    closeSnackbar,
    navigate,
  } = useUserManagement();
>>>>>>> origin/develop

  return (
    <Box>
      <UserManagementHeader onAddUser={openCreate} />

      <UserStats users={users} />

      <UserFilters 
        query={query} 
        setQuery={setQuery} 
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
      />

      <UserTable
        loading={loading}
        filteredUsers={filteredUsers}
        query={query}
        roleFilter={roleFilter}
        navigate={navigate}
        onEdit={openEdit}
        onRoleChange={openRoleDialog}
        onDelete={openDeleteDialog}
        onStaffEdit={openStaffEditDialog}
      />

<<<<<<< HEAD
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
=======
      <UserDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editUser={editUser}
        form={form}
        setForm={setForm}
        handleSave={handleSave}
        handleRoleChange={handleRoleChange}
        handleManagedStationChange={handleManagedStationChange}
        stations={stations}
        availableStationsCount={availableStationsCount}
        getStationManager={getStationManager}
        isStationDisabled={isStationDisabled}
      />
>>>>>>> origin/develop

      <DeleteUserDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        userToDelete={userToDelete}
        handleDelete={handleDelete}
      />

      <ChangeRoleDialog
        open={roleDialogOpen}
        onClose={() => setRoleDialogOpen(false)}
        userToChangeRole={userToChangeRole}
        newRole={newRole}
        setNewRole={setNewRole}
        handleChangeRole={handleChangeRole}
      />

      <StaffEditDialog
        open={staffEditDialogOpen}
        onClose={() => setStaffEditDialogOpen(false)}
        form={form}
        setForm={setForm}
        staffEditTab={staffEditTab}
        setStaffEditTab={setStaffEditTab}
        stations={stations}
        selectedStation={selectedStation}
        selectedStationId={selectedStationId}
        toggleStationSelection={toggleStationSelection}
        getStationManager={getStationManager}
        isStationDisabled={isStationDisabled}
        handleSaveStaff={handleSaveStaff}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={closeSnackbar}
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
