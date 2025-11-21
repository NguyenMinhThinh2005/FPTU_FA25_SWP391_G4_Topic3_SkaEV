import React from "react";
import { Grid, Card, CardContent, Typography, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "../../../../utils/helpers";

const YearlyAnalysisTab = ({ data }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Tổng quan năm {data.year}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h4">{data.totalBookings}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng đặt chỗ
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h4">{formatCurrency(data.totalRevenue)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Doanh thu
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h4">{data.totalEnergyKwh.toFixed(0)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Năng lượng (kWh)
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h4">{data.uniqueCustomers}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Khách hàng
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h4">{data.completionRate.toFixed(1)}%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tỷ lệ hoàn thành
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h4" color={data.growthRate >= 0 ? "success.main" : "error.main"}>
                    {data.growthRate >= 0 ? "+" : ""}{data.growthRate.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tăng trưởng
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
              Xu hướng theo tháng
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.monthlyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthName" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="totalRevenue" fill="#8884d8" name="Doanh thu (VNĐ)" />
                <Bar yAxisId="right" dataKey="totalBookings" fill="#82ca9d" name="Số đặt chỗ" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Chi tiết theo tháng
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tháng</TableCell>
                    <TableCell align="right">Đặt chỗ</TableCell>
                    <TableCell align="right">Hoàn thành</TableCell>
                    <TableCell align="right">Doanh thu</TableCell>
                    <TableCell align="right">Năng lượng (kWh)</TableCell>
                    <TableCell align="right">Tỷ lệ sử dụng</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.monthlyBreakdown.map((month) => (
                    <TableRow key={month.month}>
                      <TableCell>{month.monthName}</TableCell>
                      <TableCell align="right">{month.totalBookings}</TableCell>
                      <TableCell align="right">{month.completedSessions}</TableCell>
                      <TableCell align="right">{formatCurrency(month.totalRevenue)}</TableCell>
                      <TableCell align="right">{month.totalEnergyKwh.toFixed(1)}</TableCell>
                      <TableCell align="right">{month.utilizationRate.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default YearlyAnalysisTab;