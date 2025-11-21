import React from "react";
import { Box, Typography, Grid, Card, CardContent } from "@mui/material";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

const EnergyTab = ({ energyData, dateRangeLabel }) => {
  if (!energyData) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Báo cáo năng lượng - {dateRangeLabel}
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {(energyData.totalEnergyKwh || 0).toFixed(2)} kWh
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tổng năng lượng
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {(energyData.averageEnergyPerSession || 0).toFixed(2)} kWh
              </Typography>
              <Typography variant="body2" color="text.secondary">
                TB/phiên sạc
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {(energyData.peakPowerKw || 0).toFixed(0)} kW
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Công suất đỉnh
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Energy Chart */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Biểu đồ năng lượng tiêu thụ
          </Typography>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={energyData.timeSeriesData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatDate} />
              <YAxis label={{ value: "kWh", angle: -90, position: "insideLeft" }} />
              <Tooltip labelFormatter={formatDate} />
              <Legend />
              <Bar dataKey="energyKwh" name="Năng lượng (kWh)" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Energy by Connector Type */}
      {energyData.byConnectorType && energyData.byConnectorType.length > 0 && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Năng lượng theo loại cổng sạc
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={energyData.byConnectorType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.connectorType}: ${entry.energyKwh.toFixed(1)} kWh`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="energyKwh"
                >
                  {energyData.byConnectorType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default EnergyTab;
