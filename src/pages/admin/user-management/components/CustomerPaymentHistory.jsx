import React from 'react';
import { 
  Box, Typography, Alert, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Chip 
} from '@mui/material';
import { CreditCard } from '@mui/icons-material';

const CustomerPaymentHistory = ({ paymentHistory }) => {
  const getPaymentStatusChip = (status) => {
    const statusMap = {
      paid: { label: "Đã thanh toán", color: "success" },
      pending: { label: "Chờ thanh toán", color: "warning" },
      failed: { label: "Thất bại", color: "error" },
      refunded: { label: "Đã hoàn tiền", color: "info" },
    };
    
    const config = statusMap[status] || { label: status, color: "default" };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const formatCurrency = (amount) => {
    const value = Number.isFinite(amount) ? amount : 0;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          Lịch sử thanh toán ({paymentHistory.length})
        </Typography>
      </Box>

      {paymentHistory.length === 0 ? (
        <Alert severity="info">Chưa có lịch sử thanh toán</Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mã giao dịch</TableCell>
                <TableCell align="center">Phương thức</TableCell>
                <TableCell align="right">Số tiền</TableCell>
                <TableCell align="center">Trạng thái</TableCell>
                <TableCell align="right">Ngày thanh toán</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paymentHistory.map((payment) => (
                <TableRow key={payment.paymentId} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {payment.transactionId}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Invoice: {payment.invoiceId}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={payment.paymentMethod === "credit_card" ? "Thẻ tín dụng" : payment.paymentMethod === "momo" ? "MoMo" : "Chuyển khoản"}
                      size="small"
                      icon={<CreditCard />}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {formatCurrency(payment.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">{getPaymentStatusChip(payment.status)}</TableCell>
                  <TableCell align="right">
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(payment.paidDate)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default CustomerPaymentHistory;
