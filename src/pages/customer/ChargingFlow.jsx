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

const ChargingFlow = () => {
    const { currentBooking, chargingSession, startCharging, socTracking } = useBookingStore();
    const {
        getFilteredStations,
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

    const flowSteps = [
        "Tìm trạm sạc",
        "Đặt lịch sạc",
        "Quét QR trạm",
        "Kết nối xe",
        "Đang sạc",
        "Hoàn thành"
    ];

    // Filter stations based on search
    const filteredStations = React.useMemo(() => {
        try {
            const storeFiltered = getFilteredStations();

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
    }, [getFilteredStations, searchQuery]);

    useEffect(() => {
        initializeData();
    }, [initializeData]);

    // Check if we have an active booking to determine flow step
    useEffect(() => {
        if (currentBooking && !chargingSession) {
            setFlowStep(2); // Go to QR scan step
        } else if (chargingSession) {
            setFlowStep(4); // Go to charging step
        }
    }, [currentBooking, chargingSession]);

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
        if (currentBooking) {
            startCharging(currentBooking.id, {
                stationId: currentBooking.stationId,
                connectorId: scanResult || "A01",
                initialSOC: 25,
                targetSOC: 80,
            });
            setFlowStep(4); // Move to charging step
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
                                    <Grid item xs={12} md={6}>
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
                                                value={filters.connectorTypes || []}
                                                multiple
                                                onChange={(e) => updateFilters({ connectorTypes: e.target.value })}
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
                                    <Grid item xs={12} md={2}>
                                        <Button fullWidth variant="contained" startIcon={<Search />}>
                                            Tìm kiếm
                                        </Button>
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

            {/* Step 4: Charging */}
            {flowStep === 4 && chargingSession && (
                <Grid container spacing={3}>
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
                                    Tiến trình sạc: {chargingProgress.toFixed(1)}%
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={chargingProgress}
                                    sx={{ height: 8, borderRadius: 1, mt: 1 }}
                                />
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Thông tin phiên sạc
                                </Typography>
                                <Typography variant="body2">
                                    Trạm: {selectedStation?.name || "Green Mall Charging Hub"}
                                </Typography>
                                <Typography variant="body2">
                                    Connector: {scanResult?.split(':').pop() || "A01"}
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

                    <Grid item xs={12}>
                        <Box sx={{ textAlign: "center", mt: 2 }}>
                            <Button
                                variant="outlined"
                                color="error"
                                size="large"
                                onClick={() => setFlowStep(5)}
                            >
                                Dừng sạc
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            )}

            {/* Step 5: Complete */}
            {flowStep === 5 && (
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
                            onClick={() => {
                                setFlowStep(0);
                                setSelectedStation(null);
                                setScanResult("");
                            }}
                        >
                            Sạc phiên mới
                        </Button>
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
        </Container>
    );
};

export default ChargingFlow;