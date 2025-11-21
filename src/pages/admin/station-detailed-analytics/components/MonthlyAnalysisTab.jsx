import React from "react";
import { Grid, Card, CardContent, Typography, Paper } from "@mui/material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { formatCurrency } from "../../../../utils/helpers";

const MonthlyAnalysisTab = ({ data }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Tổng quan tháng {data.month}/{data.year}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h4">{data.totalBookings}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng đặt chỗ
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h4">{formatCurrency(data.totalRevenue)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Doanh thu
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h4">{data.totalEnergyKwh.toFixed(1)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Năng lượng (kWh)
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h4">{data.completionRate.toFixed(1)}%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tỷ lệ hoàn thành
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Phân tích theo ngày trong tháng
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data.dailyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), "dd/MM")} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip labelFormatter={(date) => format(new Date(date), "dd/MM/yyyy")} />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="totalRevenue"
                  stroke="#8884d8"
                  name="Doanh thu (VNĐ)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="totalBookings"
                  stroke="#82ca9d"
                  name="Số đặt chỗ"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default MonthlyAnalysisTab;