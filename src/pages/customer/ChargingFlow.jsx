import React, { useState, useEffect } from "react";
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
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Avatar,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import {
    QrCodeScanner,
    ElectricCar,
    BatteryChargingFull,
    CheckCircle,
    LocationOn,
    Speed,
    Search,
} from "@mui/icons-material";
import useBookingStore from "../../store/bookingStore";
import useStationStore from "../../store/stationStore";
import { formatCurrency } from "../../utils/helpers";
import { getStationImage } from "../../utils/imageAssets";
import { CONNECTOR_TYPES } from "../../utils/constants";
import BookingModal from "../../components/customer/BookingModal";
import RatingModal from "../../components/customer/RatingModal";

const ChargingFlow = () => {
    const { currentBooking, chargingSession, startCharging, socTracking } = useBookingStore();
    const {
        stations,
        initializeData,
        filters,
        updateFilters,
        loading,
    } = useStationStore();

    const [flowStep, setFlowStep] = useState(0); // 0: Tìm trạm, 1: Đặt lịch, 2: QR Scan, 3: Kết nối, 4: Sạc, 5: Hoàn thành
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStation, setSelectedStation] = useState(null);
    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [qrScanOpen, setQrScanOpen] = useState(false);
    const [scanResult, setScanResult] = useState("");
    const [ratingModalOpen, setRatingModalOpen] = useState(false);
    const [completedSession, setCompletedSession] = useState(null);

    const flowSteps = [
        "Tìm trạm sạc",
        "Đặt lịch sạc",
        "Quét QR trạm",
        "Kết nối xe",
        "Đang sạc",
        "Thanh toán",
        "Hoàn thành"
    ];

    // Combined filter for stations based on search text and connector types
    const filteredStations = React.useMemo(() => {
        console.log('🔍 Auto filtering stations - searchQuery:', searchQuery, 'filters:', filters);

        try {
            // Start with all stations from store
            let stationList = stations || [];
            console.log('📊 Total stations:', stationList.length);

            // Apply text search filter if search query exists
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                stationList = stationList.filter((station) => {
                    if (!station || !station.name || !station.location) return false;

                    const matchesName = station.name.toLowerCase().includes(query);
                    const matchesAddress = station.location.address &&
                        station.location.address.toLowerCase().includes(query);
                    const matchesLandmarks = station.location.landmarks &&
                        station.location.landmarks.some(landmark =>
                            landmark.toLowerCase().includes(query)
                        );

                    return matchesName || matchesAddress || matchesLandmarks;
                });
                console.log('🔤 After text filter:', stationList.length);
            }

            // Apply connector type filtering from store filters
            if (filters.connectorTypes && filters.connectorTypes.length > 0) {
                stationList = stationList.filter((station) => {
                    if (!station.charging) return false;

                    // Check connectorTypes array first
                    if (station.charging.connectorTypes && station.charging.connectorTypes.length > 0) {
                        return filters.connectorTypes.some(filterType =>
                            station.charging.connectorTypes.includes(filterType)
                        );
                    }

                    // Check chargingPosts if connectorTypes not available
                    if (station.charging.chargingPosts && station.charging.chargingPosts.length > 0) {
                        return station.charging.chargingPosts.some(post =>
                            post.slots && post.slots.some(slot =>
                                filters.connectorTypes.includes(slot.connectorType)
                            )
                        );
                    }

                    return false;
                });
                console.log('🔌 After connector filter:', stationList.length);
            }

            return stationList;
        } catch (error) {
            console.error("❌ Error filtering stations:", error);
            return [];
        }
    }, [searchQuery, filters, stations]);

    useEffect(() => {
        initializeData();
    }, [initializeData]);

    // Check if we have an active booking to determine flow step
    useEffect(() => {
        console.log('📊 Flow useEffect - currentBooking:', currentBooking, 'chargingSession:', chargingSession, 'currentStep:', flowStep);

        // Only auto-advance if we're still in the initial steps (0 or 1)
        if (currentBooking && !chargingSession && flowStep <= 1) {
            console.log('🔄 Auto-advancing to QR scan step after booking');
            setFlowStep(2); // Go to QR scan step only from step 0 or 1
        }
        // Don't auto-advance to charging - let manual flow handle it
    }, [currentBooking, chargingSession, flowStep]);

    const handleStationSelect = (station) => {
        setSelectedStation(station);
        setBookingModalOpen(true);
    };

    const handleBookingComplete = () => {
        setBookingModalOpen(false);
        setFlowStep(2); // Move to QR scan step
    };

    const handleQRScan = (result) => {
        setScanResult(result);
        setFlowStep(3); // Move to connect step
        setQrScanOpen(false);
    };

    const handleStartCharging = () => {
        console.log('🚀 Starting charging process...');
        if (currentBooking) {
            console.log('📱 Moving to charging step...');
            setFlowStep(4); // Move to charging step first

            // Then start the actual charging session
            setTimeout(() => {
                console.log('🔋 Initializing charging session...');
                startCharging(currentBooking.id, {
                    stationId: currentBooking.stationId,
                    connectorId: scanResult || "A01",
                    initialSOC: 25,
                    targetSOC: 80,
                });
            }, 500); // Small delay to ensure UI updates first
        }
    };

    const currentSOC = socTracking?.[currentBooking?.id]?.currentSOC || 25;
    const targetSOC = socTracking?.[currentBooking?.id]?.targetSOC || 80;
    const chargingProgress = ((currentSOC - 25) / (targetSOC - 25)) * 100;

    const getDistanceToStation = (station) => {
        return station.distance ? station.distance.toFixed(1) : "16.6";
    };

    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: "bold" }}>
                Sạc xe điện
            </Typography>            {/* Flow Progress */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Stepper activeStep={flowStep} alternativeLabel>
                        {flowSteps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </CardContent>
            </Card>

            {/* Step 0: Find Stations */}
            {flowStep === 0 && (
                <Grid container spacing={3}>
                    {/* Search and Filters */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} md={7}>
                                        <TextField
                                            fullWidth
                                            placeholder="Tìm kiếm theo vị trí, tên trạm..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            InputProps={{
                                                startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={5}>
                                        <FormControl fullWidth>
                                            <InputLabel>Loại cổng sạc</InputLabel>
                                            <Select
                                                value={filters.connectorTypes || []}
                                                multiple
                                                onChange={(e) => {
                                                    console.log('🔌 Connector type changed:', e.target.value);
                                                    updateFilters({ connectorTypes: e.target.value });
                                                }}
                                                renderValue={(selected) => selected.join(', ')}
                                            >
                                                {Object.values(CONNECTOR_TYPES).map((type) => (
                                                    <MenuItem key={type} value={type}>
                                                        {type}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Stations List */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {filteredStations.length} trạm được tìm thấy
                                </Typography>
                                {loading ? (
                                    <Box sx={{ textAlign: "center", py: 4 }}>
                                        <Typography>Đang tải...</Typography>
                                    </Box>
                                ) : (
                                    <List>
                                        {filteredStations.map((station) => (
                                            <ListItem
                                                key={station.id}
                                                onClick={() => handleStationSelect(station)}
                                                sx={{
                                                    borderRadius: 2,
                                                    mb: 1,
                                                    border: 1,
                                                    borderColor: "divider",
                                                    "&:hover": { backgroundColor: "grey.50" },
                                                    cursor: "pointer",
                                                }}
                                            >
                                                <ListItemIcon>
                                                    <Avatar src={getStationImage(station)} sx={{ width: 60, height: 60 }}>
                                                        <ElectricCar />
                                                    </Avatar>
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                                                            <Typography variant="h6" fontWeight="bold">
                                                                {station.name}
                                                            </Typography>
                                                            <Chip
                                                                label={`${station.charging.availablePorts}/${station.charging.totalPorts} Có sẵn`}
                                                                size="small"
                                                                color="success"
                                                            />
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <Box>
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                                                <LocationOn sx={{ fontSize: 16, color: "text.secondary" }} />
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {station.location.address} • {getDistanceToStation(station)} km
                                                                </Typography>
                                                            </Box>
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                                    <Speed sx={{ fontSize: 16, color: "primary.main" }} />
                                                                    <Typography variant="body2">
                                                                        Lên đến {station.charging.maxPower} kW
                                                                    </Typography>
                                                                </Box>
                                                                <Typography variant="body2" color="success.main" fontWeight="medium">
                                                                    Từ {formatCurrency(station.charging.pricing.acRate)}/kWh
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    }
                                                />
                                                <Button variant="contained" sx={{ ml: 2 }}>
                                                    Đặt ngay
                                                </Button>
                                            </ListItem>
                                        ))}
                                    </List>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Step 2: QR Scan */}
            {flowStep === 2 && (
                <Grid item xs={12}>
                    <Paper sx={{ p: 4, textAlign: "center" }}>
                        <QrCodeScanner sx={{ fontSize: 80, color: "primary.main", mb: 2 }} />
                        <Typography variant="h5" gutterBottom>
                            Quét mã QR trên trụ sạc
                        </Typography>
                        <Alert severity="info" sx={{ mb: 3 }}>
                            Bạn đã đặt lịch thành công! Hãy đến trạm và quét QR để bắt đầu sạc.
                        </Alert>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<QrCodeScanner />}
                            onClick={() => setQrScanOpen(true)}
                        >
                            Quét QR trên trụ sạc
                        </Button>
                    </Paper>
                </Grid>
            )}

            {/* Step 3: Connect Vehicle */}
            {flowStep === 3 && (
                <Grid item xs={12}>
                    <Paper sx={{ p: 4, textAlign: "center" }}>
                        <ElectricCar sx={{ fontSize: 80, color: "success.main", mb: 2 }} />
                        <Typography variant="h5" gutterBottom>
                            Kết nối xe điện với trụ sạc
                        </Typography>
                        <Alert severity="success" sx={{ mb: 3 }}>
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

            {/* Step 4: Charging - EV Dashboard */}
            {flowStep === 4 && (
                <Grid item xs={12}>
                    <Box
                        sx={{
                            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 75%, #475569 100%)',
                            borderRadius: 3,
                            p: 0,
                            color: 'white',
                            position: 'relative',
                            overflow: 'hidden',
                            minHeight: '600px',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {/* Top Status Bar */}
                        <Box sx={{
                            background: 'rgba(0,0,0,0.3)',
                            px: 4,
                            py: 2,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                🔋 Đang sạc - {selectedStation?.name || "Green Mall Charging Hub"}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                Connector: {scanResult?.split(':').pop() || "A01"}
                            </Typography>
                        </Box>

                        {/* Main Dashboard */}
                        <Box sx={{ flex: 1, p: 4 }}>
                            <Grid container spacing={4} sx={{ height: '100%' }}>
                                {/* SOC Display - Large Center */}
                                <Grid item xs={12} md={6}>
                                    <Box sx={{
                                        textAlign: 'center',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: 2,
                                        p: 4,
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center'
                                    }}>
                                        <Typography variant="h3" sx={{
                                            fontSize: '4rem',
                                            fontWeight: 'bold',
                                            color: '#10b981',
                                            mb: 1
                                        }}>
                                            {currentSOC}%
                                        </Typography>
                                        <Typography variant="h6" sx={{ opacity: 0.8, mb: 3 }}>
                                            Mức pin hiện tại
                                        </Typography>

                                        {/* SOC Progress Ring Effect */}
                                        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={currentSOC}
                                                sx={{
                                                    height: 12,
                                                    borderRadius: 6,
                                                    width: '100%',
                                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                                    '& .MuiLinearProgress-bar': {
                                                        backgroundColor: '#10b981',
                                                        borderRadius: 6,
                                                    }
                                                }}
                                            />
                                        </Box>

                                        <Typography variant="body1" sx={{ opacity: 0.7 }}>
                                            Mục tiêu: {targetSOC}% • Tiến trình: {chargingProgress.toFixed(1)}%
                                        </Typography>
                                    </Box>
                                </Grid>

                                {/* Stats Cards */}
                                <Grid item xs={12} md={6}>
                                    <Grid container spacing={2} sx={{ height: '100%' }}>
                                        {/* Power */}
                                        <Grid item xs={6}>
                                            <Box sx={{
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                                borderRadius: 2,
                                                p: 2,
                                                textAlign: 'center'
                                            }}>
                                                <Typography variant="h4" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
                                                    45
                                                </Typography>
                                                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                                    kW
                                                </Typography>
                                                <Typography variant="caption" sx={{ opacity: 0.6 }}>
                                                    Công suất
                                                </Typography>
                                            </Box>
                                        </Grid>

                                        {/* Energy */}
                                        <Grid item xs={6}>
                                            <Box sx={{
                                                background: 'rgba(16, 185, 129, 0.1)',
                                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                                borderRadius: 2,
                                                p: 2,
                                                textAlign: 'center'
                                            }}>
                                                <Typography variant="h4" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                                                    18.5
                                                </Typography>
                                                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                                    kWh
                                                </Typography>
                                                <Typography variant="caption" sx={{ opacity: 0.6 }}>
                                                    Năng lượng
                                                </Typography>
                                            </Box>
                                        </Grid>

                                        {/* Time */}
                                        <Grid item xs={6}>
                                            <Box sx={{
                                                background: 'rgba(245, 158, 11, 0.1)',
                                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                                borderRadius: 2,
                                                p: 2,
                                                textAlign: 'center'
                                            }}>
                                                <Typography variant="h4" sx={{ color: '#f59e0b', fontWeight: 'bold' }}>
                                                    45
                                                </Typography>
                                                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                                    phút
                                                </Typography>
                                                <Typography variant="caption" sx={{ opacity: 0.6 }}>
                                                    Thời gian
                                                </Typography>
                                            </Box>
                                        </Grid>

                                        {/* Cost */}
                                        <Grid item xs={6}>
                                            <Box sx={{
                                                background: 'rgba(139, 92, 246, 0.1)',
                                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                                borderRadius: 2,
                                                p: 2,
                                                textAlign: 'center'
                                            }}>
                                                <Typography variant="h4" sx={{ color: '#8b5cf6', fontWeight: 'bold' }}>
                                                    157K
                                                </Typography>
                                                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                                    VND
                                                </Typography>
                                                <Typography variant="caption" sx={{ opacity: 0.6 }}>
                                                    Chi phí
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Bottom Controls */}
                        <Box sx={{
                            background: 'rgba(0,0,0,0.3)',
                            px: 4,
                            py: 3,
                            display: 'flex',
                            justifyContent: 'center',
                            borderTop: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <Button
                                variant="contained"
                                size="large"
                                sx={{
                                    background: 'linear-gradient(45deg, #ef4444 30%, #dc2626 90%)',
                                    px: 4,
                                    py: 1.5,
                                    borderRadius: 3,
                                    boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)',
                                    '&:hover': {
                                        background: 'linear-gradient(45deg, #dc2626 30%, #b91c1c 90%)',
                                    }
                                }}
                                onClick={() => {
                                    const sessionData = {
                                        energyDelivered: 18.5,
                                        chargingDuration: 45,
                                        totalAmount: 157000,
                                        finalSOC: currentSOC,
                                        completedAt: new Date().toISOString()
                                    };
                                    setCompletedSession(sessionData);
                                    setFlowStep(5); // Move to payment step
                                }}
                            >
                                🛑 Dừng sạc
                            </Button>
                        </Box>
                    </Box>
                </Grid>
            )}

            {/* Step 5: Payment */}
            {flowStep === 5 && (
                <Grid item xs={12}>
                    <Paper sx={{ p: 4 }}>
                        <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
                            💳 Thanh toán phiên sạc
                        </Typography>

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>Chi tiết phiên sạc</Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2">Trạm sạc:</Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {selectedStation?.name || "Green Mall Charging Hub"}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2">Connector:</Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {scanResult?.split(':').pop() || "A01"}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2">Năng lượng:</Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {completedSession?.energyDelivered || 18.5} kWh
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2">Thời gian sạc:</Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {completedSession?.chargingDuration || 45} phút
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                            <Typography variant="body2">Giá:</Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {formatCurrency(8500)}/kWh
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2, borderTop: 1, borderColor: 'divider' }}>
                                            <Typography variant="h6">Tổng cộng:</Typography>
                                            <Typography variant="h6" color="primary.main" fontWeight="bold">
                                                {formatCurrency(completedSession?.totalAmount || 157000)}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>Phương thức thanh toán</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            Chọn phương thức thanh toán của bạn
                                        </Typography>

                                        {/* Payment Methods */}
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <Button
                                                variant="outlined"
                                                fullWidth
                                                sx={{ justifyContent: 'flex-start', p: 2 }}
                                            >
                                                💳 Thẻ tín dụng **** 4567
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                fullWidth
                                                sx={{ justifyContent: 'flex-start', p: 2 }}
                                            >
                                                📱 MoMo Wallet
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                fullWidth
                                                sx={{ justifyContent: 'flex-start', p: 2 }}
                                            >
                                                🏦 Chuyển khoản ngân hàng
                                            </Button>
                                        </Box>

                                        <Button
                                            variant="contained"
                                            fullWidth
                                            size="large"
                                            sx={{ mt: 3 }}
                                            onClick={() => setFlowStep(6)}
                                        >
                                            Thanh toán {formatCurrency(completedSession?.totalAmount || 157000)}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            )}

            {/* Step 6: Complete with Rating */}
            {flowStep === 6 && (
                <Grid item xs={12}>
                    <Paper sx={{ p: 4, textAlign: "center" }}>
                        <CheckCircle sx={{ fontSize: 80, color: "success.main", mb: 2 }} />
                        <Typography variant="h5" gutterBottom>
                            🎉 Sạc hoàn thành!
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            Cảm ơn bạn đã sử dụng dịch vụ. Phiên sạc đã kết thúc thành công.
                        </Typography>

                        <Box sx={{
                            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                            borderRadius: 2,
                            p: 3,
                            mb: 3,
                            border: '1px solid #0284c7'
                        }}>
                            <Typography variant="h6" color="primary.main" gutterBottom>
                                📊 Tóm tắt phiên sạc
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" fontWeight="bold" color="success.main">
                                        {completedSession?.energyDelivered || 18.5}
                                    </Typography>
                                    <Typography variant="caption">kWh sạc</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                                        {completedSession?.chargingDuration || 45}
                                    </Typography>
                                    <Typography variant="caption">phút</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" fontWeight="bold" color="warning.main">
                                        {currentSOC}%
                                    </Typography>
                                    <Typography variant="caption">mức pin</Typography>
                                </Box>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Button
                                variant="outlined"
                                size="large"
                                onClick={() => setRatingModalOpen(true)}
                            >
                                ⭐ Đánh giá trải nghiệm
                            </Button>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={() => {
                                    setFlowStep(0);
                                    setSelectedStation(null);
                                    setScanResult("");
                                    setCompletedSession(null);
                                }}
                            >
                                🚗 Sạc phiên mới
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            )}

            {/* Booking Modal */}
            <BookingModal
                open={bookingModalOpen}
                onClose={() => setBookingModalOpen(false)}
                station={selectedStation}
                onSuccess={handleBookingComplete}
            />

            {/* QR Scanner Dialog */}
            <Dialog open={qrScanOpen} onClose={() => setQrScanOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Quét mã QR trên trụ sạc</DialogTitle>
                <DialogContent>
                    <Box sx={{ textAlign: "center", py: 4 }}>
                        <QrCodeScanner sx={{ fontSize: 120, color: "primary.main", mb: 2 }} />
                        <Typography variant="body1" gutterBottom>
                            Hướng camera về phía mã QR trên trụ sạc
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Demo: Nhấn nút bên dưới để mô phỏng quét QR thành công
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setQrScanOpen(false)}>Hủy</Button>
                    <Button
                        variant="contained"
                        onClick={() => handleQRScan("SKAEV:STATION:ST001:A01")}
                    >
                        Demo: Quét thành công
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Rating Modal */}
            <RatingModal
                open={ratingModalOpen}
                onClose={() => setRatingModalOpen(false)}
                station={selectedStation}
                completedSession={completedSession}
                onRatingComplete={() => {
                    setRatingModalOpen(false);
                    // Reset flow after rating
                    setTimeout(() => {
                        setFlowStep(0);
                        setSelectedStation(null);
                        setScanResult("");
                        setCompletedSession(null);
                    }, 1000);
                }}
            />
        </Container>
    );
};

export default ChargingFlow;