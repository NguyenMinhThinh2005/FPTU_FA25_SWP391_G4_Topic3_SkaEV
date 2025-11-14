/* eslint-disable */
import React, { useState, useEffect } from "react";
import useVehicleStore from "../../store/vehicleStore";
import useBookingStore from "../../store/bookingStore";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Search,
  LocationOn,
  ElectricCar,
  Speed,
  FilterList,
  Star,
  Navigation,
} from "@mui/icons-material";
import useStationStore from "../../store/stationStore";
import {
  formatCurrency,
  calculateDistance,
} from "../../utils/helpers";
import { getStationImage } from "../../utils/imageAssets";
import { CONNECTOR_TYPES } from "../../utils/constants";
import BookingModal from "../../components/customer/BookingModal";
import { getText, formatText } from "../../utils/vietnameseTexts";

const FindStations = () => {
  const {
    filters,
    updateFilters,
    getFilteredStations,
    fetchNearbyStations,
    initializeData,
    loading,
  } = useStationStore();

  const {
    getCompatibleConnectorTypes,
    getCurrentVehicleConnectors
  } = useVehicleStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState({
    lat: 10.7769,
    lng: 106.7009,
  }); // Default to Ho Chi Minh City
  const [selectedStation, setSelectedStation] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [stationToBook, setStationToBook] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");

  // Apply search query filter on top of store filtered stations
  const filteredStations = React.useMemo(() => {
    console.log("🔄 FindStations: Re-computing filtered stations");
    console.log("Current filters:", filters);
    console.log("Search query:", searchQuery);

    try {
      const storeFiltered = getFilteredStations();
      console.log("Store filtered results:", storeFiltered.length, "stations");

      if (!searchQuery.trim()) {
        console.log("No search query, returning store filtered:", storeFiltered.map(s => s.name));
        return storeFiltered;
      }

      const query = searchQuery.toLowerCase();
      const searchFiltered = storeFiltered.filter((station) => {
        if (!station || !station.name || !station.location) return false;

        return (
          station.name.toLowerCase().includes(query) ||
          (station.location.address && station.location.address.toLowerCase().includes(query)) ||
          (station.location.city && station.location.city.toLowerCase().includes(query)) ||
          (station.location.district && station.location.district.toLowerCase().includes(query))
        );
      });

      console.log("After search filter:", searchFiltered.map(s => s.name));
      return searchFiltered;
    } catch (error) {
      console.error("Error filtering stations:", error);
      return [];
    }
  }, [getFilteredStations, searchQuery, filters]);

  // Cache station distances to prevent recalculation
  const stationsWithDistance = React.useMemo(() => {
    return filteredStations.map(station => ({
      ...station,
      cachedDistance: calculateDistance(
        userLocation.lat,
        userLocation.lng,
        station.location.coordinates.lat,
        station.location.coordinates.lng
      )
    }));
  }, [filteredStations, userLocation]);

  useEffect(() => {
    // Initialize data first
    initializeData();
  }, [initializeData]);

  useEffect(() => {
    let isMounted = true;

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (isMounted) {
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setUserLocation(newLocation);
            fetchNearbyStations(newLocation, filters.maxDistance);
          }
        },
        () => {
          if (isMounted) {
            console.warn("Location access denied, using default location");
            fetchNearbyStations(userLocation, filters.maxDistance);
          }
        }
      );
    } else {
      // Fallback: load stations with default location
      if (isMounted) {
        fetchNearbyStations(userLocation, filters.maxDistance);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [fetchNearbyStations, filters.maxDistance, userLocation]);



  const handleBookStation = (station) => {
    setStationToBook(station);
    setBookingModalOpen(true);
  };

  const handleBookingModalClose = () => {
    setBookingModalOpen(false);
    setStationToBook(null);

    // Check if there's a new booking to show success message
    const { bookings } = useBookingStore.getState();
    const latestBooking = bookings[bookings.length - 1];
    if (latestBooking && new Date(latestBooking.createdAt) > new Date(Date.now() - 5000)) {
      setBookingMessage(
        formatText("stations.bookingSuccess", {
          stationName: latestBooking.stationName,
          bookingId: latestBooking.id
        })
      );
      setBookingSuccess(true);
    }
  };



  const getDistanceToStation = (station) => {
    // Use cached distance if available, otherwise calculate
    if (station.cachedDistance !== undefined) {
      return station.cachedDistance.toFixed(1);
    }
    return calculateDistance(
      userLocation.lat,
      userLocation.lng,
      station.location.coordinates.lat,
      station.location.coordinates.lng
    ).toFixed(1);
  };

  const getStatusChip = (station) => {
    const availablePorts = station.charging.availablePorts;
    const totalPorts = station.charging.totalPorts;

    if (station.status !== "active") {
      return <Chip label={getText("stations.offline")} color="error" size="small" />;
    }

    if (availablePorts === 0) {
      return <Chip label={getText("stations.full")} color="warning" size="small" />;
    }

    if (availablePorts === totalPorts) {
      return <Chip label={getText("stations.available")} color="success" size="small" />;
    }

    return (
      <Chip
        label={`${availablePorts}/${totalPorts} Có sẵn`}
        color="info"
        size="small"
      />
    );
  };

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        {getText("stations.title")} ⚡
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        {getText("stations.subtitle")}
      </Typography>

      {/* Search & Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            {/* Search Bar */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder={getText("stations.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Search sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />
            </Grid>

            {/* Connector Type Filter with Smart Suggestions */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel id="findstations-connector-label">{getText("stations.connectorType")}</InputLabel>
                <Select
                  labelId="findstations-connector-label"
                  id="findstations-connector-select"
                  label={getText("stations.connectorType")}
                  value={Array.isArray(filters.connectorTypes) ? (filters.connectorTypes[0] || "") : (filters.connectorTypes || "")}
                  onChange={(e) => {
                    const value = e.target.value;
                    console.log("Selected connector:", value);
                    updateFilters({ connectorTypes: value || "" });
                  }}
                  renderValue={(selected) => (selected ? selected : null)}
                >
                  {Object.values(CONNECTOR_TYPES).map((type) => {
                    const isVehicleCompatible = getCurrentVehicleConnectors().includes(type);
                    return (
                      <MenuItem key={type} value={type}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          {type}
                          {isVehicleCompatible && (
                            <Chip
                              size="small"
                              label="Xe của bạn"
                              color="primary"
                              sx={{ ml: 'auto', fontSize: '0.7rem', height: '20px' }}
                            />
                          )}
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {getCurrentVehicleConnectors().length > 0 &&
                    `Xe hiện tại hỗ trợ: ${getCurrentVehicleConnectors().join(', ')}`
                  }
                </Typography>
              </FormControl>
            </Grid>




          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Station List */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {loading ? "Đang tải..." : `${stationsWithDistance.length} ${getText("stations.stationsFound")}`}
              </Typography>

              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <Typography>Đang tìm trạm sạc gần bạn...</Typography>
                </Box>
              ) : (
                <List>
                  {stationsWithDistance.map((station, index) => (
                    <React.Fragment key={station.id}>
                      <ListItem
                        onClick={() => setSelectedStation(station)}
                        sx={{
                          borderRadius: 2,
                          mb: 1,
                          border: selectedStation?.id === station.id ? 2 : 1,
                          borderColor:
                            selectedStation?.id === station.id
                              ? "primary.main"
                              : "divider",
                          "&:hover": {
                            backgroundColor: "grey.50",
                          },
                          cursor: "pointer",
                        }}
                      >
                        <ListItemIcon>
                          <Avatar
                            src={getStationImage(station)}
                            sx={{ width: 60, height: 60 }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="60"%3E%3Crect fill="%231379FF" width="60" height="60"/%3E%3Ctext fill="white" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="12"%3EStation%3C/text%3E%3C/svg%3E';
                            }}
                          >
                            <ElectricCar />
                          </Avatar>
                        </ListItemIcon>

                        <ListItemText
                          primary={
                            <span
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "start",
                              }}
                            >
                              <span style={{ fontWeight: "bold", fontSize: "1.25rem" }}>
                                {station.name}
                              </span>
                              {getStatusChip(station)}
                            </span>
                          }
                          secondary={
                            <span>
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  marginBottom: "4px",
                                }}
                              >
                                <LocationOn
                                  sx={{ fontSize: 16, color: "text.secondary" }}
                                />
                                <span
                                  style={{
                                    fontSize: "0.875rem",
                                    color: "rgba(0, 0, 0, 0.6)",
                                  }}
                                >
                                  {station.location.address} •{" "}
                                  {getDistanceToStation(station)}{getText("units.km")} {getText("stations.away")}
                                </span>
                              </span>

                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  marginBottom: "4px",
                                }}
                              >
                                <span
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "2px",
                                  }}
                                >
                                  <Speed
                                    sx={{ fontSize: 16, color: "primary.main" }}
                                  />
                                  <span style={{ fontSize: "0.875rem" }}>
                                    {getText("stations.upTo")} {station.charging.maxPower}{getText("units.kw")}
                                  </span>
                                </span>

                                <span
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "2px",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 16,
                                      color: "#4caf50",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    {getText("units.vnd")}
                                  </span>
                                  <span style={{ fontSize: "0.875rem" }}>
                                    {getText("stations.from")}{" "}
                                    {formatCurrency(
                                      station.charging.pricing.acRate
                                    )}
                                    {getText("units.perKwh")}
                                  </span>
                                </span>
                              </span>
                            </span>
                          }
                        />

                        <Button
                          variant="contained"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookStation(station);
                          }}
                          sx={{ ml: 2 }}
                        >
                          {getText("stations.bookNow")}
                        </Button>
                      </ListItem>

                      {index < stationsWithDistance.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Station Details */}
        <Grid item xs={12} md={4}>
          {selectedStation ? (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {selectedStation.name}
                </Typography>

                <Box
                  component="img"
                  src={getStationImage(selectedStation)}
                  alt={selectedStation.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect fill="%231379FF" width="400" height="200"/%3E%3Ctext fill="white" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="20"%3ECharging Station%3C/text%3E%3C/svg%3E';
                  }}
                  sx={{
                    width: "100%",
                    height: 200,
                    objectFit: "cover",
                    borderRadius: 2,
                    mb: 2,
                  }}
                />

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    color: "text.secondary",
                    fontSize: "0.875rem",
                    mb: 1,
                  }}
                >
                  <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                  {selectedStation.location.address}
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {getText("stations.distance")}: {getDistanceToStation(selectedStation)}{getText("units.km")}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  {getText("stations.chargingInfo")}
                </Typography>
                <Box sx={{ fontSize: "0.875rem", mb: 1 }}>
                  • {getText("stations.maxPower")}: {selectedStation.charging.maxPower}{getText("units.kw")}
                </Box>
                <Box sx={{ fontSize: "0.875rem", mb: 1 }}>
                  • {getText("stations.availablePorts")}: {selectedStation.charging.availablePorts}/
                  {selectedStation.charging.totalPorts}
                </Box>
                <Box sx={{ fontSize: "0.875rem", mb: 1 }}>
                  • {getText("stations.connectorTypes")}:{" "}
                  {selectedStation.charging.connectorTypes.join(", ")}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  {getText("stations.pricing")}
                </Typography>
                <Box sx={{ fontSize: "0.875rem", mb: 1 }}>
                  • {getText("stations.acCharging")}:{" "}
                  {formatCurrency(selectedStation.charging.pricing.acRate)}{getText("units.perKwh")}
                </Box>
                {selectedStation.charging.pricing.dcRate && (
                  <Box sx={{ fontSize: "0.875rem", mb: 1 }}>
                    • {getText("stations.dcCharging")}:{" "}
                    {formatCurrency(selectedStation.charging.pricing.dcRate)}
                    {getText("units.perKwh")}
                  </Box>
                )}
                {selectedStation.charging.pricing.parkingFee > 0 && (
                  <Box sx={{ fontSize: "0.875rem", mb: 1 }}>
                    • {getText("stations.parking")}:{" "}
                    {formatCurrency(
                      selectedStation.charging.pricing.parkingFee
                    )}
                    {getText("units.perHour")}
                  </Box>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => handleBookStation(selectedStation)}
                  sx={{ mt: 2 }}
                >
                  {getText("stations.bookThisStation")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {getText("stations.selectStation")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getText("stations.selectStationDescription")}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Booking Modal */}
      <BookingModal
        open={bookingModalOpen}
        onClose={handleBookingModalClose}
        station={stationToBook}
      />

      {/* Success Snackbar */}
      <Snackbar
        open={bookingSuccess}
        autoHideDuration={6000}
        onClose={() => setBookingSuccess(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setBookingSuccess(false)}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {bookingMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FindStations;
