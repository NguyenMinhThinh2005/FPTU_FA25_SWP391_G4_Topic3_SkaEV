import React from "react";
import { Grid, Typography, Autocomplete, TextField, Chip, Divider } from "@mui/material";

const AmenitiesStep = ({ formData, amenitiesOptions, handleInputChange }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Tiện ích và dịch vụ
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Chọn các tiện ích có sẵn tại trạm sạc
        </Typography>
      </Grid>
      
      <Grid item xs={12}>
        <Autocomplete
          multiple
          options={amenitiesOptions}
          value={formData.amenities}
          onChange={(event, newValue) => handleInputChange('amenities', newValue)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                variant="outlined"
                label={option}
                {...getTagProps({ index })}
                key={option}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Tiện ích"
              placeholder="Chọn tiện ích..."
            />
          )}
        />
      </Grid>
      
      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>
          Thông tin liên hệ
        </Typography>
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Số điện thoại liên hệ"
          value={formData.contactPhone}
          onChange={(e) => handleInputChange('contactPhone', e.target.value)}
          placeholder="Ví dụ: +84 901 234 567"
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Email liên hệ"
          type="email"
          value={formData.contactEmail}
          onChange={(e) => handleInputChange('contactEmail', e.target.value)}
          placeholder="Ví dụ: contact@station.com"
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Tên người quản lý"
          value={formData.managerName}
          onChange={(e) => handleInputChange('managerName', e.target.value)}
          placeholder="Ví dụ: Nguyễn Văn A"
        />
      </Grid>
    </Grid>
  );
};

export default AmenitiesStep;
