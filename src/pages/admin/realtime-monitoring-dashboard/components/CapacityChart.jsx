import React from "react";
import { Card, CardContent, Typography, Divider, Box, Grid, Paper } from "@mui/material";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

const CapacityChart = ({ realtimeData }) => {
  const capacityData = realtimeData
    ? [
        {
          name: "Đang sử dụng",
          value: realtimeData.occupiedSlots || 0,
          color: "#ff8042",
        },
        {
          name: "Khả dụng",
          value: realtimeData.availableSlots || 0,
          color: "#00c49f",
        },
        {
          name: "Bảo trì",
          value: realtimeData.maintenanceSlots || 0,
          color: "#ffbb28",
        },
      ]
    : [];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Phân bổ cổng sạc
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={capacityData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {capacityData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <RechartsTooltip />
          </PieChart>
        </ResponsiveContainer>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={1}>
            <Grid item xs={4}>
              <Paper sx={{ p: 1, textAlign: "center", bgcolor: "#ff804220" }}>
                <Typography variant="h6" fontWeight="bold">
                  {realtimeData?.occupiedSlots || 0}
                </Typography>
                <Typography variant="caption">Đang dùng</Typography>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper sx={{ p: 1, textAlign: "center", bgcolor: "#00c49f20" }}>
                <Typography variant="h6" fontWeight="bold">
                  {realtimeData?.availableSlots || 0}
                </Typography>
                <Typography variant="caption">Khả dụng</Typography>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper sx={{ p: 1, textAlign: "center", bgcolor: "#ffbb2820" }}>
                <Typography variant="h6" fontWeight="bold">
                  {realtimeData?.maintenanceSlots || 0}
                </Typography>
                <Typography variant="caption">Bảo trì</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CapacityChart;