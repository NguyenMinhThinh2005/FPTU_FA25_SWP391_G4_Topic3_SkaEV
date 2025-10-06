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
  Map as MapIcon,
  ViewList,
} from "@mui/icons-material";
import useBookingStore from "../../store/bookingStore";
import useStationStore from "../../store/stationStore";
import { formatCurrency } from "../../utils/helpers";
import StationMapLeaflet from "../../components/customer/StationMapLeaflet";
import notificationService from "../../services/notificationService";

// Helper to render operating hours safely (matches StationMapLeaflet)
const formatOperatingHours = (oh) => {
  if (!oh) return "";
  if (typeof oh === "string") {
    if (oh.trim().toLowerCase() === "24/7") return `Hoạt động: Cả ngày`;
    return `Hoạt động: ${oh}`;
  }
  const openRaw = oh.open || "";
  const closeRaw = oh.close || "";
  const open = String(openRaw).trim().toLowerCase();
  const close = String(closeRaw).trim().toLowerCase();
  if (open === "24/7" || close === "24/7") return `Hoạt động: Cả ngày`;
  if (openRaw && closeRaw) return `Hoạt động: ${openRaw} - ${closeRaw}`;
  if (openRaw) return `Hoạt động: ${openRaw}`;
  if (closeRaw) return `Hoạt động: ${closeRaw}`;
  return "";
};

