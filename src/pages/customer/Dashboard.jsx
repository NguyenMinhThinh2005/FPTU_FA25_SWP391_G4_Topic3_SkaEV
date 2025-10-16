import React, { useState } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Avatar,
    Button,
    LinearProgress,
    Chip,
    Alert,
    Stack,
    Container} from "@mui/material";
import {
    ElectricCar,
    LocationOn,
    Payment,
    QrCodeScanner,
    History,
    AccountBalanceWallet,
    Assessment} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../../utils/helpers";
import useAuthStore from "../../store/authStore";
import useBookingStore from "../../store/bookingStore";

const CustomerDashboard = () => {

    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { bookingHistory, getBookingStats } = useBookingStore();

    // Khá»Ÿi táº¡o mock data náº¿u cáº§n
    React.
    // PhiÃªn sáº¡c hiá»‡n táº¡i (náº¿u cÃ³)
    const [activeCharging] = useState(null); // Chá»‰ hiá»ƒn thá»‹ khi Ä‘ang cÃ³ phiÃªn sáº¡c

    // Chá»©c nÄƒng chÃ­nh cho tÃ i xáº¿ EV
    const quickActions = [
        {
            title: "TÃ¬m tráº¡m sáº¡c",
            description: "TÃ¬m tráº¡m gáº§n nháº¥t",
            icon: <LocationOn />,
            color: "primary",
            path: "/customer/charging"
        },
        {
            title: "QuÃ©t QR",
            description: "Báº¯t Ä‘áº§u sáº¡c ngay",
            icon: <QrCodeScanner />,
            color: "success",
            path: "/qr-demo"
        },
        {
            title: "Thanh toÃ¡n",
            description: "Quáº£n lÃ½ vÃ­ & tháº»",
            icon: <AccountBalanceWallet />,
            color: "warning",
            path: "/customer/payment"
        },
        {
            title: "Thá»‘ng kÃª & BÃ¡o cÃ¡o Chi phÃ­",
            description: "PhÃ¢n tÃ­ch chi phÃ­ & thá»‘ng kÃª sáº¡c",
            icon: <Assessment />,
            color: "info",
            path: "/customer/analytics"
        }
    ];

    // Thá»‘ng kÃª thá»±c táº¿ tá»« booking store
    const bookingStats = getBookingStats();
    const monthlyStats = {
        chargingSessions: bookingStats.total,
        totalCost: parseFloat(bookingStats.totalAmount) || 1680000,
        totalEnergy: parseFloat(bookingStats.totalEnergyCharged) || 245,
        averageCost: Math.round((parseFloat(bookingStats.totalAmount) || 1680000) / (parseFloat(bookingStats.totalEnergyCharged) || 245))
    };



    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            {/* Header chÃ o má»«ng Ä‘Æ¡n giáº£n */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    ChÃ o má»«ng, {user?.profile?.firstName || 'TÃ i xáº¿'}!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Quáº£n lÃ½ viá»‡c sáº¡c xe Ä‘iá»‡n cá»§a báº¡n
                </Typography>
            </Box>

            {/* ThÃ´ng bÃ¡o phiÃªn sáº¡c (chá»‰ hiá»ƒn thá»‹ khi Ä‘ang sáº¡c) */}
            {activeCharging && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                        Äang sáº¡c táº¡i {activeCharging.stationName}
                    </Typography>
                    <Typography variant="body2">
                        Pin: {activeCharging.currentSOC}% â€¢ Thá»i gian cÃ²n láº¡i: {activeCharging.timeRemaining} phÃºt
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={activeCharging.progress}
                        sx={{ mt: 1, height: 6, borderRadius: 3 }}
                    />
                </Alert>
            )}

            {/* CÃ¡c chá»©c nÄƒng chÃ­nh */}
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Chá»©c nÄƒng chÃ­nh
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                {quickActions.map((action, index) => (
                    <Grid item xs={6} md={3} key={index}>
                        <Card
                            sx={{
                                cursor: "pointer",
                                transition: "all 0.2s",
                                "&:hover": {
                                    transform: "translateY(-2px)",
                                    boxShadow: 4
                                }
                            }}
                            onClick={() => navigate(action.path)}
                        >
                            <CardContent sx={{ textAlign: "center", py: 3 }}>
                                <Avatar
                                    sx={{
                                        bgcolor: `${action.color}.main`,
                                        mx: "auto",
                                        mb: 2,
                                        width: 56,
                                        height: 56
                                    }}
                                >
                                    {action.icon}
                                </Avatar>
                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                    {action.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {action.description}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Thá»‘ng kÃª thÃ¡ng nÃ y */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Tá»•ng quan thÃ¡ng nÃ y
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: "center" }}>
                                <Typography variant="h4" color="primary.main" fontWeight="bold">
                                    {monthlyStats.chargingSessions}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    láº§n sáº¡c
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: "center" }}>
                                <Typography variant="h4" color="success.main" fontWeight="bold">
                                    {monthlyStats.totalEnergy}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    kWh
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: "center" }}>
                                <Typography variant="h4" color="warning.main" fontWeight="bold">
                                    {formatCurrency(monthlyStats.totalCost)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    chi phÃ­
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: "center" }}>
                                <Typography variant="h4" color="info.main" fontWeight="bold">
                                    {formatCurrency(monthlyStats.averageCost)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    VNÄ/kWh
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Lá»‹ch sá»­ sáº¡c gáº§n Ä‘Ã¢y */}
            <Card>
                <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Typography variant="h6" fontWeight="bold">
                            Lá»‹ch sá»­ gáº§n Ä‘Ã¢y
                        </Typography>
                        <Button size="small" onClick={() => navigate("/customer/history")}>
                            Xem táº¥t cáº£
                        </Button>
                    </Box>

                    <Stack spacing={2}>
                        {bookingHistory.slice(0, 3).map((booking) => (
                            <Box key={booking.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, border: 1, borderColor: "divider", borderRadius: 2 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                    <Avatar sx={{ bgcolor: "primary.light" }}>
                                        <ElectricCar />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight="medium">
                                            {booking.stationName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(booking.createdAt).toLocaleDateString('vi-VN')} â€¢ {booking.energyDelivered || 0} kWh â€¢ {booking.chargingDuration || 0} phÃºt
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ textAlign: "right" }}>
                                    <Typography variant="subtitle2" fontWeight="bold">
                                        {formatCurrency(booking.totalAmount || booking.cost || 0)}
                                    </Typography>
                                    <Chip
                                        label={booking.status === "completed" ? "HoÃ n thÃ nh" : booking.status === "cancelled" ? "ÄÃ£ há»§y" : "Äang xá»­ lÃ½"}
                                        size="small"
                                        color={booking.status === "completed" ? "success" : booking.status === "cancelled" ? "error" : "warning"}
                                    />
                                </Box>
                            </Box>
                        ))}
                        {bookingHistory.length === 0 && (
                            <Box sx={{ textAlign: "center", py: 4 }}>
                                <Typography variant="body2" color="text.secondary">
                                    ChÆ°a cÃ³ lá»‹ch sá»­ sáº¡c nÃ o
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                </CardContent>
            </Card>
        </Container>
    );
};

export default CustomerDashboard;
