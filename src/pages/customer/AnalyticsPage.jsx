import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Box,
    Typography,
    Tabs,
    Tab,
    Grid,
    Card,
    CardContent,
    Chip,
    Button,
} from '@mui/material';
import {
    Analytics,
    Assessment,
    Psychology,
    Download,
    FilterList,
    TrendingUp,
    ElectricBolt,
    AccountBalanceWallet,
    Schedule,
} from '@mui/icons-material';
import useBookingStore from '../../store/bookingStore';
import useAuthStore from '../../store/authStore';
import useVehicleStore from '../../store/vehicleStore';
import { formatCurrency } from '../../utils/helpers';

// Import existing components
import CustomerAnalytics from './Analytics';
import MonthlyCostReports from './MonthlyCostReports';
import ChargingHabitsAnalysis from './ChargingHabitsAnalysis';

const AnalyticsPage = () => {
    const [activeTab, setActiveTab] = useState(0);
    const { getBookingStats, bookingHistory, initializeMockData } = useBookingStore();
    const { user } = useAuthStore();
    const { vehicles } = useVehicleStore();

    // Ensure data is initialized
    useEffect(() => {
        if (bookingHistory.length === 0) {
            console.log('⚠️ AnalyticsPage - No data, initializing...');
            initializeMockData();
        }
    }, [bookingHistory.length, initializeMockData]);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const stats = getBookingStats();

    // Debug: Log stats để kiểm tra dữ liệu
    console.log('📊 AnalyticsPage - Stats from getBookingStats():', {
        stats,
        bookingHistoryLength: bookingHistory.length
    });

    // Quick Stats Cards - Sử dụng field names đúng từ bookingStore
    const quickStats = [
        {
            title: 'Tổng phiên sạc',
            value: stats.completed || 0, // Chỉ đếm completed bookings
            icon: <ElectricBolt />,
            color: 'primary',
            trend: '+12%'
        },
        {
            title: 'Năng lượng tiêu thụ',
            value: `${parseFloat(stats.totalEnergyCharged || 0).toFixed(1)} kWh`, // ✅ Đúng field name
            icon: <TrendingUp />,
            color: 'success',
            trend: '+8.5%'
        },
        {
            title: 'Chi phí tháng này',
            value: formatCurrency(parseFloat(stats.totalAmount || 0)),
            icon: <AccountBalanceWallet />,
            color: 'warning',
            trend: '-5.2%'
        },
        {
            title: 'Thời gian sạc TB',
            value: `${stats.averageDuration || 0} phút`, // ✅ Hiển thị phút/phiên
            icon: <Schedule />,
            color: 'info',
            trend: '+2.1%'
        },
    ];

    const tabs = [
        {
            label: 'Phân tích tổng quan',
            icon: <Analytics />,
            component: <CustomerAnalytics />
        },
        {
            label: 'Báo cáo chi phí',
            icon: <Assessment />,
            component: <MonthlyCostReports />
        },
        {
            label: 'Thói quen sạc',
            icon: <Psychology />,
            component: <ChargingHabitsAnalysis />
        }
    ];

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Analytics sx={{ fontSize: 40, color: 'primary.main' }} />
                    📊 Thống kê & Báo cáo
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Phân tích chi tiết về hoạt động sạc xe và chi phí của bạn
                </Typography>
            </Box>

            {/* Quick Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {quickStats.map((stat, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card
                            sx={{
                                height: '100%',
                                background: `linear-gradient(135deg, ${stat.color === 'primary' ? '#1976d2' :
                                    stat.color === 'success' ? '#2e7d32' :
                                        stat.color === 'warning' ? '#ed6c02' : '#0288d1'} 0%, ${stat.color === 'primary' ? '#1565c0' :
                                            stat.color === 'success' ? '#1b5e20' :
                                                stat.color === 'warning' ? '#e65100' : '#0277bd'} 100%)`,
                                color: 'white'
                            }}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Box sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}>
                                        {stat.icon}
                                    </Box>
                                    <Chip
                                        label={stat.trend}
                                        size="small"
                                        sx={{
                                            backgroundColor: stat.trend.startsWith('+') ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)',
                                            color: 'white',
                                            fontWeight: 'bold'
                                        }}
                                    />
                                </Box>
                                <Typography variant="h5" fontWeight="bold" gutterBottom>
                                    {stat.value}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    {stat.title}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Main Analytics Section */}
            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
                {/* Tabs Header */}
                <Box sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    backgroundColor: 'background.paper'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, pt: 2 }}>
                        <Tabs
                            value={activeTab}
                            onChange={handleTabChange}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                                '& .MuiTab-root': {
                                    minHeight: 60,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '0.9rem'
                                }
                            }}
                        >
                            {tabs.map((tab, index) => (
                                <Tab
                                    key={index}
                                    label={tab.label}
                                    icon={tab.icon}
                                    iconPosition="start"
                                    sx={{ gap: 1 }}
                                />
                            ))}
                        </Tabs>

                        <Box sx={{ display: 'flex', gap: 1 }}>

                            <Button
                                startIcon={<Download />}
                                variant="contained"
                                size="small"
                                sx={{ textTransform: 'none' }}
                            >
                                Xuất báo cáo
                            </Button>
                        </Box>
                    </Box>
                </Box>

                {/* Tab Content */}
                <Box sx={{ p: 0 }}>
                    {tabs[activeTab]?.component}
                </Box>
            </Paper>


        </Container>
    );
};

export default AnalyticsPage;