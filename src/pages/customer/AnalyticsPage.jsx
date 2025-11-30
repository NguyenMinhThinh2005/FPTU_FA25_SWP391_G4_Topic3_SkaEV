/* eslint-disable */
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
    Button} from '@mui/material';
import {
    Analytics,
    Assessment,
    Psychology,
    Download,
    FilterList,
    TrendingUp,
    ElectricBolt,
    AccountBalanceWallet,
    Schedule} from '@mui/icons-material';
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
    const { getBookingStats, bookingHistory} = useBookingStore();
    const { user } = useAuthStore();
    const { vehicles } = useVehicleStore();

    // Ensure data is initialized
    useEffect(() => {
        if (bookingHistory.length === 0) {
            console.log('🔍 AnalyticsPage - No data, initializing...');
        }
    }, [bookingHistory.length]);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const stats = getBookingStats();

    // Debug: Log stats để kiểm tra dữ liệu
    console.log('🔍 AnalyticsPage - Stats from getBookingStats():', {
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
            value: `${parseFloat(stats.totalEnergyCharged || 0).toFixed(1)} kWh`, // ✓ Đúng field name
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
            title: 'Thời gian sạc trung bình',
            value: `${stats.averageDuration || 0} phút`, // ✓ Hiển thị phút/phiên
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

