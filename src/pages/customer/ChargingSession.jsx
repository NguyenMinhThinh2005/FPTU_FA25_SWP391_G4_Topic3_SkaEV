import React, { useState } from "react";
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Button,
    Stepper,
    Step,
    StepLabel,
    Grid,
    Paper,
    Chip,
    LinearProgress,
    Alert
} from "@mui/material";
import {
    QrCodeScanner,
    ElectricCar,
    BatteryChargingFull,
    CheckCircle,
    Error,
} from "@mui/icons-material";
import useBookingStore from "../../store/bookingStore";
import { formatCurrency } from "../../utils/helpers";
import QRCodeScanner from "../../components/ui/QRCodeScanner/QRCodeScanner";

const ChargingSession = () => {
    const { currentBooking, chargingSession, startCharging, socTracking, scanQRCode } = useBookingStore();
    const [qrScanOpen, setQrScanOpen] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [scanResult, setScanResult] = useState("");

    const steps = [
        "Quét QR trên trụ sạc",
        "Kết nối xe điện",
        "Đang sạc pin",
        "Hoàn thành"
    ];

    const handleQRScan = async (result) => {
        const qrValue = typeof result === "string" ? result : result?.qrData ?? result?.text;

        if (!qrValue) {
            console.warn("Không nhận được dữ liệu QR hợp lệ", result);
            return;
        }

        console.log("QR Scanned:", qrValue);
        setScanResult(qrValue);

        if (currentBooking && typeof scanQRCode === "function") {
            try {
                const response = await scanQRCode(currentBooking.id, qrValue);
                if (!response?.success && response?.error) {
                    console.error("Scan QR failed:", response.error);
                }
            } catch (error) {
                console.error("Failed to scan QR code:", error);
            }
        }

        setActiveStep(1);
        setQrScanOpen(false);
    };

    const handleStartCharging = () => {
        if (currentBooking) {
            startCharging(currentBooking.id, {
                stationId: currentBooking.stationId,
                connectorId: scanResult || "A01",
                initialSOC: 25,
                targetSOC: 80,
            });
            setActiveStep(2);
        }
    };

    const currentSOC = socTracking?.[currentBooking?.id]?.currentSOC || 25;
    const targetSOC = socTracking?.[currentBooking?.id]?.targetSOC || 80;
    const chargingProgress = ((currentSOC - 25) / (targetSOC - 25)) * 100;

    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: "bold" }}>
                Phiên sạc hiện tại
            </Typography>

            {/* Quy trình sạc */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Stepper activeStep={activeStep} alternativeLabel>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </CardContent>
            </Card>

            {/* Nội dung theo từng bước */}
            <Grid container spacing={3}>
                {/* Bước 1: Quét QR */}
                {activeStep === 0 && (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 4, textAlign: "center" }}>
                            <QrCodeScanner sx={{ fontSize: 80, color: "primary.main", mb: 2 }} />
                            <Typography variant="h5" gutterBottom>
                                Quét mã QR trên trụ sạc
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                Tìm mã QR trên trụ sạc và quét để xác định vị trí chính xác
                            </Typography>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<QrCodeScanner />}
                                onClick={() => setQrScanOpen(true)}
                            >
                                Mở máy quét QR
                            </Button>
                        </Paper>
                    </Grid>
                )}

                {/* Bước 2: Kết nối xe */}
                {activeStep === 1 && (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 4, textAlign: "center" }}>
                            <Typography variant="h5" gutterBottom>
                                Kết nối xe điện với trụ sạc
                            </Typography>
                            <Alert severity="info" sx={{ mb: 3 }}>
                                QR Code đã quét: <strong>{scanResult || "SKAEV:STATION:ST001:A01"}</strong>
                            </Alert>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                Cắm dây sạc vào cổng sạc của xe và đảm bảo kết nối chắc chắn
                            </Typography>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<BatteryChargingFull />}
                                onClick={handleStartCharging}
                            >
                                Bắt đầu sạc
                            </Button>
                        </Paper>
                    </Grid>
                )}

                {/* Bước 3: Đang sạc */}
                {activeStep === 2 && chargingSession && (
                    <Grid item xs={12}>
                        <Grid container spacing={2}>
                            {/* Thông tin sạc */}
                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Trạng thái sạc pin
                                        </Typography>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Mức pin hiện tại: {currentSOC}%
                                            </Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={currentSOC}
                                                sx={{ height: 10, borderRadius: 1, mt: 1 }}
                                            />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Tiến trình: {chargingProgress.toFixed(1)}%
                                        </Typography>
                                        <LinearProgress
                                            variant="determinate"
                                            value={chargingProgress}
                                            sx={{ height: 8, borderRadius: 1, mt: 1 }}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Thông tin phiên */}
                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Thông tin phiên sạc
                                        </Typography>
                                        <Typography variant="body2">
                                            Trạm: {chargingSession.stationName || "Green Mall Charging Hub"}
                                        </Typography>
                                        <Typography variant="body2">
                                            Connector: {chargingSession.connectorId || "A01"}
                                        </Typography>
                                        <Typography variant="body2">
                                            Công suất: 45 kW
                                        </Typography>
                                        <Typography variant="body2">
                                            Giá: {formatCurrency(8500)}/kWh
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Nút dừng sạc */}
                            <Grid item xs={12}>
                                <Box sx={{ textAlign: "center", mt: 2 }}>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        size="large"
                                        onClick={() => setActiveStep(3)}
                                    >
                                        Dừng sạc
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </Grid>
                )}

                {/* Bước 4: Hoàn thành */}
                {activeStep === 3 && (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 4, textAlign: "center" }}>
                            <CheckCircle sx={{ fontSize: 80, color: "success.main", mb: 2 }} />
                            <Typography variant="h5" gutterBottom>
                                Sạc hoàn thành!
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                Phiên sạc đã kết thúc. Bạn có thể rút dây sạc và di chuyển xe.
                            </Typography>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={() => setActiveStep(0)}
                            >
                                Phiên sạc mới
                            </Button>
                        </Paper>
                    </Grid>
                )}

                {/* Trường hợp chưa có booking */}
                {!currentBooking && activeStep === 0 && (
                    <Grid item xs={12}>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Bạn chưa có lịch sạc nào. Hãy đặt lịch từ trang "Tìm trạm sạc" trước.
                        </Alert>
                    </Grid>
                )}
            </Grid>

            {/* QR Scanner Overlay */}
            {qrScanOpen && (
                <QRCodeScanner
                    onScanSuccess={handleQRScan}
                    onClose={() => setQrScanOpen(false)}
                />
            )}
        </Container>
    );
};

export default ChargingSession;