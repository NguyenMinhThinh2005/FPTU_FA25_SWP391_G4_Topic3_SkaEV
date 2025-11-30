import React, { useState } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Avatar,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Paper,
    LinearProgress,
    Chip,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
} from "@mui/material";
import {
    Analytics as AnalyticsIcon,
    TrendingUp,
    Schedule,
    LocationOn,
    ElectricCar,
    AttachMoney,
    Battery80,
    Speed,
    AccessTime,
    Place,
    CalendarMonth,
} from "@mui/icons-material";
import { formatCurrency } from "../../utils/helpers";
import { useMasterDataSync } from "../../hooks/useMasterDataSync";

const CustomerAnalytics = () => {
    const [timeRange, setTimeRange] = useState("month");
    const { stats: bookingStats, completedBookings } = useMasterDataSync();

    // Calculate station frequency from actual booking data
    const calculateFavoriteStations = () => {
        const stationCounts = {};
        completedBookings.forEach(booking => {
            const stationName = booking.stationName;
            stationCounts[stationName] = (stationCounts[stationName] || 0) + 1;
        });

        const sortedStations = Object.entries(stationCounts)
            .map(([name, sessions]) => ({
                name,
                sessions,
                percentage: completedBookings.length > 0 ? Math.round((sessions / completedBookings.length) * 100) : 0
            }))
            .sort((a, b) => b.sessions - a.sessions)
            .slice(0, 3);

        return sortedStations.length > 0 ? sortedStations : [
            { name: "Chưa có dữ liệu", sessions: 0, percentage: 0 }
        ];
    };

    // Calculate realistic analytics from actual booking data
    const totalAmount = parseFloat(bookingStats.totalAmount) || 0;
    const totalEnergy = parseFloat(bookingStats.totalEnergyCharged) || 0;
    const totalDuration = bookingStats.totalDuration || 0;
    const completedCount = bookingStats.completed || completedBookings.length;
    const avgDuration = bookingStats.averageDuration || 0;

    // Debug: Log thực tế data đang sử dụng
    console.log('📊 Analytics - Current Data:', {
        totalAmount,
        totalEnergy,
        totalDuration,
        completedCount,
        avgDuration,
        completedBookings: completedBookings.length,
        bookingStats
    });

    const analyticsData = {
        month: {
            totalCost: totalAmount,
            totalSessions: completedCount,
            totalEnergyConsumed: totalEnergy,
            avgSessionCost: completedCount > 0 ? Math.round(totalAmount / completedCount) : 0,
            avgEnergyPerSession: completedCount > 0 ? (totalEnergy / completedCount).toFixed(1) : 0,
            avgChargingTime: avgDuration, // Từ bookingStats
            favoriteStations: calculateFavoriteStations(),
            chargingHabits: {
                morningHours: 20, // 6-12h
                afternoonHours: 40, // 12-18h
                eveningHours: 40, // 18-24h
            },
            costByWeek: [480000, 620000, 580000, 770000],
            energyByWeek: [88, 115, 107, 140],
        },
        quarter: {
            totalCost: totalAmount * 3, // Estimate x3 for quarter
            totalSessions: completedCount * 3,
            totalEnergyConsumed: totalEnergy * 3,
            avgSessionCost: completedCount > 0 ? Math.round(totalAmount / completedCount) : 0,
            avgEnergyPerSession: completedCount > 0 ? (totalEnergy / completedCount).toFixed(1) : 0,
            avgChargingTime: avgDuration, // Từ bookingStats
            favoriteStations: calculateFavoriteStations(),
            chargingHabits: {
                morningHours: 24,
                afternoonHours: 38,
                eveningHours: 38,
            },
        },
        year: {
            totalCost: totalAmount * 12, // Estimate x12 for year
            totalSessions: completedCount * 12,
            totalEnergyConsumed: totalEnergy * 12,
            avgSessionCost: completedCount > 0 ? Math.round(totalAmount / completedCount) : 0,
            avgEnergyPerSession: completedCount > 0 ? (totalEnergy / completedCount).toFixed(1) : 0,
            avgChargingTime: avgDuration, // Từ bookingStats
            favoriteStations: calculateFavoriteStations(),
            chargingHabits: {
                morningHours: 28,
                afternoonHours: 36,
                eveningHours: 36,
            },
        },
    };

    const currentData = analyticsData[timeRange];

    const getTimeRangeText = () => {
        switch (timeRange) {
            case "month":
                return "Tháng này";
            case "quarter":
                return "Quý này";
            case "year":
                return "Năm này";
            default:
                return "Tháng này";
        }
    };

    return (
        <Box>
            {/* Header */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 4,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
                        <AnalyticsIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            Phân tích cá nhân
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Thống kê chi phí và thói quen sạc xe của bạn
                        </Typography>
                    </Box>
                </Box>
                <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel>Thời gian</InputLabel>
                    <Select
                        value={timeRange}
                        label="Thời gian"
                        onChange={(e) => setTimeRange(e.target.value)}
                    >
                        <MenuItem value="month">Tháng này</MenuItem>
                        <MenuItem value="quarter">Quý này</MenuItem>
                        <MenuItem value="year">Năm này</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* Debug Info removed for production */}

            {/* Key Metrics */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card
                        sx={{
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            color: "white",
                        }}
                    >
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                                    <AttachMoney />
                                </Avatar>
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        {formatCurrency(currentData.totalCost)}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Tổng chi phí
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                        {getTimeRangeText()}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card
                        sx={{
                            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                            color: "white",
                        }}
                    >
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                                    <ElectricCar />
                                </Avatar>
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        {currentData.totalSessions}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Phiên sạc
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                        Trung bình {formatCurrency(currentData.avgSessionCost)}/phiên
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card
                        sx={{
                            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                            color: "white",
                        }}
                    >
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                                    <Battery80 />
                                </Avatar>
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        {currentData.totalEnergyConsumed}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        kWh tiêu thụ
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                        TB {currentData.avgEnergyPerSession} kWh/phiên
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card
                        sx={{
                            background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                            color: "white",
                        }}
                    >
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                                    <AccessTime />
                                </Avatar>
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        {Math.floor(currentData.avgChargingTime / 60)}h{" "}
                                        {currentData.avgChargingTime % 60}m
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Thời gian TB
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                        Mỗi phiên sạc
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Detailed Analytics */}
            <Grid container spacing={3}>
                {/* Cost Trends */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                <TrendingUp sx={{ mr: 1, verticalAlign: "middle" }} />
                                Xu hướng chi phí
                            </Typography>
                            {timeRange === "month" && currentData.costByWeek && (
                                <Box>
                                    {currentData.costByWeek.map((cost, index) => (
                                        <Box key={index} sx={{ mb: 2 }}>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    mb: 1,
                                                }}
                                            >
                                                <Typography variant="body2">Tuần {index + 1}</Typography>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {formatCurrency(cost)}
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={(cost / Math.max(...currentData.costByWeek)) * 100}
                                                sx={{ height: 6, borderRadius: 3 }}
                                            />
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Favorite Stations */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                <Place sx={{ mr: 1, verticalAlign: "middle" }} />
                                Trạm sạc yêu thích
                            </Typography>
                            <List dense>
                                {currentData.favoriteStations.map((station, index) => (
                                    <ListItem key={index} sx={{ px: 0 }}>
                                        <ListItemIcon>
                                            <Avatar
                                                sx={{
                                                    bgcolor: index === 0 ? "gold" : index === 1 ? "silver" : "bronze",
                                                    width: 32,
                                                    height: 32,
                                                    fontSize: "0.9rem",
                                                }}
                                            >
                                                {index + 1}
                                            </Avatar>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={station.name}
                                            secondary={`${station.sessions} lần sạc`}
                                        />
                                        <ListItemSecondaryAction>
                                            <Chip
                                                label={`${station.percentage}%`}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                            />
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Charging Habits */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                <Schedule sx={{ mr: 1, verticalAlign: "middle" }} />
                                Thói quen sạc theo giờ
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={4}>
                                    <Paper
                                        sx={{
                                            p: 3,
                                            textAlign: "center",
                                            border: "1px solid",
                                            borderColor: "divider",
                                        }}
                                    >
                                        <Typography variant="h3" fontWeight="bold" color="warning.main">
                                            {currentData.chargingHabits.morningHours}%
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            Buổi sáng
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            6:00 - 12:00
                                        </Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Paper
                                        sx={{
                                            p: 3,
                                            textAlign: "center",
                                            border: "1px solid",
                                            borderColor: "divider",
                                        }}
                                    >
                                        <Typography variant="h3" fontWeight="bold" color="info.main">
                                            {currentData.chargingHabits.afternoonHours}%
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            Buổi chiều
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            12:00 - 18:00
                                        </Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Paper
                                        sx={{
                                            p: 3,
                                            textAlign: "center",
                                            border: "1px solid",
                                            borderColor: "divider",
                                        }}
                                    >
                                        <Typography variant="h3" fontWeight="bold" color="success.main">
                                            {currentData.chargingHabits.eveningHours}%
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            Buổi tối
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            18:00 - 24:00
                                        </Typography>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default CustomerAnalytics;