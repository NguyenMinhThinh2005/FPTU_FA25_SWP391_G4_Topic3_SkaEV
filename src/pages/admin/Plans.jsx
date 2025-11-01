import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  IconButton,
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
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
  Stack,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  MonetizationOn,
  Check,
  Star,
  CardMembership,
} from "@mui/icons-material";

const Plans = () => {
  const [plans, setPlans] = useState([
    {
      id: 1,
      name: "Trả trước",
      type: "prepaid",
      price: 0,
      description: "Nạp tiền trước, sạc sau. Linh hoạt không cam kết.",
      features: [
        "Nạp từ 100,000 VNĐ",
        "Giá tiêu chuẩn",
        "Không phí hàng tháng",
        "Hủy bất kỳ lúc nào"
      ],
      color: "primary",
      icon: <MonetizationOn />,
      active: true,
    },
    {
      id: 2,
      name: "Trả sau",
      type: "postpaid",
      price: 50000,
      description: "Thanh toán cuối tháng theo mức tiêu thụ.",
      features: [
        "Phí duy trì: 50,000 VNĐ/tháng",
        "Thanh toán cuối kỳ",
        "Báo cáo chi tiết",
        "Hạn mức tín dụng"
      ],
      color: "warning",
      icon: <CardMembership />,
      active: true,
    },
    {
      id: 3,
      name: "VIP Membership",
      type: "vip",
      price: 500000,
      description: "Gói cao cấp với nhiều ưu đãi đặc biệt.",
      features: [
        "Phí: 500,000 VNĐ/tháng",
        "Giảm 15% mọi lần sạc",
        "Ưu tiên đặt chỗ",
        "Hỗ trợ 24/7 VIP",
        "Tích điểm thưởng x2"
      ],
      color: "secondary",
      icon: <Star />,
      active: true,
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);

  const [form, setForm] = useState({
    name: "",
    type: "prepaid",
    price: 0,
    description: "",
    features: [""],
    active: true,
  });

  const handleOpenDialog = (plan = null) => {
    if (plan) {
      setEditPlan(plan);
      setForm({
        name: plan.name,
        type: plan.type,
        price: plan.price,
        description: plan.description,
        features: [...plan.features],
        active: plan.active,
      });
    } else {
      setEditPlan(null);
      setForm({
        name: "",
        type: "prepaid",
        price: 0,
        description: "",
        features: [""],
        active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditPlan(null);
  };

  const handleSave = () => {
    if (editPlan) {
      // Update existing plan
      setPlans(plans.map(p => p.id === editPlan.id ? { ...editPlan, ...form } : p));
    } else {
      // Create new plan
      const newPlan = {
        ...form,
        id: plans.length + 1,
        icon: <MonetizationOn />,
        color: form.type === "vip" ? "secondary" : form.type === "postpaid" ? "warning" : "primary",
      };
      setPlans([...plans, newPlan]);
    }
    handleCloseDialog();
  };

  const handleDeleteConfirm = (plan) => {
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    setPlans(plans.filter(p => p.id !== planToDelete.id));
    setDeleteDialogOpen(false);
    setPlanToDelete(null);
  };

  const handleAddFeature = () => {
    setForm({ ...form, features: [...form.features, ""] });
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...form.features];
    newFeatures[index] = value;
    setForm({ ...form, features: newFeatures });
  };

  const handleRemoveFeature = (index) => {
    setForm({ ...form, features: form.features.filter((_, i) => i !== index) });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Quản lý Gói dịch vụ
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quản lý các gói trả trước, trả sau và VIP membership
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Thêm gói mới
        </Button>
      </Box>

      {/* Plans Grid */}
      <Grid container spacing={3}>
        {plans.map((plan) => (
          <Grid item xs={12} md={4} key={plan.id}>
            <Card sx={{ height: "100%", position: "relative" }}>
              <CardContent>
                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        bgcolor: `${plan.color}.light`,
                        color: `${plan.color}.main`,
                      }}
                    >
                      {plan.icon}
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {plan.name}
                      </Typography>
                      <Chip
                        label={plan.active ? "Đang hoạt động" : "Tạm dừng"}
                        size="small"
                        color={plan.active ? "success" : "default"}
                      />
                    </Box>
                  </Box>
                  <Box>
                    <IconButton size="small" onClick={() => handleOpenDialog(plan)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteConfirm(plan)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                {/* Price */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h4" color={plan.color + ".main"} fontWeight="bold">
                    {plan.price.toLocaleString("vi-VN")} ₫
                    <Typography variant="caption" color="text.secondary">
                      {plan.type === "prepaid" ? "/lần nạp" : "/tháng"}
                    </Typography>
                  </Typography>
                </Box>

                {/* Description */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {plan.description}
                </Typography>

                <Divider sx={{ my: 2 }} />

                {/* Features */}
                <List dense>
                  {plan.features.map((feature, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <Check fontSize="small" color="success" sx={{ mr: 1 }} />
                      <ListItemText primary={feature} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editPlan ? "Chỉnh sửa gói dịch vụ" : "Tạo gói dịch vụ mới"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Tên gói"
              fullWidth
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <FormControl fullWidth>
              <InputLabel>Loại gói</InputLabel>
              <Select
                value={form.type}
                label="Loại gói"
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <MenuItem value="prepaid">Trả trước</MenuItem>
                <MenuItem value="postpaid">Trả sau</MenuItem>
                <MenuItem value="vip">VIP Membership</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Giá (VNĐ)"
              type="number"
              fullWidth
              value={form.price}
              onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
            />

            <TextField
              label="Mô tả"
              multiline
              rows={2}
              fullWidth
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <Divider />

            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="subtitle2">Tính năng</Typography>
                <Button size="small" onClick={handleAddFeature}>
                  Thêm tính năng
                </Button>
              </Box>

              {form.features.map((feature, index) => (
                <Box key={index} sx={{ display: "flex", gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                    placeholder="Nhập tính năng..."
                  />
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveFeature(index)}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              ))}
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
              }
              label="Kích hoạt gói"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button variant="contained" onClick={handleSave}>
            {editPlan ? "Cập nhật" : "Tạo mới"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Bạn có chắc chắn muốn xóa gói <strong>{planToDelete?.name}</strong>? 
            Hành động này không thể hoàn tác.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Plans;
