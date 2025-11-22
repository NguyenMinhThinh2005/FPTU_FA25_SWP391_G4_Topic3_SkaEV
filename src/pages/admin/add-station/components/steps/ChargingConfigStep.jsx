import React from "react";
import { Grid, Typography, TextField, FormControl, InputLabel, Select, MenuItem } from "@mui/material";

const ChargingConfigStep = ({ formData, errors, handleInputChange }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Cấu hình cổng sạc
        </Typography>
      </Grid>
      
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Tổng số cổng sạc *"
          type="number"
          value={formData.totalPorts}
          onChange={(e) => handleInputChange('totalPorts', parseInt(e.target.value) || 0)}
          error={!!errors.totalPorts}
          helperText={errors.totalPorts}
          inputProps={{ min: 1 }}
        />
      </Grid>
      
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Cổng sạc nhanh (DC)"
          type="number"
          value={formData.fastChargePorts}
          onChange={(e) => handleInputChange('fastChargePorts', parseInt(e.target.value) || 0)}
          error={!!errors.fastChargePorts}
          helperText={errors.fastChargePorts}
          inputProps={{ min: 0 }}
        />
      </Grid>
      
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Cổng sạc tiêu chuẩn (AC)"
          type="number"
          value={formData.standardPorts}
          onChange={(e) => handleInputChange('standardPorts', parseInt(e.target.value) || 0)}
          error={!!errors.standardPorts}
          helperText={errors.standardPorts}
          inputProps={{ min: 0 }}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Giá mỗi kWh (VND)"
          type="number"
          value={formData.pricePerKwh}
          onChange={(e) => handleInputChange('pricePerKwh', parseFloat(e.target.value) || 0)}
          error={!!errors.pricePerKwh}
          helperText={errors.pricePerKwh}
          inputProps={{ min: 0, step: 100 }}
          InputProps={{
            endAdornment: <Typography variant="body2" color="text.secondary">₫</Typography>
          }}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Giờ hoạt động</InputLabel>
          <Select
            value={formData.operatingHours}
            label="Giờ hoạt động"
            onChange={(e) => handleInputChange('operatingHours', e.target.value)}
          >
            <MenuItem value="24/7">24/7</MenuItem>
            <MenuItem value="6:00-22:00">6:00-22:00</MenuItem>
            <MenuItem value="8:00-20:00">8:00-20:00</MenuItem>
            <MenuItem value="Custom">Tùy chỉnh</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Trạng thái</InputLabel>
          <Select
            value={formData.status}
            label="Trạng thái"
            onChange={(e) => handleInputChange('status', e.target.value)}
          >
            <MenuItem value="active">Hoạt động</MenuItem>
            <MenuItem value="maintenance">Bảo trì</MenuItem>
            <MenuItem value="offline">Tạm ngưng</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
};

export default ChargingConfigStep;
