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
  const [detailDialog, setDetailDialog] = useState(false); // Dialog xem chi tiết hóa đơn
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

  const loadSessions = async () => {
    try {
      console.log("🔄 Loading charging sessions from API...");
      
      // Fetch all bookings (active + completed)
      const bookingsData = await staffAPI.getBookingsHistory();
      console.log("✅ Bookings data:", bookingsData);
      
      // Transform bookings to sessions format
      const sessionsData = (bookingsData || []).map(booking => {
        const isActive = booking.status === 'charging' || booking.status === 'in_progress';
        const isCompleted = booking.status === 'completed';
        
        // Calculate energy and cost from invoice if available
        const energyConsumed = booking.invoice?.totalEnergyKwh || booking.totalEnergyKwh || 0;
        const estimatedCost = booking.invoice?.totalAmount || booking.totalAmount || 
                             (energyConsumed * 3500); // 3500 VND/kWh default
        
        return {
          id: booking.bookingId || booking.id,
          bookingCode: booking.bookingCode,
          connectorId: `SLOT-${booking.slotId}`,
          stationId: booking.stationId,
          startTime: new Date(booking.actualStartTime || booking.scheduledStartTime),
          endTime: booking.actualEndTime ? new Date(booking.actualEndTime) : null,
          energyConsumed: energyConsumed,
          currentPower: isActive ? 22 : 0, // Default 22kW for active sessions
          estimatedCost: estimatedCost,
          vehicleSOC: booking.targetSoc || booking.finalSoc || 80,
          status: isActive ? "Active" : isCompleted ? "Completed" : "Pending",
          paymentStatus: booking.invoice?.paymentStatus === 'paid' ? "Paid" : "Pending",
          paymentMethod: booking.invoice?.paymentMethod || null,
          paymentTime: booking.invoice?.paidAt ? new Date(booking.invoice.paidAt) : null,
          invoice: booking.invoice,
        };
      });
      
      setSessions(sessionsData);
      console.log("✅ Loaded sessions:", sessionsData.length);
      
    } catch (error) {
      console.error("❌ Error loading sessions:", error);
      setSnackbar({ 
        open: true, 
        message: "Không thể tải dữ liệu phiên sạc. Vui lòng thử lại.", 
        severity: "error" 
      });
      setSessions([]);
    }
  };

  const handleStartSession = async () => {
    try {
      if (!startForm.connectorId) {
        setSnackbar({ open: true, message: "Vui lòng chọn connector", severity: "error" });
        return;
      }
      
      console.log("📤 Starting charging session:", startForm);
      
      // Extract booking ID from connector/session selection
      // In real scenario, staff would scan QR or select from pending bookings
      // For now, we assume connector ID format is SLOT-{slotId} or we need booking ID
      // TODO: Add booking selection UI for staff
      
      setSnackbar({
        open: true,
        message: `Đã khởi động phiên sạc tại ${startForm.connectorId}`,
        severity: "success",
      });
      setStartDialog(false);
      loadSessions();
    } catch (error) {
      console.error("❌ Error starting session:", error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || "Lỗi khởi động phiên sạc", 
        severity: "error" 
      });
    }
  };

  const handleStopSession = async () => {
    try {
      if (!selectedSession?.id) {
        setSnackbar({ open: true, message: "Không có phiên được chọn", severity: "error" });
        return;
      }
      
      console.log("📤 Stopping charging session:", selectedSession.id);
      
      // Call API to complete charging
      const sessionData = {
        finalSoc: selectedSession.vehicleSOC || 80,
        totalEnergyKwh: selectedSession.energyConsumed || 0,
        unitPrice: 3500,
      };
      
      await staffAPI.completeCharging(selectedSession.id, sessionData);
      console.log("✅ Session stopped successfully");
      
      setSnackbar({
        open: true,
        message: `Đã dừng phiên sạc ${selectedSession.bookingCode || selectedSession.id}`,
        severity: "success",
      });
      
      setStopDialog(false);
      loadSessions(); // Reload to get updated data
      
    } catch (error) {
      console.error("❌ Error stopping session:", error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || "Lỗi dừng phiên sạc", 
        severity: "error" 
      });
    }
  };

  const handleConfirmPayment = async () => {
    try {
      if (!selectedSession?.id) {
        setSnackbar({ open: true, message: "Không có phiên được chọn", severity: "error" });
        return;
      }
      
      const paymentMethodMap = {
        cash: "cash",
        transfer: "bank_transfer",
        card: "card"
      };
      const paymentMethodValue = paymentMethodMap[paymentMethod] || "cash";
      
      console.log("📤 Processing payment:", {
        bookingId: selectedSession.id,
        method: paymentMethodValue
      });
      
      // Call API to process payment
      await staffAPI.processPayment(selectedSession.id, {
        method: paymentMethodValue,
      });
      
      console.log("✅ Payment processed successfully");
      
      const paymentMethodText = {
        cash: "Tiền mặt",
        transfer: "Chuyển khoản",
        card: "Quẹt thẻ (POS tại quầy)"
      }[paymentMethod] || "Tiền mặt";
      
      setSnackbar({
        open: true,
        message: `Đã xác nhận thanh toán ${paymentMethodText} cho phiên ${selectedSession.bookingCode || selectedSession.id}`,
        severity: "success",
      });
      setPaymentDialog(false);
      
      loadSessions(); // Reload to get updated data
      
    } catch (error) {
      console.error("❌ Error processing payment:", error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || "Lỗi ghi nhận thanh toán", 
        severity: "error" 
      });
    }
  };

  const handlePrintReceipt = () => {
    // TODO: Implement print receipt
    if (!selectedSession) {
      setSnackbar({ open: true, message: "Vui lòng chọn phiên sạc", severity: "warning" });
      return;
    }
    
    // Tạo nội dung hóa đơn
    const receiptContent = generateReceiptContent(selectedSession);
    
    // Mở cửa sổ in
    const printWindow = window.open('', '_blank');
    printWindow.document.write(receiptContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
    
    setSnackbar({ 
      open: true, 
      message: `Đang xuất hóa đơn cho phiên ${selectedSession.id}`, 
      severity: "success" 
    });
  };

  const generateReceiptContent = (session) => {
    const now = new Date().toLocaleString("vi-VN");
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Hóa đơn phiên sạc - ${session.id}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            max-width: 400px; 
            margin: 0 auto;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 10px; 
            margin-bottom: 20px; 
          }
          .header h1 { margin: 5px 0; font-size: 20px; }
          .header p { margin: 3px 0; font-size: 12px; }
          .section { margin: 15px 0; }
          .row { 
            display: flex; 
            justify-content: space-between; 
            padding: 5px 0; 
            border-bottom: 1px dashed #ccc; 
          }
          .row.total { 
            font-weight: bold; 
            font-size: 16px; 
            border-top: 2px solid #000; 
            border-bottom: 2px solid #000; 
            margin-top: 10px; 
          }
          .label { font-weight: normal; }
          .value { font-weight: bold; }
          .footer { 
            text-align: center; 
            margin-top: 20px; 
            padding-top: 10px; 
            border-top: 1px solid #000; 
            font-size: 11px; 
          }
          @media print {
            body { padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>⚡ SkaEV CHARGING STATION</h1>
          <p>Trạm sạc FPT Complex</p>
          <p>Địa chỉ: Lô E2a-7, Đường D1, P. Long Thạnh Mỹ, TP. Thủ Đức, TP.HCM</p>
          <p>Hotline: 1900 xxxx</p>
        </div>

        <div class="section">
          <h3 style="text-align: center; margin: 10px 0;">HÓA ĐƠN DỊCH VỤ SẠC XE ĐIỆN</h3>
          <div class="row">
            <span class="label">Mã phiên:</span>
            <span class="value">${session.id}</span>
          </div>
          <div class="row">
            <span class="label">Điểm sạc:</span>
            <span class="value">${session.connectorId}</span>
          </div>
          <div class="row">
            <span class="label">Thời gian bắt đầu:</span>
            <span class="value">${session.startTime.toLocaleString("vi-VN")}</span>
          </div>
          <div class="row">
            <span class="label">Thời gian kết thúc:</span>
            <span class="value">${session.endTime ? session.endTime.toLocaleString("vi-VN") : "Đang sạc"}</span>
          </div>
          <div class="row">
            <span class="label">Thời lượng sạc:</span>
            <span class="value">${formatDuration(session.startTime, session.endTime)}</span>
          </div>
        </div>

        <div class="section">
          <h4 style="margin: 10px 0;">Chi tiết năng lượng:</h4>
          <div class="row">
            <span class="label">Năng lượng tiêu thụ:</span>
            <span class="value">${session.energyConsumed.toFixed(2)} kWh</span>
          </div>
          <div class="row">
            <span class="label">Đơn giá:</span>
            <span class="value">5,000 ₫/kWh</span>
          </div>
          ${session.vehicleSOC ? `
          <div class="row">
            <span class="label">Mức pin xe:</span>
            <span class="value">${session.vehicleSOC}%</span>
          </div>
          ` : ''}
        </div>

        <div class="section">
          <h4 style="margin: 10px 0;">Thanh toán:</h4>
          <div class="row">
            <span class="label">Phương thức:</span>
            <span class="value">${session.paymentMethod || "Chưa thanh toán"}</span>
          </div>
          ${session.paymentTime ? `
          <div class="row">
            <span class="label">Thời gian thanh toán:</span>
            <span class="value">${session.paymentTime.toLocaleString("vi-VN")}</span>
          </div>
          ` : ''}
          <div class="row total">
            <span class="label">TỔNG TIỀN:</span>
            <span class="value">${session.estimatedCost.toLocaleString()} ₫</span>
          </div>
        </div>

        <div class="footer">
          <p>Cảm ơn quý khách đã sử dụng dịch vụ!</p>
          <p>Hóa đơn in lúc: ${now}</p>
          <p style="margin-top: 10px;">━━━━━━━━━━━━━━━━━━━━━━━━</p>
          <p><strong>Vui lòng giữ lại hóa đơn để đối chiếu</strong></p>
        </div>
      </body>
      </html>
    `;
  };

  const formatDuration = (startTime, endTime) => {
    const duration = (endTime || new Date()).getTime() - startTime.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <Box>
      {/* Header - RÚT GỌN TIÊU ĐỀ */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Quản lý Phiên sạc (Trực tiếp)
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Khởi động, dừng phiên sạc và ghi nhận thanh toán tại chỗ qua đài
          </Typography>
        </Box>
        <Button startIcon={<ArrowBack />} onClick={() => navigate("/staff/dashboard")}>
          Quay lại
        </Button>
      </Box>

      {/* Sessions Table - SẮP XẾP LẠI THỨ TỰ CỘT */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Mã phiên</TableCell>
                  <TableCell>Điểm sạc</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Thời gian Bắt đầu</TableCell>
                  <TableCell>Thời gian Đã sạc</TableCell>
                  <TableCell align="right">Năng lượng (kWh)</TableCell>
                  <TableCell align="right">Phí (₫)</TableCell>
                  <TableCell align="center">TT Status</TableCell>
                  <TableCell align="center">Phương thức TT</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id} hover>
                    <TableCell>{session.id}</TableCell>
                    <TableCell>{session.connectorId}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={session.status === "Active" ? "Đang sạc" : "Hoàn thành"}
                        color={session.status === "Active" ? "primary" : "success"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {session.startTime.toLocaleString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {formatDuration(session.startTime, session.endTime)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{session.energyConsumed.toFixed(2)}</TableCell>
                    <TableCell align="right">{session.estimatedCost.toLocaleString()}</TableCell>
                    
                    {/* CỘT TRẠNG THÁI THANH TOÁN */}
                    <TableCell align="center">
                      <Chip
                        label={session.paymentStatus === "Paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                        color={session.paymentStatus === "Paid" ? "success" : "warning"}
                        size="small"
                      />
                    </TableCell>

                    {/* CỘT PHƯƠNG THỨC THANH TOÁN - PHÂN BIỆT RÕ */}
                    <TableCell align="center">
                      {session.paymentMethod ? (
                        <Chip
                          label={session.paymentMethod}
                          color={
                            session.paymentMethod === "QR Code" || session.paymentMethod === "Ví điện tử"
                              ? "info"
                              : session.paymentMethod === "Thẻ ngân hàng"
                              ? "primary"
                              : "default"
                          }
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>

                    {/* CỘT THAO TÁC - Logic rõ ràng */}
                    <TableCell align="center">
                      {/* CASE 1: Phiên đang sạc - Nút Dừng Sạc */}
                      {session.status === "Active" && (
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          startIcon={<Stop />}
                          onClick={() => {
                            setSelectedSession(session);
                            setStopDialog(true);
                          }}
                        >
                          Dừng Sạc
                        </Button>
                      )}
                      
                      {/* CASE 2: Phiên hoàn thành NHƯNG chưa thanh toán - Staff phải xác nhận TT tại chỗ */}
                      {session.status === "Completed" && session.paymentStatus === "Pending" && (
                        <Button
                          variant="contained"
                          color="warning"
                          size="small"
                          startIcon={<Payment />}
                          onClick={() => {
                            setSelectedSession(session);
                            setPaymentDialog(true);
                          }}
                        >
                          Xác nhận TT tại chỗ
                        </Button>
                      )}
                      
                      {/* CASE 3: Đã thanh toán (Customer tự TT hoặc Staff đã xác nhận) - Chỉ xem chi tiết */}
                      {session.paymentStatus === "Paid" && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Print />}
                          onClick={() => {
                            setSelectedSession(session);
                            setDetailDialog(true);
                          }}
                        >
                          Xem chi tiết
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

      {/* Payment Dialog - CHỈ DÀNH CHO THANH TOÁN TẠI QUẦY */}
      <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Xác nhận Thanh toán tại chỗ</DialogTitle>
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

              {/* Giải thích ngắn gọn */}
              <Alert severity="info" sx={{ mb: 2 }}>
                Khách hàng thanh toán <strong>trực tiếp tại quầy</strong>. Chọn phương thức và xác nhận.
              </Alert>

              {/* Payment Methods - TIỀN MẶT, CHUYỂN KHOẢN, QUẸT THẺ */}
              <FormControl component="fieldset" fullWidth>
                <FormLabel sx={{ mb: 1 }}>Phương thức khách thanh toán:</FormLabel>
                <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <FormControlLabel
                    value="cash"
                    control={<Radio />}
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Money color="success" /> <strong>Tiền mặt</strong>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="transfer"
                    control={<Radio />}
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <AccountBalance color="primary" /> <strong>Chuyển khoản ngân hàng</strong>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="card"
                    control={<Radio />}
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <CreditCard color="info" /> <strong>Quẹt thẻ (POS tại quầy)</strong>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>

              <Alert severity="warning" sx={{ mt: 2 }}>
                <strong>Lưu ý:</strong> Nếu khách đã thanh toán bằng <strong>QR Code/Thẻ (POS tự động)/Ví điện tử</strong> 
                trên trạm, hệ thống sẽ tự động ghi nhận và KHÔNG hiển thị nút "Xác nhận TT tại chỗ".
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>Hủy</Button>
          <Button startIcon={<Print />} onClick={handlePrintReceipt}>
            In hóa đơn
          </Button>
          <Button variant="contained" color="success" startIcon={<Payment />} onClick={handleConfirmPayment}>
            Xác nhận đã thanh toán
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog - THỐNG KÊ HÓA ĐƠN CHI TIẾT */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h5" fontWeight="bold">
              📄 Chi tiết Hóa đơn
            </Typography>
            <Chip 
              label={selectedSession?.paymentStatus === "Paid" ? "Đã thanh toán" : "Chưa thanh toán"}
              color={selectedSession?.paymentStatus === "Paid" ? "success" : "warning"}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedSession && (
            <Box sx={{ pt: 2 }}>
              {/* Thông tin chính */}
              <Card sx={{ mb: 3, bgcolor: "grey.50" }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                    ⚡ Thông tin Phiên sạc
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Mã phiên sạc:</Typography>
                      <Typography variant="h6" fontWeight={700}>{selectedSession.id}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Điểm sạc:</Typography>
                      <Typography variant="h6" fontWeight={700}>{selectedSession.connectorId}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Trạng thái:</Typography>
                      <Chip 
                        label={selectedSession.status === "Active" ? "Đang sạc" : "Hoàn thành"}
                        color={selectedSession.status === "Active" ? "primary" : "success"}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Mức pin xe:</Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedSession.vehicleSOC ? `${selectedSession.vehicleSOC}%` : "N/A"}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Thống kê thời gian */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                    🕐 Thống kê Thời gian
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Box sx={{ p: 2, bgcolor: "info.50", borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">Thời gian bắt đầu:</Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {selectedSession.startTime.toLocaleString("vi-VN", {
                            weekday: "long",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit"
                          })}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ p: 2, bgcolor: "success.50", borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">Thời gian kết thúc:</Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {selectedSession.endTime 
                            ? selectedSession.endTime.toLocaleString("vi-VN", {
                                weekday: "long",
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit"
                              })
                            : "Đang sạc..."}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ p: 2, bgcolor: "warning.50", borderRadius: 1, textAlign: "center" }}>
                        <Typography variant="caption" color="text.secondary">Tổng thời lượng sạc:</Typography>
                        <Typography variant="h5" fontWeight={700} color="warning.dark">
                          {formatDuration(selectedSession.startTime, selectedSession.endTime)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Thống kê năng lượng */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                    ⚡ Thống kê Năng lượng
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ p: 2, bgcolor: "primary.50", borderRadius: 1, textAlign: "center" }}>
                        <Typography variant="caption" color="text.secondary">Năng lượng tiêu thụ:</Typography>
                        <Typography variant="h4" fontWeight={700} color="primary.main">
                          {selectedSession.energyConsumed.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">kWh</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ p: 2, bgcolor: "secondary.50", borderRadius: 1, textAlign: "center" }}>
                        <Typography variant="caption" color="text.secondary">Công suất hiện tại:</Typography>
                        <Typography variant="h4" fontWeight={700} color="secondary.main">
                          {selectedSession.currentPower || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">kW</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">Đơn giá điện:</Typography>
                        <Typography variant="h6" fontWeight={600}>
                          5,000 ₫/kWh
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Thống kê thanh toán */}
              <Card sx={{ mb: 2, bgcolor: "success.50", border: "2px solid", borderColor: "success.main" }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom color="success.dark">
                    💰 Thống kê Thanh toán
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" color="text.secondary">Phương thức thanh toán:</Typography>
                      <Box mt={1}>
                        <Chip 
                          label={selectedSession.paymentMethod || "Chưa thanh toán"}
                          color={
                            selectedSession.paymentMethod?.includes("QR") || selectedSession.paymentMethod?.includes("Ví")
                              ? "info"
                              : selectedSession.paymentMethod?.includes("Thẻ")
                              ? "primary"
                              : "default"
                          }
                          size="medium"
                        />
                      </Box>
                    </Grid>
                    {selectedSession.paymentTime && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="caption" color="text.secondary">Thời gian thanh toán:</Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {selectedSession.paymentTime.toLocaleString("vi-VN")}
                        </Typography>
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ p: 2, bgcolor: "white", borderRadius: 1 }}>
                        <Typography variant="h6" fontWeight={700}>TỔNG TIỀN THANH TOÁN:</Typography>
                        <Typography variant="h4" fontWeight={900} color="success.dark">
                          {selectedSession.estimatedCost.toLocaleString()} ₫
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: "grey.50" }}>
          <Button 
            onClick={() => setDetailDialog(false)} 
            variant="outlined"
          >
            Đóng
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<Print />} 
            onClick={() => {
              handlePrintReceipt();
              setDetailDialog(false);
            }}
            size="large"
          >
            Xuất hóa đơn
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
