import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Paper,
    Alert,
    CircularProgress,
    Grid,
    Chip,
    Card,
    CardContent,
    Divider
} from '@mui/material';
import {
    QrCodeScanner,
    ElectricCar,
    CheckCircle,
    Error,
    Schedule,
    LocationOn
} from '@mui/icons-material';
import useBookingStore from '../../store/bookingStore';
import notificationService from '../../services/notificationService';

const QRScanner = ({ open, onClose, booking }) => {
    const { scanQRCode, startCharging } = useBookingStore();
    const [scanning, setScanning] = useState(false);

    const [error, setError] = useState('');
    const [step, setStep] = useState('scan'); // 'scan', 'connect', 'charging'

    const handleScanQR = async () => {
        setScanning(true);
        setError('');

        try {
            // Simulate QR scan - in real app this would use camera
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Mock QR data
            const qrData = {
                stationId: booking?.stationId,
                chargingPostId: booking?.chargingPost?.id,
                slotId: booking?.slot?.id,
                scannedAt: new Date().toISOString()
            };

            // Validate QR code matches booking
            if (qrData.stationId !== booking?.stationId) {
                throw new Error('Mã QR không khớp với trạm đã đặt');
            }

            scanQRCode(booking.id, qrData);
            setStep('connect');

        } catch (err) {
            setError(err.message || 'Không thể quét mã QR. Vui lòng thử lại.');
        } finally {
            setScanning(false);
        }
    };

    const handleStartCharging = async () => {
        try {
            setScanning(true);

            // Simulate connection check
            await new Promise(resolve => setTimeout(resolve, 1500));

            startCharging(booking.id);
            setStep('charging');

            // Send notification
            notificationService.notifyChargingStarted({
                stationName: booking.stationName,
                currentSOC: 25
            });

            // Close after showing success
            setTimeout(() => {
                onClose();
            }, 3000);

        } catch (err) {
            setError(err.message || 'Không thể khởi động sạc. Vui lòng thử lại.');
        } finally {
            setScanning(false);
        }
    };

    const handleClose = () => {
        setStep('scan');
        setError('');
        setScanning(false);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
                {step === 'scan' && 'Quét mã QR để bắt đầu'}
                {step === 'connect' && 'Kết nối dây sạc'}
                {step === 'charging' && 'Đang sạc xe'}
            </DialogTitle>

            <DialogContent>
                {/* Booking Info */}
                {booking && (
                    <Card sx={{ mb: 3, bgcolor: 'primary.50' }}>
                        <CardContent sx={{ pb: '16px !important' }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item>
                                    <LocationOn color="primary" />
                                </Grid>
                                <Grid item xs>
                                    <Typography variant="subtitle1" fontWeight="medium">
                                        {booking.stationName}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {booking.chargingPost?.name} • {booking.slot?.connectorType}
                                    </Typography>
                                </Grid>
                                <Grid item>
                                    <Chip
                                        label={booking.status}
                                        color={booking.status === 'confirmed' ? 'success' : 'primary'}
                                        size="small"
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Step 1: QR Scanning */}
                {step === 'scan' && (
                    <Box sx={{ textAlign: 'center' }}>
                        <Paper
                            sx={{
                                p: 4,
                                mb: 3,
                                border: '2px dashed',
                                borderColor: 'primary.main',
                                bgcolor: 'primary.50'
                            }}
                        >
                            {scanning ? (
                                <Box>
                                    <CircularProgress size={60} sx={{ mb: 2 }} />
                                    <Typography variant="h6" color="primary">
                                        Đang quét mã QR...
                                    </Typography>
                                </Box>
                            ) : (
                                <Box>
                                    <QrCodeScanner sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                                    <Typography variant="h6" gutterBottom>
                                        Quét mã QR trên trụ sạc
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Mã QR nằm trên màn hình hoặc thân trụ sạc
                                    </Typography>
                                </Box>
                            )}
                        </Paper>

                        <Typography variant="body1" sx={{ mb: 2 }}>
                            📱 Hướng camera về phía mã QR trên trụ sạc
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                            Đảm bảo bạn đang ở đúng trụ sạc đã đặt
                        </Typography>
                    </Box>
                )}

                {/* Step 2: Connect Cable */}
                {step === 'connect' && (
                    <Box sx={{ textAlign: 'center' }}>
                        <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                        <Typography variant="h6" color="success.main" gutterBottom>
                            Quét QR thành công!
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Paper sx={{ p: 3, mb: 3, bgcolor: 'warning.50' }}>
                            <ElectricCar sx={{ fontSize: 50, color: 'warning.main', mb: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                Kết nối dây sạc với xe
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                1. Mở nắp cổng sạc trên xe của bạn<br />
                                2. Cắm đầu sạc vào cổng xe<br />
                                3. Đảm bảo kết nối chặt chẽ
                            </Typography>
                        </Paper>

                        {scanning ? (
                            <Box>
                                <CircularProgress size={30} sx={{ mb: 2 }} />
                                <Typography variant="body1">
                                    Đang kiểm tra kết nối...
                                </Typography>
                            </Box>
                        ) : (
                            <Typography variant="body1">
                                ✅ Nhấn "Bắt đầu sạc" khi đã kết nối xong
                            </Typography>
                        )}
                    </Box>
                )}

                {/* Step 3: Charging Started */}
                {step === 'charging' && (
                    <Box sx={{ textAlign: 'center' }}>
                        <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
                        <Typography variant="h5" color="success.main" gutterBottom>
                            🔋 Đang sạc xe!
                        </Typography>

                        <Paper sx={{ p: 3, bgcolor: 'success.50' }}>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                Quá trình sạc đã bắt đầu thành công
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Bạn có thể theo dõi tiến trình sạc trong phần "Phiên sạc hiện tại"
                            </Typography>
                        </Paper>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 1 }}>
                {step === 'scan' && (
                    <>
                        <Button onClick={handleClose}>
                            Hủy
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleScanQR}
                            disabled={scanning}
                            startIcon={<QrCodeScanner />}
                        >
                            {scanning ? 'Đang quét...' : 'Quét mã QR'}
                        </Button>
                    </>
                )}

                {step === 'connect' && (
                    <>
                        <Button onClick={handleClose}>
                            Hủy
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleStartCharging}
                            disabled={scanning}
                            startIcon={<ElectricCar />}
                        >
                            {scanning ? 'Đang kết nối...' : 'Bắt đầu sạc'}
                        </Button>
                    </>
                )}

                {step === 'charging' && (
                    <Button
                        variant="contained"
                        onClick={handleClose}
                        fullWidth
                    >
                        Hoàn thành
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default QRScanner;