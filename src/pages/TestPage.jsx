import React from "react";
import { Box, Typography, Button, Card, CardContent } from "@mui/material";
import { ElectricCar, CheckCircle } from "@mui/icons-material";

const TestPage = () => {
  return (
    <Box sx={{ p: 4 }}>
      <Card sx={{ maxWidth: 600, mx: "auto" }}>
        <CardContent sx={{ textAlign: "center" }}>
          <ElectricCar sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            🎉 SkaEV Project Ready!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            All Phase 4 features have been successfully implemented:
          </Typography>

          <Box sx={{ textAlign: "left", mb: 3 }}>
            <Typography
              variant="body2"
              sx={{ display: "flex", alignItems: "center", mb: 1 }}
            >
              <CheckCircle
                sx={{ color: "success.main", mr: 1, fontSize: 18 }}
              />
              Advanced Analytics Dashboard with charts
            </Typography>
            <Typography
              variant="body2"
              sx={{ display: "flex", alignItems: "center", mb: 1 }}
            >
              <CheckCircle
                sx={{ color: "success.main", mr: 1, fontSize: 18 }}
              />
              Hệ thống quản lý trạm sạc
            </Typography>

            <Typography
              variant="body2"
              sx={{ display: "flex", alignItems: "center", mb: 1 }}
            >
              <CheckCircle
                sx={{ color: "success.main", mr: 1, fontSize: 18 }}
              />
              Real-time Data Visualization
            </Typography>
          </Box>

          <Button variant="contained" size="large">
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TestPage;
