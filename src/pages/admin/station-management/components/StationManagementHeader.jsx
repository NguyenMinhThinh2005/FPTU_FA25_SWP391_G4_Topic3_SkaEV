import React from "react";
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Button } from "@mui/material";
import { Add } from "@mui/icons-material";
import PropTypes from "prop-types";

const StationManagementHeader = ({ filterStatus, setFilterStatus, onCreateNew }) => {
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
          Quản lý trạm sạc
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Giám sát và quản lý mạng lưới trạm sạc xe điện của bạn
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Lọc trạng thái</InputLabel>
          <Select
            value={filterStatus}
            label="Lọc trạng thái"
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value="all">Tất cả trạm</MenuItem>
            <MenuItem value="active">Hoạt động</MenuItem>
            <MenuItem value="maintenance">Bảo trì</MenuItem>
            <MenuItem value="offline">Ngoại tuyến</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onCreateNew}
        >
          Thêm trạm sạc
        </Button>
      </Box>
    </Box>
  );
};

StationManagementHeader.propTypes = {
  filterStatus: PropTypes.string.isRequired,
  setFilterStatus: PropTypes.func.isRequired,
  onCreateNew: PropTypes.func.isRequired,
};

export default StationManagementHeader;
