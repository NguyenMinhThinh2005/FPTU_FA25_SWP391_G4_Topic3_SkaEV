/* eslint-disable */
import React, { useState, useEffect } from "react";
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
  LinearProgress,
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
  ];

  useEffect(() => {
    loadMonitoringData();
    // Handle navigation state
    if (location.state?.action === "report" && location.state?.connectorId) {
      setReportForm({ ...reportForm, connectorId: location.state.connectorId });
      setReportDialog(true);
    }
  }, [location.state]);

  const loadMonitoringData = async () => {
    try {
      console.log("🔄 Loading monitoring data from API...");
      
      // Fetch stations with slots (connectors)
      const stationsData = await staffAPI.getStationsStatus();
      console.log("✅ Stations data:", stationsData);
      
      // Transform stations to connectors format
      const connectorsData = [];
      if (stationsData && Array.isArray(stationsData)) {
        stationsData.forEach(station => {
          // Get slots from charging structure
          if (station.charging?.poles) {
            station.charging.poles.forEach((pole, poleIndex) => {
              if (pole.ports) {
                pole.ports.forEach((port, portIndex) => {
                  connectorsData.push({
                    id: `${station.id}-P${poleIndex + 1}-${portIndex + 1}`,
                    stationId: station.id,
                    stationName: station.name,
                    type: pole.connectorType || "AC",
                    maxPower: pole.maxPower || 22,
                    status: port.status === "available" ? "online" : "offline",
                    operationalStatus: port.status === "available" ? "Available" : 
                                     port.status === "charging" ? "Charging" : "Faulted",
                    voltage: port.status === "available" ? 230 : 0,
                    current: port.status === "charging" ? 32 : 0,
                    temperature: port.status === "available" ? 28 : 0,
                  });
                });
              }
            });
          }
        });
      }
      
      // Fetch issues/incidents
      const issuesData = await staffAPI.getAllIssues();
      console.log("✅ Issues data:", issuesData);
      
      // Transform issues to incidents format
      const incidentsData = (issuesData || []).map(issue => ({
        id: issue.issueId || issue.id,
        connectorId: issue.stationId ? `${issue.stationId}-connector` : "Unknown",
        type: issue.category || "other",
        typeLabel: issue.title || issue.category,
        priority: issue.priority || "medium",
        description: issue.description,
        status: issue.status === "resolved" ? "completed" : 
                issue.status === "in_progress" ? "in_progress" : "pending",
        statusLabel: issue.status === "resolved" ? "Hoàn thành" :
                    issue.status === "in_progress" ? "Đang xử lý" : "Chờ xử lý",
        reportedAt: new Date(issue.reportedAt || issue.createdAt),
        adminResponse: issue.resolution,
      }));
      
      setConnectors(connectorsData);
      setIncidents(incidentsData);
      
    } catch (error) {
      console.error("❌ Error loading monitoring data:", error);
      setSnackbar({ 
        open: true, 
        message: "Không thể tải dữ liệu. Sử dụng dữ liệu mẫu.", 
        severity: "warning" 
      });
      
      // Fallback to empty data
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
      console.log("📤 Submitting issue report:", reportForm);
      
      // Extract station ID from connector ID (format: "stationId-P1-1")
      const stationId = parseInt(reportForm.connectorId.split('-')[0]) || 1;
      
      // Create issue via API
      const issueData = {
        stationId: stationId,
        title: incidentTypes.find(t => t.value === reportForm.incidentType)?.label || "Sự cố",
        description: reportForm.description,
        priority: reportForm.priority,
        category: reportForm.incidentType,
      };
      
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
      case "Available":
        return <CheckCircle color="success" />;
      case "Charging":
        return <Build color="primary" />;
      case "Faulted":
        return <Error color="error" />;
      case "Unavailable":
        return <PowerOff color="disabled" />;
      default:
        return <Warning color="warning" />;
    }
  };

  const onlineConnectors = connectors.filter((c) => c.status === "online").length;
  const offlineConnectors = connectors.filter((c) => c.status === "offline").length;
  const availableConnectors = connectors.filter((c) => c.operationalStatus === "Available").length;
  const chargingConnectors = connectors.filter((c) => c.operationalStatus === "Charging").length;
  const faultedConnectors = connectors.filter((c) => c.operationalStatus === "Faulted").length;

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
                {onlineConnectors}
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
                {offlineConnectors}
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
                {availableConnectors}
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
                {chargingConnectors}
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
                {faultedConnectors}
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
                  <TableCell>Loại</TableCell>
                  <TableCell>Công suất</TableCell>
                  <TableCell align="center">Trạng thái Kỹ thuật</TableCell>
                  <TableCell align="center">Trạng thái Hoạt động</TableCell>
                  <TableCell align="right">Điện áp (V)</TableCell>
                  <TableCell align="right">Dòng điện (A)</TableCell>
                  <TableCell align="right">Nhiệt độ (°C)</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {connectors.map((connector) => (
                  <TableRow key={connector.id} hover>
                    <TableCell fontWeight={600}>{connector.id}</TableCell>
                    <TableCell>{connector.type}</TableCell>
                    <TableCell>{connector.maxPower} kW</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={connector.status === "online" ? "Online" : "Offline"}
                        color={getStatusColor(connector.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={getStatusIcon(connector.operationalStatus)}
                        label={connector.operationalStatus}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">{connector.voltage}</TableCell>
                    <TableCell align="right">{connector.current}</TableCell>
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                        {connector.temperature}
                        {connector.temperature > 40 && (
                          <Warning fontSize="small" color="warning" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      {connector.status === "offline" && (
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
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Mã sự cố</TableCell>
                  <TableCell>Điểm sạc</TableCell>
                  <TableCell>Loại sự cố</TableCell>
                  <TableCell>Mô tả</TableCell>
                  <TableCell align="center">Ưu tiên</TableCell>
                  <TableCell align="center">Trạng thái</TableCell>
                  <TableCell>Phản hồi</TableCell>
                  <TableCell>Thời gian</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {incidents.map((incident) => (
                  <TableRow key={incident.id} hover>
                    <TableCell fontWeight={600}>{incident.id}</TableCell>
                    <TableCell>{incident.connectorId}</TableCell>
                    <TableCell>{incident.typeLabel}</TableCell>
                    <TableCell>{incident.description}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={priorityLevels.find((p) => p.value === incident.priority)?.label}
                        color={priorityLevels.find((p) => p.value === incident.priority)?.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={incident.statusLabel} 
                        color={incident.status === "completed" ? "success" : "warning"}
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      {incident.adminResponse ? (
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
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
                    <TableCell>{incident.reportedAt.toLocaleString("vi-VN")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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
                        {c.id} - {c.type} {c.maxPower}kW
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
            <Box>
              {/* Thông tin báo cáo */}
              <Card sx={{ mb: 2, bgcolor: "grey.50" }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                    Thông tin Báo cáo
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Mã sự cố:</Typography>
                      <Typography variant="body1" fontWeight={600}>{selectedIncident.id}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Điểm sạc:</Typography>
                      <Typography variant="body1" fontWeight={600}>{selectedIncident.connectorId}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Loại sự cố:</Typography>
                      <Typography variant="body1">{selectedIncident.typeLabel}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Mức độ ưu tiên:</Typography>
                      <Chip
                        label={priorityLevels.find((p) => p.value === selectedIncident.priority)?.label}
                        color={priorityLevels.find((p) => p.value === selectedIncident.priority)?.color}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Mô tả:</Typography>
                      <Typography variant="body1">{selectedIncident.description}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Trạng thái:</Typography>
                      <Chip 
                        label={selectedIncident.statusLabel} 
                        color={selectedIncident.status === "completed" ? "success" : "warning"}
                        size="small" 
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Thời gian báo cáo:</Typography>
                      <Typography variant="body1">
                        {selectedIncident.reportedAt.toLocaleString("vi-VN")}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Phản hồi của Admin */}
              {selectedIncident.adminResponse && (
                <Card sx={{ bgcolor: "success.50" }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom color="success.main">
                      Phản hồi từ Admin
                    </Typography>
                    <Alert severity="success" sx={{ mt: 1 }}>
                      <Typography variant="body1">{selectedIncident.adminResponse}</Typography>
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
