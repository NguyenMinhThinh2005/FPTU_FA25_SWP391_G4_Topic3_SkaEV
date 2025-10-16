import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Alert } from '@mui/material';
import useBookingStore from '../../store/bookingStore';
import { formatCurrency } from '../../utils/helpers';

const DataDebugger = () => {
    const { bookingHistory, getBookingStats} = useBookingStore();
    const [debugInfo, setDebugInfo] = useState(null);

    const refreshDebugInfo = () => {
        const stats = getBookingStats();
        const completedBookings = bookingHistory.filter(b => b.status === 'completed');

        setDebugInfo({
            bookingHistoryLength: bookingHistory.length,
            completedBookingsLength: completedBookings.length,
            stats: stats,
            sampleBookings: bookingHistory.slice(0, 3).map(b => ({
                id: b.id,
                status: b.status,
                stationName: b.stationName,
                totalAmount: b.totalAmount,
                energyDelivered: b.energyDelivered
            }))
        });
    };

    useEffect(() => {
        const stats = getBookingStats();
        const completedBookings = bookingHistory.filter(b => b.status === 'completed');

        setDebugInfo({
            bookingHistoryLength: bookingHistory.length,
            completedBookingsLength: completedBookings.length,
            stats: stats,
            sampleBookings: bookingHistory.slice(0, 3).map(b => ({
                id: b.id,
                status: b.status,
                stationName: b.stationName,
                totalAmount: b.totalAmount,
                energyDelivered: b.energyDelivered
            }))
        });
    }, [bookingHistory, getBookingStats]);

    const handleForceInit = () => {
        console.log('ðŸ”„ Force initializing mock data...');
                setTimeout(refreshDebugInfo, 500);
    };

    return (
        <Card sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    ðŸ› Data Debug Panel
                </Typography>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleForceInit}
                    sx={{ mb: 2, mr: 2 }}
                >
                    Force Initialize Data
                </Button>

                <Button
                    variant="outlined"
                    onClick={refreshDebugInfo}
                    sx={{ mb: 2 }}
                >
                    Refresh Debug Info
                </Button>

                {debugInfo && (
                    <Box sx={{ mt: 2 }}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            <Typography variant="body2">
                                <strong>Booking History:</strong> {debugInfo.bookingHistoryLength} total, {debugInfo.completedBookingsLength} completed
                            </Typography>
                            <Typography variant="body2">
                                <strong>Stats:</strong> Total: {debugInfo.stats.total}, Completed: {debugInfo.stats.completed}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Total Amount:</strong> {formatCurrency(debugInfo.stats.totalAmount)}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Total Energy:</strong> {debugInfo.stats.totalEnergyCharged} kWh
                            </Typography>
                        </Alert>

                        <Typography variant="subtitle2" gutterBottom>
                            Sample Bookings:
                        </Typography>
                        {debugInfo.sampleBookings.map((booking, index) => (
                            <Typography key={index} variant="body2">
                                {booking.id} - {booking.status} - {booking.stationName} - {formatCurrency(booking.totalAmount)} - {booking.energyDelivered} kWh
                            </Typography>
                        ))}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default DataDebugger;
