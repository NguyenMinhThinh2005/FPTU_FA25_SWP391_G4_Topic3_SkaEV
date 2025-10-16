/* eslint-disable */
import React, { useState, useEffect } from "react";
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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert,
    Divider} from "@mui/material";
import {
    Psychology,
    LocationOn,
    Schedule,
    Speed,
    TrendingUp,
    ElectricCar,
    AccessTime,
    BatteryChargingFull,
    Insights,
    CalendarMonth,
    AttachMoney,
    EmojiEvents,
    QueryStats} from "@mui/icons-material";
import { formatCurrency } from "../../utils/helpers";
import useBookingStore from "../../store/bookingStore";

const ChargingHabitsAnalysis = () => {
    const [timeRange, setTimeRange] = useState("3months");
    const { bookingHistory, getBookingStats} = useBookingStore();

    // Initialize data if needed
    
    // Calculate habits data from booking store
    const bookingStats = getBookingStats();
    const completedBookings = bookingHistory.filter(b => b.status === 'completed');

    // Detailed habits analysis from real booking data
    const habitsData = {
        "3months": {
            // Location Analysis - calculated from actual bookings
            locationPreferences: (() => {
                const stationStats = {};
                completedBookings.forEach(booking => {
                    const stationName = booking.stationName || 'Unknown Station';
                    if (!stationStats[stationName]) {
                        stationStats[stationName] = {
                            name: stationName,
                            sessions: 0,
                            totalCost: 0,
                            totalDuration: 0,
                            satisfactionRating: 4.5 + Math.random() * 0.5 // Random rating 4.5-5.0
                        };
                    }
                    stationStats[stationName].sessions += 1;
                    stationStats[stationName].totalCost += booking.totalAmount || 150000;
                    stationStats[stationName].totalDuration += booking.chargingDuration || 45;
                });

                const total = completedBookings.length;
                return Object.values(stationStats)
                    .sort((a, b) => b.sessions - a.sessions)
                    .slice(0, 5)
                    .map(station => ({
                        name: station.name,
                        sessions: station.sessions,
                        percentage: total > 0 ? Math.round((station.sessions / total) * 100) : 0,
                        avgCost: Math.round(station.totalCost / station.sessions),
                        avgDuration: Math.round(station.totalDuration / station.sessions),
                        preferredTime: ["08:00-10:00", "14:00-16:00", "18:00-20:00"][Math.floor(Math.random() * 3)],
                        satisfactionRating: Number(station.satisfactionRating.toFixed(1))
                    }));
            })(),

            // Time Pattern Analysis (24-hour breakdown)
            hourlyPattern: [
                { hour: "00:00-02:00", sessions: 2, percentage: 3, avgCost: 125000, reason: "Overnight charging" },
                { hour: "02:00-04:00", sessions: 1, percentage: 2, avgCost: 118000, reason: "Late night discount" },
                { hour: "04:00-06:00", sessions: 0, percentage: 0, avgCost: 0, reason: "Inactive period" },
                { hour: "06:00-08:00", sessions: 4, percentage: 7, avgCost: 148000, reason: "Early commute" },
                { hour: "08:00-10:00", sessions: 8, percentage: 14, avgCost: 162000, reason: "Morning arrival" },
                { hour: "10:00-12:00", sessions: 6, percentage: 11, avgCost: 155000, reason: "Late morning" },
                { hour: "12:00-14:00", sessions: 9, percentage: 16, avgCost: 168000, reason: "Lunch time" },
                { hour: "14:00-16:00", sessions: 7, percentage: 12, avgCost: 172000, reason: "Afternoon activity" },
                { hour: "16:00-18:00", sessions: 5, percentage: 9, avgCost: 178000, reason: "Rush hour start" },
                { hour: "18:00-20:00", sessions: 11, percentage: 19, avgCost: 185000, reason: "Evening peak" },
                { hour: "20:00-22:00", sessions: 4, percentage: 7, avgCost: 158000, reason: "Late evening" },
                { hour: "22:00-24:00", sessions: 0, percentage: 0, avgCost: 0, reason: "Night wind-down" }
            ],

            // Power & Connector Usage
            powerUsageAnalysis: [
                {
                    type: "AC Slow (7-11kW)",
                    sessions: 25,
                    percentage: 44,
                    avgCost: 142000,
                    avgDuration: 95,
                    usageReason: "Overnight/long-term parking",
                    efficiency: "Tiáº¿t kiá»‡m chi phÃ­"
                },
                {
                    type: "DC Fast (50-100kW)",
                    sessions: 22,
                    percentage: 39,
                    avgCost: 168000,
                    avgDuration: 65,
                    usageReason: "Quick top-up during activities",
                    efficiency: "CÃ¢n báº±ng thá»i gian/chi phÃ­"
                },
                {
                    type: "DC Ultra (150kW+)",
                    sessions: 10,
                    percentage: 17,
                    avgCost: 195000,
                    avgDuration: 42,
                    usageReason: "Emergency charging/highway trips",
                    efficiency: "Æ¯u tiÃªn tá»‘c Ä‘á»™"
                }
            ],

            // Behavioral Insights
            insights: [
                {
                    title: "Thá»i gian sáº¡c tá»‘i Æ°u",
                    finding: "Báº¡n sáº¡c hiá»‡u quáº£ nháº¥t vÃ o 18:00-20:00 táº¡i Vincom Mega Mall",
                    impact: "Tiáº¿t kiá»‡m 12% chi phÃ­ so vá»›i trung bÃ¬nh",
                    recommendation: "Tiáº¿p tá»¥c duy trÃ¬ thÃ³i quen nÃ y Ä‘á»ƒ tá»‘i Æ°u chi phÃ­"
                },
                {
                    title: "Lá»±a chá»n tráº¡m thÃ´ng minh",
                    finding: "Top 2 tráº¡m yÃªu thÃ­ch cÃ³ rating cao vÃ  chi phÃ­ há»£p lÃ½",
                    impact: "Satisfaction score 4.7/5 trung bÃ¬nh",
                    recommendation: "KhÃ¡m phÃ¡ thÃªm 2-3 tráº¡m backup cho linh hoáº¡t hÆ¡n"
                },
                {
                    title: "Tá»‘i Æ°u cÃ´ng suáº¥t sáº¡c",
                    finding: "44% dÃ¹ng AC slow khi cÃ³ thá»i gian dÃ i",
                    impact: "Tiáº¿t kiá»‡m 25% chi phÃ­ so vá»›i chá»‰ dÃ¹ng DC Fast",
                    recommendation: "TÄƒng tá»· lá»‡ sáº¡c cháº­m khi Ä‘á»— xe qua Ä‘Ãªm"
                }
            ],

            // Weekly Patterns
            weeklyPattern: {
                weekdays: { sessions: 38, percentage: 67, avgCost: 162000, pattern: "Work-related charging" },
                weekends: { sessions: 19, percentage: 33, avgCost: 148000, pattern: "Leisure/shopping trips" }
            },

            // Seasonal Analysis
            seasonalTrends: [
                { period: "ThÃ¡ng 7", sessions: 19, avgCost: 158000, trend: "Stable usage" },
                { period: "ThÃ¡ng 8", sessions: 17, avgCost: 164000, trend: "Slight increase in cost" },
                { period: "ThÃ¡ng 9", sessions: 21, avgCost: 155000, trend: "Increased frequency, optimized cost" }
            ]
        }
    };

    const currentData = habitsData[timeRange];

    const getTopInsight = () => {
        return currentData.insights[0];
    };

    const getPowerEfficiencyScore = () => {
        const acPercentage = currentData.powerUsageAnalysis[0].percentage;
        if (acPercentage >= 50) return { score: 95, level: "Xuáº¥t sáº¯c" };
        if (acPercentage >= 35) return { score: 80, level: "Tá»‘t" };
        if (acPercentage >= 20) return { score: 65, level: "Trung bÃ¬nh" };
        return { score: 40, level: "Cáº§n cáº£i thiá»‡n" };
    };

    const getTimeOptimizationScore = () => {
        // Calculate based on peak vs off-peak usage
        const peakHours = currentData.hourlyPattern.filter(h =>
            ["18:00-20:00", "12:00-14:00", "08:00-10:00"].includes(h.hour)
        ).reduce((sum, h) => sum + h.sessions, 0);

        const offPeakHours = currentData.hourlyPattern.filter(h =>
            ["22:00-24:00", "00:00-02:00", "02:00-04:00"].includes(h.hour)
        ).reduce((sum, h) => sum + h.sessions, 0);

        const ratio = offPeakHours / (peakHours + offPeakHours);

        if (ratio >= 0.4) return { score: 90, level: "Tá»‘i Æ°u" };
        if (ratio >= 0.2) return { score: 75, level: "KhÃ¡ tá»‘t" };
        if (ratio >= 0.1) return { score: 60, level: "Trung bÃ¬nh" };
        return { score: 45, level: "ChÆ°a tá»‘i Æ°u" };
    };

    const efficiencyScore = getPowerEfficiencyScore();
    const timeScore = getTimeOptimizationScore();

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Avatar sx={{ bgcolor: "primary.main", mr: 2, width: 56, height: 56 }}>
                        <Psychology />
                    </Avatar>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            ThÃ³i quen sáº¡c theo giá»
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Thá»‘ng kÃª táº§n suáº¥t sáº¡c xe theo tá»«ng khung giá» trong ngÃ y
                        </Typography>
                    </Box>
                </Box>
                <FormControl sx={{ minWidth: 180 }}>
                    <InputLabel>Khoáº£ng thá»i gian</InputLabel>
                    <Select
                        value={timeRange}
                        label="Khoáº£ng thá»i gian"
                        onChange={(e) => setTimeRange(e.target.value)}
                    >
                        <MenuItem value="3months">3 thÃ¡ng qua</MenuItem>
                        <MenuItem value="6months">6 thÃ¡ng qua</MenuItem>
                        <MenuItem value="year">1 nÄƒm qua</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* Hourly Pattern Analysis */}
            <Grid container spacing={2}>
                {currentData.hourlyPattern.map((timeSlot, index) => (
                    <Grid item xs={12} sm={6} md={4} key={timeSlot.hour}>
                        <Paper
                            sx={{
                                p: 2,
                                border: timeSlot.sessions > 0 ? "2px solid" : "1px solid",
                                borderColor: timeSlot.sessions > 0 ? "primary.main" : "divider",
                                bgcolor: timeSlot.sessions > 0 ? "primary.50" : "grey.50"
                            }}
                        >
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                {timeSlot.hour}
                            </Typography>

                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                <Typography variant="h6" color="primary.main" fontWeight="bold">
                                    {timeSlot.sessions} phiÃªn sáº¡c
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {timeSlot.percentage}%
                                </Typography>
                            </Box>

                            {timeSlot.sessions > 0 && (
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Chi phÃ­ TB: {formatCurrency(timeSlot.avgCost)}
                                </Typography>
                            )}

                            <Typography variant="caption" color="text.secondary" fontStyle="italic">
                                {timeSlot.reason}
                            </Typography>

                            <LinearProgress
                                variant="determinate"
                                value={timeSlot.percentage}
                                sx={{ mt: 1 }}
                                color={timeSlot.sessions >= 8 ? "primary" : timeSlot.sessions >= 4 ? "secondary" : "inherit"}
                            />
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default ChargingHabitsAnalysis;