// Helper function to format time
const formatTime = (minutes) => {
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
import { getStationImage } from "../../utils/imageAssets";
import { CONNECTOR_TYPES } from "../../utils/constants";
import BookingModal from "../../components/customer/BookingModal";
import RatingModal from "../../components/customer/RatingModal";

const ChargingFlow = () => {
  const { currentBooking, chargingSession, resetFlowState } = useBookingStore();
  const { stations, initializeData, filters, updateFilters, loading } =
    useStationStore();

  const [flowStep, setFlowStep] = useState(0); // 0: Tìm trạm, 1: Đặt lịch, 2: QR Scan, 3: Kết nối, 4: Sạc, 5: Hoàn thành
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStation, setSelectedStation] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'map'

  // Debug searchQuery changes
  useEffect(() => {
    console.log("🔎 SearchQuery changed to:", searchQuery);
  }, [searchQuery]);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [qrScanOpen, setQrScanOpen] = useState(false);
  const [scanResult, setScanResult] = useState("");
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [completedSession, setCompletedSession] = useState(null);
  const [currentBookingData, setCurrentBookingData] = useState(null);
  const [chargingStartTime, setChargingStartTime] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [sessionData, setSessionData] = useState({
    energyDelivered: 0,
    startSOC: 25,
    currentSOC: 25,
    targetSOC: 80,
    startTime: null,
    estimatedDuration: 0,
    currentCost: 0,
    chargingRate: 8500,
    stationId: "ST-001",
    stationName: "Trạm sạc FPT Hà Nội",
    connectorType: "CCS2",
    maxPower: 150,
  });

  const flowSteps = [
    "Tìm trạm sạc",
    "Đặt lịch sạc",
    "Quét QR trạm",
    "Kết nối xe",
    "Đang sạc",
    "Thanh toán",
    "Hoàn thành",
  ];

  // Combined filter for stations based on search text and connector types
  const filteredStations = React.useMemo(() => {
    console.log(
      "🔍 FILTER START - Query:",
      searchQuery,
      "| Connector:",
      filters.connectorTypes
    );
    console.log("📊 Stations array:", stations);

    try {
      // Start with all stations from store
      let stationList = Array.isArray(stations) ? [...stations] : [];
      console.log("📊 Total stations to filter:", stationList.length);

      if (stationList.length === 0) {
        console.warn("⚠️ No stations available in store!");
        return [];
      }

      // Apply text search filter if search query exists
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        console.log("🔤 Applying text search for:", query);

        stationList = stationList.filter((station) => {
          if (!station) return false;

          // Search in station name
          const matchesName =
            station.name && station.name.toLowerCase().includes(query);

          // Search in address
          const matchesAddress =
            station.location &&
            station.location.address &&
            station.location.address.toLowerCase().includes(query);

          // Search in landmarks
          const matchesLandmarks =
            station.location &&
            station.location.landmarks &&
            Array.isArray(station.location.landmarks) &&
            station.location.landmarks.some(
              (landmark) => landmark && landmark.toLowerCase().includes(query)
            );

          const isMatch = matchesName || matchesAddress || matchesLandmarks;
          if (isMatch) {
            console.log("✅ Text match:", station.name);
          }
          return isMatch;
        });
        console.log("🔤 After text search:", stationList.length, "stations");
      }

      // Apply connector type filter if selected (independent from text search)
      // Handle both string and array format for connectorTypes
      const connectorFilter = Array.isArray(filters.connectorTypes)
        ? filters.connectorTypes[0]
        : filters.connectorTypes;

      if (
        connectorFilter &&
        typeof connectorFilter === "string" &&
        connectorFilter.trim() !== ""
      ) {
        const filterType = connectorFilter.trim();
        console.log("🔌 Applying connector filter for:", filterType);

        stationList = stationList.filter((station) => {
          if (!station || !station.charging) {
            console.log("❌ Station missing charging data:", station?.name);
            return false;
          }

          // Check connectorTypes array first
          if (
            station.charging.connectorTypes &&
            Array.isArray(station.charging.connectorTypes)
          ) {
            const hasConnector =
              station.charging.connectorTypes.includes(filterType);
            if (hasConnector) {
              console.log(
                "✅ Connector match in array:",
                station.name,
                station.charging.connectorTypes
              );
              return true;
            }
          }

          // Check chargingPosts if connectorTypes not available
          if (
            station.charging.chargingPosts &&
            Array.isArray(station.charging.chargingPosts)
          ) {
            const hasInPosts = station.charging.chargingPosts.some(
              (post) =>
                post &&
                post.slots &&
                Array.isArray(post.slots) &&
                post.slots.some(
                  (slot) => slot && slot.connectorType === filterType
                )
            );
            if (hasInPosts) {
              console.log("✅ Connector match in posts:", station.name);
              return true;
            }
          }

          console.log("❌ No connector match:", station.name);
          return false;
        });
        console.log(
          "🔌 After connector filter:",
          stationList.length,
          "stations"
        );
      }

      console.log("✅ FINAL RESULT:", stationList.length, "stations");
      if (stationList.length > 0) {
        console.log("   Stations:", stationList.map((s) => s.name).join(", "));
      }

      // Add stats to each station
      stationList = stationList.map((station) => {
        if (!station.stats && station.charging?.chargingPosts) {
          let totalSlots = 0;
          let availableSlots = 0;

          station.charging.chargingPosts.forEach((post) => {
            if (post.slots && Array.isArray(post.slots)) {
              totalSlots += post.slots.length;
              availableSlots += post.slots.filter(
                (slot) => slot.status === "available"
              ).length;
            }
          });

          return {
            ...station,
            stats: {
              total: totalSlots,
              available: availableSlots,
              occupied: totalSlots - availableSlots,
            },
          };
        }
        return station;
      });

      return stationList;
    } catch (error) {
      console.error("❌ Error filtering stations:", error);
      return [];
    }
  }, [searchQuery, filters.connectorTypes, stations]);

  useEffect(() => {
    console.log("🚀 ChargingFlow mounted - initializing data");
    initializeData();
  }, [initializeData]);

  // Reset flow step to 0 if no active booking or charging session
  useEffect(() => {
    if (!currentBooking && !chargingSession) {
      console.log("🔄 No active booking or session, resetting flow to step 0");
      setFlowStep(0);
    }
  }, [currentBooking, chargingSession]);

  // Debug log when stations change
  useEffect(() => {
    console.log(
      "📍 Stations updated in ChargingFlow:",
      stations?.length,
      "stations"
    );
    if (stations && stations.length > 0) {
      console.log("   First station:", stations[0]?.name);
    }
  }, [stations]);

  // Check if we have an active booking to determine flow step
  useEffect(() => {
    console.log(
      "📊 Flow useEffect - currentBooking:",
      currentBooking,
      "chargingSession:",
      chargingSession,
      "currentStep:",
      flowStep
    );

    // Only auto-advance if we're still in the initial steps (0 or 1)
    if (currentBooking && !chargingSession && flowStep <= 1) {
      console.log("🔄 Auto-advancing to QR scan step after booking");
      setFlowStep(2); // Go to QR scan step only from step 0 or 1
    }
    // Don't auto-advance to charging - let manual flow handle it
  }, [currentBooking, chargingSession, flowStep]);

  const handleStationSelect = (station) => {
    setSelectedStation(station);
    setBookingModalOpen(true);
  };

  const handleBookingComplete = (booking) => {
    console.log("🎯 Booking completed:", booking);
    setCurrentBookingData(booking);
    setBookingModalOpen(false);
    setFlowStep(2); // Move to QR scan step

    // Initialize session data based on booking
    const energyNeeded = (sessionData.targetSOC - sessionData.startSOC) * 0.6; // 60kWh battery
    const estimatedDuration = Math.round((energyNeeded / 45) * 60); // 45kW average rate

    setSessionData((prev) => ({
      ...prev,
      startTime: booking?.scheduledDateTime || new Date(),
      estimatedDuration,
      chargingRate: selectedStation?.charging?.pricing?.acRate || 8500,
      stationId: selectedStation?.id || "ST-001",
      stationName: selectedStation?.name || "Trạm sạc FPT",
      maxPower: selectedStation?.charging?.fastCharging?.maxPower || 150,
    }));
  };

  const handleQRScan = (result) => {
    if (!currentBookingData) {
      console.error("No booking data available for QR scan");
      return;
    }

    setScanResult(result);
    setFlowStep(3); // Move to connect step
    setQrScanOpen(false);

    console.log("📱 QR Scanned for booking:", currentBookingData.id);
  };

  const handleStartCharging = () => {
    if (!currentBookingData || !scanResult) {
      console.error("Missing booking data or QR scan result");
      return;
    }

    const now = new Date();
    setChargingStartTime(now);
    setFlowStep(4); // Move to charging step

    // Initialize session data with real values
    setSessionData((prev) => ({
      ...prev,
      startTime: now,
      currentSOC: 25, // Starting battery level
      energyDelivered: 0,
      currentCost: 0,
    }));

    // Thông báo bắt đầu sạc
    notificationService.notifyChargingStarted({
      stationName: selectedStation?.name || "Trạm sạc",
      currentSOC: 25,
    });

    console.log("⚡ Charging started for station:", selectedStation?.name);
    console.log("📊 Booking data:", currentBookingData);
  };

  // Use sessionData for consistent state management
  const currentSOC = sessionData.currentSOC;
  const targetSOC = sessionData.targetSOC;

  // Calculate total cost including parking fee
  const calculateTotalCost = React.useCallback(() => {
    const energyCost = completedSession?.totalAmount || sessionData.currentCost;
    const chargingDuration = chargingStartTime
      ? Math.round((new Date() - chargingStartTime) / (1000 * 60))
      : Math.round(sessionData.energyDelivered * 3); // 3 minutes per kWh estimate
    const parkingFee = Math.max(0, chargingDuration * 500); // 500 VND per minute
    return energyCost + parkingFee;
  }, [completedSession, sessionData, chargingStartTime]);

  // Simulate realistic charging progress
  React.useEffect(() => {
    if (flowStep === 4 && chargingStartTime) {
      const interval = setInterval(() => {
        setSessionData((prev) => {
          const timeElapsed = (new Date() - chargingStartTime) / (1000 * 60); // minutes
          const newSOC = Math.min(
            prev.targetSOC,
            prev.startSOC + timeElapsed * 0.5
          ); // 0.5% per minute
          const newEnergyDelivered = Math.max(
            0,
            (newSOC - prev.startSOC) * 0.6
          ); // 60kWh battery
          const newCost = Math.round(newEnergyDelivered * prev.chargingRate);

          // Auto complete when reaching target
          if (newSOC >= prev.targetSOC && flowStep === 4) {
            setTimeout(() => setFlowStep(5), 2000);
          }

          return {
            ...prev,
            currentSOC: Math.round(newSOC),
            energyDelivered: Math.round(newEnergyDelivered * 10) / 10,
            currentCost: Math.round(newCost),
          };
        });
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, [flowStep, chargingStartTime]);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: "bold" }}>
        Sạc xe điện
      </Typography>{" "}
      {/* Flow Progress */}
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
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={2.5} alignItems="center">
                  {/* Search Input - Wider on desktop */}
                  <Grid item xs={12} md={5}>
                    <TextField
                      fullWidth
                      placeholder="Tìm kiếm theo vị trí, tên trạm..."
                      value={searchQuery}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        console.log("⌨️ TextField onChange:", newValue);
                        setSearchQuery(newValue);
                      }}
                      InputProps={{
                        startAdornment: (
                          <Search sx={{ mr: 1, color: "text.secondary" }} />
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          backgroundColor: "grey.50",
                          "&:hover": {
                            backgroundColor: "white",
                          },
                          "&.Mui-focused": {
                            backgroundColor: "white",
                          },
                        },
                      }}
                    />
                  </Grid>

                  {/* Connector Type Filter */}
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Loại cổng sạc</InputLabel>
                      <Select
                        value={filters.connectorTypes || ""}
                        onChange={(e) => {
                          console.log(
                            "🔌 Connector type changed:",
                            e.target.value
                          );
                          updateFilters({ connectorTypes: e.target.value });
                        }}
                        sx={{
                          borderRadius: 2,
                          backgroundColor: "grey.50",
                          "&:hover": {
                            backgroundColor: "white",
                          },
                          "&.Mui-focused": {
                            backgroundColor: "white",
                          },
                        }}
                      >
                        <MenuItem value="">
                          <em>Tất cả loại cổng</em>
                        </MenuItem>
                        {Object.values(CONNECTOR_TYPES).map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* View Mode Toggle Buttons */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        justifyContent: { xs: "stretch", md: "flex-end" },
                      }}
                    >
                      <Button
                        variant={viewMode === "list" ? "contained" : "outlined"}
                        onClick={() => setViewMode("list")}
                        startIcon={<ViewList />}
                        fullWidth
                        sx={{
                          borderRadius: 2,
                          px: 2,
                          fontWeight: viewMode === "list" ? 600 : 400,
                          boxShadow:
                            viewMode === "list"
                              ? "0 2px 8px rgba(25,118,210,0.2)"
                              : "none",
                        }}
                      >
                        Danh sách
                      </Button>
                      <Button
                        variant={viewMode === "map" ? "contained" : "outlined"}
                        onClick={() => setViewMode("map")}
                        startIcon={<MapIcon />}
                        fullWidth
                        sx={{
                          borderRadius: 2,
                          px: 2,
                          fontWeight: viewMode === "map" ? 600 : 400,
                          boxShadow:
                            viewMode === "map"
                              ? "0 2px 8px rgba(25,118,210,0.2)"
                              : "none",
                        }}
                      >
                        Bản đồ
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Stations List or Map */}
          <Grid item xs={12}>
            {viewMode === "list" ? (
              <Card>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      fontWeight: "bold",
                      color: "black",
                      mb: 3,
                      textAlign: "center",
                    }}
                  >
                    Danh sách trạm SkaEV ({filteredStations.length} trạm)
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
                            <Avatar
                              src={getStationImage(station)}
                              sx={{ width: 60, height: 60 }}
                            >
                              <ElectricCar />
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "start",
                                }}
                              >
                                <Typography variant="h6" fontWeight="bold">
                                  {station.name}
                                </Typography>
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-end",
                                    gap: 0.5,
                                  }}
                                >
                                  <Chip
                                    label={`${station.charging.availablePorts}/${station.charging.totalPorts} cổng đang trống`}
                                    size="small"
                                    color="success"
                                    sx={{ borderRadius: "16px" }}
                                  />
                                  {station.operatingHours && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {formatOperatingHours(
                                        station.operatingHours
                                      )}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            }
                            secondary={
                              <Box component="span" sx={{ display: "block" }}>
                                <Box
                                  component="span"
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    mb: 1,
                                  }}
                                >
                                  <LocationOn
                                    sx={{
                                      fontSize: 16,
                                      color: "text.secondary",
                                    }}
                                  />
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    component="span"
                                  >
                                    {station.location.address}
                                  </Typography>
                                </Box>
                                <Box
                                  component="span"
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                  }}
                                >
                                  <Box
                                    component="span"
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                    }}
                                  >
                                    <Speed
                                      sx={{
                                        fontSize: 16,
                                        color: "primary.main",
                                      }}
                                    />
                                    <Typography
                                      variant="body2"
                                      component="span"
                                    >
                                      Sạc nhanh lên đến{" "}
                                      {station.charging.maxPower} kW
                                    </Typography>
                                  </Box>
                                  <Typography
                                    variant="body2"
                                    color="success.main"
                                    fontWeight="medium"
                                    component="span"
                                  >
                                    Từ{" "}
                                    {formatCurrency(
                                      station.id === "station-001"
                                        ? 8500
                                        : station.id === "station-002"
                                        ? 9500
                                        : station.id === "station-003"
                                        ? 7500
                                        : station.charging.pricing.acRate
                                    )}
                                    /kWh
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
            ) : (
              <Card>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      fontWeight: "bold",
                      color: "black",
                      mb: 3,
                      textAlign: "center",
                    }}
                  >
                    🗺️ Bản đồ trạm sạc ({filteredStations.length} trạm)
                  </Typography>
                  <StationMapLeaflet
                    stations={filteredStations}
                    onStationSelect={handleStationSelect}
                  />
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      )}
      {/* Step 2: QR Scan */}
      {flowStep === 2 && (
        <Grid item xs={12}>
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <QrCodeScanner
              sx={{ fontSize: 80, color: "primary.main", mb: 2 }}
            />
            <Typography variant="h5" gutterBottom>
              Quét mã QR trên trụ sạc
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Bạn đã đặt lịch thành công! Hãy đến trạm và quét QR để bắt đầu
              sạc.
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
              QR Code đã quét:{" "}
              <strong>{scanResult || "SKAEV:STATION:ST001:A01"}</strong>
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
              background:
                "linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 75%, #475569 100%)",
              borderRadius: 3,
              p: 0,
              color: "white",
              position: "relative",
              overflow: "hidden",
              minHeight: "600px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Top Status Bar */}
            <Box
              sx={{
                background: "rgba(0,0,0,0.3)",
                px: 4,
                py: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                🔋 Đang sạc -{" "}
                {selectedStation?.name || "Green Mall Charging Hub"}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Connector: {scanResult?.split(":").pop() || "A01"}
              </Typography>
            </Box>

            {/* Main Dashboard */}
            <Box sx={{ flex: 1, p: { xs: 2, md: 4 } }}>
              <Grid container spacing={3} sx={{ height: "100%" }}>
                {/* Left: Battery Display */}
                <Grid item xs={12} md={5}>
                  <Box
                    sx={{
                      textAlign: "center",
                      background:
                        "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)",
                      border: "2px solid rgba(16, 185, 129, 0.3)",
                      borderRadius: 3,
                      p: 4,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Background glow effect */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: "-50%",
                        left: "-50%",
                        width: "200%",
                        height: "200%",
                        background:
                          "radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)",
                        animation: "rotate 10s linear infinite",
                        "@keyframes rotate": {
                          "0%": { transform: "rotate(0deg)" },
                          "100%": { transform: "rotate(360deg)" },
                        },
                      }}
                    />

                    <Box sx={{ position: "relative", zIndex: 1 }}>
                      <Typography
                        variant="overline"
                        sx={{ opacity: 0.7, fontSize: "0.875rem", mb: 2 }}
                      >
                        Mức pin hiện tại
                      </Typography>

                      <Typography
                        variant="h1"
                        sx={{
                          fontSize: { xs: "5rem", md: "6rem" },
                          fontWeight: "bold",
                          background:
                            "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                          backgroundClip: "text",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          mb: 3,
                          lineHeight: 1,
                        }}
                      >
                        {currentSOC}%
                      </Typography>

                      {/* Progress Bar */}
                      <Box sx={{ mb: 3, px: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={currentSOC}
                          sx={{
                            height: 16,
                            borderRadius: 8,
                            backgroundColor: "rgba(255,255,255,0.1)",
                            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)",
                            "& .MuiLinearProgress-bar": {
                              background:
                                "linear-gradient(90deg, #10b981 0%, #34d399 100%)",
                              borderRadius: 8,
                              boxShadow: "0 0 10px rgba(16, 185, 129, 0.5)",
                            },
                          }}
                        />
                      </Box>

                      {/* Time to full */}
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 1,
                          background: "rgba(245, 158, 11, 0.15)",
                          border: "1px solid rgba(245, 158, 11, 0.3)",
                          borderRadius: 2,
                          px: 3,
                          py: 1.5,
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{ color: "#f59e0b", fontWeight: 600 }}
                        >
                          ⏱️{" "}
                          {formatTime(
                            chargingStartTime
                              ? Math.max(
                                  0,
                                  Math.round((targetSOC - currentSOC) * 1.2)
                                )
                              : sessionData.estimatedDuration || 66
                          )}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          còn lại đầy
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                {/* Right: Stats Cards */}
                <Grid item xs={12} md={7}>
                  <Grid container spacing={2} sx={{ height: "100%" }}>
                    {/* Power */}
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          background:
                            "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.05) 100%)",
                          border: "2px solid rgba(59, 130, 246, 0.3)",
                          borderRadius: 2.5,
                          p: 3,
                          textAlign: "center",
                          height: "100%",
                          minHeight: 140,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: "0 8px 24px rgba(59, 130, 246, 0.3)",
                            border: "2px solid rgba(59, 130, 246, 0.5)",
                          },
                        }}
                      >
                        <Typography
                          variant="h2"
                          sx={{
                            color: "#3b82f6",
                            fontWeight: "bold",
                            mb: 1,
                            textShadow: "0 0 20px rgba(59, 130, 246, 0.3)",
                          }}
                        >
                          {chargingStartTime
                            ? currentSOC < 50
                              ? "150"
                              : currentSOC < 80
                              ? "75"
                              : "22"
                            : "0"}
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ opacity: 0.9, mb: 1, fontWeight: 600 }}
                        >
                          kW
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            opacity: 0.7,
                            textTransform: "uppercase",
                            letterSpacing: 1,
                          }}
                        >
                          Công suất sạc
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Temperature */}
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          background:
                            "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.05) 100%)",
                          border: "2px solid rgba(239, 68, 68, 0.3)",
                          borderRadius: 2.5,
                          p: 3,
                          textAlign: "center",
                          height: "100%",
                          minHeight: 140,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: "0 8px 24px rgba(239, 68, 68, 0.3)",
                            border: "2px solid rgba(239, 68, 68, 0.5)",
                          },
                        }}
                      >
                        <Typography
                          variant="h2"
                          sx={{
                            color: "#ef4444",
                            fontWeight: "bold",
                            mb: 1,
                            textShadow: "0 0 20px rgba(239, 68, 68, 0.3)",
                          }}
                        >
                          {chargingStartTime
                            ? currentSOC < 50
                              ? "32"
                              : currentSOC < 80
                              ? "38"
                              : "42"
                            : "25"}
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ opacity: 0.9, mb: 1, fontWeight: 600 }}
                        >
                          °C
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            opacity: 0.7,
                            textTransform: "uppercase",
                            letterSpacing: 1,
                          }}
                        >
                          Nhiệt độ
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Range */}
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          background:
                            "linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(22, 163, 74, 0.05) 100%)",
                          border: "2px solid rgba(34, 197, 94, 0.3)",
                          borderRadius: 2.5,
                          p: 3,
                          textAlign: "center",
                          height: "100%",
                          minHeight: 140,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: "0 8px 24px rgba(34, 197, 94, 0.3)",
                            border: "2px solid rgba(34, 197, 94, 0.5)",
                          },
                        }}
                      >
                        <Typography
                          variant="h2"
                          sx={{
                            color: "#22c55e",
                            fontWeight: "bold",
                            mb: 1,
                            textShadow: "0 0 20px rgba(34, 197, 94, 0.3)",
                          }}
                        >
                          {Math.round(currentSOC * 4.5)}
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ opacity: 0.9, mb: 1, fontWeight: 600 }}
                        >
                          km
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            opacity: 0.7,
                            textTransform: "uppercase",
                            letterSpacing: 1,
                          }}
                        >
                          Quãng đường dự kiến
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Cost */}
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          background:
                            "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.05) 100%)",
                          border: "2px solid rgba(139, 92, 246, 0.3)",
                          borderRadius: 2.5,
                          p: 3,
                          textAlign: "center",
                          height: "100%",
                          minHeight: 140,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: "0 8px 24px rgba(139, 92, 246, 0.3)",
                            border: "2px solid rgba(139, 92, 246, 0.5)",
                          },
                        }}
                      >
                        <Typography
                          variant="h2"
                          sx={{
                            color: "#8b5cf6",
                            fontWeight: "bold",
                            mb: 1,
                            textShadow: "0 0 20px rgba(139, 92, 246, 0.3)",
                          }}
                        >
                          {Math.round(sessionData.currentCost / 1000)}K
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ opacity: 0.9, mb: 1, fontWeight: 600 }}
                        >
                          VND
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            opacity: 0.7,
                            textTransform: "uppercase",
                            letterSpacing: 1,
                          }}
                        >
                          Chi phí hiện tại
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Box>

            {/* Charging Animation Section */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: 0.5, // Reduced from 2 to 0.5
                background: "rgba(255,255,255,0.02)",
                borderTop: "1px solid rgba(255,255,255,0.05)",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5, // Reduced from 1 to 0.5
                  textAlign: "center",
                }}
              >
                {/* Large horizontal battery icon */}
                <Box
                  sx={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BatteryChargingFull
                    sx={{
                      fontSize: "16rem", // Increased from 8rem to 16rem (2x larger)
                      color: "#10b981",
                      transform: "rotate(90deg)", // Rotate to make it horizontal
                      animation: "chargingPulse 2.5s infinite",
                      filter: "drop-shadow(0 0 20px rgba(16, 185, 129, 0.3))",
                      "@keyframes chargingPulse": {
                        "0%": {
                          opacity: 1,
                          transform: "rotate(90deg) scale(1)",
                          filter:
                            "drop-shadow(0 0 20px rgba(16, 185, 129, 0.3))",
                        },
                        "50%": {
                          opacity: 0.8,
                          transform: "rotate(90deg) scale(1.05)",
                          filter:
                            "drop-shadow(0 0 30px rgba(16, 185, 129, 0.6))",
                        },
                        "100%": {
                          opacity: 1,
                          transform: "rotate(90deg) scale(1)",
                          filter:
                            "drop-shadow(0 0 20px rgba(16, 185, 129, 0.3))",
                        },
                      },
                    }}
                  />
                </Box>

                {/* Charging status text */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: "#10b981",
                      animation: "blink 1.5s infinite",
                      "@keyframes blink": {
                        "0%, 50%": { opacity: 1 },
                        "51%, 100%": { opacity: 0.3 },
                      },
                    }}
                  />
                  <Typography
                    variant="h6"
                    sx={{
                      color: "#10b981",
                      fontWeight: "medium",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Đang sạc xe điện
                  </Typography>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: "#10b981",
                      animation: "blink 1.5s infinite 0.75s", // Offset animation
                      "@keyframes blink": {
                        "0%, 50%": { opacity: 1 },
                        "51%, 100%": { opacity: 0.3 },
                      },
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Bottom Controls */}
            <Box
              sx={{
                background: "rgba(0,0,0,0.3)",
                px: 4,
                py: 3,
                display: "flex",
                justifyContent: "center",
                borderTop: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Button
                variant="contained"
                size="large"
                sx={{
                  background:
                    "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 50%, #ea2027 100%)",
                  px: 6,
                  py: 2,
                  borderRadius: "50px",
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  textTransform: "none",
                  minWidth: "200px",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow:
                    "0 8px 32px rgba(234, 32, 39, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: "-100%",
                    width: "100%",
                    height: "100%",
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                    transition: "left 0.6s",
                  },
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #ee5a24 0%, #ea2027 50%, #c23616 100%)",
                    transform: "translateY(-2px) scale(1.02)",
                    boxShadow:
                      "0 12px 40px rgba(234, 32, 39, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2)",
                    "&::before": {
                      left: "100%",
                    },
                  },
                  "&:active": {
                    transform: "translateY(0) scale(0.98)",
                  },
                }}
                onClick={() => {
                  if (!chargingStartTime) {
                    console.error("No charging session to stop");
                    return;
                  }

                  const sessionEndData = {
                    energyDelivered: sessionData.energyDelivered,
                    chargingDuration: Math.round(
                      (new Date() - chargingStartTime) / (1000 * 60)
                    ),
                    totalAmount: sessionData.currentCost,
                    finalSOC: currentSOC,
                    completedAt: new Date().toISOString(),
                    stationName: selectedStation?.name,
                    connectorId: scanResult?.split(":").pop() || "A01",
                    bookingId: currentBookingData?.id,
                  };
                  setCompletedSession(sessionEndData);

                  // Thông báo hoàn thành sạc
                  notificationService.notifyChargingCompleted({
                    energyDelivered: sessionData.energyDelivered,
                    finalSOC: currentSOC,
                  });

                  setFlowStep(5); // Move to payment step
                  console.log("🏁 Charging session completed:", sessionEndData);
                }}
              >
                Dừng sạc
              </Button>
            </Box>
          </Box>
        </Grid>
      )}
      {/* Step 5: Payment */}
      {flowStep === 5 && (
        <Grid item xs={12}>
          <Paper sx={{ p: 4 }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ textAlign: "center", mb: 3 }}
            >
              💳 Thanh toán phiên sạc
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Chi tiết phiên sạc
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">Trạm sạc:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {selectedStation?.name || "Green Mall Charging Hub"}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">Connector:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {scanResult?.split(":").pop() || "A01"}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">Năng lượng:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {completedSession?.energyDelivered ||
                          sessionData.energyDelivered.toFixed(1)}{" "}
                        kWh
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">Thời gian sạc:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatTime(
                          completedSession?.chargingDuration ||
                            (chargingStartTime
                              ? Math.round(
                                  (new Date() - chargingStartTime) / (1000 * 60)
                                )
                              : Math.round(sessionData.energyDelivered * 3))
                        )}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">Giá điện:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(sessionData.chargingRate)}/kWh
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">
                        Chi phí năng lượng:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(
                          completedSession?.totalAmount ||
                            sessionData.currentCost
                        )}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 2,
                      }}
                    >
                      <Typography variant="body2">Phí đỗ xe:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(
                          (chargingStartTime
                            ? Math.round(
                                (new Date() - chargingStartTime) / (1000 * 60)
                              )
                            : Math.round(sessionData.energyDelivered * 3)) * 500
                        )}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        pt: 2,
                        borderTop: 1,
                        borderColor: "divider",
                      }}
                    >
                      <Typography variant="h6">Tổng cộng:</Typography>
                      <Typography
                        variant="h6"
                        color="primary.main"
                        fontWeight="bold"
                      >
                        {formatCurrency(calculateTotalCost())}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Phương thức thanh toán
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Chọn phương thức thanh toán của bạn
                    </Typography>

                    {/* Payment Methods */}
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      <Button
                        variant={
                          selectedPaymentMethod === "credit-card"
                            ? "contained"
                            : "outlined"
                        }
                        fullWidth
                        onClick={() => setSelectedPaymentMethod("credit-card")}
                        sx={{
                          justifyContent: "flex-start",
                          p: 2,
                          borderWidth: 2,
                          "&:hover": { borderWidth: 2 },
                        }}
                      >
                        💳 Thẻ tín dụng **** 4567
                      </Button>
                      <Button
                        variant={
                          selectedPaymentMethod === "momo"
                            ? "contained"
                            : "outlined"
                        }
                        fullWidth
                        onClick={() => setSelectedPaymentMethod("momo")}
                        sx={{
                          justifyContent: "flex-start",
                          p: 2,
                          borderWidth: 2,
                          "&:hover": { borderWidth: 2 },
                        }}
                      >
                        📱 MoMo Wallet
                      </Button>
                      <Button
                        variant={
                          selectedPaymentMethod === "bank-transfer"
                            ? "contained"
                            : "outlined"
                        }
                        fullWidth
                        onClick={() =>
                          setSelectedPaymentMethod("bank-transfer")
                        }
                        sx={{
                          justifyContent: "flex-start",
                          p: 2,
                          borderWidth: 2,
                          "&:hover": { borderWidth: 2 },
                        }}
                      >
                        🏦 Chuyển khoản ngân hàng
                      </Button>
                    </Box>

                    {!selectedPaymentMethod && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Vui lòng chọn phương thức thanh toán
                      </Alert>
                    )}

                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      disabled={!selectedPaymentMethod}
                      sx={{
                        mt: 3,
                        opacity: !selectedPaymentMethod ? 0.5 : 1,
                      }}
                      onClick={() => {
                        if (selectedPaymentMethod) {
                          // Trigger payment success notification
                          const totalAmount = calculateTotalCost();
                          const invoiceNumber = `INV-${Date.now()}`;

                          notificationService.notifyPaymentSuccess({
                            amount: totalAmount,
                            invoiceNumber: invoiceNumber,
                          });

                          setFlowStep(6);
                        }
                      }}
                    >
                      {selectedPaymentMethod
                        ? `Thanh toán ${formatCurrency(calculateTotalCost())}`
                        : "Chọn phương thức thanh toán"}
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
          <Box
            sx={{
              background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
              borderRadius: 4,
              p: 0,
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            }}
          >
            {/* Header Section */}
            <Box
              sx={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "white",
                p: 4,
                textAlign: "center",
                position: "relative",
              }}
            >
              <CheckCircle
                sx={{
                  fontSize: 100,
                  mb: 2,
                  filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
                }}
              />
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Sạc hoàn thành!
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Cảm ơn bạn đã sử dụng dịch vụ SkaEV
              </Typography>
            </Box>

            {/* Stats Section */}
            <Box sx={{ p: 4 }}>
              <Typography
                variant="h5"
                color="primary.main"
                fontWeight="bold"
                sx={{ mb: 3, textAlign: "center" }}
              >
                📊 Tóm tắt phiên sạc
              </Typography>

              <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Energy */}
                <Grid item xs={12} sm={4}>
                  <Box
                    sx={{
                      background:
                        "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "white",
                      p: 3,
                      borderRadius: 3,
                      textAlign: "center",
                      boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
                      height: 140,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                      {completedSession?.energyDelivered ||
                        sessionData.energyDelivered.toFixed(1)}
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                      kWh đã sạc
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                      Năng lượng nạp vào xe
                    </Typography>
                  </Box>
                </Grid>

                {/* Duration */}
                <Grid item xs={12} sm={4}>
                  <Box
                    sx={{
                      background:
                        "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                      color: "white",
                      p: 3,
                      borderRadius: 3,
                      textAlign: "center",
                      boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
                      height: 140,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                      {formatTime(
                        completedSession?.chargingDuration ||
                          (chargingStartTime
                            ? Math.round(
                                (new Date() - chargingStartTime) / (1000 * 60)
                              )
                            : 0)
                      )}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                      Thời gian sạc
                    </Typography>
                  </Box>
                </Grid>

                {/* Battery Level */}
                <Grid item xs={12} sm={4}>
                  <Box
                    sx={{
                      background:
                        "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      color: "white",
                      p: 3,
                      borderRadius: 3,
                      textAlign: "center",
                      boxShadow: "0 4px 15px rgba(245, 158, 11, 0.3)",
                      height: 140,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                      {currentSOC}%
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                      mức pin hiện tại
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                      Từ {sessionData.startSOC}% → {currentSOC}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Cost Summary */}
              <Box
                sx={{
                  background:
                    "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
                  border: "1px solid #cbd5e1",
                  borderRadius: 3,
                  p: 3,
                  mb: 4,
                }}
              >
                <Typography
                  variant="h6"
                  color="primary.main"
                  fontWeight="bold"
                  gutterBottom
                >
                  Chi phí sạc
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Năng lượng:{" "}
                      {completedSession?.energyDelivered ||
                        sessionData.energyDelivered.toFixed(1)}{" "}
                      kWh × ₫
                      {(sessionData.chargingRate || 8500).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sx={{ textAlign: "right" }}>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(
                        completedSession?.totalAmount || sessionData.currentCost
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Phí đỗ xe:{" "}
                      {chargingStartTime
                        ? Math.round(
                            (new Date() - chargingStartTime) / (1000 * 60)
                          )
                        : Math.round(sessionData.energyDelivered * 3)}{" "}
                      phút
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sx={{ textAlign: "right" }}>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(
                        (chargingStartTime
                          ? Math.round(
                              (new Date() - chargingStartTime) / (1000 * 60)
                            )
                          : Math.round(sessionData.energyDelivered * 3)) * 500
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        borderTop: 1,
                        borderColor: "divider",
                        pt: 2,
                        mt: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="h6" fontWeight="bold">
                          Tổng cộng:
                        </Typography>
                        <Typography
                          variant="h5"
                          color="primary.main"
                          fontWeight="bold"
                        >
                          {formatCurrency(calculateTotalCost())}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Action Buttons */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: "25px",
                    borderColor: "#10b981",
                    color: "#10b981",
                    "&:hover": {
                      borderColor: "#059669",
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                    },
                  }}
                  onClick={() => setRatingModalOpen(true)}
                >
                  Đánh giá trải nghiệm
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: "25px",
                    background:
                      "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    },
                  }}
                  onClick={() => {
                    // Reset all flow state including booking and session
                    resetFlowState();
                    setFlowStep(0);
                    setSelectedStation(null);
                    setScanResult("");
                    setCompletedSession(null);
                    setCurrentBookingData(null);
                    setChargingStartTime(null);
                    setSelectedPaymentMethod(null);
                    // Reset session data to initial state
                    setSessionData({
                      energyDelivered: 0,
                      startSOC: 25,
                      currentSOC: 25,
                      targetSOC: 80,
                      startTime: null,
                      estimatedDuration: 0,
                      currentCost: 0,
                      chargingRate: 8500,
                      stationId: "ST-001",
                      stationName: "Trạm sạc FPT Hà Nội",
                      connectorType: "CCS2",
                      maxPower: 150,
                    });
                  }}
                >
                  Kết thúc
                </Button>
              </Box>
            </Box>
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
      <Dialog
        open={qrScanOpen}
        onClose={() => setQrScanOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Quét mã QR trên trụ sạc</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: "center", py: 4 }}>
            <QrCodeScanner
              sx={{ fontSize: 120, color: "primary.main", mb: 2 }}
            />
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
