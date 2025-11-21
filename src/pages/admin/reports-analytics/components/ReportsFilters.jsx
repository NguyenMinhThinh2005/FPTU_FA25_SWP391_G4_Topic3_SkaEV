import React from "react";
import { Card, CardContent, Grid, FormControl, InputLabel, Select, MenuItem, Alert } from "@mui/material";
import { CalendarToday } from "@mui/icons-material";

const ReportsFilters = ({ 
  dateRange, 
  setDateRange, 
  granularity, 
  setGranularity, 
  dateRangeLabel 
}) => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Khoảng thời gian</InputLabel>
              <Select
                value={dateRange}
                label="Khoảng thời gian"
                onChange={(e) => setDateRange(e.target.value)}
              >
                <MenuItem value="today">Hôm nay</MenuItem>
                <MenuItem value="yesterday">Hôm qua</MenuItem>
                <MenuItem value="last7days">7 ngày qua</MenuItem>
                <MenuItem value="last30days">30 ngày qua</MenuItem>
                <MenuItem value="thisMonth">Tháng này</MenuItem>
                <MenuItem value="lastMonth">Tháng trước</MenuItem>
                <MenuItem value="thisYear">Năm nay</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Mức độ chi tiết</InputLabel>
              <Select
                value={granularity}
                label="Mức độ chi tiết"
                onChange={(e) => setGranularity(e.target.value)}
              >
                <MenuItem value="hourly">Theo giờ</MenuItem>
                <MenuItem value="daily">Theo ngày</MenuItem>
                <MenuItem value="weekly">Theo tuần</MenuItem>
                <MenuItem value="monthly">Theo tháng</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Alert severity="info" icon={<CalendarToday />}>
              Đang xem: <strong>{dateRangeLabel}</strong>
            </Alert>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ReportsFilters;
