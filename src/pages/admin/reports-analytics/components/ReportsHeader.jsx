import React from "react";
import { Box, Typography, Button, Menu, MenuItem } from "@mui/material";
import { Download, Refresh } from "@mui/icons-material";

const ReportsHeader = ({ 
  onExportClick, 
  exportMenuAnchor, 
  onExportClose, 
  onExport, 
  onRefresh 
}) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
      <Box>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Báo cáo & Phân tích
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Theo dõi doanh thu, năng lượng và hoạt động hệ thống
        </Typography>
      </Box>
      <Box sx={{ display: "flex", gap: 2 }}>
        <Button 
          variant="outlined" 
          startIcon={<Download />}
          onClick={onExportClick}
        >
          Xuất báo cáo
        </Button>
        <Menu
          anchorEl={exportMenuAnchor}
          open={Boolean(exportMenuAnchor)}
          onClose={onExportClose}
        >
          <MenuItem onClick={() => onExport("excel")}>
            Xuất Excel (.xlsx)
          </MenuItem>
          <MenuItem onClick={() => onExport("pdf")}>
            Xuất PDF (.pdf)
          </MenuItem>
        </Menu>
        <Button variant="contained" startIcon={<Refresh />} onClick={onRefresh}>
          Làm mới
        </Button>
      </Box>
    </Box>
  );
};

export default ReportsHeader;
