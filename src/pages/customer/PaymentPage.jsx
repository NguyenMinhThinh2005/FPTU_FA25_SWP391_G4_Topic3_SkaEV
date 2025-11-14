import React from 'react';
import {
    Container,
    Paper,
    Box,
    Typography,
} from '@mui/material';
import {
    Payment,
} from '@mui/icons-material';

// Import existing components
import PaymentHistory from './PaymentHistory';

const PaymentPage = () => {
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
                {/* Payment History Content */}
                <Box sx={{ p: 0 }}>
                    <PaymentHistory />
                </Box>
            </Paper>
        </Container>
    );
};

export default PaymentPage;