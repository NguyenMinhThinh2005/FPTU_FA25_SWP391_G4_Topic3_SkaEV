import React from "react";
import { Grid, Card, CardContent, Typography, Alert } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";

const HourlyAnalysisTab = ({ data, peakHour }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">Không có dữ liệu phân tích theo giờ</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Phân bố sử dụng theo giờ 
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Giờ cao điểm: {peakHour}:00 - {peakHour + 1}:00
            </Alert>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" label={{ value: "Giờ", position: "insideBottom", offset: -5 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sessionCount" fill="#8884d8" name="Tổng phiên" />
                <Bar dataKey="completedCount" fill="#82ca9d" name="Hoàn thành" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Doanh thu theo giờ
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" name="Doanh thu (VNĐ)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default HourlyAnalysisTab;