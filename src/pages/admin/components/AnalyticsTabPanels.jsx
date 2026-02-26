import React from "react";
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Alert,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@mui/material";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { formatCurrency } from "../../../utils/helpers";

// ─── Time Series Tab ───────────────────────────────────────────────
export const TimeSeriesTab = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <Card>
                <CardContent>
                    <Alert severity="info">Không có dữ liệu cho khoảng thời gian này</Alert>
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
                            Biểu đồ doanh thu và đặt chỗ theo thời gian
                        </Typography>
                        <ResponsiveContainer width="100%" height={400}>
                            <AreaChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="label" />
                                <YAxis yAxisId="left" />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip />
                                <Legend />
                                <Area
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#8884d8"
                                    fill="#8884d8"
                                    name="Doanh thu (VNĐ)"
                                />
                                <Area
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="bookings"
                                    stroke="#82ca9d"
                                    fill="#82ca9d"
                                    name="Số đặt chỗ"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </Grid>

            {/* Energy consumption chart removed as requested. */}

            <Grid item xs={12} md={6}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Tỷ lệ hoàn thành vs Hủy
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="label" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="completedSessions"
                                    stroke="#00C49F"
                                    name="Hoàn thành"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="cancelledSessions"
                                    stroke="#FF8042"
                                    name="Đã hủy"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};

// ─── Hourly Analysis Tab ───────────────────────────────────────────
export const HourlyAnalysisTab = ({ data, peakHour }) => {
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

// ─── Monthly Analysis Tab ──────────────────────────────────────────
export const MonthlyAnalysisTab = ({ data }) => {
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
                                    <Typography variant="body2" color="text.secondary">Tổng đặt chỗ</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Paper sx={{ p: 2, textAlign: "center" }}>
                                    <Typography variant="h4">{formatCurrency(data.totalRevenue)}</Typography>
                                    <Typography variant="body2" color="text.secondary">Doanh thu</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Paper sx={{ p: 2, textAlign: "center" }}>
                                    <Typography variant="h4">{data.totalEnergyKwh.toFixed(1)}</Typography>
                                    <Typography variant="body2" color="text.secondary">Năng lượng (kWh)</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Paper sx={{ p: 2, textAlign: "center" }}>
                                    <Typography variant="h4">{data.completionRate.toFixed(1)}%</Typography>
                                    <Typography variant="body2" color="text.secondary">Tỷ lệ hoàn thành</Typography>
                                </Paper>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Phân tích theo ngày trong tháng</Typography>
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={data.dailyBreakdown}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), "dd/MM")} />
                                <YAxis yAxisId="left" />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip labelFormatter={(date) => format(new Date(date), "dd/MM/yyyy")} />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="totalRevenue" stroke="#8884d8" name="Doanh thu (VNĐ)" />
                                <Line yAxisId="right" type="monotone" dataKey="totalBookings" stroke="#82ca9d" name="Số đặt chỗ" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};

// ─── Yearly Analysis Tab ───────────────────────────────────────────
export const YearlyAnalysisTab = ({ data }) => {
    return (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Tổng quan năm {data.year}</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6} md={2}>
                                <Paper sx={{ p: 2, textAlign: "center" }}>
                                    <Typography variant="h4">{data.totalBookings}</Typography>
                                    <Typography variant="body2" color="text.secondary">Tổng đặt chỗ</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={6} md={2}>
                                <Paper sx={{ p: 2, textAlign: "center" }}>
                                    <Typography variant="h4">{formatCurrency(data.totalRevenue)}</Typography>
                                    <Typography variant="body2" color="text.secondary">Doanh thu</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={6} md={2}>
                                <Paper sx={{ p: 2, textAlign: "center" }}>
                                    <Typography variant="h4">{data.totalEnergyKwh.toFixed(0)}</Typography>
                                    <Typography variant="body2" color="text.secondary">Năng lượng (kWh)</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={6} md={2}>
                                <Paper sx={{ p: 2, textAlign: "center" }}>
                                    <Typography variant="h4">{data.uniqueCustomers}</Typography>
                                    <Typography variant="body2" color="text.secondary">Khách hàng</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={6} md={2}>
                                <Paper sx={{ p: 2, textAlign: "center" }}>
                                    <Typography variant="h4">{data.completionRate.toFixed(1)}%</Typography>
                                    <Typography variant="body2" color="text.secondary">Tỷ lệ hoàn thành</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={6} md={2}>
                                <Paper sx={{ p: 2, textAlign: "center" }}>
                                    <Typography variant="h4" color={data.growthRate >= 0 ? "success.main" : "error.main"}>
                                        {data.growthRate >= 0 ? "+" : ""}{data.growthRate.toFixed(1)}%
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">Tăng trưởng</Typography>
                                </Paper>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Xu hướng theo tháng</Typography>
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
                        <Typography variant="h6" gutterBottom>Chi tiết theo tháng</Typography>
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
