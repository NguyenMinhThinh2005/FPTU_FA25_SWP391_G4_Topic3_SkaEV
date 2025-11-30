import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useUserStore from "../../../../store/userStore";
import useStationStore from "../../../../store/stationStore";

export const useUserManagement = () => {
  const navigate = useNavigate();
  const { users, addUser, updateUser, deleteUser, fetchUsers, loading } = useUserStore();
  const { stations, fetchStations } = useStationStore();
  
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [staffEditDialogOpen, setStaffEditDialogOpen] = useState(false);
  const [staffEditTab, setStaffEditTab] = useState(0);
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
    password: "",
    employeeId: "",
    department: "",
    position: "",
    joinDate: "",
    location: "",
  });

  // Fetch users and stations on component mount
  useEffect(() => {
    fetchUsers();
    fetchStations();
  }, [fetchUsers, fetchStations]);

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
    setForm({ 
      email: "", 
      firstName: "", 
      lastName: "", 
      phone: "", 
      role: "customer", 
      managedStationId: null,
      password: "",
      employeeId: "",
      department: "",
      position: "",
      joinDate: "",
      location: ""
    });
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
      password: "",
      employeeId: user.employeeId || "",
      department: user.department || "",
      position: user.position || "",
      joinDate: user.joinDate || "",
      location: user.location || "",
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

  const openStaffEditDialog = (user) => {
    setEditUser(user);
    setForm({
      email: user.email,
      firstName: user.fullName?.split(" ")[0] || "",
      lastName: user.fullName?.split(" ").slice(1).join(" ") || "",
      phone: user.phoneNumber || "",
      role: user.role,
      employeeId: user.employeeId || "",
      department: user.department || "",
      position: user.position || "",
      joinDate: user.joinDate || "",
      location: user.location || "Hà Nội",
      managedStationId: user.managedStationId || null,
    });
    setSelectedStationId(user.managedStationId || null);
    setStaffEditTab(0);
    setStaffEditDialogOpen(true);
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

  const handleSaveStaff = async () => {
    if (!editUser) return;

    if (!selectedStationId) {
      setSnackbar({ open: true, message: "Vui lòng chọn trạm quản lý cho nhân viên", severity: "error" });
      return;
    }
    
    try {
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

  const closeSnackbar = () => setSnackbar({ ...snackbar, open: false });

  return {
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
    setSnackbar,
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
    navigate
  };
};
