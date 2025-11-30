import React from "react";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  TextField,
} from "@mui/material";
import PropTypes from 'prop-types';

const AnalyticsHeader = ({
  dateMode,
  selectedFrom,
  setSelectedFrom,
  selectedTo,
  setSelectedTo,
  fetchAnalyticsData,
  loading
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 4,
      }}
    >
      <Box>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Phân tích tổng quan
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Báo cáo chi tiết về doanh thu, sử dụng và hiệu suất hệ thống
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            views={dateMode === 'day' ? ['year','month','day'] : dateMode === 'month' ? ['year','month'] : ['year']}
            label={dateMode === 'day' ? 'Từ ngày' : dateMode === 'month' ? 'Từ tháng' : 'Từ năm'}
            value={selectedFrom}
            onChange={(d) => setSelectedFrom(d)}
            maxDate={new Date()}
            renderInput={(params) => <TextField {...params} size="small" />}
          />

          <DatePicker
            views={dateMode === 'day' ? ['year','month','day'] : dateMode === 'month' ? ['year','month'] : ['year']}
            label={dateMode === 'day' ? 'Đến ngày' : dateMode === 'month' ? 'Đến tháng' : 'Đến năm'}
            value={selectedTo}
            onChange={(d) => setSelectedTo(d)}
            maxDate={new Date()}
            renderInput={(params) => <TextField {...params} size="small" />}
          />
        </LocalizationProvider>

        <Button 
          variant="contained" 
          onClick={fetchAnalyticsData} 
          disabled={loading} 
          startIcon={loading ? <CircularProgress size={18} /> : null}
        >
          Áp dụng
        </Button>
      </Box>
    </Box>
  );
};

AnalyticsHeader.propTypes = {
  dateMode: PropTypes.string.isRequired,
  selectedFrom: PropTypes.instanceOf(Date),
  setSelectedFrom: PropTypes.func.isRequired,
  selectedTo: PropTypes.instanceOf(Date),
  setSelectedTo: PropTypes.func.isRequired,
  fetchAnalyticsData: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default AnalyticsHeader;
