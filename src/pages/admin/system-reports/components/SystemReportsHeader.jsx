import React from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button
} from "@mui/material";
import { Refresh } from "@mui/icons-material";

const SystemReportsHeader = ({ dateRange, setDateRange, onRefresh }) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          Báo cáo hệ thống
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Khoảng thời gian</InputLabel>
            <Select
              value={dateRange}
              label="Khoảng thời gian"
              onChange={(e) => setDateRange(e.target.value)}
            >
              <MenuItem value="last7days">7 ngày qua</MenuItem>
              <MenuItem value="last30days">30 ngày qua</MenuItem>
              <MenuItem value="last3months">3 tháng qua</MenuItem>
              <MenuItem value="last6months">6 tháng qua</MenuItem>
              <MenuItem value="lastyear">Năm qua</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            startIcon={<Refresh />}
            onClick={onRefresh}
          >
            Làm mới
          </Button>
        </Box>
      </Box>
      <Typography variant="body1" color="text.secondary">
        Báo cáo tổng hợp dữ liệu và hiệu suất hoạt động của hệ thống
      </Typography>
    </Box>
  );
};

export default SystemReportsHeader;
