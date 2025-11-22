import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  InputAdornment,
  FormControlLabel,
  Switch
} from "@mui/material";

const PlanDialog = ({
  open,
  onClose,
  editingPlan,
  formData,
  setFormData,
  onSubmit
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
        <Button onClick={onClose}>Hủy</Button>
        <Button onClick={onSubmit} variant="contained">
          {editingPlan ? "Cập nhật" : "Tạo mới"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlanDialog;
