import React from 'react';
import { Box, Typography, Alert, Grid, Card, CardContent, Chip } from '@mui/material';
import { DirectionsCar } from '@mui/icons-material';

const CustomerVehicles = ({ vehicles }) => {
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          Phương tiện ({vehicles.length})
        </Typography>
      </Box>

      {vehicles.length === 0 ? (
        <Alert severity="info">Chưa đăng ký phương tiện nào</Alert>
      ) : (
        <Grid container spacing={2}>
          {vehicles.map((vehicle) => (
            <Grid item xs={12} md={6} key={vehicle.vehicleId}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                    <DirectionsCar color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {vehicle.brand} {vehicle.model}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {vehicle.licensePlate}
                      </Typography>
                    </Box>
                    <Chip
                      label={vehicle.status === "active" ? "Hoạt động" : "Không hoạt động"}
                      color={vehicle.status === "active" ? "success" : "default"}
                      size="small"
                      sx={{ ml: "auto" }}
                    />
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Dung lượng pin
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {vehicle.batteryCapacity} kWh
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Loại cổng
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {vehicle.connectorType}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default CustomerVehicles;
