/* eslint-disable */
import React, { useState } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Avatar,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Alert,
    LinearProgress} from "@mui/material";
import {
    Receipt,
    Download,
    TrendingUp,
    TrendingDown,
    Compare,
    CalendarMonth,
    AttachMoney,
    ElectricCar,
    Schedule,
    Assessment} from "@mui/icons-material";
import { formatCurrency } from "../../utils/helpers";
import useBookingStore from "../../store/bookingStore";

const MonthlyCostReports = () => {
    const [selectedMonth, setSelectedMonth] = useState("2025-09");
    const { bookingHistory, getBookingStats} = useBookingStore();

    // Calculate monthly data from booking store
    const bookingStats = getBookingStats();
    const completedBookings = bookingHistory.filter(b => b.status === 'completed');

    const monthlyReports = {
        "2025-09": {
            totalCost: bookingStats.totalAmount || 2450000,
            totalSessions: bookingStats.total || 15,
            totalEnergy: bookingStats.totalEnergyCharged || 450,
            avgCostPerKwh: bookingStats.totalEnergyCharged > 0 ? Math.round(bookingStats.totalAmount / bookingStats.totalEnergyCharged) : 5444,
            avgSessionCost: bookingStats.total > 0 ? Math.round(bookingStats.totalAmount / bookingStats.total) : 163333,
            comparedToLastMonth: {
                costChange: 12.5,
                sessionsChange: -6.7,
                energyChange: 8.3},
            dailyBreakdown: [
                { date: "2025-09-01", sessions: 1, energy: 32, cost: 174000 },
                { date: "2025-09-03", sessions: 1, energy: 28, cost: 152000 },
                { date: "2025-09-06", sessions: 2, energy: 64, cost: 348000 },
                { date: "2025-09-10", sessions: 1, energy: 35, cost: 190000 },
                { date: "2025-09-14", sessions: 2, energy: 58, cost: 315000 },
                { date: "2025-09-18", sessions: 1, energy: 29, cost: 158000 },
                { date: "2025-09-22", sessions: 1, energy: 31, cost: 168000 },
                { date: "2025-09-25", sessions: 2, energy: 62, cost: 337000 },
                { date: "2025-09-28", sessions: 1, energy: 33, cost: 179000 },
                { date: "2025-09-30", sessions: 3, energy: 78, cost: 424000 },
            ],
            stationBreakdown: [
                { name: "Vincom Mega Mall", sessions: 5, energy: 150, cost: 815000 },
                { name: "AEON Mall BÌnh Tân", sessions: 3, energy: 96, cost: 522000 },
                { name: "Lotte Mart Gò Vấp", sessions: 2, energy: 64, cost: 348000 },
                { name: "Big C Thăng Long", sessions: 2, energy: 58, cost: 315000 },
                { name: "Coopmart Cống Quỳnh", sessions: 3, energy: 82, cost: 445000 },
            ],
            timeBreakdown: [
                { period: "06:00 - 12:00", sessions: 3, percentage: 20 },
                { period: "12:00 - 18:00", sessions: 6, percentage: 40 },
                { period: "18:00 - 24:00", sessions: 6, percentage: 40 },
            ]},
        "2025-08": {
            totalCost: 2180000,
            totalSessions: 16,
            totalEnergy: 416,
            avgCostPerKwh: 5240,
            avgSessionCost: 136250,
            comparedToLastMonth: {
                costChange: -8.2,
                sessionsChange: 14.3,
                energyChange: 2.9}},
        "2025-07": {
            totalCost: 2375000,
            totalSessions: 14,
            totalEnergy: 404,
            avgCostPerKwh: 5877,
            avgSessionCost: 169643,
            comparedToLastMonth: {
                costChange: 18.9,
                sessionsChange: -12.5,
                energyChange: -5.6}}};

    const currentReport = monthlyReports[selectedMonth];
    const months = Object.keys(monthlyReports);

    const handleExportReport = () => {
        // Mock export functionality
        const reportData = {
            month: selectedMonth,
            ...currentReport};

        const dataStr = JSON.stringify(reportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `charging_report_${selectedMonth}.json`;
        link.click();

        URL.revokeObjectURL(url);
    };

    const getChangeIcon = (value) => {
        if (value > 0) return <TrendingUp />;
        if (value < 0) return <TrendingDown />;
        return <Compare />;
    };

    return (
        <Box>
            {/* Header */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 4}}
            >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
                        <Receipt />
                    </Avatar>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            Báo cáo chi phí hàng tháng
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Chi tiết chi phí sạc xe theo từng tháng
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 2 }}>
                    <FormControl sx={{ minWidth: 150 }}>
                        <InputLabel>Tháng</InputLabel>
                        <Select
                            value={selectedMonth}
                            label="ThÃ¡ng"
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        >
                            {months.map((month) => (
                                <MenuItem key={month} value={month}>
                                    {new Date(month + "-01").toLocaleDateString("vi-VN", {
                                        month: "long",
                                        year: "numeric"})}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                </Box>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card
                        sx={{
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            color: "white"}}
                    >
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                                    <AttachMoney />
                                </Avatar>
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        {formatCurrency(currentReport.totalCost)}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Tổng chi phí
                                    </Typography>
                                    <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                                        {getChangeIcon(currentReport.comparedToLastMonth.costChange)}
                                        <Typography variant="caption" sx={{ opacity: 0.8, ml: 0.5 }}>
                                            {Math.abs(currentReport.comparedToLastMonth.costChange)}% so với tháng trước
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card
                        sx={{
                            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                            color: "white"}}
                    >
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                                    <ElectricCar />
                                </Avatar>
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        {currentReport.totalSessions}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Lần sạc
                                    </Typography>
                                    <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                                        {getChangeIcon(currentReport.comparedToLastMonth.sessionsChange)}
                                        <Typography variant="caption" sx={{ opacity: 0.8, ml: 0.5 }}>
                                            {Math.abs(currentReport.comparedToLastMonth.sessionsChange)}% so với tháng trước
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card
                        sx={{
                            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                            color: "white"}}
                    >
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                                    <Assessment />
                                </Avatar>
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        {currentReport.totalEnergy}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        kWh tiêu thụ
                                    </Typography>
                                    <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                                        {getChangeIcon(currentReport.comparedToLastMonth.energyChange)}
                                        <Typography variant="caption" sx={{ opacity: 0.8, ml: 0.5 }}>
                                            {Math.abs(currentReport.comparedToLastMonth.energyChange)}% so với tháng trước
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card
                        sx={{
                            background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                            color: "white"}}
                    >
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                                    <Schedule />
                                </Avatar>
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        {formatCurrency(currentReport.avgCostPerKwh)}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        /kWh trung bình
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                        {formatCurrency(currentReport.avgSessionCost)}/phiên
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Daily Breakdown */}
            {currentReport.dailyBreakdown && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={8}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Chi tiết theo ngày
                                </Typography>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Ngày</TableCell>
                                                <TableCell align="center">Lần sạc</TableCell>
                                                <TableCell align="center">Năng lượng (kWh)</TableCell>
                                                <TableCell align="right">Chi phí</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {currentReport.dailyBreakdown.map((day) => (
                                                <TableRow key={day.date}>
                                                    <TableCell>
                                                        {new Date(day.date).toLocaleDateString("vi-VN")}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip label={day.sessions} size="small" color="primary" />
                                                    </TableCell>
                                                    <TableCell align="center">{day.energy}</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: "medium" }}>
                                                        {formatCurrency(day.cost)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Time Distribution */}
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Phân bố theo giờ
                                </Typography>
                                {currentReport.timeBreakdown.map((time, index) => (
                                    <Box key={index} sx={{ mb: 3 }}>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                            <Typography variant="body2">{time.period}</Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {time.sessions} lần ({time.percentage}%)
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={time.percentage}
                                            sx={{ height: 8, borderRadius: 4 }}
                                            color={
                                                index === 0 ? "warning" : index === 1 ? "info" : "success"
                                            }
                                        />
                                    </Box>
                                ))}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Station Breakdown */}
            {currentReport.stationBreakdown && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            Chi phí theo trạm sạc
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Trạm sạc</TableCell>
                                        <TableCell align="center">Số lần sạc</TableCell>
                                        <TableCell align="center">Năng lượng (kWh)</TableCell>
                                        <TableCell align="right">Chi phí</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {currentReport.stationBreakdown.map((station, index) => (
                                        <TableRow key={index}>
                                            <TableCell sx={{ fontWeight: "medium" }}>
                                                {station.name}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip label={station.sessions} size="small" color="primary" />
                                            </TableCell>
                                            <TableCell align="center">{station.energy}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: "medium" }}>
                                                {formatCurrency(station.cost)}
                                            </TableCell>
                                            {/* % Tổng chi phí column removed per request */}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}


        </Box>
    );
};

export default MonthlyCostReports;
