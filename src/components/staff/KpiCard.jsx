import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";

export default function KpiCard({ icon, label, value, color = "primary", trend, trendLabel }) {
  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Box 
              sx={{ 
                color: `${color}.main`,
                bgcolor: `${color}.lighter`,
                p: 1.5,
                borderRadius: 2,
                display: 'flex'
              }}
            >
              {icon}
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={700} color={color}>
                {value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {label}
              </Typography>
            </Box>
          </Box>
          {trend && (
            <Box textAlign="right">
              <Typography 
                variant="body2" 
                color={trend > 0 ? "success.main" : "error.main"}
                fontWeight={600}
              >
                {trend > 0 ? '+' : ''}{trend}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {trendLabel || "vs tháng trước"}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
