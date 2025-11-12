import React, { useState, useEffect } from "react"; 
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
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
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Star,
  CheckCircle,
  Cancel,
} from "@mui/icons-material";
import servicePlansAPI from "../../services/api/servicePlansAPI";

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    planName: "",
    planType: "prepaid",
    description: "",
    pricePerKwh: "",
    monthlyFee: "",
    discountPercentage: "",
    maxPowerKw: "",
    priorityAccess: false,
    freeCancellation: false,
    features: "",
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await servicePlansAPI.getAll();
      if (response.success) {
        setPlans(response.data);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
      setError("Không thể tải danh sách gói dịch vụ");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        planName: plan.planName,
        planType: plan.planType,
        description: plan.description || "",
        pricePerKwh: plan.pricePerKwh,
        monthlyFee: plan.monthlyFee || "",
        discountPercentage: plan.discountPercentage || "",
        maxPowerKw: plan.maxPowerKw || "",
        priorityAccess: plan.priorityAccess,
        freeCancellation: plan.freeCancellation,
        features: plan.features || "",
      });
    } else {
      setEditingPlan(null);
      setFormData({
        planName: "",
        planType: "prepaid",
        description: "",
        pricePerKwh: "",
        monthlyFee: "",
        discountPercentage: "",
        maxPowerKw: "",
        priorityAccess: false,
        freeCancellation: false,
        features: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPlan(null);
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      const planData = {
        ...formData,
        pricePerKwh: parseFloat(formData.pricePerKwh),
        monthlyFee: formData.monthlyFee ? parseFloat(formData.monthlyFee) : null,
        discountPercentage: formData.discountPercentage ? parseFloat(formData.discountPercentage) : null,
        maxPowerKw: formData.maxPowerKw ? parseFloat(formData.maxPowerKw) : null,
      };

      if (editingPlan) {
        await servicePlansAPI.update(editingPlan.planId, planData);
        setSuccess("Cập nhật gói dịch vụ thành công");
      } else {
        await servicePlansAPI.create(planData);
        setSuccess("Tạo gói dịch vụ mới thành công");
      }

      handleCloseDialog();
      fetchPlans();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error saving plan:", error);
      setError("Có lỗi xảy ra khi lưu gói dịch vụ");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa gói dịch vụ này?")) {
      try {
        await servicePlansAPI.delete(id);
        setSuccess("Xóa gói dịch vụ thành công");
        fetchPlans();
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        console.error("Error deleting plan:", error);
        setError("Có lỗi xảy ra khi xóa gói dịch vụ");
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await servicePlansAPI.toggleStatus(id);
      setSuccess("Cập nhật trạng thái thành công");
      fetchPlans();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error toggling status:", error);
      setError("Có lỗi xảy ra khi cập nhật trạng thái");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getPlanTypeColor = (type) => {
    switch (type) {
      case "prepaid":
        return "primary";
      case "postpaid":
        return "secondary";
      case "vip":
        return "warning";
      default:
        return "default";
    }
  };

  const getPlanTypeLabel = (type) => {
    switch (type) {
      case "prepaid":
        return "Trả trước";
      case "postpaid":
        return "Trả sau";
      case "vip":
        return "VIP";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">
          Quản lý gói dịch vụ
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Thêm gói mới
        </Button>
      </Box>

      {/* Success/Error Messages */}
      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Plans Grid */}
      <Grid container spacing={3}>
        {plans.map((plan) => (
          <Grid item xs={12} md={6} lg={4} key={plan.planId}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                border: plan.planType === "vip" ? "2px solid gold" : "none",
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {plan.planName}
                      {plan.planType === "vip" && (
                        <Star sx={{ color: "gold", ml: 1, verticalAlign: "middle" }} />
                      )}
                    </Typography>
                    <Chip
                      label={getPlanTypeLabel(plan.planType)}
                      color={getPlanTypeColor(plan.planType)}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={plan.isActive ? "Hoạt động" : "Tạm dừng"}
                      color={plan.isActive ? "success" : "default"}
                      size="small"
                      icon={plan.isActive ? <CheckCircle /> : <Cancel />}
                    />
                  </Box>
                  <Box>
                    <IconButton size="small" onClick={() => handleOpenDialog(plan)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(plan.planId)} color="error">
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                {/* Description */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {plan.description}
                </Typography>

                {/* Pricing */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h5" color="primary" fontWeight="bold">
                    {formatCurrency(plan.pricePerKwh)}/kWh
                  </Typography>
                  {plan.monthlyFee && (
                    <Typography variant="body2" color="text.secondary">
                      + {formatCurrency(plan.monthlyFee)}/tháng
                    </Typography>
                  )}
                  {plan.discountPercentage && (
                    <Typography variant="body2" color="success.main">
                      Giảm giá: {plan.discountPercentage}%
                    </Typography>
                  )}
                </Box>

                {/* Features */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {plan.maxPowerKw && (
                    <Typography variant="body2">
                      ⚡ Công suất tối đa: {plan.maxPowerKw} kW
                    </Typography>
                  )}
                  {plan.priorityAccess && (
                    <Typography variant="body2" color="primary">
                      ✓ Ưu tiên booking
                    </Typography>
                  )}
                  {plan.freeCancellation && (
                    <Typography variant="body2" color="success.main">
                      ✓ Hủy miễn phí
                    </Typography>
                  )}
                </Box>

                {/* Toggle Status */}
                <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #eee" }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={plan.isActive}
                        onChange={() => handleToggleStatus(plan.planId)}
                      />
                    }
                    label={plan.isActive ? "Đang kích hoạt" : "Tạm dừng"}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPlan ? "Chỉnh sửa gói dịch vụ" : "Tạo gói dịch vụ mới"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
            <TextField
              label="Tên gói"
              value={formData.planName}
              onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
              required
              fullWidth
            />

            <FormControl fullWidth required>
              <InputLabel>Loại gói</InputLabel>
              <Select
                value={formData.planType}
                label="Loại gói"
                onChange={(e) => setFormData({ ...formData, planType: e.target.value })}
              >
                <MenuItem value="prepaid">Trả trước</MenuItem>
                <MenuItem value="postpaid">Trả sau</MenuItem>
                <MenuItem value="vip">VIP</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Mô tả"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Giá trên kWh"
                  type="number"
                  value={formData.pricePerKwh}
                  onChange={(e) => setFormData({ ...formData, pricePerKwh: e.target.value })}
                  required
                  fullWidth
                  InputProps={{
                    endAdornment: <InputAdornment position="end">VND</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Phí hàng tháng"
                  type="number"
                  value={formData.monthlyFee}
                  onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
                  fullWidth
                  InputProps={{
                    endAdornment: <InputAdornment position="end">VND</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Giảm giá"
                  type="number"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                  fullWidth
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Công suất tối đa"
                  type="number"
                  value={formData.maxPowerKw}
                  onChange={(e) => setFormData({ ...formData, maxPowerKw: e.target.value })}
                  fullWidth
                  InputProps={{
                    endAdornment: <InputAdornment position="end">kW</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.priorityAccess}
                  onChange={(e) => setFormData({ ...formData, priorityAccess: e.target.checked })}
                />
              }
              label="Ưu tiên booking"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.freeCancellation}
                  onChange={(e) => setFormData({ ...formData, freeCancellation: e.target.checked })}
                />
              }
              label="Hủy miễn phí"
            />

            <TextField
              label="Tính năng (JSON)"
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              multiline
              rows={4}
              fullWidth
              placeholder='{"benefits": [...], "limitations": [...]}'
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingPlan ? "Cập nhật" : "Tạo mới"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Plans;
