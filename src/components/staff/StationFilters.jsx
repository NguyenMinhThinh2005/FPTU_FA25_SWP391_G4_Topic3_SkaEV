import React from "react";
import {
  Box,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button
} from "@mui/material";
import { Search, FilterList, Clear } from "@mui/icons-material";

export default function StationFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  locationFilter,
  onLocationChange,
  locations = [],
  onClearFilters,
  showClear = true
}) {
  const hasActiveFilters = searchQuery || statusFilter !== "all" || locationFilter !== "all";

  return (
    <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
      <TextField
        size="small"
        placeholder="Tìm kiếm trạm sạc..."
        value={searchQuery}
        onChange={(e) => onSearchChange?.(e.target.value)}
        sx={{ minWidth: 250, flex: 1 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Trạng thái</InputLabel>
        <Select
          value={statusFilter}
          label="Trạng thái"
          onChange={(e) => onStatusChange?.(e.target.value)}
        >
          <MenuItem value="all">Tất cả</MenuItem>
          <MenuItem value="operational">Đang hoạt động</MenuItem>
          <MenuItem value="charging">Đang sạc</MenuItem>
          <MenuItem value="available">Sẵn sàng</MenuItem>
          <MenuItem value="maintenance">Bảo trì</MenuItem>
          <MenuItem value="offline">Offline</MenuItem>
          <MenuItem value="warning">Cảnh báo</MenuItem>
          <MenuItem value="error">Lỗi</MenuItem>
        </Select>
      </FormControl>

      {locations.length > 0 && (
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Địa điểm</InputLabel>
          <Select
            value={locationFilter}
            label="Địa điểm"
            onChange={(e) => onLocationChange?.(e.target.value)}
          >
            <MenuItem value="all">Tất cả</MenuItem>
            {locations.map((loc) => (
              <MenuItem key={loc} value={loc}>
                {loc}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {showClear && hasActiveFilters && (
        <Button
          size="small"
          startIcon={<Clear />}
          onClick={onClearFilters}
          variant="outlined"
        >
          Xóa bộ lọc
        </Button>
      )}

      {hasActiveFilters && (
        <Chip
          icon={<FilterList />}
          label={`${
            [searchQuery, statusFilter !== "all", locationFilter !== "all"].filter(Boolean).length
          } bộ lọc`}
          size="small"
          color="primary"
          variant="outlined"
        />
      )}
    </Box>
  );
}
