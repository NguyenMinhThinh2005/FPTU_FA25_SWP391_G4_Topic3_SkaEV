/* eslint-disable */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import staffAPI from "../../services/api/staffAPI";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Snackbar,
  Alert as MuiAlert,
} from "@mui/material";
import { 
  Refresh, 
  ArrowBack, 
  Stop, 
  Payment,
  Info,
  Print,
  PlayArrow
} from "@mui/icons-material";

const ChargingSessionsSimple = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Dialog states
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false); // Thêm resume dialog
  const [selectedSession, setSelectedSession] = useState(null);
  
  // Payment form data
  const [paymentForm, setPaymentForm] = useState({
    finalSoc: '',
    totalEnergyKwh: '',
    paymentMethod: 'cash'
  });
  
  // Snackbar notification
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("🔄 Loading charging sessions from Dashboard API...");
      
      // Fetch dashboard data which includes all connectors
      const dashboardData = await staffAPI.getDashboardOverview();
      console.log("✅ Dashboard data received:", dashboardData);
      
      // Extract sessions from connectors
      const allSessions = [];
      
      if (dashboardData?.connectors && Array.isArray(dashboardData.connectors)) {
        dashboardData.connectors.forEach((connector) => {
          // Map connector data to session format
          const session = {
            // Basic connector info
            id: connector.slotId || connector.connectorCode,
            connectorCode: connector.connectorCode || 'N/A',
            connectorType: connector.connectorType || 'N/A',
            maxPower: connector.maxPower || 0,
            
            // Status from backend
            technicalStatus: connector.technicalStatus || 'unknown',
            operationalStatus: connector.operationalStatus || 'Available',
            
            // Technical readings
            voltage: connector.voltage,
            current: connector.current,
            temperature: connector.temperature,
            
            // Booking/Session info (null if no active session)
            activeSession: connector.activeSession,
          };
          
          // If has active session, add customer & vehicle info
          if (connector.activeSession) {
            const activeSession = connector.activeSession;
            session.bookingId = activeSession.bookingId;
            session.customerId = activeSession.customerId;
            session.customerName = activeSession.customerName || 'N/A';
            session.vehicleInfo = activeSession.vehicleInfo || 'N/A';
            session.startedAt = activeSession.startedAt;
            session.currentSoc = activeSession.currentSoc;
            session.power = activeSession.power;
            session.energyDelivered = activeSession.energyDelivered || 0;
            
            // Calculate charging duration
            if (activeSession.startedAt) {
              const startTime = new Date(activeSession.startedAt);
              const now = new Date();
              const durationMs = now - startTime;
              const hours = Math.floor(durationMs / (1000 * 60 * 60));
              const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
              session.duration = `${hours}h ${minutes}m`;
            }
          }
          
          allSessions.push(session);
        });
      }
      
      console.log("✅ Processed sessions:", allSessions);
      setSessions(allSessions);
      
    } catch (err) {
      console.error("❌ Error loading sessions:", err);
      setError(err.message || "Không thể tải dữ liệu phiên sạc");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (operationalStatus) => {
    switch (operationalStatus?.toLowerCase()) {
      case 'charging':
        return 'success';
      case 'available':
        return 'default';
      case 'faulted':
      case 'offline':
        return 'error';
      case 'unavailable':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (operationalStatus) => {
    switch (operationalStatus?.toLowerCase()) {
      case 'charging':
        return 'Đang sạc';
      case 'available':
        return 'Sẵn sàng';
      case 'faulted':
        return 'Lỗi';
      case 'offline':
        return 'Offline';
      case 'unavailable':
        return 'Không khả dụng';
      default:
        return operationalStatus || 'N/A';
    }
  };

  // Calculate pricing based on energy delivered (example rate: 3000 VND/kWh)
  const calculateCost = (energyKwh) => {
    const pricePerKwh = 3000; // VND
    return energyKwh ? energyKwh * pricePerKwh : 0;
  };

  // Handle emergency stop button
  const handleEmergencyStop = (session) => {
    setSelectedSession(session);
    setStopDialogOpen(true);
  };

  // Confirm emergency stop - Complete the charging session
  const confirmEmergencyStop = async () => {
    try {
      console.log("🛑 Emergency stopping session:", selectedSession.bookingId);
      
      // Call API to complete charging
      await staffAPI.completeCharging(selectedSession.bookingId, {
        finalSoc: selectedSession.currentSoc || 80,
        totalEnergyKwh: selectedSession.energyDelivered || 0,
        unitPrice: 3000
      });
      
      setStopDialogOpen(false);
      setSnackbar({
        open: true,
        message: `Đã dừng khẩn cấp phiên sạc #${selectedSession.bookingId}. Vui lòng thanh toán.`,
        severity: 'warning'
      });
      
      // Reload sessions and open payment dialog
      await loadSessions();
      
      // Auto-open payment dialog after stopping
      setTimeout(() => {
        setPaymentForm({
          finalSoc: selectedSession.currentSoc || 80,
          totalEnergyKwh: selectedSession.energyDelivered || 0,
          paymentMethod: 'cash'
        });
        setPaymentDialogOpen(true);
      }, 500);
      
    } catch (err) {
      console.error("❌ Error stopping session:", err);
      setSnackbar({
        open: true,
        message: err.message || "Không thể dừng phiên sạc",
        severity: 'error'
      });
    }
  };

  // Handle payment button
  const handlePayment = (session) => {
    setSelectedSession(session);
    setPaymentForm({
      finalSoc: session.currentSoc || 80,
      totalEnergyKwh: session.energyDelivered || 0,
      paymentMethod: 'cash'
    });
    setPaymentDialogOpen(true);
  };

  // Handle resume from maintenance
  const handleResumeFromMaintenance = (session) => {
    setSelectedSession(session);
    setResumeDialogOpen(true);
  };

  // Confirm resume from maintenance
  const confirmResumeFromMaintenance = async () => {
    try {
      console.log("🔄 Resuming slot from maintenance:", selectedSession.id);
      
      // Call API to update slot status to available
      await staffAPI.updateSlotStatus(selectedSession.id, 'available', 'Đã hoàn tất bảo trì');
      
      setResumeDialogOpen(false);
      setSnackbar({
        open: true,
        message: `✅ Connector ${selectedSession.connectorCode} đã hoạt động trở lại`,
        severity: 'success'
      });
      
      // Reload sessions to reflect changes
      await loadSessions();
      
    } catch (err) {
      console.error("❌ Error resuming from maintenance:", err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Không thể khôi phục hoạt động",
        severity: 'error'
      });
    }
  };

  // Process payment
  const processPayment = async () => {
    try {
      console.log("💰 Processing payment for booking:", selectedSession.bookingId);
      
      // Process payment
      await staffAPI.processPayment(selectedSession.bookingId, {
        method: paymentForm.paymentMethod,
        amount: calculateCost(paymentForm.totalEnergyKwh)
      });
      
      setPaymentDialogOpen(false);
      setSnackbar({
        open: true,
        message: `Thanh toán thành công cho phiên sạc #${selectedSession.bookingId}!`,
        severity: 'success'
      });
      
      // Reload sessions
      await loadSessions();
      
    } catch (err) {
      console.error("❌ Error processing payment:", err);
      setSnackbar({
        open: true,
        message: err.message || "Không thể xử lý thanh toán",
        severity: 'error'
      });
    }
  };

  // Handle view detail button
  const handleViewDetail = (session) => {
    setSelectedSession(session);
    setDetailDialogOpen(true);
  };

  // Format duration helper
  const formatDuration = (startTime, endTime) => {
    if (!startTime) return '-';
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = end.getTime() - start.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Print receipt function
  const handlePrintReceipt = () => {
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
      message: `Đã xuất hóa đơn cho phiên sạc #${selectedSession.bookingId}`, 
      severity: "success" 
    });
  };

  // Generate receipt HTML
  const generateReceiptContent = (session) => {
    const now = new Date().toLocaleString("vi-VN");
    const cost = calculateCost(session.energyDelivered || 0);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Hóa đơn phiên sạc - ${session.bookingId}</title>
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
            <span class="value">#${session.bookingId || session.id}</span>
          </div>
          <div class="row">
            <span class="label">Điểm sạc:</span>
            <span class="value">${session.connectorCode}</span>
          </div>
          <div class="row">
            <span class="label">Khách hàng:</span>
            <span class="value">${session.customerName || 'N/A'}</span>
          </div>
          <div class="row">
            <span class="label">Xe:</span>
            <span class="value">${session.vehicleInfo || 'N/A'}</span>
          </div>
          <div class="row">
            <span class="label">Thời gian bắt đầu:</span>
            <span class="value">${session.startedAt ? new Date(session.startedAt).toLocaleString("vi-VN") : 'N/A'}</span>
          </div>
          <div class="row">
            <span class="label">Thời lượng sạc:</span>
            <span class="value">${formatDuration(session.startedAt, null)}</span>
          </div>
        </div>

        <div class="section">
          <h4 style="margin: 10px 0;">Chi tiết năng lượng:</h4>
          <div class="row">
            <span class="label">Năng lượng tiêu thụ:</span>
            <span class="value">${(session.energyDelivered || 0).toFixed(2)} kWh</span>
          </div>
          <div class="row">
            <span class="label">Đơn giá:</span>
            <span class="value">3,000 ₫/kWh</span>
          </div>
          ${session.currentSoc ? `
          <div class="row">
            <span class="label">Mức pin xe:</span>
            <span class="value">${session.currentSoc}%</span>
          </div>
          ` : ''}
          <div class="row">
            <span class="label">Công suất:</span>
            <span class="value">${session.power || session.maxPower || 0} kW</span>
          </div>
        </div>

        <div class="section">
          <h4 style="margin: 10px 0;">Thanh toán:</h4>
          <div class="row">
            <span class="label">Phương thức:</span>
            <span class="value">${paymentForm.paymentMethod === 'cash' ? 'Tiền mặt' : 
                                 paymentForm.paymentMethod === 'card' ? 'Thẻ' : 
                                 paymentForm.paymentMethod === 'momo' ? 'MoMo' : 
                                 paymentForm.paymentMethod === 'vnpay' ? 'VNPay' : 'Chưa thanh toán'}</span>
          </div>
          <div class="row total">
            <span class="label">TỔNG TIỀN:</span>
            <span class="value">${cost.toLocaleString('vi-VN')} ₫</span>
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography ml={2}>Đang tải dữ liệu phiên sạc...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/staff/dashboard')}
          >
            Quay lại
          </Button>
          <Typography variant="h4">
            ⚡ Quản lý Phiên sạc (Trực tiếp)
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadSessions}
        >
          Làm mới
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" mb={3}>
        Khởi động, dừng phiên sạc và ghi nhận thanh toán tại chỗ qua đại diện
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <strong>Lỗi:</strong> {error}
        </Alert>
      )}

      {sessions.length === 0 ? (
        <Card>
          <CardContent>
            <Alert severity="info">
              Không có connector nào. Vui lòng kiểm tra lại phân công trạm sạc.
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Mã phiên</strong></TableCell>
                <TableCell><strong>Điểm sạc</strong></TableCell>
                <TableCell><strong>Trạng thái</strong></TableCell>
                <TableCell><strong>Thời gian Bắt đầu</strong></TableCell>
                <TableCell><strong>Thời gian Đã sạc</strong></TableCell>
                <TableCell><strong>Năng lượng (kWh)</strong></TableCell>
                <TableCell><strong>Phí (₫)</strong></TableCell>
                <TableCell><strong>TT Status</strong></TableCell>
                <TableCell><strong>Phương thức TT</strong></TableCell>
                <TableCell><strong>Thao tác</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((session) => {
                const isActive = session.activeSession !== null && session.activeSession !== undefined;
                const cost = isActive ? calculateCost(session.energyDelivered) : 0;
                
                return (
                  <TableRow key={session.id} sx={{ bgcolor: isActive ? 'action.hover' : 'inherit' }}>
                    <TableCell>
                      {isActive ? `#${session.bookingId}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {session.connectorCode}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {session.connectorType} ({session.maxPower}kW)
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(session.operationalStatus)}
                        color={getStatusColor(session.operationalStatus)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {isActive && session.startedAt 
                        ? new Date(session.startedAt).toLocaleString('vi-VN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {isActive ? session.duration || '-' : '-'}
                    </TableCell>
                    <TableCell>
                      {isActive && session.energyDelivered 
                        ? `${session.energyDelivered.toFixed(2)} kWh`
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {isActive && cost > 0
                        ? `${cost.toLocaleString('vi-VN')} ₫`
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {isActive ? (
                        <Chip label="Đang sử dụng" color="success" size="small" />
                      ) : (
                        <Chip label="Trống" color="default" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {isActive ? 'Thanh toán sau' : '-'}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        {/* Dừng sạc button - Only show when charging */}
                        {isActive && (
                          <Button 
                            size="small" 
                            variant="contained"
                            color="error"
                            startIcon={<Stop />}
                            onClick={() => handleEmergencyStop(session)}
                          >
                            Dừng sạc
                          </Button>
                        )}
                        
                        {/* Thanh toán button - Show when active or completed */}
                        {isActive && (
                          <Button 
                            size="small" 
                            variant="contained"
                            color="warning"
                            startIcon={<Payment />}
                            onClick={() => handlePayment(session)}
                          >
                            Xác nhận TT
                          </Button>
                        )}
                        
                        {/* Chi tiết button - Always show for active sessions */}
                        {isActive && (
                          <Button 
                            size="small" 
                            variant="outlined" 
                            startIcon={<Info />}
                            onClick={() => handleViewDetail(session)}
                          >
                            Xem chi tiết
                          </Button>
                        )}
                        
                        {/* Hoạt động lại button - Show for maintenance slots */}
                        {!isActive && session.operationalStatus?.toLowerCase() === 'maintenance' && (
                          <Button 
                            size="small" 
                            variant="contained"
                            color="success"
                            startIcon={<PlayArrow />}
                            onClick={() => handleResumeFromMaintenance(session)}
                          >
                            Hoạt động lại
                          </Button>
                        )}
                        
                        {/* Empty state for inactive connectors */}
                        {!isActive && session.operationalStatus?.toLowerCase() !== 'maintenance' && (
                          <Typography variant="caption" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box mt={3}>
        <Typography variant="caption" color="text.secondary">
          💡 Tip: Dữ liệu được load từ Dashboard API. Nếu không hiển thị, kiểm tra staff đã được assign vào station chưa.
        </Typography>
      </Box>

      {/* Emergency Stop Confirmation Dialog */}
      <Dialog open={stopDialogOpen} onClose={() => setStopDialogOpen(false)}>
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Stop />
            <Typography variant="h6">Xác nhận Dừng khẩn cấp</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>Cảnh báo:</strong> Hành động này sẽ dừng ngay phiên sạc và chuyển sang bước thanh toán.
          </Alert>
          
          {selectedSession && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Phiên sạc:</strong> #{selectedSession.bookingId}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Khách hàng:</strong> {selectedSession.customerName}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Xe:</strong> {selectedSession.vehicleInfo}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Năng lượng đã sạc:</strong> {selectedSession.energyDelivered?.toFixed(2)} kWh
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>SOC hiện tại:</strong> {selectedSession.currentSoc || 'N/A'}%
              </Typography>
              <Typography variant="h6" color="error" sx={{ mt: 2 }}>
                <strong>Tổng tiền:</strong> {calculateCost(selectedSession.energyDelivered).toLocaleString('vi-VN')} ₫
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStopDialogOpen(false)} color="inherit">
            Hủy
          </Button>
          <Button 
            onClick={confirmEmergencyStop} 
            variant="contained" 
            color="error"
            startIcon={<Stop />}
          >
            Xác nhận Dừng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'success.main', color: 'white' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Payment />
            <Typography variant="h6">Xác nhận Thanh toán tại chỗ</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedSession && (
            <Stack spacing={2}>
              <Alert severity="info">
                Khách hàng thanh toán <strong>trực tiếp tại quầy</strong>. Chọn phương thức và xác nhận.
              </Alert>
              
              <Alert severity="info">
                Phiên sạc <strong>#{selectedSession.bookingId}</strong> - {selectedSession.customerName}
              </Alert>
              
              <TextField
                label="SOC cuối cùng (%)"
                type="number"
                fullWidth
                value={paymentForm.finalSoc}
                onChange={(e) => setPaymentForm({...paymentForm, finalSoc: e.target.value})}
                InputProps={{ inputProps: { min: 0, max: 100 } }}
              />
              
              <TextField
                label="Tổng năng lượng (kWh)"
                type="number"
                fullWidth
                value={paymentForm.totalEnergyKwh}
                onChange={(e) => setPaymentForm({...paymentForm, totalEnergyKwh: e.target.value})}
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              />
              
              <TextField
                label="Phương thức thanh toán"
                select
                fullWidth
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({...paymentForm, paymentMethod: e.target.value})}
                SelectProps={{ native: true }}
              >
                <option value="cash">Tiền mặt</option>
                <option value="transfer">Chuyển khoản ngân hàng</option>
                <option value="card">Quẹt thẻ (POS tại quầy)</option>
              </TextField>
              
              <Card sx={{ bgcolor: 'success.50', border: 1, borderColor: 'success.main' }}>
                <CardContent>
                  <Typography variant="h5" color="success.main" textAlign="center">
                    <strong>Tổng tiền: {calculateCost(paymentForm.totalEnergyKwh).toLocaleString('vi-VN')} ₫</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
                    Đơn giá: 3,000 ₫/kWh
                  </Typography>
                </CardContent>
              </Card>
              
              <Alert severity="warning">
                <strong>Lưu ý:</strong> Nếu khách đã thanh toán bằng <strong>QR Code/Ví điện tử</strong> 
                trên trạm, hệ thống sẽ tự động ghi nhận.
              </Alert>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)} color="inherit">
            Hủy
          </Button>
          <Button 
            startIcon={<Print />} 
            onClick={handlePrintReceipt}
          >
            In hóa đơn
          </Button>
          <Button 
            onClick={processPayment} 
            variant="contained" 
            color="success"
            startIcon={<Payment />}
          >
            Xác nhận Thanh toán
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog - Xem chi tiết hóa đơn */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h5" fontWeight="bold">
              📄 Chi tiết Hóa đơn
            </Typography>
            <Chip 
              label={selectedSession?.activeSession ? "Đang sạc" : "Hoàn thành"}
              color={selectedSession?.activeSession ? "primary" : "success"}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedSession && (
            <Box sx={{ pt: 2 }}>
              {/* Thông tin chính */}
              <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                    ⚡ Thông tin Phiên sạc
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Mã phiên sạc:</Typography>
                      <Typography variant="h6" fontWeight={700}>#{selectedSession.bookingId}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Điểm sạc:</Typography>
                      <Typography variant="h6" fontWeight={700}>{selectedSession.connectorCode}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Khách hàng:</Typography>
                      <Typography variant="body1" fontWeight={600}>{selectedSession.customerName}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Thông tin xe:</Typography>
                      <Typography variant="body1" fontWeight={600}>{selectedSession.vehicleInfo}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Mức pin xe:</Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedSession.currentSoc ? `${selectedSession.currentSoc}%` : "N/A"}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Thống kê thời gian */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                    🕐 Thống kê Thời gian
                  </Typography>
                  <Stack spacing={2}>
                    <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">Thời gian bắt đầu:</Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedSession.startedAt 
                          ? new Date(selectedSession.startedAt).toLocaleString("vi-VN", {
                              weekday: "long",
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit"
                            })
                          : 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 1, textAlign: "center" }}>
                      <Typography variant="caption" color="text.secondary">Tổng thời lượng sạc:</Typography>
                      <Typography variant="h5" fontWeight={700} color="warning.dark">
                        {formatDuration(selectedSession.startedAt, null)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Thống kê năng lượng */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                    ⚡ Thống kê Năng lượng
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Box sx={{ flex: 1, p: 2, bgcolor: 'primary.50', borderRadius: 1, textAlign: "center" }}>
                      <Typography variant="caption" color="text.secondary">Năng lượng tiêu thụ:</Typography>
                      <Typography variant="h4" fontWeight={700} color="primary.main">
                        {(selectedSession.energyDelivered || 0).toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">kWh</Typography>
                    </Box>
                    <Box sx={{ flex: 1, p: 2, bgcolor: 'secondary.50', borderRadius: 1, textAlign: "center" }}>
                      <Typography variant="caption" color="text.secondary">Công suất:</Typography>
                      <Typography variant="h4" fontWeight={700} color="secondary.main">
                        {selectedSession.power || selectedSession.maxPower || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">kW</Typography>
                    </Box>
                  </Stack>
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">Đơn giá điện:</Typography>
                    <Typography variant="h6" fontWeight={600}>3,000 ₫/kWh</Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* Thống kê thanh toán */}
              <Card sx={{ bgcolor: 'success.50', border: "2px solid", borderColor: "success.main" }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom color="success.dark">
                    💰 Thống kê Thanh toán
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ p: 2, bgcolor: "white", borderRadius: 1 }}>
                    <Typography variant="h6" fontWeight={700}>TỔNG TIỀN:</Typography>
                    <Typography variant="h4" fontWeight={900} color="success.dark">
                      {calculateCost(selectedSession.energyDelivered || 0).toLocaleString('vi-VN')} ₫
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: "grey.50" }}>
          <Button 
            onClick={() => setDetailDialogOpen(false)} 
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
              setDetailDialogOpen(false);
            }}
            size="large"
          >
            Xuất hóa đơn
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resume from Maintenance Dialog */}
      <Dialog 
        open={resumeDialogOpen} 
        onClose={() => setResumeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'success.main', color: 'white' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <PlayArrow />
            <Typography variant="h6">Xác nhận Hoạt động lại</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Bạn đang chuẩn bị khôi phục hoạt động cho connector{' '}
              <strong>{selectedSession?.connectorCode}</strong>
            </Typography>
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sau khi xác nhận, connector sẽ chuyển sang trạng thái "Sẵn sàng" và khách hàng có thể sử dụng trở lại.
          </Typography>
          <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Thông tin connector:</strong>
            </Typography>
            <Typography variant="body2">
              • Mã: {selectedSession?.connectorCode}
            </Typography>
            <Typography variant="body2">
              • Loại: {selectedSession?.connectorType}
            </Typography>
            <Typography variant="body2">
              • Công suất: {selectedSession?.maxPower} kW
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setResumeDialogOpen(false)} variant="outlined">
            Hủy
          </Button>
          <Button 
            onClick={confirmResumeFromMaintenance} 
            variant="contained"
            color="success"
            startIcon={<PlayArrow />}
          >
            Xác nhận hoạt động lại
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MuiAlert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};

export default ChargingSessionsSimple;
