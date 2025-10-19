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
    Paper,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Divider,
    Stack,
    Container,
} from "@mui/material";
import {
    ElectricCar,
    LocationOn,
    Schedule,
    Payment,
    QrCodeScanner,
    Star,
    MoreVert,
    TrendingUp,
    History,
    BatteryChargingFull,
    PersonOutline,
    DirectionsCar,
    AnalyticsOutlined,
    MapOutlined,
    CreditCard,
    Assessment,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../../utils/helpers";
import useAuthStore from "../../store/authStore";

const CustomerDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    // Mock active charging session
    const [activeBooking] = useState({
        id: "B001",
        stationName: "Vincom Mega Mall - Trạm A01",
        progress: 65,
        currentSOC: 65,
        targetSOC: 80,
        estimatedTimeRemaining: 25,
        currentCost: 89000,
        chargingRate: 45,
        energyDelivered: 18.5,
        status: "charging",
    });

    // Chức năng cho Tài xế (EV Driver) - Phân chia mục logic
    const driverSections = [
        {
            title: "🚗 Quản lý Tài khoản & Xe",
            description: "Đăng ký, hồ sơ cá nhân, thông tin xe, lịch sử giao dịch",
            icon: <PersonOutline sx={{ fontSize: 28 }} />,
            color: "primary",
            actions: [
                {
                    title: "Hồ sơ cá nhân",
                    description: "Cập nhật thông tin tài khoản",
                    icon: <PersonOutline />,
                    action: () => navigate("/customer/profile"),
                },
                {
                    title: "Quản lý xe",
                    description: "Thông tin xe điện của bạn",
                    icon: <DirectionsCar />,
                    action: () => navigate("/customer/vehicles"),
                },
                {
                    title: "Lịch sử giao dịch",
                    description: "Xem tất cả giao dịch đã thực hiện",
                    icon: <History />,
                    action: () => navigate("/customer/transactions"),
                },
            ]
        },
        {
            title: "🔍 Đặt chỗ & Khởi động Sạc",
            description: "Bản đồ trạm, đặt trước, quét QR, theo dõi trạng thái sạc",
            icon: <MapOutlined sx={{ fontSize: 28 }} />,
            color: "success",
            actions: [
                {
                    title: "Bản đồ trạm sạc",
                    description: "Tìm trạm theo vị trí, công suất, giá cả",
                    icon: <LocationOn />,
                    action: () => navigate("/customer/charging"),
                },
                {
                    title: "Đặt trước điểm sạc",
                    description: "Đặt chỗ trước để đảm bảo có trạm",
                    icon: <Schedule />,
                    action: () => navigate("/customer/booking"),
                },
                {
                    title: "Quét QR sạc ngay",
                    description: "Bắt đầu phiên sạc bằng QR code",
                    icon: <QrCodeScanner />,
                    action: () => navigate("/qr-demo"),
                },
                {
                    title: "Theo dõi sạc",
                    description: "Xem SOC%, thời gian, chi phí realtime",
                    icon: <BatteryChargingFull />,
                    action: () => navigate("/customer/charging-status"),
                },
            ]
        },
        {
            title: "💳 Thanh toán & Ví điện tử",
            description: "Thanh toán theo kWh/thời gian, ví điện tử, hóa đơn",
            icon: <CreditCard sx={{ fontSize: 28 }} />,
            color: "warning",
            actions: [
                {
                    title: "Phương thức thanh toán",
                    description: "Quản lý ví, thẻ, banking",
                    icon: <Payment />,
                    action: () => navigate("/customer/payment"),
                },
                {
                    title: "Lịch sử thanh toán",
                    description: "Chi tiết thanh toán và hóa đơn",
                    icon: <Payment />,
                    action: () => navigate("/customer/payment-history"),
                },
            ]
        },
        {
            title: "📊 Lịch sử & Phân tích cá nhân",
            description: "Báo cáo chi phí, thống kê thói quen sạc, phân tích",
            icon: <Assessment sx={{ fontSize: 28 }} />,
            color: "info",
            actions: [
                {
                    title: "Báo cáo chi phí",
                    description: "Chi phí sạc hàng tháng chi tiết",
                    icon: <TrendingUp />,
                    action: () => navigate("/customer/analytics"),
                },
                {
                    title: "Thống kê thói quen",
                    description: "Phân tích nơi sạc, giờ sạc, công suất",
                    icon: <AnalyticsOutlined />,
                    action: () => navigate("/customer/habits"),
                },
                {
                    title: "Lịch sử sạc",
                    description: "Tất cả phiên sạc đã thực hiện",
                    icon: <History />,
                    action: () => navigate("/customer/history"),
                },
            ]
        }
    ];

    const recentBookings = [
        {
            id: "B002",
            stationName: "AEON Mall Bình Tân",
            date: "29/09/2024",
            energy: 32.5,
            cost: 176000,
            status: "completed",
            rating: 5,
        },
        {
            id: "B003",
            stationName: "Lotte Mart Gò Vấp",
            date: "27/09/2024",
            energy: 28.0,
            cost: 152000,
            status: "completed",
            rating: 4,
        },
        {
            id: "B004",
            stationName: "Big C Thăng Long",
            date: "25/09/2024",
            energy: 35.2,
            cost: 191000,
            status: "completed",
            rating: null,
        },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case "charging": return "primary";
            case "completed": return "success";
            case "cancelled": return "error";
            default: return "default";
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case "charging": return "Đang sạc";
            case "completed": return "Hoàn thành";
            case "cancelled": return "Đã hủy";
            default: return status;
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 2 }}>
            {/* Welcome Header */}
            <Box
                sx={{
                    mb: 4,
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: 4,
                    p: 4,
                    color: "white",
                }}
            >
                <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="center">
                    <Avatar
                        sx={{
                            width: 80,
                            height: 80,
                            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                            fontSize: "2rem",
                            fontWeight: "bold"
                        }}
                    >
                        {user?.profile?.firstName?.[0] || user?.name?.[0] || 'U'}
                    </Avatar>
                    <Box sx={{ flex: 1, textAlign: { xs: "center", md: "left" } }}>
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                            Xin chào Tài xế, {user?.profile?.firstName || user?.name?.split(' ')[0] || 'Bạn'}! ⚡
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.9 }}>
                            Dashboard quản lý xe điện - Tất cả chức năng cho Tài xế EV
                        </Typography>
                    </Box>
                </Stack>
            </Box>

            {/* Active Charging Session */}
            {activeBooking && (
                <Alert severity="info" sx={{ mb: 4, border: 2, borderColor: "primary.main" }}>
                    <Box>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            🔋 Phiên sạc đang hoạt động
                        </Typography>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={6}>
                                <Typography variant="body1" fontWeight="medium">
                                    📍 {activeBooking.stationName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    ⚡ {activeBooking.chargingRate} kW • 🔋 {activeBooking.currentSOC}% → {activeBooking.targetSOC}%
                                </Typography>
                                <Box sx={{ mt: 1, mb: 1 }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={activeBooking.progress}
                                        sx={{ height: 8, borderRadius: 4 }}
                                    />
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                    ⏱️ Còn lại ~{activeBooking.estimatedTimeRemaining} phút • 💰 {formatCurrency(activeBooking.currentCost)}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>
                </Alert>
            )}

            {/* CHỨC NĂNG CHO TÀI XẾ (EV DRIVER) */}
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                🚗 Chức năng Tài xế EV - Phân chia theo Logic
            </Typography>

            <Grid container spacing={3}>
                {driverSections.map((section, sectionIndex) => (
                    <Grid item xs={12} md={6} key={sectionIndex}>
                        <Card
                            sx={{
                                height: "100%",
                                border: `2px solid ${section.color === 'primary' ? '#1976d2' :
                                    section.color === 'success' ? '#2e7d32' :
                                        section.color === 'warning' ? '#ed6c02' : '#0288d1'}`,
                                borderRadius: 3,
                                transition: "all 0.3s",
                                "&:hover": {
                                    transform: "translateY(-4px)",
                                    boxShadow: 6,
                                }
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                                    <Avatar
                                        sx={{
                                            bgcolor: `${section.color}.main`,
                                            width: 56,
                                            height: 56,
                                        }}
                                    >
                                        {section.icon}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" fontWeight="bold">
                                            {section.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {section.description}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Divider sx={{ mb: 2 }} />

                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                                    {section.actions.map((action, actionIndex) => (
                                        <Paper
                                            key={actionIndex}
                                            sx={{
                                                p: 2,
                                                cursor: "pointer",
                                                border: "1px solid",
                                                borderColor: "divider",
                                                borderRadius: 2,
                                                transition: "all 0.2s",
                                                "&:hover": {
                                                    borderColor: `${section.color}.main`,
                                                    backgroundColor: `${section.color}.50`,
                                                    transform: "translateX(4px)",
                                                },
                                            }}
                                            onClick={action.action}
                                        >
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                <Avatar
                                                    sx={{
                                                        bgcolor: `${section.color}.light`,
                                                        width: 40,
                                                        height: 40,
                                                    }}
                                                >
                                                    {action.icon}
                                                </Avatar>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="subtitle2" fontWeight="medium">
                                                        {action.title}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {action.description}
                                                    </Typography>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: "50%",
                                                        bgcolor: `${section.color}.main`
                                                    }}
                                                />
                                            </Box>
                                        </Paper>
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Phiên sạc gần đây */}
            <Card sx={{ mt: 4 }}>
                <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Typography variant="h6" fontWeight="bold">
                            📋 Phiên sạc gần đây
                        </Typography>
                        <Button size="small" onClick={() => navigate("/customer/history")}>
                            Xem tất cả
                        </Button>
                    </Box>
                    <List>
                        {recentBookings.map((booking, index) => (
                            <React.Fragment key={booking.id}>
                                <ListItem sx={{ px: 0 }}>
                                    <ListItemIcon>
                                        <Avatar sx={{ bgcolor: "primary.light" }}>
                                            <ElectricCar />
                                        </Avatar>
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={booking.stationName}
                                        secondary={
                                            <Box>
                                                <Typography variant="caption" display="block">
                                                    {booking.date} • {booking.energy} kWh • {formatCurrency(booking.cost)}
                                                </Typography>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                                                    <Chip
                                                        label={getStatusText(booking.status)}
                                                        size="small"
                                                        color={getStatusColor(booking.status)}
                                                    />
                                                    {booking.rating && (
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                            <Star sx={{ fontSize: 14, color: "warning.main" }} />
                                                            <Typography variant="caption">{booking.rating}</Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Box>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton size="small">
                                            <MoreVert />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                                {index < recentBookings.length - 1 && <Divider sx={{ my: 1 }} />}
                            </React.Fragment>
                        ))}
                    </List>
                </CardContent>
            </Card>

            {/* Thống kê tóm tắt */}
            <Card sx={{ mt: 3 }}>
                <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        📊 Tổng quan tháng này
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: "center", p: 2 }}>
                                <Typography variant="h4" color="primary.main" fontWeight="bold">15</Typography>
                                <Typography variant="body2">Số lần sạc</Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: "center", p: 2 }}>
                                <Typography variant="h4" color="success.main" fontWeight="bold">
                                    {formatCurrency(2450000)}
                                </Typography>
                                <Typography variant="body2">Tổng chi phí</Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: "center", p: 2 }}>
                                <Typography variant="h4" color="info.main" fontWeight="bold">450</Typography>
                                <Typography variant="body2">kWh sạc</Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: "center", p: 2 }}>
                                <Typography variant="h4" color="warning.main" fontWeight="bold">225</Typography>
                                <Typography variant="body2">kg CO₂ tiết kiệm</Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Container>
    );
};

export default CustomerDashboard;