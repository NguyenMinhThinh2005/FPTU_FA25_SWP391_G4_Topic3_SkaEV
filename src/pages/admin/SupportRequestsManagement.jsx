import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Chip,
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
  IconButton,
  Tooltip,
  CircularProgress,
  Avatar,
  Divider,
  Tab,
  Tabs,
} from "@mui/material";
import {
  Search,
  FilterList,
  CheckCircle,
  HourglassEmpty,
  Cancel,
  Lock,
  Visibility,
  Edit,
  Assignment,
  Flag,
  Person,
  Chat,
  History,
  ArrowUpward,
  TrendingUp,
} from "@mui/icons-material";
import axiosInstance from "../../services/axiosConfig";

const SupportRequestsManagement = () => {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    fetchRequests();
    fetchUsers();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/admin/support-requests?pageNumber=1&pageSize=100`);
      
      if (response.data.success) {
        setRequests(response.data.data.requests);
      }
    } catch (error) {
      console.error("Error fetching support requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get(`/admin/AdminUsers?pageNumber=1&pageSize=200`);
      
      if (response.data.success) {
        setUsers(response.data.data.users);
        setStaff(response.data.data.users.filter(u => u.role === "staff"));
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedRequest || !selectedStaffId) return;

    try {
      const response = await axiosInstance.patch(
        `/admin/support-requests/${selectedRequest.requestId}/assign`,
        { staffId: parseInt(selectedStaffId) }
      );

      if (response.data.success) {
        setSnackbar({ open: true, message: "Đã phân công thành công!", severity: "success" });
        setAssignDialogOpen(false);
        fetchRequests();
      }
    } catch (error) {
      console.error("Error assigning staff:", error);
      setSnackbar({ open: true, message: "Lỗi phân công nhân viên!", severity: "error" });
    }
  };

  const handleResolve = async () => {
    if (!selectedRequest || !resolutionNotes) return;

    try {
      const response = await axiosInstance.patch(
        `/admin/support-requests/${selectedRequest.requestId}/resolve`,
        { resolutionNotes }
      );

      if (response.data.success) {
        setSnackbar({ open: true, message: "Đã giải quyết yêu cầu!", severity: "success" });
        setResolveDialogOpen(false);
        setResolutionNotes("");
        fetchRequests();
      }
    } catch (error) {
      console.error("Error resolving request:", error);
      setSnackbar({ open: true, message: "Lỗi giải quyết yêu cầu!", severity: "error" });
    }
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      const response = await axiosInstance.patch(
        `/admin/support-requests/${requestId}/status`,
        { status: newStatus }
      );

      if (response.data.success) {
        setSnackbar({ open: true, message: `Đã cập nhật trạng thái: ${newStatus}`, severity: "success" });
        fetchRequests();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setSnackbar({ open: true, message: "Lỗi cập nhật trạng thái!", severity: "error" });
    }
  };

  const getStatusChip = (status) => {
    const statusMap = {
      open: { label: "Mới", color: "error", icon: <Flag /> },
      in_progress: { label: "Đang xử lý", color: "warning", icon: <HourglassEmpty /> },
      resolved: { label: "Đã giải quyết", color: "success", icon: <CheckCircle /> },
      closed: { label: "Đã đóng", color: "default", icon: <Lock /> },
    };
    
    const config = statusMap[status] || { label: status, color: "default" };
    return <Chip label={config.label} color={config.color} size="small" icon={config.icon} />;
  };

  const getPriorityChip = (priority) => {
    const priorityMap = {
      low: { label: "Thấp", color: "default" },
      medium: { label: "Trung bình", color: "info" },
      high: { label: "Cao", color: "warning" },
      urgent: { label: "Khẩn cấp", color: "error" },
    };
    
    const config = priorityMap[priority] || { label: priority, color: "default" };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const getCategoryChip = (category) => {
    const categoryMap = {
      technical: { label: "Kỹ thuật", color: "primary" },
      billing: { label: "Thanh toán", color: "success" },
      account: { label: "Tài khoản", color: "info" },
      station: { label: "Trạm sạc", color: "warning" },
      other: { label: "Khác", color: "default" },
    };
    
    const config = categoryMap[category] || { label: category, color: "default" };
    return <Chip label={config.label} color={config.color} size="small" variant="outlined" />;
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.userId === userId);
    return user ? user.fullName : `User ${userId}`;
  };

  const getStaffName = (staffId) => {
    const staffMember = users.find(u => u.userId === staffId);
    return staffMember ? staffMember.fullName : "Chưa phân công";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const filteredRequests = requests.filter((req) => {
    // Status filter
    if (statusFilter !== "all" && req.status !== statusFilter) return false;
    
    // Priority filter
    if (priorityFilter !== "all" && req.priority !== priorityFilter) return false;
    
    // Category filter
    if (categoryFilter !== "all" && req.category !== categoryFilter) return false;
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        req.subject.toLowerCase().includes(query) ||
        req.description.toLowerCase().includes(query) ||
        getUserName(req.userId).toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const stats = {
    total: requests.length,
    open: requests.filter(r => r.status === "open").length,
    inProgress: requests.filter(r => r.status === "in_progress").length,
    resolved: requests.filter(r => r.status === "resolved").length,
    urgent: requests.filter(r => r.priority === "urgent").length,
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Quản lý yêu cầu hỗ trợ
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Theo dõi và giải quyết yêu cầu hỗ trợ từ khách hàng
        </Typography>
      </Box>

      {/* Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tổng yêu cầu
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" fontWeight="bold" color="error">
                {stats.open}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mới
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {stats.inProgress}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Đang xử lý
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {stats.resolved}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Đã giải quyết
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" fontWeight="bold" color="error">
                {stats.urgent}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Khẩn cấp
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm theo tiêu đề, mô tả, khách hàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select value={statusFilter} label="Trạng thái" onChange={(e) => setStatusFilter(e.target.value)}>
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="open">Mới</MenuItem>
                  <MenuItem value="in_progress">Đang xử lý</MenuItem>
                  <MenuItem value="resolved">Đã giải quyết</MenuItem>
                  <MenuItem value="closed">Đã đóng</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Độ ưu tiên</InputLabel>
                <Select value={priorityFilter} label="Độ ưu tiên" onChange={(e) => setPriorityFilter(e.target.value)}>
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="low">Thấp</MenuItem>
                  <MenuItem value="medium">Trung bình</MenuItem>
                  <MenuItem value="high">Cao</MenuItem>
                  <MenuItem value="urgent">Khẩn cấp</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Danh mục</InputLabel>
                <Select value={categoryFilter} label="Danh mục" onChange={(e) => setCategoryFilter(e.target.value)}>
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="technical">Kỹ thuật</MenuItem>
                  <MenuItem value="billing">Thanh toán</MenuItem>
                  <MenuItem value="account">Tài khoản</MenuItem>
                  <MenuItem value="station">Trạm sạc</MenuItem>
                  <MenuItem value="other">Khác</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setCategoryFilter("all");
                  setSearchQuery("");
                }}
                sx={{ height: "56px" }}
              >
                Xóa bộ lọc
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <CircularProgress />
            </Box>
          ) : filteredRequests.length === 0 ? (
            <Alert severity="info">
              {searchQuery || statusFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all"
                ? "Không tìm thấy yêu cầu phù hợp"
                : "Chưa có yêu cầu hỗ trợ nào"}
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Yêu cầu</TableCell>
                    <TableCell>Khách hàng</TableCell>
                    <TableCell align="center">Danh mục</TableCell>
                    <TableCell align="center">Độ ưu tiên</TableCell>
                    <TableCell align="center">Trạng thái</TableCell>
                    <TableCell>Nhân viên phụ trách</TableCell>
                    <TableCell>Ngày tạo</TableCell>
                    <TableCell align="center">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.requestId} hover>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {request.subject}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: "block" }}>
                          {request.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                            {getUserName(request.userId)[0]}
                          </Avatar>
                          <Typography variant="body2">{getUserName(request.userId)}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">{getCategoryChip(request.category)}</TableCell>
                      <TableCell align="center">{getPriorityChip(request.priority)}</TableCell>
                      <TableCell align="center">{getStatusChip(request.status)}</TableCell>
                      <TableCell>
                        {request.assignedTo ? (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Person fontSize="small" color="action" />
                            <Typography variant="body2">{getStaffName(request.assignedTo)}</Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Chưa phân công
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(request.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Xem chi tiết">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setSelectedRequest(request);
                              setDetailDialogOpen(true);
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {request.status === "open" && (
                          <Tooltip title="Phân công">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => {
                                setSelectedRequest(request);
                                setSelectedStaffId(request.assignedTo || "");
                                setAssignDialogOpen(true);
                              }}
                            >
                              <Assignment />
                            </IconButton>
                          </Tooltip>
                        )}
                        {request.status === "in_progress" && (
                          <Tooltip title="Giải quyết">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => {
                                setSelectedRequest(request);
                                setResolveDialogOpen(true);
                              }}
                            >
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="h6">Chi tiết yêu cầu hỗ trợ</Typography>
            {selectedRequest && getStatusChip(selectedRequest.status)}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedRequest && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Tiêu đề
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                      {selectedRequest.subject}
                    </Typography>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Mô tả chi tiết
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {selectedRequest.description}
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Khách hàng
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {getUserName(selectedRequest.userId)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Danh mục
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          {getCategoryChip(selectedRequest.category)}
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Độ ưu tiên
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          {getPriorityChip(selectedRequest.priority)}
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Nhân viên phụ trách
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {selectedRequest.assignedTo ? getStaffName(selectedRequest.assignedTo) : "Chưa phân công"}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Ngày tạo
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(selectedRequest.createdAt)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Cập nhật lần cuối
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(selectedRequest.updatedAt)}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    {selectedRequest.status === "resolved" && selectedRequest.resolutionNotes && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Alert severity="success" icon={<CheckCircle />}>
                          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            Ghi chú giải quyết
                          </Typography>
                          <Typography variant="body2">
                            {selectedRequest.resolutionNotes}
                          </Typography>
                          {selectedRequest.resolvedAt && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                              Giải quyết lúc: {formatDate(selectedRequest.resolvedAt)}
                            </Typography>
                          )}
                        </Alert>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Quick Actions */}
              <Grid item xs={12}>
                <Box sx={{ display: "flex", gap: 1 }}>
                  {selectedRequest.status === "open" && (
                    <>
                      <Button
                        variant="contained"
                        color="warning"
                        startIcon={<ArrowUpward />}
                        onClick={() => handleUpdateStatus(selectedRequest.requestId, "in_progress")}
                      >
                        Bắt đầu xử lý
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Assignment />}
                        onClick={() => {
                          setDetailDialogOpen(false);
                          setAssignDialogOpen(true);
                        }}
                      >
                        Phân công
                      </Button>
                    </>
                  )}
                  {selectedRequest.status === "in_progress" && (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircle />}
                      onClick={() => {
                        setDetailDialogOpen(false);
                        setResolveDialogOpen(true);
                      }}
                    >
                      Giải quyết
                    </Button>
                  )}
                  {selectedRequest.status === "resolved" && (
                    <Button
                      variant="contained"
                      startIcon={<Lock />}
                      onClick={() => handleUpdateStatus(selectedRequest.requestId, "closed")}
                    >
                      Đóng yêu cầu
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Staff Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Phân công nhân viên</DialogTitle>
        <DialogContent dividers>
          {selectedRequest && (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Yêu cầu: <strong>{selectedRequest.subject}</strong>
              </Typography>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Chọn nhân viên</InputLabel>
                <Select
                  value={selectedStaffId}
                  label="Chọn nhân viên"
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                >
                  {staff.map((s) => (
                    <MenuItem key={s.userId} value={s.userId}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                          {s.fullName[0]}
                        </Avatar>
                        {s.fullName}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleAssignStaff} disabled={!selectedStaffId}>
            Phân công
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onClose={() => setResolveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Giải quyết yêu cầu</DialogTitle>
        <DialogContent dividers>
          {selectedRequest && (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Yêu cầu: <strong>{selectedRequest.subject}</strong>
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Ghi chú giải quyết *"
                placeholder="Mô tả cách giải quyết vấn đề..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                sx={{ mt: 2 }}
                required
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialogOpen(false)}>Hủy</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleResolve}
            disabled={!resolutionNotes.trim()}
          >
            Xác nhận giải quyết
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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

export default SupportRequestsManagement;
