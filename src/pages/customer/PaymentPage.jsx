import React, { useState } from 'react';
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
    Payment,
    History,
    CreditCard,
    AccountBalance,
    Wallet,
    Receipt,
    Download,
    FilterList,
} from '@mui/icons-material';
import useCustomerStore from '../../store/customerStore';
import useAuthStore from '../../store/authStore';
import useBookingStore from '../../store/bookingStore';
import useVehicleStore from '../../store/vehicleStore';

// Import existing components
import PaymentHistory from './PaymentHistory';
import PaymentMethods from './PaymentMethods';

const PaymentPage = () => {
    const [activeTab, setActiveTab] = useState(0);
    const customerStore = useCustomerStore();
    const authStore = useAuthStore();
    const bookingStore = useBookingStore();
    const vehicleStore = useVehicleStore();
    const summary = customerStore.getCustomerSummary(authStore, bookingStore, vehicleStore);
    const stats = summary.stats;
    const user = summary.user;
    const formatCurrency = customerStore.formatCurrency;

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Thống kê hiển thị, lấy từ stats đã đồng bộ
    const paymentStats = [
        {
            title: 'Tổng chi tiêu tháng này',
            value: formatCurrency(stats.totalAmount || 0),
            icon: <AccountBalance />,
            color: 'primary',
            trend: '+15.2%'
        },
        {
            title: 'Số giao dịch',
            value: `${stats.totalBookings || 0} lần`,
            icon: <Receipt />,
            color: 'success',
            trend: `+${stats.completedBookings || 0} giao dịch`
        },
        {
            title: 'Phương thức ưa thích',
            value: user?.preferredPayment || 'Thẻ tín dụng',
            icon: <CreditCard />,
            color: 'info',
            trend: '65% sử dụng'
        },
        {
            title: 'Điểm tích lũy',
            value: '1,250 điểm',
            icon: <Wallet />,
            color: 'warning',
            trend: '+125 điểm'
        }
    ];

    const tabs = [
        {
            label: 'Lịch sử thanh toán',
            icon: <History />,
            component: <PaymentHistory />
        },
        {
            label: 'Phương thức thanh toán',
            icon: <CreditCard />,
            component: <PaymentMethods />
        }
    ];

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Payment sx={{ fontSize: 40, color: 'primary.main' }} />
                    💳 Thanh toán
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Quản lý phương thức thanh toán và theo dõi lịch sử giao dịch
                </Typography>
            </Box>

            {/* Payment Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {paymentStats.map((stat, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card
                            sx={{
                                height: '100%',
                                background: `linear-gradient(135deg, ${stat.color === 'primary' ? '#1976d2' :
                                    stat.color === 'success' ? '#2e7d32' :
                                        stat.color === 'info' ? '#0288d1' : '#ed6c02'
                                    } 0%, ${stat.color === 'primary' ? '#1565c0' :
                                        stat.color === 'success' ? '#1b5e20' :
                                            stat.color === 'info' ? '#0277bd' : '#e65100'
                                    } 100%)`,
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
                                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                            color: 'white',
                                            fontWeight: 'bold'
                                        }}
                                    />
                                </Box>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
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

            {/* Main Content */}
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
                            sx={{
                                '& .MuiTab-root': {
                                    minHeight: 60,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '1rem'
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

export default PaymentPage;