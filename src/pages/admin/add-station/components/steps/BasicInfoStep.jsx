import React from "react";
import { Grid, TextField } from "@mui/material";

const BasicInfoStep = ({ formData, errors, handleInputChange }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Tên trạm sạc *"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          error={!!errors.name}
          helperText={errors.name}
          placeholder="Ví dụ: Green Mall Charging Hub"
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Mô tả"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          multiline
          rows={3}
          placeholder="Mô tả về trạm sạc, vị trí, đặc điểm..."
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Địa chỉ *"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          error={!!errors.address}
          helperText={errors.address}
          placeholder="Ví dụ: 123 Đường Nguyễn Huệ"
        />
      </Grid>
    </Grid>
  );
};

export default BasicInfoStep;
