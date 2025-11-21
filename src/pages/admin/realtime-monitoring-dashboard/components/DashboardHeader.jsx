import React from "react";
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Tooltip, IconButton } from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";

const DashboardHeader = ({ stations, selectedStation, onStationChange, onRefresh }) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 3,
      }}
    >
      <Box>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Giám sát Thời gian Thực
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Theo dõi công suất, phiên sạc và trạng thái trạm
        </Typography>
      </Box>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <FormControl sx={{ minWidth: 250 }}>
          <InputLabel>Chọn trạm</InputLabel>
          <Select
            value={selectedStation || ""}
            label="Chọn trạm"
            onChange={(e) => onStationChange(e.target.value)}
          >
            {stations.map((station) => (
              <MenuItem key={station.stationId} value={station.stationId}>
                {station.stationName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Tooltip title="Làm mới ngay">
          <IconButton color="primary" onClick={onRefresh}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default DashboardHeader;