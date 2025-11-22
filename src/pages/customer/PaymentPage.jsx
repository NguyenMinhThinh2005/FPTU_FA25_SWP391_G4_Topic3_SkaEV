import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Avatar,
} from "@mui/material";
import {
  AccountBalanceWallet,
  Add,
  History,
  TrendingUp,
  TrendingDown,
  ReceiptLong,
  Visibility,
} from "@mui/icons-material";
import { formatCurrency } from "../../utils/helpers";
import { walletAPI } from "../../services/api";
import useAuthStore from "../../store/authStore";

const PaymentPage = () => {
  const { user } = useAuthStore();
  const [walletInfo, setWalletInfo] = useState({
    balance: 0,
    totalDeposit: 0,
    totalSpent: 0,
    transactionCount: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [topupLoading, setTopupLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch data on mount
  useEffect(() => {
    fetchWalletData();
    fetchTransactions();
  }, []);

  const fetchWalletData = async () => {
    try {
      const response = await walletAPI.getBalance();
      const data = response?.data || response;
      setWalletInfo(data);
    } catch (error) {
      console.error("Error fetching wallet info:", error);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await walletAPI.getTransactions();
      const data = response?.data || response || [];

      // Transform to transaction format
      const formattedTransactions = Array.isArray(data)
        ? data.map((t) => ({
            id: t.id,
            date: t.createdAt,
            type: t.type.toLowerCase(), // 'topup' or 'payment'
            description: t.description,
            amount: t.type === "Payment" ? -t.amount : t.amount,
            status: t.status,
          }))
        : [];

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopup = async (amount) => {
    setTopupLoading(true);
    try {
      const response = await walletAPI.topup(amount);
      const result = response?.data || response;

      if (result.success) {
        // Refresh data
        fetchWalletData();
        fetchTransactions();

        setSnackbar({
          open: true,
          message: result.message,
          severity: "success",
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Nạp tiền thất bại",
        severity: "error",
      });
    } finally {
      setTopupLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusChip = (status) => {
    const statusMap = {
      completed: { label: "Thành công", color: "success" },
      pending: { label: "Đang xử lý", color: "warning" },
      failed: { label: "Thất bại", color: "error" },
    };
    const info = statusMap[status] || statusMap.completed;
    return (
      <Chip
        label={info.label}
        color={info.color}
        size="small"
        variant="outlined"
      />
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        fontWeight="bold"
        gutterBottom
        sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}
      >
        <AccountBalanceWallet fontSize="large" color="primary" />
        Ví điện tử
      </Typography>

      <Grid container spacing={3}>
        {/* Section 1: Wallet Card & Top-up */}
        <Grid item xs={12} md={5}>
          <Card
            sx={{
              height: "100%",
              background: "linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)",
              color: "white",
              borderRadius: 4,
              boxShadow: "0 8px 32px rgba(25, 118, 210, 0.3)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Decorative circles */}
            <Box
              sx={{
                position: "absolute",
                top: -20,
                right: -20,
                width: 150,
                height: 150,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                bottom: -40,
                left: -40,
                width: 200,
                height: 200,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.05)",
              }}
            />

            <CardContent
              sx={{
                p: 4,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography variant="subtitle1" sx={{ opacity: 0.8, mb: 1 }}>
                  Số dư khả dụng
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  {formatCurrency(walletInfo.balance)}
                </Typography>
              </Box>

              <Box sx={{ mt: 4 }}>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Chủ tài khoản
                </Typography>
                <Typography variant="h6" fontWeight="medium">
                  {user?.full_name || "Khách hàng"}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.6 }}>
                  {user?.email}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card
            sx={{
              height: "100%",
              borderRadius: 4,
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography
                variant="h6"
                fontWeight="bold"
                gutterBottom
                sx={{ mb: 3 }}
              >
                Demo Nạp tiền
              </Typography>
              <Grid container spacing={2}>
                {[100000, 200000, 500000, 1000000].map((amount) => (
                  <Grid item xs={6} sm={3} key={amount}>
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{
                        py: 2,
                        borderRadius: 2,
                        borderWidth: 2,
                        borderColor: "divider",
                        color: "text.primary",
                        "&:hover": {
                          borderColor: "primary.main",
                          backgroundColor: "primary.light",
                          color: "primary.main",
                          borderWidth: 2,
                        },
                      }}
                      onClick={() => handleTopup(amount)}
                      disabled={topupLoading}
                    >
                      {formatCurrency(amount)}
                    </Button>
                  </Grid>
                ))}
              </Grid>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 3 }}
              >
                * Chọn mệnh giá để nạp tiền ngay lập tức vào ví của bạn.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Section 2: Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}
          >
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}
              >
                <Avatar
                  sx={{ bgcolor: "primary.light", color: "primary.main" }}
                >
                  <AccountBalanceWallet />
                </Avatar>
                <Typography variant="body2" color="text.secondary">
                  Số dư hiện tại
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">
                {formatCurrency(walletInfo.balance)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}
          >
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}
              >
                <Avatar
                  sx={{ bgcolor: "success.light", color: "success.main" }}
                >
                  <TrendingUp />
                </Avatar>
                <Typography variant="body2" color="text.secondary">
                  Tổng tiền nạp
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold" color="success.main">
                +{formatCurrency(walletInfo.totalDeposit)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}
          >
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}
              >
                <Avatar sx={{ bgcolor: "error.light", color: "error.main" }}>
                  <TrendingDown />
                </Avatar>
                <Typography variant="body2" color="text.secondary">
                  Tổng chi tiêu
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold" color="error.main">
                -{formatCurrency(walletInfo.totalSpent)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}
          >
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}
              >
                <Avatar sx={{ bgcolor: "info.light", color: "info.main" }}>
                  <ReceiptLong />
                </Avatar>
                <Typography variant="body2" color="text.secondary">
                  Tổng giao dịch
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">
                {transactions.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Section 3: Transaction History */}
        <Grid item xs={12}>
          <Paper
            sx={{
              borderRadius: 4,
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            }}
          >
            <Box
              sx={{
                p: 3,
                borderBottom: "1px solid",
                borderColor: "divider",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <History color="action" />
              <Typography variant="h6" fontWeight="bold">
                Lịch sử biến động số dư
              </Typography>
            </Box>

            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: "grey.50" }}>
                  <TableRow>
                    <TableCell>Thời gian</TableCell>
                    <TableCell>Loại giao dịch</TableCell>
                    <TableCell>Nội dung</TableCell>
                    <TableCell align="right">Số tiền</TableCell>
                    <TableCell align="center">Trạng thái</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                        <Typography color="text.secondary">
                          Chưa có giao dịch nào
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {new Date(row.date).toLocaleDateString("vi-VN")}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(row.date).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              row.type === "topup" ? "Nạp tiền" : "Thanh toán"
                            }
                            size="small"
                            color={row.type === "topup" ? "success" : "default"}
                            variant={
                              row.type === "topup" ? "filled" : "outlined"
                            }
                          />
                        </TableCell>
                        <TableCell>{row.description}</TableCell>
                        <TableCell align="right">
                          <Typography
                            fontWeight="bold"
                            color={
                              row.amount > 0 ? "success.main" : "error.main"
                            }
                          >
                            {row.amount > 0 ? "+" : ""}
                            {formatCurrency(row.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {getStatusChip(row.status)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PaymentPage;
