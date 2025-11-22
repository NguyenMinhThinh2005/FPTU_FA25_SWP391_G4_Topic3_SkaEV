import React from "react";
import { Paper, Grid, FormControl, InputLabel, Select, MenuItem, Button } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

const AnalyticsFilters = ({ 
  dateRange, 
  handleDateRangeChange, 
  customDateMode, 
  startDate, 
  setStartDate, 
  endDate, 
  setEndDate, 
  onApply 
}) => {
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Khoảng thời gian</InputLabel>
            <Select value={dateRange} onChange={handleDateRangeChange} label="Khoảng thời gian">
              <MenuItem value="7days">7 ngày qua</MenuItem>
              <MenuItem value="30days">30 ngày qua</MenuItem>
              <MenuItem value="3months">3 tháng qua</MenuItem>
              <MenuItem value="6months">6 tháng qua</MenuItem>
              <MenuItem value="1year">1 năm qua</MenuItem>
              <MenuItem value="custom">Tùy chỉnh</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        {customDateMode && (
          <>
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Từ ngày"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                maxDate={new Date()}
                slotProps={{ textField: { fullWidth: true, size: "small" } }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Đến ngày"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                maxDate={new Date()}
                slotProps={{ textField: { fullWidth: true, size: "small" } }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button fullWidth variant="contained" onClick={onApply}>
                Áp dụng
              </Button>
            </Grid>
          </>
        )}
      </Grid>
    </Paper>
  );
};

export default AnalyticsFilters;