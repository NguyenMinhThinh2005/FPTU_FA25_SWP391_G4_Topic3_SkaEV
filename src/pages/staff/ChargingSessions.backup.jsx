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
  Info 
} from "@mui/icons-material";

const ChargingSessionsSimple = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Dialog states
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
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
                        {/* Chi tiết button */}
                        <Button 
                          size="small" 
                          variant="outlined" 
                          startIcon={<Info />}
                          disabled={!isActive}
                          onClick={() => {
                            if (isActive) {
                              alert(`Chi tiết phiên sạc #${session.bookingId}\n` +
                                    `Khách hàng: ${session.customerName}\n` +
                                    `Xe: ${session.vehicleInfo}\n` +
                                    `SOC: ${session.currentSoc || 'N/A'}%\n` +
                                    `Công suất: ${session.power || 'N/A'} kW`);
                            }
                          }}
                        >
                          Chi tiết
                        </Button>
                        
                        {/* Dừng khẩn cấp button - Only show when charging */}
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
                        
                        {/* Thanh toán button - Show after stopped */}
                        {!isActive && session.bookingId && (
                          <Button 
                            size="small" 
                            variant="contained"
                            color="success"
                            startIcon={<Payment />}
                            onClick={() => handlePayment(session)}
                          >
                            Thanh toán
                          </Button>
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
            <Typography variant="h6">Thanh toán Phiên sạc</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedSession && (
            <Stack spacing={2}>
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
                <option value="card">Thẻ</option>
                <option value="momo">MoMo</option>
                <option value="vnpay">VNPay</option>
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
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)} color="inherit">
            Hủy
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
