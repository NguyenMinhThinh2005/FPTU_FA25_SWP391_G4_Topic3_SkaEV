import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";

const SupportRequestHeader = ({ onRefresh }) => {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
      <Typography variant="h4" fontWeight="bold" color="primary">
        Quản lý Yêu cầu Hỗ trợ
      </Typography>
      <Button
        variant="outlined"
        startIcon={<RefreshIcon />}
        onClick={onRefresh}
      >
        Làm mới
      </Button>
    </Box>
  );
};

export default SupportRequestHeader;
