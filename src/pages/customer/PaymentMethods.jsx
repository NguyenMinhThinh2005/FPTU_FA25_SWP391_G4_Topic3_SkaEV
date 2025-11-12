import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Alert,
  Container,
  Stack,
  Paper,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import {
  CreditCard,
  AccountBalanceWallet,
  Add,
  Edit,
  Delete,
  Security,
  CheckCircle,
  Warning,
} from "@mui/icons-material";
import { getText } from "../../utils/vietnameseTexts";
import { paymentMethodsAPI } from "../../services/api";

const PaymentMethods = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [formData, setFormData] = useState({
    type: "credit_card",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
    isDefault: false,
  });

  // Fetch payment methods on mount
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentMethodsAPI.getMine();
      const methods = response?.data || response || [];
      setPaymentMethods(Array.isArray(methods) ? methods : []);
    } catch (err) {
      console.error("Error fetching payment methods:", err);
      setError(err.message || "Không thể tải danh sách phương thức thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setSelectedMethod(null);
    setFormData({
      type: "credit_card",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      cardholderName: "",
      isDefault: false,
    });
    setDialogOpen(true);
  };

  const handleEdit = (method) => {
    setSelectedMethod(method);
    const type = method.paymentType || method.type || "credit_card";
    const lastFour = method.lastFourDigits || method.lastFour || "";
    const expiryMonth = method.expiryMonth;
    const expiryYear = method.expiryYear;
    const expiryDate = expiryMonth && expiryYear 
      ? `${String(expiryMonth).padStart(2, '0')}/${String(expiryYear).slice(-2)}`
      : method.expiryDate || "";
    
    setFormData({
      type: type,
      cardNumber: type === "credit_card" || type === "CreditCard" 
        ? `****-****-****-${lastFour}` 
        : "",
      expiryDate: expiryDate,
      cvv: "",
      cardholderName: method.cardHolderName || method.cardholderName || "",
      isDefault: method.isDefault || false,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (methodId) => {
    if (!confirm("Bạn có chắc muốn xóa phương thức thanh toán này?")) {
      return;
    }

    setLoading(true);
    try {
      await paymentMethodsAPI.remove(methodId);
      setSuccessMessage("Đã xóa phương thức thanh toán");
      fetchPaymentMethods(); // Reload list
    } catch (err) {
      console.error("Error deleting payment method:", err);
      setError(err.message || "Không thể xóa phương thức thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (methodId) => {
    setLoading(true);
    try {
      await paymentMethodsAPI.setDefault(methodId);
      setSuccessMessage("Đã đặt phương thức thanh toán mặc định");
      fetchPaymentMethods(); // Reload list
    } catch (err) {
      console.error("Error setting default payment method:", err);
      setError(err.message || "Không thể đặt phương thức mặc định");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build payload
      const payload = {
        paymentType: formData.type,
        cardNumber: formData.cardNumber,
        expiryMonth: formData.expiryDate ? parseInt(formData.expiryDate.split('/')[0]) : null,
        expiryYear: formData.expiryDate ? parseInt('20' + formData.expiryDate.split('/')[1]) : null,
        cardHolderName: formData.cardholderName,
        isDefault: formData.isDefault,
      };

      if (selectedMethod) {
        // Update existing method
        await paymentMethodsAPI.update(selectedMethod.id, payload);
        setSuccessMessage("Đã cập nhật phương thức thanh toán");
      } else {
        // Add new method
        await paymentMethodsAPI.create(payload);
        setSuccessMessage("Đã thêm phương thức thanh toán mới");
      }

      setDialogOpen(false);
      fetchPaymentMethods(); // Reload list
    } catch (err) {
      console.error("Error saving payment method:", err);
      setError(err.message || "Không thể lưu phương thức thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const getMethodIcon = (method) => {
    const type = method.paymentType || method.type;
    if (type === "credit_card" || type === "CreditCard") {
      return <CreditCard />;
    } else if (type === "wallet" || type === "Wallet") {
      return <AccountBalanceWallet />;
    }
    return <CreditCard />;
  };

  const getMethodTitle = (method) => {
    const type = method.paymentType || method.type;
    const lastFour = method.lastFourDigits || method.lastFour;
    const brand = method.cardBrand || method.brand || "Card";
    
    if (type === "credit_card" || type === "CreditCard") {
      return `${brand} •••• ${lastFour}`;
    } else if (type === "wallet" || type === "Wallet") {
      return `${method.provider || "Wallet"} ${method.accountNumber || ""}`;
    }
    return "Phương thức thanh toán";
  };

  const getMethodSubtitle = (method) => {
    const type = method.paymentType || method.type;
    
    if (type === "credit_card" || type === "CreditCard") {
      const expiryMonth = method.expiryMonth;
      const expiryYear = method.expiryYear;
      const expiryDate = expiryMonth && expiryYear 
        ? `${String(expiryMonth).padStart(2, '0')}/${String(expiryYear).slice(-2)}`
        : method.expiryDate || "";
      const cardHolder = method.cardHolderName || method.cardholderName || "";
      return `Hết hạn ${expiryDate}${cardHolder ? ` • ${cardHolder}` : ""}`;
    } else if (type === "wallet" || type === "Wallet") {
      return "Ví điện tử";
    }
    return "";
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

      {/* Modern Payment Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          background: "linear-gradient(135deg, #FF9800 0%, #F57C00 100%)",
          borderRadius: 4,
          p: 4,
          color: "white",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            right: 0,
            width: "30%",
            height: "100%",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          },
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" alignItems="center" spacing={3}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                background: "rgba(255,255,255,0.2)",
                backdropFilter: "blur(10px)",
                border: "2px solid rgba(255,255,255,0.3)",
              }}
            >
              <CreditCard sx={{ fontSize: 40, color: "white" }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                💳 Ví và thanh toán
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Quản lý phương thức thanh toán an toàn
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={handleAddNew}
            sx={{
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.3)",
              "&:hover": { background: "rgba(255,255,255,0.3)" },
              minWidth: 180,
            }}
          >
            Thêm phương thức
          </Button>
        </Stack>
      </Paper>

      {/* Security Notice */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Security />
          <Typography variant="body2">
            Thông tin thanh toán của bạn được mã hóa và bảo mật. Chúng tôi không
            bao giờ lưu trữ thông tin thẻ đầy đủ của bạn.
          </Typography>
        </Box>
      </Alert>

      {/* Payment Methods List */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {getText("payment.paymentMethods")}
          </Typography>

          {loading && paymentMethods.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Đang tải phương thức thanh toán...
              </Typography>
            </Box>
          ) : paymentMethods.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <CreditCard sx={{ fontSize: 60, color: "grey.400", mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {getText("payment.noPaymentMethods")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Thêm phương thức thanh toán để thanh toán dễ dàng hơn
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddNew}
              >
                {getText("payment.addFirstMethod")}
              </Button>
            </Box>
          ) : (
            <List>
              {paymentMethods.map((method, index) => (
                <React.Fragment key={method.id}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          bgcolor: method.isDefault
                            ? "primary.main"
                            : "grey.300",
                        }}
                      >
                        {getMethodIcon(method)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography variant="subtitle1" fontWeight="medium">
                            {getMethodTitle(method)}
                          </Typography>
                          {method.isDefault && (
                            <Chip
                              label={getText("payment.defaultMethod")}
                              size="small"
                              color="primary"
                            />
                          )}
                          {method.isExpired && (
                            <Chip label="Hết hạn" size="small" color="error" />
                          )}
                        </Box>
                      }
                      secondary={getMethodSubtitle(method)}
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        {!method.isDefault && (
                          <Button
                            size="small"
                            onClick={() => handleSetDefault(method.id)}
                          >
                            {getText("payment.setAsDefault")}
                          </Button>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(method)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(method.id)}
                          disabled={method.isDefault}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < paymentMethods.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {paymentMethods.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Phương thức thanh toán
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {paymentMethods.filter((m) => !m.isExpired).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Đang hoạt động
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {paymentMethods.filter((m) => m.isExpired).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cần cập nhật
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add/Edit Payment Method Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedMethod
            ? "Chỉnh sửa phương thức thanh toán"
            : getText("payment.addPaymentMethod")}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Loại thanh toán</InputLabel>
                <Select
                  value={formData.type}
                  label="Loại thanh toán"
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                >
                  <MenuItem value="credit_card">
                    {getText("payment.creditCard")}
                  </MenuItem>
                  <MenuItem value="wallet">
                    {getText("payment.wallet")}
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.type === "credit_card" && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={getText("payment.cardNumber")}
                    value={formData.cardNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, cardNumber: e.target.value })
                    }
                    placeholder="1234 5678 9012 3456"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label={getText("payment.expiryDate")}
                    value={formData.expiryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expiryDate: e.target.value })
                    }
                    placeholder="MM/YY"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label={getText("payment.cvv")}
                    value={formData.cvv}
                    onChange={(e) =>
                      setFormData({ ...formData, cvv: e.target.value })
                    }
                    placeholder="123"
                    type="password"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={getText("payment.cardHolder")}
                    value={formData.cardholderName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cardholderName: e.target.value,
                      })
                    }
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            {getText("common.cancel")}
          </Button>
          <Button variant="contained" onClick={handleSave}>
            {selectedMethod ? "Cập nhật" : "Thêm"} phương thức thanh toán
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PaymentMethods;
