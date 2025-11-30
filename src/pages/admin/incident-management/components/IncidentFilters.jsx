import React from 'react';
import { Paper, Grid, FormControl, InputLabel, Select, MenuItem, Button, Box } from '@mui/material';
import PropTypes from 'prop-types';

const IncidentFilters = ({ filters, setFilters, clearFilters }) => {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Grid container spacing={2} alignItems="center" justifyContent="space-between">
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={filters.status || ''}
              label="Trạng thái"
              onChange={(e) => setFilters({ status: e.target.value || null })}
            >
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value="open">Chưa xử lý</MenuItem>
              <MenuItem value="in_progress">Đang xử lý</MenuItem>
              <MenuItem value="resolved">Đã xử lý</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Mức độ nghiêm trọng</InputLabel>
            <Select
              value={filters.severity || ''}
              label="Mức độ nghiêm trọng"
              onChange={(e) => setFilters({ severity: e.target.value || null })}
            >
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value="critical">Nghiêm trọng</MenuItem>
              <MenuItem value="medium">Trung bình</MenuItem>
              <MenuItem value="low">Nhẹ</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={12} md={3}>
          <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Button size="large" variant="outlined" onClick={clearFilters}>
              Xóa bộ lọc
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

IncidentFilters.propTypes = {
  filters: PropTypes.object.isRequired,
  setFilters: PropTypes.func.isRequired,
  clearFilters: PropTypes.func.isRequired
};

export default IncidentFilters;
