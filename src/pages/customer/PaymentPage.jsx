import React, { useState } from 'react';
import {
    Container,
    Paper,
    Box,
    Typography,
    Tabs,
    Tab,
} from '@mui/material';
import {
    Payment,
    History,
    CreditCard,
} from '@mui/icons-material';

// Import existing components
import PaymentHistory from './PaymentHistory';
import PaymentMethods from './PaymentMethods';

const PaymentPage = () => {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

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
                     Thanh toán
                </Typography>

            </Box>

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