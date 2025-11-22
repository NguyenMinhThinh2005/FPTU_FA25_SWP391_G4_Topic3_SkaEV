import React from "react";
import { Box, Typography } from "@mui/material";
import { Dashboard as DashboardIcon } from "@mui/icons-material";

const DashboardHeader = () => {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <DashboardIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 0 }}>
            Quản trị hệ thống
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Giám sát và quản lý mạng lưới sạc SkaEV
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardHeader;
