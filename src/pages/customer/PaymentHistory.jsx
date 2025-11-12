/* eslint-disable */
import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import {
  Receipt,
  Download,
  Print,
  Visibility,
  AttachMoney,
  CalendarMonth,
  Payment,
  CheckCircle,
  Schedule,
  ElectricBolt,
  CreditCard,
  AccountBalanceWallet,
  LocalAtm,
} from "@mui/icons-material";
import { formatCurrency } from "../../utils/helpers";
import { invoicesAPI, paymentsAPI } from "../../services/api";

const PaymentHistory = () => {
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch invoices on mount
  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await invoicesAPI.getMyInvoices();
      const data = response?.data || response || [];
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setError(err.message || "Không thể tải lịch sử thanh toán");
    } finally {
      setLoading(false);
    }
  };

  // Transform invoice data to payment history format
  const paymentHistory = invoices.map((invoice) => {
    const paymentMethods = [
      {
        name: "SkaEV Wallet",
        icon: <AccountBalanceWallet />,
        color: "primary",
      },
      { name: "Visa ****1234", icon: <CreditCard />, color: "info" },
      {
        name: "MoMo Wallet",
        icon: <AccountBalanceWallet />,
        color: "success",
      },
      { name: "Banking Transfer", icon: <LocalAtm />, color: "warning" },
    ];
    
    // Get payment method from invoice or use random for demo
    const methodIndex = invoice.paymentMethodId 
      ? invoice.paymentMethodId % paymentMethods.length 
      : Math.floor(Math.random() * paymentMethods.length);
    const method = paymentMethods[methodIndex];

    return {
      id: `PAY-${invoice.invoiceId || invoice.id}`,
      invoiceId: invoice.invoiceId || invoice.id,
      date: invoice.invoiceDate || invoice.createdAt || new Date().toISOString().split("T")[0],
      amount: invoice.totalAmount || invoice.total || 0,
      method: method.name,
      methodIcon: method.icon,
      methodColor: method.color,
      status: invoice.paymentStatus || invoice.status || "completed",
      description: invoice.description || `Sạc tại trạm`,
      session: {
        stationName: invoice.stationName || "Trạm sạc",
        energy: `${invoice.energyDelivered || invoice.energy || 0} kWh`,
        duration: `${invoice.chargingDuration || invoice.duration || 0} phút`,
        connector: invoice.connectorType || "CCS2",
        startTime: invoice.startTime || "10:00",
        endTime: invoice.endTime || "11:00",
        energyCost: invoice.energyCost || invoice.subtotal || 0,
        parkingFee: invoice.parkingFee || 0,
      },
      invoiceNumber: invoice.invoiceNumber || `INV-${invoice.invoiceId}`,
      taxInfo: {
        subtotal: invoice.subtotal || Math.round((invoice.totalAmount || 0) / 1.1),
        tax: invoice.taxAmount || Math.round((invoice.totalAmount || 0) * 0.1),
        total: invoice.totalAmount || invoice.total || 0,
      },
    };
  });

  // Sort payments by date (newest first)
  const allPayments = paymentHistory.sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  // Calculate summary statistics with safety checks
  const totalAmount = (allPayments || []).reduce(
    (sum, p) => sum + (p?.amount || 0),
    0
  );
  const completedPayments = (allPayments || []).filter(
    (p) => p?.status === "completed"
  );
  const averageAmount =
    completedPayments.length > 0
      ? completedPayments.reduce((sum, p) => sum + (p?.amount || 0), 0) /
        completedPayments.length
      : 0;
  const totalSessions = (paymentHistory || []).length; // Only count actual charging sessions

  const getStatusChip = (status) => {
    const statusMap = {
      completed: { label: "Thành công", color: "success" },
      pending: { label: "Đang xử lý", color: "warning" },
      failed: { label: "Thất bại", color: "error" },
    };
    const statusInfo = statusMap[status] || statusMap.completed;
    return (
      <Chip label={statusInfo.label} color={statusInfo.color} size="small" />
    );
  };

  const handleViewReceipt = (payment) => {
    setSelectedPayment(payment);
    setReceiptDialogOpen(true);
  };

  const handleDownloadReceipt = async (payment) => {
    if (!payment.invoiceId) {
      setError("Không tìm thấy ID hóa đơn");
      return;
    }

    try {
      setLoading(true);
      const blob = await invoicesAPI.download(payment.invoiceId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${payment.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccessMessage(`Đã tải xuống hóa đơn ${payment.invoiceNumber}`);
    } catch (err) {
      console.error("Error downloading invoice:", err);
      setError(err.message || "Không thể tải xuống hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    if (selectedPayment) {
      window.print();
      setSuccessMessage("Đã gửi lệnh in hóa đơn");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Loading Overlay */}
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0,0,0,0.3)',
            zIndex: 9999,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {/* Success Message */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Avatar sx={{ bgcolor: "success.main", mr: 2 }}>
            <Payment />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Lịch sử thanh toán
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quản lý giao dịch và hóa đơn điện tử
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Summary Cards - Updated with realistic data */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  width: 56,
                  height: 56,
                  mx: "auto",
                  mb: 2,
                }}
              >
                <AttachMoney />
              </Avatar>
              <Typography variant="h5" fontWeight="bold" color="primary.main">
                {formatCurrency(totalAmount)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tổng chi tiêu
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5 }}
              >
                +15.2% so với tháng trước
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Avatar
                sx={{
                  bgcolor: "success.main",
                  width: 56,
                  height: 56,
                  mx: "auto",
                  mb: 2,
                }}
              >
                <CheckCircle />
              </Avatar>
              <Typography variant="h5" fontWeight="bold" color="success.main">
                {completedPayments.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Giao dịch thành công
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5 }}
              >
                Tỷ lệ thành công: 100%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Avatar
                sx={{
                  bgcolor: "info.main",
                  width: 56,
                  height: 56,
                  mx: "auto",
                  mb: 2,
                }}
              >
                <ElectricBolt />
              </Avatar>
              <Typography variant="h5" fontWeight="bold" color="info.main">
                {formatCurrency(Math.round(averageAmount))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Chi tiêu TB/giao dịch
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5 }}
              >
                {totalSessions} phiên sạc
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Avatar
                sx={{
                  bgcolor: "warning.main",
                  width: 56,
                  height: 56,
                  mx: "auto",
                  mb: 2,
                }}
              >
                <Receipt />
              </Avatar>
              <Typography variant="h5" fontWeight="bold" color="warning.main">
                {allPayments.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tổng hóa đơn
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5 }}
              >
                Điện tích lũy
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment History Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Chi tiết giao dịch
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ngày</TableCell>
                  <TableCell>Mô tả</TableCell>
                  <TableCell>Phương thức</TableCell>
                  <TableCell align="right">Số tiền</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="center">Hóa đơn</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <CircularProgress />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Đang tải lịch sử thanh toán...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : !loading && allPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <Typography variant="body1" color="text.secondary">
                        Chưa có lịch sử thanh toán
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Các giao dịch của bạn sẽ hiển thị tại đây
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  (allPayments || []).map((payment) => (
                    <TableRow key={payment.id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(payment.date).toLocaleDateString("vi-VN")}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {payment.invoiceNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {payment.description}
                        </Typography>
                        {payment.session && (
                          <Typography variant="caption" color="text.secondary">
                            {payment.session.energy} • {payment.session.duration}
                          </Typography>
                        )}
                        {payment.subscription && (
                          <Typography variant="caption" color="text.secondary">
                            {payment.subscription.packageName} •{" "}
                            {payment.subscription.sessions} phiên
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Avatar
                            sx={{
                              width: 24,
                              height: 24,
                              bgcolor: `${payment.methodColor}.main`,
                            }}
                          >
                            {payment.methodIcon}
                          </Avatar>
                          <Typography variant="body2">
                            {payment.method}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(payment.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(payment.status)}</TableCell>
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            justifyContent: "center",
                          }}
                        >
                          <Tooltip title="Xem chi tiết">
                            <IconButton
                              size="small"
                              onClick={() => handleViewReceipt(payment)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Tải xuống">
                            <IconButton
                              size="small"
                              onClick={() => handleDownloadReceipt(payment)}
                            >
                              <Download />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="In hóa đơn">
                            <IconButton
                              size="small"
                              onClick={() => handlePrintReceipt(payment)}
                            >
                              <Print />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Receipt Detail Dialog */}
      <Dialog
        open={receiptDialogOpen}
        onClose={() => setReceiptDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Chi tiết hóa đơn
          <Typography variant="body2" color="text.secondary">
            {selectedPayment?.invoiceNumber}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Ngày giao dịch:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {new Date(selectedPayment.date).toLocaleDateString("vi-VN")}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Phương thức:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {selectedPayment.method}
                  </Typography>
                </Grid>
                {selectedPayment.session && (
                  <>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2" fontWeight="bold">
                        Chi tiết phiên sạc
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Trạm sạc:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {selectedPayment.session.stationName}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Thời gian:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {selectedPayment.session.startTime} -{" "}
                        {selectedPayment.session.endTime}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Năng lượng:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {selectedPayment.session.energy}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Thời lượng:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {selectedPayment.session.duration}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2" fontWeight="bold">
                        Chi phí chi tiết
                      </Typography>
                    </Grid>
                    <Grid item xs={8}>
                      <Typography variant="body2">
                        Chi phí năng lượng:
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" align="right">
                        {formatCurrency(selectedPayment.session.energyCost)}
                      </Typography>
                    </Grid>
                    <Grid item xs={8}>
                      <Typography variant="body2">Phí đỗ xe:</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" align="right">
                        {formatCurrency(selectedPayment.session.parkingFee)}
                      </Typography>
                    </Grid>
                  </>
                )}
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2">Tạm tính:</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" align="right">
                    {formatCurrency(selectedPayment.taxInfo.subtotal)}
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2">VAT (10%):</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" align="right">
                    {formatCurrency(selectedPayment.taxInfo.tax)}
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="h6" fontWeight="bold">
                    Tổng cộng:
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    align="right"
                    color="primary.main"
                  >
                    {formatCurrency(selectedPayment.amount)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReceiptDialogOpen(false)}>Đóng</Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => handleDownloadReceipt(selectedPayment)}
          >
            Tải xuống
          </Button>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={() => handlePrintReceipt(selectedPayment)}
          >
            In hóa đơn
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PaymentHistory;
