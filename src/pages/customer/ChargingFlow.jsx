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
    Star,
} from "@mui/icons-material";
import useBookingStore from "../../store/bookingStore";
import useStationStore from "../../store/stationStore";

import { getStationImage } from "../../utils/imageAssets";
import { CONNECTOR_TYPES } from "../../utils/constants";
import BookingModal from "../../components/customer/BookingModal";
import RatingModal from "../../components/customer/RatingModal";

const ChargingFlow = () => {
    const {
        currentBooking,
        chargingSession,
        startCharging,
        socTracking,
        scanQRCode,
        clearCurrentBooking,
        resetFlowState,
        stopCharging
    } = useBookingStore();
    const {
        getFilteredStations,
        initializeData,
        filters,
        updateFilters,
        loading,
    } = useStationStore();

    const [flowStep, setFlowStep] = useState(0); // 0: Tìm trạm, 1: Đặt lịch, 2: QR Scan, 3: Kết nối, 4: Sạc, 5: Thanh toán, 6: Hoàn thành
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStation, setSelectedStation] = useState(null);
    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [qrScanOpen, setQrScanOpen] = useState(false);
    const [scanResult, setScanResult] = useState("");
    const [ratingModalOpen, setRatingModalOpen] = useState(false);
    const [completedSession, setCompletedSession] = useState(null);
    const [userManualReset, setUserManualReset] = useState(false); // Flag to prevent auto-advance after manual reset

    const flowSteps = [
        "Tìm trạm sạc",
        "Đặt lịch sạc",
        "Quét QR trạm",
        "Kết nối xe",
        "Đang sạc",
        "Thanh toán",
        "Hoàn thành"
    ];

    // Filter stations based on search
    const filteredStations = React.useMemo(() => {
        console.log("🔄 ChargingFlow: Re-computing filtered stations");
        console.log("Current filters:", filters);

        try {
            const storeFiltered = getFilteredStations();
            console.log("ChargingFlow store filtered:", storeFiltered.length, "stations");

            if (!searchQuery.trim()) return storeFiltered;

            const query = searchQuery.toLowerCase();
            return storeFiltered.filter((station) => {
                if (!station || !station.name || !station.location) return false;

                return (
                    station.name.toLowerCase().includes(query) ||
                    (station.location.address && station.location.address.toLowerCase().includes(query))
                );
            });
        } catch (error) {
            console.error("Error filtering stations:", error);
            return [];
        }
    }, [getFilteredStations, searchQuery, filters]);

    // Initialize stations và reset flow state khi component mount
    useEffect(() => {
        initializeData();
        
        // Reset flow state về trạng thái ban đầu để đảm bảo luôn bắt đầu từ bước 1
        resetFlowState();
        setFlowStep(0);
        setUserManualReset(false);
        
        console.log('ChargingFlow mounted - Reset to step 0');
    }, [initializeData, resetFlowState]);

    // Check if we have an active booking to determine flow step (only for certain conditions)
    useEffect(() => {
        console.log('ChargingFlow useEffect:', { currentBooking, chargingSession, flowStep, userManualReset });

        // Don't auto-advance if user manually reset hoặc không có booking
        if (userManualReset || !currentBooking) {
            console.log('Skipping auto-advance: manual reset or no booking');
            return;
        }

        // Chỉ auto-advance khi có booking hợp lệ và đúng điều kiện
        if (currentBooking.status === "confirmed" && !currentBooking.chargingStarted && flowStep < 3) {
            console.log('Auto-advancing to connection step (3)');
            setFlowStep(3); // Go to connection step
        } else if (chargingSession && currentBooking.qrScanned && currentBooking.chargingStarted && flowStep < 4) {
            console.log('Auto-advancing to charging step (4)');
            setFlowStep(4); // Go to charging step only if QR scanned and charging started
        }
    }, [currentBooking, chargingSession, flowStep, userManualReset]);

    const handleStationSelect = (station) => {
        setSelectedStation(station);
        setBookingModalOpen(true);
    };

    const handleBookingComplete = () => {
        console.log('BookingComplete called, setting flowStep to 2');
        setBookingModalOpen(false);
        // Force move to QR scan step immediately after booking success
        setFlowStep(2); // Move to QR scan step
    };

    // Function to completely reset all states
    const handleCompleteReset = () => {
        console.log('Performing complete reset...');

        // Clear store states first
        clearCurrentBooking(); // Clear current booking

        // If there's an active charging session, stop it
        if (chargingSession && currentBooking) {
            stopCharging(currentBooking.id, {
                finalSOC: 80, // Set a default final SOC
                reason: 'User reset session'
            });
        }

        // Set manual reset flag to prevent auto-advance
        setUserManualReset(true);

        // Reset all local states
        setFlowStep(0);
        setSelectedStation(null);
        setScanResult("");
        setCompletedSession(null);
        setSearchQuery("");
        setBookingModalOpen(false);
        setQrScanOpen(false);
        setRatingModalOpen(false);

        // Clear the manual reset flag after states are cleared
        setTimeout(() => {
            setUserManualReset(false);
            console.log('Manual reset flag cleared - ready for new session');
        }, 500);
    };

    const handleQRScan = (result) => {
        console.log('QR Scan result:', result);
        setScanResult(result);

        // Mark QR as scanned in the booking
        if (currentBooking) {
            try {
                scanQRCode(currentBooking.id, result);
                console.log('QR code scanned successfully');
                setFlowStep(3); // Move to connect step
                setQrScanOpen(false);
            } catch (error) {
                console.error('Failed to scan QR code:', error);
            }
        }
    };

    const handleStartCharging = () => {
        console.log('handleStartCharging called');
        if (currentBooking) {
            startCharging(currentBooking.id, {
                stationId: currentBooking.stationId,
                connectorId: scanResult || "A01",
                initialSOC: 25,
                targetSOC: 80,
            });
            console.log('Moving to charging step (4)');
            setFlowStep(4); // Move to charging step (index 4 = "Đang sạc")
        }
    };

    // Use a stable SOC value that doesn't depend on store when manually reset
    const currentSOC = userManualReset ? 80 : (socTracking?.[currentBooking?.id]?.currentSOC || 80);
    // eslint-disable-next-line no-unused-vars
    const targetSOC = socTracking?.[currentBooking?.id]?.targetSOC || 80;

    // Format currency helper
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    // Format time display (66 minutes -> 1 giờ 6 phút)
    const formatChargingTime = (minutes) => {
        if (minutes < 60) {
            return `${minutes} phút`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        if (remainingMinutes === 0) {
            return `${hours} giờ`;
        }
        return `${hours} giờ ${remainingMinutes} phút`;
    };

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
                                    <Grid item xs={12} md={8}>
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
                                    <Grid item xs={12} md={4}>
                                        <FormControl fullWidth>
                                            <InputLabel>Loại cổng sạc</InputLabel>
                                            <Select
                                                value={filters.connectorTypes?.[0] || ''}
                                                onChange={(e) => updateFilters({ connectorTypes: e.target.value ? [e.target.value] : [] })}
                                            >
                                                <MenuItem value="">
                                                    <em>Tất cả</em>
                                                </MenuItem>
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
                                                        <span style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                                                            <span style={{ fontWeight: "bold", fontSize: "1.25rem" }}>
                                                                {station.name}
                                                            </span>
                                                            <Chip
                                                                label={`${station.charging.availablePorts}/${station.charging.totalPorts} Có sẵn`}
                                                                size="small"
                                                                color="success"
                                                            />
                                                        </span>
                                                    }
                                                    secondary={
                                                        <span>
                                                            <span style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                                                <LocationOn style={{ fontSize: 16, color: "rgba(0, 0, 0, 0.6)" }} />
                                                                <span style={{ fontSize: "0.875rem", color: "rgba(0, 0, 0, 0.6)" }}>
                                                                    {station.location.address} • {getDistanceToStation(station)} km
                                                                </span>
                                                            </span>
                                                            <span style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                                                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                    <Speed style={{ fontSize: 16, color: "#1976d2" }} />
                                                                    <span style={{ fontSize: "0.875rem" }}>
                                                                        Lên đến {station.charging.maxPower} kW
                                                                    </span>
                                                                </span>
                                                                <span style={{ fontSize: "0.875rem", color: "#2e7d32", fontWeight: "500" }}>
                                                                    Từ {formatCurrency(station.charging.pricing.acRate)}/kWh
                                                                </span>
                                                            </span>
                                                        </span>
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

            {/* Step 4: Charging - Authentic EV Dashboard */}
            {flowStep === 4 && chargingSession && (
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
                        {/* Top Status Bar - More Detailed */}
                        <Box sx={{
                            p: 2,
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'rgba(0, 0, 0, 0.3)'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                                    {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                                <Typography variant="body2" sx={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                    |
                                </Typography>
                                <Typography variant="body2" sx={{ fontSize: '0.8rem', opacity: 0.9 }}>
                                    Trạm {selectedStation?.name?.split(' ')[0] || 'Green'} • Cổng A01
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="body2" sx={{ fontSize: '0.8rem', opacity: 0.8 }}>
                                    45kW • AC Type 2
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Box
                                        sx={{
                                            width: 8,
                                            height: 8,
                                            bgcolor: '#10b981',
                                            borderRadius: '50%',
                                            animation: 'pulse 2s infinite'
                                        }}
                                    />
                                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#10b981' }}>
                                        Đang sạc
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        {/* Main Dashboard Content */}
                        <Box sx={{ flex: 1, p: 3, display: 'flex', position: 'relative' }}>
                            {/* Left Side - Stats Cards */}
                            <Box sx={{ width: '40%', pr: 3 }}>
                                {/* Battery Status */}
                                <Box
                                    sx={{
                                        position: 'relative',
                                        mb: 2,
                                        p: 2,
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: 2,
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="body2" sx={{ color: '#10b981', mr: 1 }}>●</Typography>
                                        <Typography variant="body2" sx={{ fontSize: '0.8rem', opacity: 0.9 }}>
                                            {Math.round(currentSOC * 4.2)}km
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '0.8rem', opacity: 0.6, ml: 1 }}>
                                            {currentSOC}%
                                        </Typography>
                                    </Box>

                                    {/* Linear Battery Progress */}
                                    <Box sx={{
                                        width: '100%',
                                        height: 8,
                                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: 1,
                                        overflow: 'hidden',
                                        mb: 1
                                    }}>
                                        <Box sx={{
                                            width: `${currentSOC}%`,
                                            height: '100%',
                                            background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
                                            transition: 'width 1s ease-in-out'
                                        }} />
                                    </Box>

                                    <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.7rem' }}>
                                        Sạc
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.65rem', display: 'block' }}>
                                        {formatChargingTime(Math.max(5, Math.round((80 - currentSOC) * 1.2)))} còn lại
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.65rem', display: 'block' }}>
                                        Hiển thị dung lượng
                                    </Typography>
                                </Box>

                                {/* Detailed Stats Grid */}
                                <Grid container spacing={1} sx={{ mb: 2 }}>
                                    {/* Time Remaining */}
                                    <Grid item xs={12}>
                                        <Box sx={{
                                            textAlign: 'center',
                                            p: 2,
                                            background: 'rgba(16, 185, 129, 0.1)',
                                            borderRadius: 2,
                                            border: '1px solid rgba(16, 185, 129, 0.2)'
                                        }}>
                                            <Typography variant="h3" sx={{ fontWeight: 700, color: '#10b981', fontSize: '2.2rem', mb: 0.5 }}>
                                                {formatChargingTime(Math.max(5, Math.round((80 - currentSOC) * 1.2)))}
                                            </Typography>
                                            <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.75rem', fontWeight: 500 }}>
                                                Thời gian còn lại
                                            </Typography>
                                        </Box>
                                    </Grid>

                                    {/* Current Power & Speed */}
                                    <Grid item xs={6}>
                                        <Box sx={{ textAlign: 'center', p: 1.5 }}>
                                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.6rem' }}>
                                                42.5
                                            </Typography>
                                            <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.7rem' }}>
                                                kW
                                            </Typography>
                                            <Typography variant="caption" sx={{ opacity: 0.6, display: 'block', fontSize: '0.6rem' }}>
                                                Công suất hiện tại
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Box sx={{ textAlign: 'center', p: 1.5 }}>
                                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.6rem' }}>
                                                {(42.5 / 60 * 100).toFixed(1)}
                                            </Typography>
                                            <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.7rem' }}>
                                                %/h
                                            </Typography>
                                            <Typography variant="caption" sx={{ opacity: 0.6, display: 'block', fontSize: '0.6rem' }}>
                                                Tốc độ sạc
                                            </Typography>
                                        </Box>
                                    </Grid>

                                    {/* Energy & Cost */}
                                    <Grid item xs={6}>
                                        <Box sx={{ textAlign: 'center', p: 1.5 }}>
                                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.6rem' }}>
                                                {((currentSOC - 25) * 0.6).toFixed(1)}
                                            </Typography>
                                            <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.7rem' }}>
                                                kWh
                                            </Typography>
                                            <Typography variant="caption" sx={{ opacity: 0.6, display: 'block', fontSize: '0.6rem' }}>
                                                Năng lượng đã sạc
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Box sx={{ textAlign: 'center', p: 1.5 }}>
                                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#fbbf24', fontSize: '1.6rem' }}>
                                                {Math.round((currentSOC - 25) * 0.6 * 8.5)}k
                                            </Typography>
                                            <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.7rem' }}>
                                                VNĐ
                                            </Typography>
                                            <Typography variant="caption" sx={{ opacity: 0.6, display: 'block', fontSize: '0.6rem' }}>
                                                Chi phí hiện tại
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Center - Enhanced Battery Visualization */}
                            <Box sx={{ width: '60%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                {/* Battery Status Header */}
                                <Box sx={{ textAlign: 'center', mb: 2 }}>
                                    <Typography variant="h3" sx={{ fontWeight: 700, color: 'white', fontSize: '3rem' }}>
                                        {currentSOC}%
                                    </Typography>
                                    <Typography variant="body1" sx={{ opacity: 0.8, fontSize: '1rem', mb: 1 }}>
                                        Dung lượng pin
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.6, fontSize: '0.9rem' }}>
                                        {Math.round(currentSOC * 4.2)} km • Quãng đường ước tính
                                    </Typography>
                                </Box>

                                {/* Modern EV SUV Graphic - Transparent Style */}
                                <Box
                                    sx={{
                                        width: 380,
                                        height: 220,
                                        position: 'relative',
                                        mb: 2,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}
                                >
                                    {/* Glowing Base Platform */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            bottom: '5%',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: '90%',
                                            height: 12,
                                            background: 'radial-gradient(ellipse, rgba(59, 130, 246, 0.4) 0%, rgba(29, 78, 216, 0.2) 50%, transparent 80%)',
                                            borderRadius: '50%',
                                            filter: 'blur(2px)'
                                        }}
                                    />

                                    {/* Car Body - SUV Silhouette */}
                                    <Box
                                        sx={{
                                            width: '75%',
                                            height: '70%',
                                            position: 'relative',
                                            mt: 2
                                        }}
                                    >
                                        {/* Main Body - Transparent Glass Effect */}
                                        <Box
                                            sx={{
                                                width: '100%',
                                                height: '85%',
                                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(29, 78, 216, 0.25) 50%, rgba(30, 64, 175, 0.3) 100%)',
                                                borderRadius: '12px 35px 8px 45px',
                                                position: 'relative',
                                                border: '2px solid rgba(59, 130, 246, 0.4)',
                                                backdropFilter: 'blur(10px)',
                                                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3), inset 0 2px 0 rgba(255,255,255,0.1)',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            {/* SUV Roof Line */}
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: '10%',
                                                    width: '80%',
                                                    height: '35%',
                                                    background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 197, 253, 0.3) 50%, rgba(59, 130, 246, 0.2) 100%)',
                                                    borderRadius: '8px 25px 0 0',
                                                    border: '1px solid rgba(147, 197, 253, 0.4)'
                                                }}
                                            />

                                            {/* Windshield */}
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: '5%',
                                                    left: '5%',
                                                    width: '30%',
                                                    height: '50%',
                                                    background: 'linear-gradient(135deg, rgba(147, 197, 253, 0.4) 0%, rgba(59, 130, 246, 0.2) 100%)',
                                                    borderRadius: '6px 15px 4px 20px',
                                                    border: '1px solid rgba(147, 197, 253, 0.5)',
                                                    backdropFilter: 'blur(5px)'
                                                }}
                                            />

                                            {/* Side Windows */}
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: '5%',
                                                    left: '35%',
                                                    width: '25%',
                                                    height: '45%',
                                                    background: 'linear-gradient(135deg, rgba(147, 197, 253, 0.3) 0%, rgba(59, 130, 246, 0.15) 100%)',
                                                    borderRadius: '4px',
                                                    border: '1px solid rgba(147, 197, 253, 0.4)'
                                                }}
                                            />

                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: '5%',
                                                    left: '60%',
                                                    width: '25%',
                                                    height: '45%',
                                                    background: 'linear-gradient(135deg, rgba(147, 197, 253, 0.3) 0%, rgba(59, 130, 246, 0.15) 100%)',
                                                    borderRadius: '4px',
                                                    border: '1px solid rgba(147, 197, 253, 0.4)'
                                                }}
                                            />

                                            {/* Car Outline Glow */}
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: -2,
                                                    left: -2,
                                                    right: -2,
                                                    bottom: -2,
                                                    borderRadius: '14px 37px 10px 47px',
                                                    border: '1px solid rgba(59, 130, 246, 0.6)',
                                                    boxShadow: '0 0 20px rgba(59, 130, 246, 0.4), inset 0 0 20px rgba(59, 130, 246, 0.1)',
                                                    animation: 'pulse 3s infinite'
                                                }}
                                            />
                                        </Box>

                                        {/* Battery Pack - Glowing Blue */}
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                bottom: '-5%',
                                                left: '15%',
                                                width: '70%',
                                                height: '25%',
                                                background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.8) 0%, rgba(37, 99, 235, 0.9) 50%, rgba(29, 78, 216, 0.8) 100%)',
                                                borderRadius: 4,
                                                border: '2px solid rgba(59, 130, 246, 0.6)',
                                                boxShadow: '0 0 25px rgba(59, 130, 246, 0.7), inset 0 2px 0 rgba(147, 197, 253, 0.3)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                px: 1
                                            }}
                                        >
                                            {/* Battery Level Fill */}
                                            <Box
                                                sx={{
                                                    width: `${currentSOC}%`,
                                                    height: '70%',
                                                    background: 'linear-gradient(90deg, rgba(34, 197, 94, 0.9) 0%, rgba(16, 185, 129, 1) 50%, rgba(5, 150, 105, 0.9) 100%)',
                                                    borderRadius: 2,
                                                    transition: 'width 1.5s ease-in-out',
                                                    boxShadow: '0 0 15px rgba(34, 197, 94, 0.8)',
                                                    animation: 'pulse 2s infinite'
                                                }}
                                            />

                                            {/* Battery Percentage Text */}
                                            <Typography
                                                sx={{
                                                    position: 'absolute',
                                                    left: '50%',
                                                    top: '50%',
                                                    transform: 'translate(-50%, -50%)',
                                                    color: 'white',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 600,
                                                    textShadow: '0 0 10px rgba(0,0,0,0.8)'
                                                }}
                                            >
                                                {currentSOC}%
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Modern Wheels - Glowing Effect */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            bottom: '15%',
                                            left: '8%',
                                            width: 36,
                                            height: 36,
                                            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(30, 64, 175, 0.4) 50%, rgba(15, 23, 42, 0.8) 100%)',
                                            borderRadius: '50%',
                                            border: '3px solid rgba(59, 130, 246, 0.6)',
                                            boxShadow: '0 0 20px rgba(59, 130, 246, 0.5), 0 4px 8px rgba(0,0,0,0.3)'
                                        }}
                                    >
                                        {/* Wheel Rim - Futuristic */}
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                width: '70%',
                                                height: '70%',
                                                background: 'linear-gradient(45deg, rgba(147, 197, 253, 0.4) 0%, rgba(59, 130, 246, 0.6) 100%)',
                                                borderRadius: '50%',
                                                border: '1px solid rgba(147, 197, 253, 0.8)',
                                                boxShadow: 'inset 0 2px 4px rgba(147, 197, 253, 0.3)'
                                            }}
                                        />
                                    </Box>

                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            bottom: '15%',
                                            right: '8%',
                                            width: 36,
                                            height: 36,
                                            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(30, 64, 175, 0.4) 50%, rgba(15, 23, 42, 0.8) 100%)',
                                            borderRadius: '50%',
                                            border: '3px solid rgba(59, 130, 246, 0.6)',
                                            boxShadow: '0 0 20px rgba(59, 130, 246, 0.5), 0 4px 8px rgba(0,0,0,0.3)'
                                        }}
                                    >
                                        {/* Wheel Rim - Futuristic */}
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                width: '70%',
                                                height: '70%',
                                                background: 'linear-gradient(45deg, rgba(147, 197, 253, 0.4) 0%, rgba(59, 130, 246, 0.6) 100%)',
                                                borderRadius: '50%',
                                                border: '1px solid rgba(147, 197, 253, 0.8)',
                                                boxShadow: 'inset 0 2px 4px rgba(147, 197, 253, 0.3)'
                                            }}
                                        />
                                    </Box>

                                    {/* LED Headlights - Modern */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: '30%',
                                            left: '1%',
                                            width: 16,
                                            height: 10,
                                            background: 'radial-gradient(ellipse, rgba(147, 197, 253, 0.9) 0%, rgba(59, 130, 246, 0.7) 100%)',
                                            borderRadius: '50%',
                                            border: '2px solid rgba(59, 130, 246, 0.8)',
                                            boxShadow: '0 0 20px rgba(147, 197, 253, 0.8)'
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '1%',
                                            width: 16,
                                            height: 10,
                                            background: 'radial-gradient(ellipse, rgba(147, 197, 253, 0.9) 0%, rgba(59, 130, 246, 0.7) 100%)',
                                            borderRadius: '50%',
                                            border: '2px solid rgba(59, 130, 246, 0.8)',
                                            boxShadow: '0 0 20px rgba(147, 197, 253, 0.8)'
                                        }}
                                    />

                                    {/* Charging Cable - Blue Glow */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            left: '-70px',
                                            top: '45%',
                                            width: 75,
                                            height: 10,
                                            background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.8) 0%, rgba(37, 99, 235, 0.9) 50%, rgba(29, 78, 216, 0.8) 100%)',
                                            borderRadius: 5,
                                            border: '2px solid rgba(59, 130, 246, 0.6)',
                                            boxShadow: '0 0 15px rgba(59, 130, 246, 0.6)',
                                            '&::before': {
                                                content: '"⚡"',
                                                position: 'absolute',
                                                left: '-30px',
                                                top: '-12px',
                                                fontSize: '1.8rem',
                                                color: 'rgba(251, 191, 36, 1)',
                                                textShadow: '0 0 15px rgba(251, 191, 36, 1)',
                                                animation: 'flash 1.5s infinite'
                                            }
                                        }}
                                    />

                                    {/* Charging Port - Glowing */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            left: '2%',
                                            top: '47%',
                                            width: 10,
                                            height: 8,
                                            background: 'rgba(59, 130, 246, 0.8)',
                                            borderRadius: 2,
                                            border: '1px solid rgba(147, 197, 253, 0.8)',
                                            boxShadow: '0 0 10px rgba(59, 130, 246, 0.7)'
                                        }}
                                    />
                                </Box>

                                {/* Stop Charging Button - Rectangular */}
                                <Box sx={{ textAlign: 'center', mt: 3 }}>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        size="medium"
                                        onClick={() => setFlowStep(5)}
                                        sx={{
                                            borderRadius: 3,
                                            px: 4,
                                            py: 1.5,
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            textTransform: 'none',
                                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 6px 25px rgba(239, 68, 68, 0.4)',
                                            },
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        🛑 Dừng sạc
                                    </Button>
                                </Box>
                            </Box>


                        </Box>

                        {/* CSS Animations for EV Dashboard */}
                        <style jsx>{`
                            @keyframes pulse {
                                0%, 100% { opacity: 1; transform: scale(1); }
                                50% { opacity: 0.5; transform: scale(1.1); }
                            }
                            @keyframes bounce {
                                0% { transform: translate(-50%, -50%) scale(1); }
                                100% { transform: translate(-50%, -50%) scale(1.2); }
                            }
                            @keyframes flash {
                                0%, 100% { opacity: 1; }
                                50% { opacity: 0.3; }
                            }
                        `}</style>
                    </Box>
                </Grid>
            )}

            {/* Step 5: Payment */}
            {flowStep === 5 && (
                <Grid item xs={12}>
                    <Box
                        sx={{
                            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                            borderRadius: 4,
                            p: 4,
                            color: 'white',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
                        }}
                    >
                        {/* Header with Animation */}
                        <Box sx={{ textAlign: 'center', mb: 4 }}>
                            <Box
                                sx={{
                                    width: 80,
                                    height: 80,
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 3,
                                    boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)',
                                    animation: 'pulse 2s infinite'
                                }}
                            >
                                <Typography sx={{ fontSize: '2rem' }}>💳</Typography>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                                Thanh toán
                            </Typography>
                            <Typography variant="body1" sx={{ opacity: 0.8 }}>
                                Phiên sạc đã hoàn tất. Vui lòng chọn phương thức thanh toán
                            </Typography>
                        </Box>

                        <Grid container spacing={4}>
                            {/* Bill Summary */}
                            <Grid item xs={12} md={6}>
                                <Box
                                    sx={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: 3,
                                        p: 3,
                                        border: '1px solid rgba(255, 255, 255, 0.2)'
                                    }}
                                >
                                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                                        🧾 Hóa đơn chi tiết
                                    </Typography>

                                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography>Năng lượng sạc:</Typography>
                                        <Typography sx={{ fontWeight: 600 }}>
                                            {((currentSOC - 25) * 0.6).toFixed(1)} kWh
                                        </Typography>
                                    </Box>

                                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography>Thời gian sạc:</Typography>
                                        <Typography sx={{ fontWeight: 600 }}>
                                            {formatChargingTime(Math.round((currentSOC - 25) * 1.5))}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography>Đơn giá:</Typography>
                                        <Typography sx={{ fontWeight: 600 }}>8,500 VNĐ/kWh</Typography>
                                    </Box>

                                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography>Phí dịch vụ:</Typography>
                                        <Typography sx={{ fontWeight: 600 }}>5,000 VNĐ</Typography>
                                    </Box>

                                    <hr style={{ border: '1px solid rgba(255,255,255,0.3)', margin: '16px 0' }} />

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Tổng cộng:</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#22c55e' }}>
                                            {formatCurrency(Math.round((currentSOC - 25) * 0.6 * 8500 + 5000))}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>

                            {/* Payment Methods */}
                            <Grid item xs={12} md={6}>
                                <Box
                                    sx={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: 3,
                                        p: 3,
                                        border: '1px solid rgba(255, 255, 255, 0.2)'
                                    }}
                                >
                                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                                        🎯 Phương thức thanh toán
                                    </Typography>

                                    <Grid container spacing={2}>
                                        {/* Credit Card */}
                                        <Grid item xs={12}>
                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                onClick={() => setFlowStep(6)}
                                                sx={{
                                                    py: 2,
                                                    justifyContent: 'flex-start',
                                                    border: '2px solid rgba(59, 130, 246, 0.5)',
                                                    color: 'white',
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': {
                                                        background: 'rgba(59, 130, 246, 0.1)',
                                                        border: '2px solid rgba(59, 130, 246, 0.8)',
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)'
                                                    }
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Typography sx={{ mr: 2, fontSize: '1.5rem' }}>💳</Typography>
                                                    <Box>
                                                        <Typography sx={{ fontWeight: 600 }}>Thẻ tín dụng/ghi nợ</Typography>
                                                        <Typography variant="caption" sx={{ opacity: 0.7 }}>Visa, Mastercard, JCB</Typography>
                                                    </Box>
                                                </Box>
                                            </Button>
                                        </Grid>

                                        {/* Bank Transfer */}
                                        <Grid item xs={12}>
                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                onClick={() => setFlowStep(6)}
                                                sx={{
                                                    py: 2,
                                                    justifyContent: 'flex-start',
                                                    border: '2px solid rgba(34, 197, 94, 0.5)',
                                                    color: 'white',
                                                    '&:hover': {
                                                        background: 'rgba(34, 197, 94, 0.1)',
                                                        border: '2px solid rgba(34, 197, 94, 0.8)'
                                                    }
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Typography sx={{ mr: 2, fontSize: '1.5rem' }}>🏦</Typography>
                                                    <Box>
                                                        <Typography sx={{ fontWeight: 600 }}>Chuyển khoản ngân hàng</Typography>
                                                        <Typography variant="caption" sx={{ opacity: 0.7 }}>QR Banking, Internet Banking</Typography>
                                                    </Box>
                                                </Box>
                                            </Button>
                                        </Grid>

                                        {/* E-Wallet */}
                                        <Grid item xs={12}>
                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                onClick={() => setFlowStep(6)}
                                                sx={{
                                                    py: 2,
                                                    justifyContent: 'flex-start',
                                                    border: '2px solid rgba(245, 158, 11, 0.5)',
                                                    color: 'white',
                                                    '&:hover': {
                                                        background: 'rgba(245, 158, 11, 0.1)',
                                                        border: '2px solid rgba(245, 158, 11, 0.8)'
                                                    }
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Typography sx={{ mr: 2, fontSize: '1.5rem' }}>📱</Typography>
                                                    <Box>
                                                        <Typography sx={{ fontWeight: 600 }}>Ví điện tử</Typography>
                                                        <Typography variant="caption" sx={{ opacity: 0.7 }}>MoMo, ZaloPay, VNPay</Typography>
                                                    </Box>
                                                </Box>
                                            </Button>
                                        </Grid>

                                        {/* SkaEV Wallet */}
                                        <Grid item xs={12}>
                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                onClick={() => setFlowStep(6)}
                                                sx={{
                                                    py: 2,
                                                    justifyContent: 'flex-start',
                                                    border: '2px solid rgba(168, 85, 247, 0.5)',
                                                    color: 'white',
                                                    '&:hover': {
                                                        background: 'rgba(168, 85, 247, 0.1)',
                                                        border: '2px solid rgba(168, 85, 247, 0.8)'
                                                    }
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                    <Typography sx={{ mr: 2, fontSize: '1.5rem' }}>💰</Typography>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography sx={{ fontWeight: 600 }}>Ví SkaEV</Typography>
                                                        <Typography variant="caption" sx={{ opacity: 0.7 }}>Số dư: {formatCurrency(250000)}</Typography>
                                                    </Box>
                                                    <Typography sx={{
                                                        background: 'rgba(34, 197, 94, 0.2)',
                                                        px: 1,
                                                        py: 0.5,
                                                        borderRadius: 1,
                                                        fontSize: '0.75rem',
                                                        color: '#22c55e',
                                                        fontWeight: 600
                                                    }}>
                                                        Khuyến nghị
                                                    </Typography>
                                                </Box>
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Grid>
                        </Grid>

                        {/* Back Button */}
                        <Box sx={{ textAlign: 'center', mt: 4 }}>
                            <Button
                                variant="outlined"
                                onClick={() => setFlowStep(4)}
                                sx={{
                                    color: 'white',
                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                    '&:hover': {
                                        borderColor: 'rgba(255, 255, 255, 0.5)',
                                        background: 'rgba(255, 255, 255, 0.1)'
                                    }
                                }}
                            >
                                ← Quay lại sạc
                            </Button>
                        </Box>
                    </Box>
                </Grid>
            )}

            {/* Step 6: Complete - Beautiful Modern Design */}
            {flowStep === 6 && (
                <Grid item xs={12}>
                    <Box
                        sx={{
                            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                            borderRadius: 4,
                            p: 5,
                            textAlign: "center",
                            boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Background Pattern */}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'radial-gradient(circle at 20% 80%, rgba(34, 197, 94, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
                                zIndex: 0
                            }}
                        />

                        {/* Success Icon with Animation */}
                        <Box sx={{ position: 'relative', zIndex: 1, mb: 3 }}>
                            <Box
                                sx={{
                                    width: 120,
                                    height: 120,
                                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 3,
                                    boxShadow: '0 15px 35px rgba(34, 197, 94, 0.3)',
                                    animation: 'bounce 0.6s ease-out'
                                }}
                            >
                                <CheckCircle sx={{ fontSize: 60, color: "white" }} />
                            </Box>

                            <Typography
                                variant="h4"
                                sx={{
                                    fontWeight: 700,
                                    color: '#1e293b',
                                    mb: 2
                                }}
                            >
                                Sạc hoàn thành!
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: '#64748b',
                                    mb: 4,
                                    fontSize: '1.1rem'
                                }}
                            >
                                Phiên sạc đã kết thúc. Bạn có thể rút dây sạc và di chuyển xe.
                            </Typography>
                        </Box>

                        {/* Session Summary - Enhanced Design */}
                        <Box sx={{ position: 'relative', zIndex: 1, mb: 4 }}>
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 600,
                                    color: '#1e293b',
                                    mb: 3
                                }}
                            >
                                Tóm tắt phiên sạc
                            </Typography>

                            <Grid container spacing={3} sx={{ maxWidth: 600, mx: 'auto' }}>
                                {/* Energy */}
                                <Grid item xs={6}>
                                    <Box
                                        sx={{
                                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
                                            borderRadius: 3,
                                            p: 3,
                                            border: '1px solid rgba(59, 130, 246, 0.2)',
                                            textAlign: 'center'
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                                            Năng lượng
                                        </Typography>
                                        <Typography
                                            variant="h4"
                                            sx={{
                                                color: '#3b82f6',
                                                fontWeight: 700
                                            }}
                                        >
                                            {((currentSOC - 25) * 0.6).toFixed(1)} kWh
                                        </Typography>
                                    </Box>
                                </Grid>

                                {/* Time */}
                                <Grid item xs={6}>
                                    <Box
                                        sx={{
                                            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(147, 51, 234, 0.05) 100%)',
                                            borderRadius: 3,
                                            p: 3,
                                            border: '1px solid rgba(168, 85, 247, 0.2)',
                                            textAlign: 'center'
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                                            Thời gian
                                        </Typography>
                                        <Typography
                                            variant="h4"
                                            sx={{
                                                color: '#a855f7',
                                                fontWeight: 700
                                            }}
                                        >
                                            {formatChargingTime(Math.round((currentSOC - 25) * 1.5))}
                                        </Typography>
                                    </Box>
                                </Grid>

                                {/* Total Cost */}
                                <Grid item xs={6}>
                                    <Box
                                        sx={{
                                            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                                            borderRadius: 3,
                                            p: 3,
                                            border: '1px solid rgba(34, 197, 94, 0.2)',
                                            textAlign: 'center'
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                                            Tổng tiền
                                        </Typography>
                                        <Typography
                                            variant="h4"
                                            sx={{
                                                color: '#22c55e',
                                                fontWeight: 700
                                            }}
                                        >
                                            {Math.round((currentSOC - 25) * 0.6 * 8.5)}k ₫
                                        </Typography>
                                    </Box>
                                </Grid>

                                {/* Average Speed */}
                                <Grid item xs={6}>
                                    <Box
                                        sx={{
                                            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)',
                                            borderRadius: 3,
                                            p: 3,
                                            border: '1px solid rgba(245, 158, 11, 0.2)',
                                            textAlign: 'center'
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                                            Tốc độ TB
                                        </Typography>
                                        <Typography
                                            variant="h4"
                                            sx={{
                                                color: '#f59e0b',
                                                fontWeight: 700
                                            }}
                                        >
                                            45 kW
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Action Buttons - Enhanced */}
                        <Box sx={{
                            position: 'relative',
                            zIndex: 1,
                            display: "flex",
                            gap: 3,
                            justifyContent: "center",
                            flexWrap: "wrap"
                        }}>
                            <Button
                                variant="outlined"
                                size="large"
                                onClick={() => {
                                    const sessionData = {
                                        id: Date.now().toString(),
                                        stationId: selectedStation?.id,
                                        energyDelivered: ((currentSOC - 25) * 0.6).toFixed(1),
                                        duration: Math.round((currentSOC - 25) * 1.5),
                                        totalCost: Math.round((currentSOC - 25) * 0.6 * 8500),
                                        chargingRate: 45,
                                        startTime: new Date(Date.now() - Math.round((currentSOC - 25) * 1.5) * 60 * 1000),
                                        endTime: new Date(),
                                    };
                                    setCompletedSession(sessionData);
                                    setRatingModalOpen(true);
                                }}
                                sx={{
                                    minWidth: 160,
                                    py: 2,
                                    fontSize: '1.1rem',
                                    borderRadius: 3,
                                    border: '2px solid #f59e0b',
                                    color: '#f59e0b',
                                    '&:hover': {
                                        background: 'rgba(245, 158, 11, 0.1)',
                                        border: '2px solid #d97706',
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 8px 25px rgba(245, 158, 11, 0.3)'
                                    },
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                ⭐ Đánh giá
                            </Button>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={handleCompleteReset}
                                sx={{
                                    minWidth: 160,
                                    py: 2,
                                    fontSize: '1.1rem',
                                    borderRadius: 3,
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)'
                                    },
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                Sạc phiên mới
                            </Button>
                        </Box>

                        {/* Additional Animation Styles */}
                        <style jsx>{`
                            @keyframes bounce {
                                0% { transform: scale(0.3) rotate(-180deg); opacity: 0; }
                                50% { transform: scale(1.1) rotate(0deg); opacity: 1; }
                                100% { transform: scale(1) rotate(0deg); opacity: 1; }
                            }
                        `}</style>
                    </Box>
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
                onClose={() => {
                    setRatingModalOpen(false);
                    setCompletedSession(null);
                }}
                chargingSession={completedSession}
                station={selectedStation}
                onSubmit={(ratingData) => {
                    console.log("Rating submitted:", ratingData);
                    // Here you would typically send to API
                    // addRating(ratingData);
                }}
            />
        </Container>
    );
};

export default ChargingFlow;