import React, { useState, useEffect } from "react";
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
  Rating,
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
    try {
      const storeFiltered = getFilteredStations();

      if (!searchQuery.trim()) return storeFiltered;

      const query = searchQuery.toLowerCase();
      return storeFiltered.filter((station) => {
        if (!station || !station.name || !station.location) return false;

        return (
          station.name.toLowerCase().includes(query) ||
          (station.location.address && station.location.address.toLowerCase().includes(query)) ||
          (station.location.city && station.location.city.toLowerCase().includes(query)) ||
          (station.location.district && station.location.district.toLowerCase().includes(query))
        );
      });
    } catch (error) {
      console.error("Error filtering stations:", error);
      return [];
    }
  }, [getFilteredStations, searchQuery]); useEffect(() => {
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

  const handleSearch = () => {
    // Mock search functionality
    console.log("Searching for:", searchQuery);
  };

  const handleBookStation = (station) => {
    setStationToBook(station);
    setBookingModalOpen(true);
  };

  const handleBookingComplete = (bookingData) => {
    setBookingMessage(
      formatText("stations.bookingSuccess", {
        stationName: bookingData.stationName,
        bookingId: bookingData.id
      })
    );
    setBookingSuccess(true);
    setBookingModalOpen(false);
    // You can add logic to update booking history or navigate to booking details
  };

  const handleCloseBookingModal = () => {
    setBookingModalOpen(false);
    setStationToBook(null);
  };

  const getDistanceToStation = (station) => {
    return calculateDistance(
      userLocation.lat,
      userLocation.lng,
      station.location.coordinates.lat,
      station.location.coordinates.lng
    );
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

            {/* Connector Type Filter */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>{getText("stations.connectorType")}</InputLabel>
                <Select
                  value={filters.connectorTypes || []}
                  multiple
                  onChange={(e) => {
                    console.log("Selected connectors:", e.target.value);
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



            {/* Search Button */}
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearch}
                startIcon={<Search />}
              >
                {getText("common.search")}
              </Button>
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
                {loading ? "Đang tải..." : `${filteredStations.length} ${getText("stations.stationsFound")}`}
              </Typography>

              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <Typography>Đang tìm trạm sạc gần bạn...</Typography>
                </Box>
              ) : (
                <List>
                  {filteredStations.map((station, index) => (
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
                              {getStatusChip(station)}
                            </Box>
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

                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <Rating
                                  value={station.ratings.overall}
                                  precision={0.1}
                                  size="small"
                                  readOnly
                                />
                                <span
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "rgba(0, 0, 0, 0.6)",
                                  }}
                                >
                                  {station.ratings.overall} (
                                  {station.ratings.totalReviews} {getText("stations.reviews")})
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

                      {index < filteredStations.length - 1 && <Divider />}
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
        onClose={handleCloseBookingModal}
        station={stationToBook}
        onBookingComplete={handleBookingComplete}
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
