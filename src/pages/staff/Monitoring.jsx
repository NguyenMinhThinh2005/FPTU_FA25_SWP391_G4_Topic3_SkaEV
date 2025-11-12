/* eslint-disable */
import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import staffAPI from "../../services/api/staffAPI";
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
} from "@mui/material";
import {
  Warning,
  Add,
  ArrowBack,
  CloudUpload,
  CheckCircle,
  Error,
  PowerOff,
  Build,
  Info,
  Schedule,
  HourglassEmpty,
} from "@mui/icons-material";

const Monitoring = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [connectors, setConnectors] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [reportDialog, setReportDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [reportForm, setReportForm] = useState({
    connectorId: "",
    incidentType: "",
    priority: "medium",
    description: "",
    attachments: [],
  });

  const incidentTypes = [
    { value: "hardware", label: "Lỗi Phần cứng Thiết bị" },
    { value: "software", label: "Lỗi Phần mềm/Giao tiếp" },
    { value: "physical", label: "Hư hỏng Vật lý/Thiên tai" },
    { value: "electrical", label: "Vấn đề về Điện" },
    { value: "other", label: "Lỗi Khác" },
  ];

  const priorityLevels = [
    { value: "low", label: "Thấp", color: "success" },
    { value: "medium", label: "Trung bình", color: "warning" },
    { value: "high", label: "Cao", color: "error" },
    { value: "urgent", label: "Khẩn cấp", color: "error" },
  ];

  useEffect(() => {
    loadMonitoringData();
    
    // Auto-refresh every 30 seconds for real-time updates
    const refreshInterval = setInterval(() => {
      loadMonitoringData();
    }, 30000); // 30 seconds

    // Handle navigation state
    if (location.state?.action === "report" && location.state?.connectorId) {
      setReportForm((prev) => ({ ...prev, connectorId: location.state.connectorId }));
      setReportDialog(true);
    }

    // Cleanup interval on component unmount
    return () => clearInterval(refreshInterval);
  }, [location.state]);

  const mapSlotStatus = (status = "") => {
    const normalized = status.toLowerCase();
    switch (normalized) {
      case "available":
        return { technical: "online", operational: "Sẵn sàng" };
      case "occupied":
      case "charging":
        return { technical: "online", operational: "Đang hoạt động" };
      case "maintenance":
        return { technical: "offline", operational: "Bảo trì" };
      case "faulted":
      case "error":
        return { technical: "offline", operational: "Lỗi" };
      default:
        return { technical: "unknown", operational: "Không rõ" };
    }
  };

  const mapIssueStatus = (status = "") => {
    const normalized = status.toLowerCase();
    switch (normalized) {
      case "resolved":
        return { key: "completed", label: "Đã xử lý" };
      case "in_progress":
      case "in-progress":
        return { key: "in_progress", label: "Đang xử lý" };
      case "closed":
        return { key: "completed", label: "Đã đóng" };
      default:
        return { key: "pending", label: "Chờ xử lý" };
    }
  };

  const loadMonitoringData = async () => {
    try {
      // Load dashboard data to get assigned station
      const dashboardData = await staffAPI.getDashboardOverview();
      console.log("📊 Dashboard data:", dashboardData);

      if (!dashboardData.hasAssignment || !dashboardData.station) {
        setSnackbar({
          open: true,
          message: "Bạn chưa được phân công quản lý trạm nào. Vui lòng liên hệ quản trị viên.",
          severity: "warning",
        });
        setConnectors([]);
        setIncidents([]);
        return;
      }

      const assignedStation = dashboardData.station;

      // Load all issues for the assigned station
      const issues = await staffAPI.getAllIssues({ stationId: assignedStation.stationId });
      const issueList = Array.isArray(issues) ? issues : [];
      
      console.log("📊 Issues loaded from API:", issueList);
      
      // Build a map of stations with active issues (reported or in_progress)
      const stationsWithActiveIssues = new Set(
        issueList
          .filter(issue => issue.status && !['resolved', 'closed'].includes(issue.status.toLowerCase()))
          .map(issue => issue.stationId)
      );

      // Load slots from dashboard connectors (already loaded with active sessions)
      const hasActiveIssue = stationsWithActiveIssues.has(assignedStation.stationId);
      
      const connectorsData = dashboardData.connectors.map((connector) => {
        // If station has active issue, override status to maintenance
        const actualStatus = hasActiveIssue ? 'maintenance' : (connector.technicalStatus || connector.operationalStatus);
        const status = mapSlotStatus(actualStatus);
        
        return {
          id: connector.connectorCode || `SLOT-${connector.slotId}`,
          stationId: assignedStation.stationId,
          stationName: assignedStation.stationName,
          slotId: connector.slotId,
          postId: null,
          postNumber: null,
          slotNumber: null,
          type: connector.connectorType || "Không rõ",
          maxPower: connector.maxPower || 0,
          status: status.technical,
          operationalStatus: status.operational,
          currentPower: connector.activeSession?.energyConsumed ?? null,
          currentSoc: connector.activeSession?.vehicleSOC ?? null,
          currentUser: connector.activeSession?.customerName ?? null,
          bookingStart: connector.activeSession?.startTime ?? null,
          hasActiveIssue, // Flag to show maintenance icon
        };
      });

      const incidentsData = issueList.map((issue) => {
        const status = mapIssueStatus(issue.status);
        const resolvedAt = issue.resolvedAt ? new Date(issue.resolvedAt) : null;
        const updatedAt = issue.updatedAt ? new Date(issue.updatedAt) : null;
        const reportedAt = issue.reportedAt ? new Date(issue.reportedAt) : (issue.createdAt ? new Date(issue.createdAt) : new Date());
        const resolution = issue.resolution ?? null;
        const priority = (issue.priority || "medium").toLowerCase();

        return {
          id: issue.issueId,
          connectorId: issue.postName ? `${issue.stationName} · Post ${issue.postName}` : `ST${issue.stationId}`,
          type: issue.title || "Sự cố",
          priority,
          description: issue.description,
          status: status.key,
          statusLabel: status.label,
          stationName: issue.stationName,
          stationId: issue.stationId,
          assignedTo: issue.assignedToUserName,
          reportedBy: issue.reportedByUserName,
          reportedAt: reportedAt,
          updatedAt: updatedAt,
          resolvedAt: resolvedAt,
          adminResponse: resolution,
        };
      });

      console.log("📋 Processed incidents data:", incidentsData);

      setConnectors(connectorsData);
      setIncidents(incidentsData);

    } catch (error) {
      console.error("❌ Error loading monitoring data:", error);
      setSnackbar({
        open: true,
        message: "Không thể tải dữ liệu theo thời gian thực. Vui lòng thử lại.",
        severity: "error",
      });
      setConnectors([]);
      setIncidents([]);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportForm.connectorId || !reportForm.incidentType || !reportForm.description) {
      setSnackbar({ open: true, message: "Vui lòng điền đầy đủ thông tin", severity: "error" });
      return;
    }

    try {
      const targetConnector = connectors.find((c) => c.id === reportForm.connectorId);

      if (!targetConnector) {
        setSnackbar({ open: true, message: "Không tìm thấy điểm sạc đã chọn", severity: "error" });
        return;
      }

      const issueData = {
        StationId: targetConnector.stationId,
        PostId: targetConnector.postId,
        Title: incidentTypes.find((t) => t.value === reportForm.incidentType)?.label || "Sự cố kỹ thuật",
        Description: reportForm.description,
        Priority: reportForm.priority,
      };

      console.log("📝 Submitting issue data:", issueData);

      const result = await staffAPI.createIssue(issueData);
      console.log("✅ Issue created:", result);
      
      // Upload attachments if any
      if (reportForm.attachments.length > 0 && result.issueId) {
        for (const file of reportForm.attachments) {
          try {
            await staffAPI.uploadAttachment(result.issueId, file);
          } catch (err) {
            console.warn("⚠️ Failed to upload attachment:", err);
          }
        }
      }
      
      setSnackbar({
        open: true,
        message: "Đã gửi báo cáo sự cố thành công!",
        severity: "success",
      });
      setReportDialog(false);
      setReportForm({
        connectorId: "",
        incidentType: "",
        priority: "medium",
        description: "",
        attachments: [],
      });
      loadMonitoringData();
    } catch (error) {
      console.error("❌ Error submitting report:", error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || "Lỗi gửi báo cáo", 
        severity: "error" 
      });
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setReportForm({ ...reportForm, attachments: files });
  };

  const handleViewDetail = (incident) => {
    setSelectedIncident(incident);
    setDetailDialog(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "online":
        return "success";
      case "offline":
        return "error";
      default:
        return "warning";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Sẵn sàng":
        return <CheckCircle color="success" />;
      case "Đang hoạt động":
        return <Build color="primary" />;
      case "Bảo trì":
        return <PowerOff color="warning" />;
      case "Lỗi":
        return <Error color="error" />;
      default:
        return <Warning color="warning" />;
    }
  };

  const stats = useMemo(() => {
    const online = connectors.filter((c) => c.status === "online").length;
    const offline = connectors.filter((c) => c.status === "offline").length;
    const ready = connectors.filter((c) => c.operationalStatus === "Sẵn sàng").length;
    const active = connectors.filter((c) => c.operationalStatus === "Đang hoạt động").length;
    const faulted = connectors.filter((c) => c.operationalStatus === "Lỗi" || c.operationalStatus === "Bảo trì").length;
    return { online, offline, ready, active, faulted };
  }, [connectors]);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Theo dõi & Báo cáo Sự cố
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Giám sát tình trạng điểm sạc và báo cáo sự cố kỹ thuật
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" startIcon={<Add />} onClick={() => setReportDialog(true)}>
            Báo cáo sự cố
          </Button>
          <Button startIcon={<ArrowBack />} onClick={() => navigate("/staff/dashboard")}>
            Quay lại
          </Button>
        </Stack>
      </Box>

      {/* Statistics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography variant="h5" fontWeight="bold" color="success.main">
                {stats.online}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Điểm sạc Online
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography variant="h5" fontWeight="bold" color="error.main">
                {stats.offline}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Điểm sạc Offline
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography variant="h5" fontWeight="bold" color="success.main">
                {stats.ready}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Đang Rảnh
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography variant="h5" fontWeight="bold" color="primary.main">
                {stats.active}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Đang Sạc
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography variant="h5" fontWeight="bold" color="error.main">
                {stats.faulted}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Lỗi/Bảo trì
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Connector Status Table */}
      <Typography variant="h5" fontWeight={600} mb={2}>
        Tình trạng Điểm sạc
      </Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Mã điểm sạc</TableCell>
                  <TableCell>Trạm</TableCell>
                  <TableCell>Loại</TableCell>
                  <TableCell>Công suất tối đa</TableCell>
                  <TableCell align="center">Trạng thái Kỹ thuật</TableCell>
                  <TableCell align="center">Trạng thái Hoạt động</TableCell>
                  <TableCell align="right">Công suất tức thời (kW)</TableCell>
                  <TableCell align="right">SOC hiện tại (%)</TableCell>
                  <TableCell align="right">Bắt đầu lúc</TableCell>
                  <TableCell align="right">Người dùng</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {connectors.map((connector) => (
                  <TableRow key={connector.id} hover>
                    <TableCell fontWeight={600}>{connector.id}</TableCell>
                    <TableCell>{connector.stationName}</TableCell>
                    <TableCell>{connector.type}</TableCell>
                    <TableCell>{connector.maxPower} kW</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={connector.status === "online" ? "Online" : connector.status === "offline" ? "Offline" : "Không rõ"}
                        color={getStatusColor(connector.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={
                          connector.hasActiveIssue ? (
                            <Build fontSize="small" />
                          ) : (
                            getStatusIcon(connector.operationalStatus)
                          )
                        }
                        label={
                          connector.hasActiveIssue 
                            ? "Đang bảo trì" 
                            : connector.operationalStatus
                        }
                        size="small"
                        variant="outlined"
                        color={connector.hasActiveIssue ? "warning" : "default"}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {typeof connector.currentPower === "number"
                        ? connector.currentPower.toFixed(2)
                        : "-"}
                    </TableCell>
                    <TableCell align="right">
                      {typeof connector.currentSoc === "number"
                        ? connector.currentSoc.toFixed(0)
                        : "-"}
                    </TableCell>
                    <TableCell align="right">
                      {connector.bookingStart ? connector.bookingStart.toLocaleTimeString("vi-VN") : "-"}
                    </TableCell>
                    <TableCell align="right">{connector.currentUser ?? "-"}</TableCell>
                    <TableCell align="center">
                      {connector.status !== "online" && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          startIcon={<Warning />}
                          onClick={() => {
                            setReportForm({ ...reportForm, connectorId: connector.id });
                            setReportDialog(true);
                          }}
                        >
                          Báo cáo
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Incident Reports History */}
      <Typography variant="h5" fontWeight={600} mb={2}>
        Lịch sử Báo cáo Sự cố
      </Typography>
      <Card>
        <CardContent>
          {incidents.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Chưa có báo cáo sự cố nào
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Mã sự cố</TableCell>
                    <TableCell>Trạm</TableCell>
                    <TableCell>Loại sự cố</TableCell>
                    <TableCell>Mô tả</TableCell>
                    <TableCell align="center">Ưu tiên</TableCell>
                    <TableCell align="center">Trạng thái</TableCell>
                    <TableCell>Gán cho</TableCell>
                    <TableCell>Phản hồi Admin</TableCell>
                    <TableCell>Thời gian báo cáo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {incidents.map((incident) => (
                    <TableRow key={incident.id} hover>
                      <TableCell fontWeight={600}>#{incident.id}</TableCell>
                      <TableCell>{incident.stationName || incident.connectorId}</TableCell>
                      <TableCell>{incident.type}</TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {incident.description}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={priorityLevels.find((p) => p.value === incident.priority)?.label || 'Trung bình'}
                          color={priorityLevels.find((p) => p.value === incident.priority)?.color || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={incident.statusLabel} 
                          color={
                            incident.status === "completed" ? "success" : 
                            incident.status === "in_progress" ? "info" : 
                            "warning"
                          }
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        {incident.assignedTo || (
                          <Typography variant="body2" color="text.secondary" fontStyle="italic">
                            Chưa phân công
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {incident.adminResponse ? (
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => handleViewDetail(incident)}
                          >
                            Xem phản hồi
                          </Button>
                        ) : (
                          <Typography variant="body2" color="text.secondary" fontStyle="italic">
                            Đang chờ xử lý...
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {incident.reportedAt.toLocaleDateString("vi-VN")}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {incident.reportedAt.toLocaleTimeString("vi-VN")}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Report Incident Dialog */}
      <Dialog open={reportDialog} onClose={() => setReportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Tạo Báo cáo Sự cố Mới</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Điểm sạc Ảnh hưởng</InputLabel>
                  <Select
                    value={reportForm.connectorId}
                    label="Điểm sạc Ảnh hưởng"
                    onChange={(e) => setReportForm({ ...reportForm, connectorId: e.target.value })}
                  >
                    {connectors.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.stationName} · {c.id} ({c.type} {c.maxPower}kW)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Loại Sự cố</InputLabel>
                  <Select
                    value={reportForm.incidentType}
                    label="Loại Sự cố"
                    onChange={(e) => setReportForm({ ...reportForm, incidentType: e.target.value })}
                  >
                    {incidentTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Mức độ Ưu tiên</InputLabel>
                  <Select
                    value={reportForm.priority}
                    label="Mức độ Ưu tiên"
                    onChange={(e) => setReportForm({ ...reportForm, priority: e.target.value })}
                  >
                    {priorityLevels.map((level) => (
                      <MenuItem key={level.value} value={level.value}>
                        {level.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={4}
                  label="Mô tả Chi tiết"
                  placeholder="Mô tả rõ ràng vấn đề và các bước đã thử khắc phục (nếu có)"
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <Button variant="outlined" component="label" startIcon={<CloudUpload />}>
                  Tải lên Hình ảnh/Video
                  <input type="file" hidden multiple accept="image/*,video/*" onChange={handleFileUpload} />
                </Button>
                {reportForm.attachments.length > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                    {reportForm.attachments.length} file đã chọn
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialog(false)}>Hủy</Button>
          <Button variant="contained" color="warning" startIcon={<Warning />} onClick={handleSubmitReport}>
            Gửi Báo cáo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">
              Chi tiết Báo cáo Sự cố - {selectedIncident?.id}
            </Typography>
            <IconButton onClick={() => setDetailDialog(false)}>
              <Warning />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedIncident && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Thông tin báo cáo */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Info /> Thông tin Báo cáo
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Mã sự cố:</Typography>
                      <Typography variant="body1" fontWeight={600}>#{selectedIncident.id}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Trạm:</Typography>
                      <Typography variant="body1" fontWeight={600}>{selectedIncident.stationName || "Không xác định"}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Điểm sạc:</Typography>
                      <Typography variant="body1">{selectedIncident.connectorId}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Loại sự cố:</Typography>
                      <Typography variant="body1">{selectedIncident.type}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Mức độ ưu tiên:</Typography>
                      <Chip
                        label={priorityLevels.find((p) => p.value === selectedIncident.priority)?.label || 'Trung bình'}
                        color={priorityLevels.find((p) => p.value === selectedIncident.priority)?.color || 'default'}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Người báo cáo:</Typography>
                      <Typography variant="body1">{selectedIncident.reportedBy || "Không rõ"}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Mô tả chi tiết:</Typography>
                      <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'grey.50' }}>
                        <Typography variant="body1">{selectedIncident.description}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Trạng thái:</Typography>
                      <Chip 
                        label={selectedIncident.statusLabel} 
                        color={
                          selectedIncident.status === "resolved" || selectedIncident.status === "closed" ? "success" : 
                          selectedIncident.status === "in_progress" ? "info" : 
                          "warning"
                        }
                        size="small" 
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Người phụ trách:</Typography>
                      <Typography variant="body1">{selectedIncident.assignedTo || "Chưa phân công"}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Thời gian báo cáo:</Typography>
                      <Typography variant="body2">
                        {selectedIncident.reportedAt.toLocaleDateString("vi-VN")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedIncident.reportedAt.toLocaleTimeString("vi-VN")}
                      </Typography>
                    </Grid>
                    {selectedIncident.updatedAt && selectedIncident.updatedAt.getTime() !== selectedIncident.reportedAt.getTime() && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Cập nhật lần cuối:</Typography>
                        <Typography variant="body2">
                          {selectedIncident.updatedAt.toLocaleDateString("vi-VN")}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {selectedIncident.updatedAt.toLocaleTimeString("vi-VN")}
                        </Typography>
                      </Grid>
                    )}
                    {selectedIncident.resolvedAt && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Giải quyết lúc:</Typography>
                        <Typography variant="body2" color="success.main" fontWeight={600}>
                          {selectedIncident.resolvedAt.toLocaleDateString("vi-VN")}
                        </Typography>
                        <Typography variant="caption" color="success.main">
                          {selectedIncident.resolvedAt.toLocaleTimeString("vi-VN")}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>

              {/* Phản hồi của Admin */}
              {selectedIncident.adminResponse ? (
                <Card variant="outlined" sx={{ bgcolor: "success.50", borderColor: 'success.main' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle /> Phản hồi từ Admin
                    </Typography>
                    <Divider sx={{ mb: 2, borderColor: 'success.main' }} />
                    <Alert severity="success" variant="outlined" sx={{ mb: 2 }}>
                      <Typography variant="body1" fontWeight={500}>{selectedIncident.adminResponse}</Typography>
                    </Alert>
                    {selectedIncident.assignedTo && (
                      <Typography variant="caption" color="text.secondary">
                        Được xử lý bởi: <strong>{selectedIncident.assignedTo}</strong>
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card variant="outlined" sx={{ bgcolor: "warning.50", borderColor: 'warning.main' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <HourglassEmpty /> Chờ phản hồi
                    </Typography>
                    <Divider sx={{ mb: 2, borderColor: 'warning.main' }} />
                    <Alert severity="warning" variant="outlined">
                      <Typography variant="body1">Sự cố đang được xử lý, vui lòng chờ phản hồi từ quản trị viên.</Typography>
                    </Alert>
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

export default Monitoring;
