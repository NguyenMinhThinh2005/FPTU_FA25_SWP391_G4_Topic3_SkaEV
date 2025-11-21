import React from "react";
import { Grid, Paper, Box, Typography } from "@mui/material";
import {
  Assignment as AssignmentIcon,
  PendingActions as PendingIcon,
  Autorenew as ProcessingIcon,
  CheckCircle as ResolvedIcon,
  Warning as UrgentIcon,
} from "@mui/icons-material";

const StatCard = ({ title, value, icon, color }) => (
  <Paper sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    <Box>
      <Typography variant="body2" color="textSecondary">
        {title}
      </Typography>
      <Typography variant="h4" fontWeight="bold" color={color}>
        {value}
      </Typography>
    </Box>
    <Box sx={{ 
      backgroundColor: `${color}20`, 
      p: 1, 
      borderRadius: "50%", 
      display: "flex",
      color: color 
    }}>
      {icon}
    </Box>
  </Paper>
);

const SupportRequestStats = ({ stats }) => {
  return (
    <Grid container spacing={3} mb={3}>
      <Grid item xs={12} sm={6} md={2.4}>
        <StatCard 
          title="Tổng yêu cầu" 
          value={stats.total} 
          icon={<AssignmentIcon />} 
          color="#1976d2" 
        />
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <StatCard 
          title="Chờ xử lý" 
          value={stats.open} 
          icon={<PendingIcon />} 
          color="#ed6c02" 
        />
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <StatCard 
          title="Đang xử lý" 
          value={stats.inProgress} 
          icon={<ProcessingIcon />} 
          color="#0288d1" 
        />
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <StatCard 
          title="Đã giải quyết" 
          value={stats.resolved} 
          icon={<ResolvedIcon />} 
          color="#2e7d32" 
        />
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <StatCard 
          title="Khẩn cấp" 
          value={stats.urgent} 
          icon={<UrgentIcon />} 
          color="#d32f2f" 
        />
      </Grid>
    </Grid>
  );
};

export default SupportRequestStats;
