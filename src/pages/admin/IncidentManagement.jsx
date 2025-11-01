/* eslint-disable */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Snackbar,
  Stack,
  Divider,
  Tab,
  Tabs,
} from "@mui/material";
import {
  Warning,
  CheckCircle,
  Error,
  Build,
  Assignment,
  Send,
  Close,
  AccessTime,
  Person,
  LocationOn,
} from "@mui/icons-material";

const IncidentManagement = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [responseDialog, setResponseDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [responseForm, setResponseForm] = useState({
    decision: "",
    instructions: "",
    notes: "",
  });

  const statusOptions = [
    { value: "all", label: "Tất cả", color: "default" },
    { value: "pending", label: "Chờ xử lý", color: "warning" },
    { value: "in_progress", label: "Đang xử lý", color: "info" },
    { value: "resolved", label: "Đã giải quyết", color: "success" },
    { value: "rejected", label: "Từ chối", color: "error" },
  ];

  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = () => {
    // Mock incident reports từ Staff
    const mockIncidents = [
      {
        id: "INC-001",
        connectorId: "CON-04",
        stationName: "Trạm sạc FPT Complex",
        type: "hardware",
        typeLabel: "Lỗi Phần cứng Thiết bị",
        priority: "high",
        description: "Cáp sạc bị đứt, không thể kết nối với xe. Khách hàng phản ánh nhiều lần.",
        status: "pending",
        statusLabel: "Chờ xử lý",
        reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        reportedBy: "Nguyễn Văn Minh",
        reporterRole: "Staff",
        reporterId: "ST001",
        attachments: ["cable-broken.jpg"],
        adminResponse: null,
      },
      {
        id: "INC-002",
        connectorId: "CON-02",
        stationName: "Trạm sạc FPT Complex",
        type: "software",
        typeLabel: "Lỗi Phần mềm/Giao tiếp",
        priority: "medium",
        description: "Màn hình đôi khi không hiển thị trạng thái sạc. Cần kiểm tra phần mềm.",
        status: "in_progress",
        statusLabel: "Đang xử lý",
        reportedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        reportedBy: "Nguyễn Văn Minh",
        reporterRole: "Staff",
        reporterId: "ST001",
        attachments: [],
        adminResponse: {
          decision: "approve",
          instructions: "Liên hệ kỹ thuật viên kiểm tra hệ thống phần mềm",
          respondedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
          respondedBy: "Admin",
        },
      },
      {
        id: "INC-003",
        connectorId: "CON-01",
        stationName: "Trạm sạc FPT Complex",
        type: "electrical",
        typeLabel: "Vấn đề về Điện",
        priority: "high",
        description: "Công suất bị giảm đột ngột, không đạt 22kW như thiết kế",
        status: "resolved",
        statusLabel: "Đã giải quyết",
        reportedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        reportedBy: "Nguyễn Văn Minh",
        reporterRole: "Staff",
        reporterId: "ST001",
        attachments: [],
        adminResponse: {
          decision: "approve",
          instructions: "Đã kiểm tra và thay thế thiết bị điều khiển công suất",
          notes: "Hoàn thành sửa chữa, hệ thống hoạt động bình thường",
          respondedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          respondedBy: "Admin",
          resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      },
    ];

    setIncidents(mockIncidents);
  };

  const handleViewDetail = (incident) => {
    setSelectedIncident(incident);
    setDetailDialog(true);
  };

  const handleOpenResponse = (incident) => {
    setSelectedIncident(incident);
    
    // Nếu đã có phản hồi rồi, load dữ liệu cũ vào form để có thể chỉnh sửa
    if (incident.adminResponse) {
      setResponseForm({
        decision: incident.adminResponse.decision,
        instructions: incident.adminResponse.instructions,
        notes: incident.adminResponse.notes || "",
      });
    } else {
      // Nếu chưa có phản hồi, reset form
      setResponseForm({
        decision: "",
        instructions: "",
        notes: "",
      });
    }
    
    setResponseDialog(true);
  };

  const handleSubmitResponse = async () => {
    if (!responseForm.decision || !responseForm.instructions) {
      setSnackbar({ open: true, message: "Vui lòng điền đầy đủ thông tin", severity: "error" });
      return;
    }

    try {
      // TODO: API call to submit admin response
      // Sau khi gửi phản hồi, trạng thái vẫn là "Đang xử lý" (không tự động chuyển sang "Hoàn thành")
      const newStatus = responseForm.decision === "approve" ? "in_progress" : "rejected";
      
      setIncidents(incidents.map(inc => 
        inc.id === selectedIncident?.id 
          ? {
              ...inc,
              status: newStatus,
              statusLabel: newStatus === "in_progress" ? "Đang xử lý" : "Từ chối",
              adminResponse: {
                decision: responseForm.decision,
                instructions: responseForm.instructions,
                notes: responseForm.notes,
                respondedAt: new Date(),
                respondedBy: "Admin",
              }
            }
          : inc
      ));

      setSnackbar({
        open: true,
        message: "Đã gửi phản hồi thành công!",
        severity: "success",
      });
      setResponseDialog(false);
    } catch (error) {
      setSnackbar({ open: true, message: "Lỗi gửi phản hồi", severity: "error" });
    }
  };

  const handleMarkResolved = (incidentId) => {
    setIncidents(incidents.map(inc => 
      inc.id === incidentId 
        ? {
            ...inc,
            status: "resolved",
            statusLabel: "Đã giải quyết",
            adminResponse: {
              ...inc.adminResponse,
              resolvedAt: new Date(),
            }
          }
        : inc
    ));
    setSnackbar({
      open: true,
      message: "Đã đánh dấu sự cố đã giải quyết!",
      severity: "success",
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "in_progress":
        return "info";
      case "resolved":
        return "success";
      case "rejected":
        return "error";
      default:
        return "default";
    }
  };

  const filteredIncidents = statusFilter === "all" 
    ? incidents 
    : incidents.filter(inc => inc.status === statusFilter);

  const pendingCount = incidents.filter(inc => inc.status === "pending").length;
  const inProgressCount = incidents.filter(inc => inc.status === "in_progress").length;
  const resolvedCount = incidents.filter(inc => inc.status === "resolved").length;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Quản lý Báo cáo Sự cố
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Xử lý các báo cáo từ nhân viên và đưa ra quyết định xử lý
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: "warning.50" }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Warning sx={{ fontSize: 40, color: "warning.main" }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {pendingCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Chờ xử lý
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: "info.50" }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Build sx={{ fontSize: 40, color: "info.main" }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {inProgressCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Đang xử lý
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: "success.50" }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <CheckCircle sx={{ fontSize: 40, color: "success.main" }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {resolvedCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Đã giải quyết
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Assignment sx={{ fontSize: 40, color: "primary.main" }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {incidents.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng báo cáo
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Lọc theo trạng thái</InputLabel>
            <Select
              value={statusFilter}
              label="Lọc theo trạng thái"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Chip label={option.label} color={option.color} size="small" />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Incidents Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Mã báo cáo</TableCell>
                  <TableCell>Điểm sạc</TableCell>
                  <TableCell>Loại sự cố</TableCell>
                  <TableCell>Mức độ</TableCell>
                  <TableCell>Thời gian</TableCell>
                  <TableCell align="center">Trạng thái</TableCell>
                  <TableCell>Phản hồi</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredIncidents.map((incident) => (
                  <TableRow key={incident.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {incident.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{incident.connectorId}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {incident.stationName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{incident.typeLabel}</TableCell>
                    <TableCell>
                      <Chip
                        label={incident.priority === "high" ? "Cao" : incident.priority === "medium" ? "Trung bình" : "Thấp"}
                        color={getPriorityColor(incident.priority)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {incident.reportedAt.toLocaleString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={incident.statusLabel}
                        color={getStatusColor(incident.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {incident.adminResponse ? (
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => handleViewDetail(incident)}
                        >
                          Xem chi tiết
                        </Button>
                      ) : (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                          Chưa có phản hồi
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        {/* Chưa có phản hồi - Hiển thị nút Phản hồi */}
                        {incident.status === "pending" && (
                          <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            onClick={() => handleOpenResponse(incident)}
                          >
                            Phản hồi
                          </Button>
                        )}
                        
                        {/* Đã phản hồi nhưng chưa hoàn thành - Hiển thị 2 nút */}
                        {incident.status === "in_progress" && incident.adminResponse && (
                          <>
                            <Button
                              variant="outlined"
                              size="small"
                              color="primary"
                              onClick={() => handleOpenResponse(incident)}
                            >
                              Phản hồi lại
                            </Button>
                            <Button
                              variant="contained"
                              size="small"
                              color="success"
                              onClick={() => handleMarkResolved(incident.id)}
                            >
                              Hoàn thành
                            </Button>
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">
              Chi tiết Báo cáo Sự cố - {selectedIncident?.id}
            </Typography>
            <IconButton onClick={() => setDetailDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedIncident && (
            <Box>
              {/* Thông tin báo cáo */}
              <Card sx={{ mb: 2, bgcolor: "grey.50" }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                    Thông tin Báo cáo
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Điểm sạc:</Typography>
                      <Typography variant="body1" fontWeight={600}>{selectedIncident.connectorId}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Trạm:</Typography>
                      <Typography variant="body1" fontWeight={600}>{selectedIncident.stationName}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Loại sự cố:</Typography>
                      <Typography variant="body1">{selectedIncident.typeLabel}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Mức độ:</Typography>
                      <Chip
                        label={selectedIncident.priority === "high" ? "Cao" : selectedIncident.priority === "medium" ? "Trung bình" : "Thấp"}
                        color={getPriorityColor(selectedIncident.priority)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Mô tả:</Typography>
                      <Typography variant="body1">{selectedIncident.description}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Người báo cáo:</Typography>
                      <Typography variant="body1">{selectedIncident.reportedBy}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Thời gian:</Typography>
                      <Typography variant="body1">
                        {selectedIncident.reportedAt.toLocaleString("vi-VN")}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Quyết định xử lý của Admin */}
              {selectedIncident.adminResponse && (
                <Card sx={{ bgcolor: "primary.50" }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                      Quyết định Xử lý
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Alert severity={selectedIncident.adminResponse.decision === "approve" ? "success" : "error"}>
                          <strong>Quyết định:</strong> {selectedIncident.adminResponse.decision === "approve" ? "Chấp nhận & Xử lý" : "Từ chối"}
                        </Alert>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">Hướng dẫn:</Typography>
                        <Typography variant="body1">{selectedIncident.adminResponse.instructions}</Typography>
                      </Grid>
                      {selectedIncident.adminResponse.notes && (
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">Ghi chú:</Typography>
                          <Typography variant="body1">{selectedIncident.adminResponse.notes}</Typography>
                        </Grid>
                      )}
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Người xử lý:</Typography>
                        <Typography variant="body1">{selectedIncident.adminResponse.respondedBy}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Thời gian phản hồi:</Typography>
                        <Typography variant="body1">
                          {selectedIncident.adminResponse.respondedAt.toLocaleString("vi-VN")}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={responseDialog} onClose={() => setResponseDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedIncident?.adminResponse ? "Chỉnh sửa Phản hồi" : "Đưa ra Quyết định Xử lý"} - {selectedIncident?.id}
        </DialogTitle>
        <DialogContent dividers>
          {selectedIncident && (
            <Box>
              {/* Thông tin sự cố */}
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Sự cố:</strong> {selectedIncident.typeLabel} tại {selectedIncident.connectorId}
                </Typography>
                <Typography variant="body2">
                  <strong>Mô tả:</strong> {selectedIncident.description}
                </Typography>
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Quyết định</InputLabel>
                    <Select
                      value={responseForm.decision}
                      label="Quyết định"
                      onChange={(e) => setResponseForm({ ...responseForm, decision: e.target.value })}
                    >
                      <MenuItem value="approve">Chấp nhận & Xử lý</MenuItem>
                      <MenuItem value="reject">Từ chối</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    multiline
                    rows={3}
                    label="Hướng dẫn xử lý"
                    value={responseForm.instructions}
                    onChange={(e) => setResponseForm({ ...responseForm, instructions: e.target.value })}
                    placeholder="Mô tả chi tiết cách xử lý sự cố này..."
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Ghi chú (không bắt buộc)"
                    value={responseForm.notes}
                    onChange={(e) => setResponseForm({ ...responseForm, notes: e.target.value })}
                    placeholder="Thêm ghi chú nếu cần..."
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResponseDialog(false)}>Hủy</Button>
          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={handleSubmitResponse}
            color={responseForm.decision === "approve" ? "primary" : "error"}
          >
            {selectedIncident?.adminResponse ? "Cập nhật Phản hồi" : "Gửi Phản hồi"}
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
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default IncidentManagement;
