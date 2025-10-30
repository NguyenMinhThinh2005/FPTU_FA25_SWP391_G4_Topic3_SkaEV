/* eslint-disable */
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Divider,
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
} from "@mui/material";
import {
  PlayArrow,
  Stop,
  Payment,
  Print,
  ArrowBack,
  QrCode,
  CreditCard,
  AccountBalance,
  Money,
} from "@mui/icons-material";

const ChargingSessions = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [startDialog, setStartDialog] = useState(false);
  const [stopDialog, setStopDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Form states
  const [startForm, setStartForm] = useState({
    connectorId: "",
    authMethod: "rfid",
    authCode: "",
  });

  useEffect(() => {
    loadSessions();
    // Handle navigation state
    if (location.state) {
      const { action, connectorId, sessionId } = location.state;
      if (action === "start") {
        setStartForm({ ...startForm, connectorId });
        setStartDialog(true);
      } else if (action === "stop" && sessionId) {
        const session = sessions.find((s) => s.id === sessionId);
        setSelectedSession(session);
        setStopDialog(true);
      } else if (action === "payment" && sessionId) {
        const session = sessions.find((s) => s.id === sessionId);
        setSelectedSession(session);
        setPaymentDialog(true);
      }
    }
  }, [location.state]);

  const loadSessions = () => {
    // Mock data
    const mockSessions = [
      {
        id: "SES-001",
        connectorId: "CON-02",
        startTime: new Date(Date.now() - 45 * 60 * 1000),
        endTime: null,
        energyConsumed: 15.5,
        currentPower: 22,
        estimatedCost: 77500,
        vehicleSOC: 65,
        status: "Active",
        paymentStatus: "Pending",
      },
      {
        id: "SES-002",
        connectorId: "CON-01",
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 30 * 60 * 1000),
        energyConsumed: 28.3,
        currentPower: 0,
        estimatedCost: 141500,
        vehicleSOC: 100,
        status: "Completed",
        paymentStatus: "Pending",
      },
    ];
    setSessions(mockSessions);
  };

  const handleStartSession = async () => {
    try {
      // TODO: API call to start charging
      setSnackbar({
        open: true,
        message: `Đã khởi động phiên sạc tại ${startForm.connectorId}`,
        severity: "success",
      });
      setStartDialog(false);
      loadSessions();
    } catch (error) {
      setSnackbar({ open: true, message: "Lỗi khởi động phiên sạc", severity: "error" });
    }
  };

  const handleStopSession = async () => {
    try {
      // TODO: API call to stop charging
      setSnackbar({
        open: true,
        message: `Đã dừng phiên sạc ${selectedSession?.id}`,
        severity: "success",
      });
      setStopDialog(false);
      setPaymentDialog(true);
      loadSessions();
    } catch (error) {
      setSnackbar({ open: true, message: "Lỗi dừng phiên sạc", severity: "error" });
    }
  };

  const handleConfirmPayment = async () => {
    try {
      // TODO: API call to record payment
      setSnackbar({
        open: true,
        message: `Đã xác nhận thanh toán ${paymentMethod.toUpperCase()} cho phiên ${selectedSession?.id}`,
        severity: "success",
      });
      setPaymentDialog(false);
      loadSessions();
    } catch (error) {
      setSnackbar({ open: true, message: "Lỗi ghi nhận thanh toán", severity: "error" });
    }
  };

  const handlePrintReceipt = () => {
    // TODO: Implement print receipt
    setSnackbar({ open: true, message: "Chức năng in hóa đơn đang phát triển", severity: "info" });
  };

  const formatDuration = (startTime, endTime) => {
    const duration = (endTime || new Date()).getTime() - startTime.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Quản lý Phiên sạc & Thanh toán
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Khởi động, dừng phiên sạc và ghi nhận thanh toán tại chỗ
          </Typography>
        </Box>
        <Button startIcon={<ArrowBack />} onClick={() => navigate("/staff/dashboard")}>
          Quay lại
        </Button>
      </Box>

      {/* Sessions Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Mã phiên</TableCell>
                  <TableCell>Điểm sạc</TableCell>
                  <TableCell>Thời gian</TableCell>
                  <TableCell align="right">Năng lượng (kWh)</TableCell>
                  <TableCell align="right">Phí (₫)</TableCell>
                  <TableCell align="center">Trạng thái</TableCell>
                  <TableCell align="center">Thanh toán</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id} hover>
                    <TableCell>{session.id}</TableCell>
                    <TableCell>{session.connectorId}</TableCell>
                    <TableCell>
                      {session.startTime.toLocaleTimeString("vi-VN")}
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        {formatDuration(session.startTime, session.endTime)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{session.energyConsumed.toFixed(2)}</TableCell>
                    <TableCell align="right">{session.estimatedCost.toLocaleString()}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={session.status === "Active" ? "Đang sạc" : "Hoàn thành"}
                        color={session.status === "Active" ? "primary" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={session.paymentStatus === "Paid" ? "Đã TT" : "Chưa TT"}
                        color={session.paymentStatus === "Paid" ? "success" : "warning"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {session.status === "Active" && (
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => {
                            setSelectedSession(session);
                            setStopDialog(true);
                          }}
                        >
                          <Stop />
                        </IconButton>
                      )}
                      {session.status === "Completed" && session.paymentStatus === "Pending" && (
                        <IconButton
                          color="success"
                          size="small"
                          onClick={() => {
                            setSelectedSession(session);
                            setPaymentDialog(true);
                          }}
                        >
                          <Payment />
                        </IconButton>
                      )}
                      {session.paymentStatus === "Paid" && (
                        <IconButton size="small" onClick={handlePrintReceipt}>
                          <Print />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Start Session Dialog */}
      <Dialog open={startDialog} onClose={() => setStartDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Khởi động Phiên sạc</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Điểm sạc"
              value={startForm.connectorId}
              disabled
              sx={{ mb: 2 }}
            />
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel>Phương thức xác thực</FormLabel>
              <RadioGroup
                value={startForm.authMethod}
                onChange={(e) => setStartForm({ ...startForm, authMethod: e.target.value })}
              >
                <FormControlLabel value="rfid" control={<Radio />} label="Thẻ RFID" />
                <FormControlLabel value="qr" control={<Radio />} label="Mã QR" />
                <FormControlLabel
                  value="manual"
                  control={<Radio />}
                  label="Khởi động thủ công"
                />
              </RadioGroup>
            </FormControl>
            {startForm.authMethod !== "manual" && (
              <TextField
                fullWidth
                label={startForm.authMethod === "rfid" ? "Mã thẻ RFID" : "Mã QR"}
                value={startForm.authCode}
                onChange={(e) => setStartForm({ ...startForm, authCode: e.target.value })}
                placeholder="Quét hoặc nhập mã"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStartDialog(false)}>Hủy</Button>
          <Button variant="contained" startIcon={<PlayArrow />} onClick={handleStartSession}>
            Bắt đầu sạc
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stop Session Dialog */}
      <Dialog open={stopDialog} onClose={() => setStopDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Dừng Phiên sạc</DialogTitle>
        <DialogContent>
          {selectedSession && (
            <Box sx={{ pt: 2 }}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Bạn có chắc chắn muốn dừng phiên sạc này?
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Mã phiên:
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedSession.id}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Điểm sạc:
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedSession.connectorId}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Thời gian sạc:
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {formatDuration(selectedSession.startTime, null)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Năng lượng:
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedSession.energyConsumed} kWh
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStopDialog(false)}>Hủy</Button>
          <Button variant="contained" color="error" startIcon={<Stop />} onClick={handleStopSession}>
            Dừng sạc
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thanh toán Phiên sạc</DialogTitle>
        <DialogContent>
          {selectedSession && (
            <Box sx={{ pt: 2 }}>
              {/* Session Summary */}
              <Card sx={{ mb: 3, bgcolor: "primary.50" }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Mã phiên:
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedSession.id}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Thời gian:
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {formatDuration(selectedSession.startTime, selectedSession.endTime)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Năng lượng tiêu thụ:
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedSession.energyConsumed} kWh
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Tổng phí:
                      </Typography>
                      <Typography variant="h6" fontWeight={700} color="primary">
                        {selectedSession.estimatedCost.toLocaleString()} ₫
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Divider sx={{ mb: 2 }} />

              {/* Payment Methods */}
              <FormControl component="fieldset" fullWidth>
                <FormLabel>Phương thức thanh toán</FormLabel>
                <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <FormControlLabel
                    value="cash"
                    control={<Radio />}
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Money /> Tiền mặt
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="transfer"
                    control={<Radio />}
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <AccountBalance /> Chuyển khoản
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="card"
                    control={<Radio />}
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <CreditCard /> Thẻ/POS
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>Hủy</Button>
          <Button startIcon={<Print />} onClick={handlePrintReceipt}>
            In hóa đơn
          </Button>
          <Button variant="contained" color="success" startIcon={<Payment />} onClick={handleConfirmPayment}>
            Xác nhận thanh toán
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

export default ChargingSessions;
