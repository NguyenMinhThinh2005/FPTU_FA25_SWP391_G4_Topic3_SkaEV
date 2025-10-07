import React, { useMemo, useState } from "react";
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
} from "@mui/material";
import { Search, Add, Edit, Delete, People, Shield } from "@mui/icons-material";
import useUserStore from "../../store/userStore";

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "customer", label: "Customer" },
];

const UserManagement = () => {
  const { users, addUser, updateUser, deleteUser } = useUserStore();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "customer",
  });

  const filteredUsers = useMemo(() => {
    const q = query.toLowerCase();
    return users.filter((u) => {
      const name = `${u.profile?.firstName || ""} ${u.profile?.lastName || ""}`.toLowerCase();
      const matchesQuery =
        u.email.toLowerCase().includes(q) ||
        name.includes(q) ||
        (u.profile?.phone || "").includes(query);
      const matchesRole = roleFilter === "all" ? true : u.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [users, query, roleFilter]);

  const openCreate = () => {
    setEditUser(null);
    setForm({ email: "", firstName: "", lastName: "", phone: "", role: "customer" });
    setDialogOpen(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({
      email: user.email,
      firstName: user.profile?.firstName || "",
      lastName: user.profile?.lastName || "",
      phone: user.profile?.phone || "",
      role: user.role,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editUser) {
      updateUser(editUser.id, {
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        role: form.role,
      });
    } else {
      addUser({
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        role: form.role,
      });
    }
    setDialogOpen(false);
  };

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
                {filteredUsers.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar src={u.profile?.avatar}>{(u.profile?.firstName || "?")[0]}</Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {u.profile?.firstName} {u.profile?.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {u.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.profile?.phone || "-"}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={u.role}
                        color={u.role === "admin" ? "primary" : u.role === "staff" ? "warning" : "default"}
                        size="small"
                        icon={u.role === "admin" ? <Shield /> : <People />}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => openEdit(u)}>
                        <Edit />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => deleteUser(u.id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editUser ? "Chỉnh sửa người dùng" : "Thêm người dùng"}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tên"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
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
                label="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
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
              <FormControl fullWidth>
                <InputLabel>Vai trò</InputLabel>
                <Select value={form.role} label="Vai trò" onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {roleOptions.map((r) => (
                    <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSave}>{editUser ? "Lưu thay đổi" : "Tạo người dùng"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
