import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";

const AddStationHeader = ({ onBack }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
      <IconButton onClick={onBack} sx={{ mr: 2 }}>
        <ArrowBack />
      </IconButton>
      <Box>
        <Typography variant="h4" fontWeight="bold">
          Thêm trạm sạc mới
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Tạo trạm sạc mới cho mạng lưới SkaEV
        </Typography>
      </Box>
    </Box>
  );
};

export default AddStationHeader;
