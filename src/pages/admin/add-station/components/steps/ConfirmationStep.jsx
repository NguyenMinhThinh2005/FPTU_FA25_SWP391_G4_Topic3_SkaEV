import React from "react";
import { Box, Typography, Paper, Grid, Chip, Alert } from "@mui/material";
import { formatCurrency } from "../../../../../utils/helpers";

const ConfirmationStep = ({ formData }) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Xác nhận thông tin trạm sạc
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" color="primary">
              {formData.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formData.address}, TP. Hồ Chí Minh
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" fontWeight="medium">
              Tổng số cổng sạc: {formData.totalPorts}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Sạc nhanh (DC): {formData.fastChargePorts}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Sạc tiêu chuẩn (AC): {formData.standardPorts}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" fontWeight="medium">
              Giá: {formatCurrency(formData.pricePerKwh)}/kWh
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Giờ hoạt động: {formData.operatingHours}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Trạng thái: {formData.status === 'active' ? 'Hoạt động' : 
                         formData.status === 'maintenance' ? 'Bảo trì' : 'Tạm ngưng'}
            </Typography>
          </Grid>
          
          {formData.amenities.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                Tiện ích:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.amenities.map((amenity) => (
                  <Chip key={amenity} label={amenity} size="small" />
                ))}
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>
      
      <Alert severity="info">
        Sau khi tạo trạm sạc, thông tin sẽ được cập nhật vào bảng "Station Performance" 
        trong trang Dashboard.
      </Alert>
    </Box>
  );
};

export default ConfirmationStep;
