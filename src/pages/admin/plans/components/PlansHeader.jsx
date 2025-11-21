import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { Add } from "@mui/icons-material";

const PlansHeader = ({ onAdd }) => {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
      <Typography variant="h4" fontWeight="bold">
        Quản lý gói dịch vụ
      </Typography>
      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={onAdd}
      >
        Thêm gói mới
      </Button>
    </Box>
  );
};

export default PlansHeader;
