import React from "react";
import { Paper, Box, TextField, FormControl, InputLabel, Select, MenuItem, InputAdornment } from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";

const SupportRequestFilters = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  categoryFilter,
  setCategoryFilter
}) => {
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box display="flex" gap={2} flexWrap="wrap">
        <TextField
          label="Tìm kiếm"
          variant="outlined"
          size="small"
          placeholder="Tiêu đề, nội dung, người gửi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1, minWidth: "200px" }}
        />
        
        <FormControl size="small" sx={{ minWidth: "150px" }}>
          <InputLabel>Trạng thái</InputLabel>
          <Select
            value={statusFilter}
            label="Trạng thái"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="open">Chờ xử lý</MenuItem>
            <MenuItem value="in_progress">Đang xử lý</MenuItem>
            <MenuItem value="resolved">Đã giải quyết</MenuItem>
            <MenuItem value="closed">Đã đóng</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: "150px" }}>
          <InputLabel>Độ ưu tiên</InputLabel>
          <Select
            value={priorityFilter}
            label="Độ ưu tiên"
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="low">Thấp</MenuItem>
            <MenuItem value="medium">Trung bình</MenuItem>
            <MenuItem value="high">Cao</MenuItem>
            <MenuItem value="urgent">Khẩn cấp</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: "150px" }}>
          <InputLabel>Danh mục</InputLabel>
          <Select
            value={categoryFilter}
            label="Danh mục"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="technical">Kỹ thuật</MenuItem>
            <MenuItem value="billing">Thanh toán</MenuItem>
            <MenuItem value="account">Tài khoản</MenuItem>
            <MenuItem value="other">Khác</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Paper>
  );
};

export default SupportRequestFilters;
