import React from "react";
import { Box, Typography, IconButton, Button, Chip } from "@mui/material";
import { ArrowBack, Download } from "@mui/icons-material";

const AnalyticsHeader = ({ detailedAnalytics, navigate, onExport }) => {
  return (
    <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <IconButton onClick={() => navigate("/admin/stations")}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {detailedAnalytics.stationName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {detailedAnalytics.location}
          </Typography>
        </Box>
        <Chip
          label={detailedAnalytics.status}
          color={detailedAnalytics.status === "active" ? "success" : "default"}
          size="small"
        />
      </Box>
      <Button
        variant="outlined"
        startIcon={<Download />}
        onClick={onExport}
      >
        Xuất báo cáo
      </Button>
    </Box>
  );
};

export default AnalyticsHeader;