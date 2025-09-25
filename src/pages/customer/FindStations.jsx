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
  Slider,
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
  getStatusColor,
} from "../../utils/helpers";
import { getStationImage } from "../../utils/imageAssets";
import { CONNECTOR_TYPES, AMENITIES } from "../../utils/constants";
import BookingModal from "../../components/customer/BookingModal";

const FindStations = () => {
  const {
    stations,
    filters,
    updateFilters,
    getFilteredStations,
    fetchNearbyStations,
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

  const filteredStations = getFilteredStations();

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          fetchNearbyStations(position.coords, filters.maxDistance);
        },
        (error) => {
          console.warn("Location access denied, using default location");
          fetchNearbyStations(userLocation, filters.maxDistance);
        }
      );
    }
  }, []);

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
      `Đặt chỗ thành công tại ${bookingData.stationName}! Mã đặt chỗ: ${bookingData.id}`
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
      return <Chip label="Offline" color="error" size="small" />;
    }

    if (availablePorts === 0) {
      return <Chip label="Full" color="warning" size="small" />;
    }

    if (availablePorts === totalPorts) {
      return <Chip label="Available" color="success" size="small" />;
    }

    return (
      <Chip
        label={`${availablePorts}/${totalPorts} Available`}
        color="info"
        size="small"
      />
    );
  };

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Find Charging Stations ⚡
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Discover nearby charging stations and book your charging session
      </Typography>

      {/* Search & Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            {/* Search Bar */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search by location, station name..."
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
                <InputLabel>Connector Type</InputLabel>
                <Select
                  value={filters.connectorTypes}
                  multiple
                  onChange={(e) =>
                    updateFilters({ connectorTypes: e.target.value })
                  }
                >
                  {Object.values(CONNECTOR_TYPES).map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Distance Filter */}
            <Grid item xs={12} md={3}>
              <Typography variant="body2" gutterBottom>
                Max Distance: {filters.maxDistance}km
              </Typography>
              <Slider
                value={filters.maxDistance}
                onChange={(e, value) => updateFilters({ maxDistance: value })}
                min={1}
                max={50}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}km`}
              />
            </Grid>

            {/* Search Button */}
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearch}
                startIcon={<Search />}
              >
                Search
              </Button>
            </Grid>
          </Grid>

          {/* Amenities Filter */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Amenities:
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {Object.values(AMENITIES).map((amenity) => (
                <Chip
                  key={amenity}
                  label={amenity}
                  variant={
                    filters.amenities.includes(amenity) ? "filled" : "outlined"
                  }
                  onClick={() => {
                    const newAmenities = filters.amenities.includes(amenity)
                      ? filters.amenities.filter((a) => a !== amenity)
                      : [...filters.amenities, amenity];
                    updateFilters({ amenities: newAmenities });
                  }}
                  size="small"
                />
              ))}
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Station List */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {filteredStations.length} Stations Found
              </Typography>

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
                                {getDistanceToStation(station)}km away
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
                                  Up to {station.charging.maxPower}kW
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
                                  ₫
                                </span>
                                <span style={{ fontSize: "0.875rem" }}>
                                  From{" "}
                                  {formatCurrency(
                                    station.charging.pricing.acRate
                                  )}
                                  /kWh
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
                                {station.ratings.totalReviews} reviews)
                              </span>
                            </span>

                            <span
                              style={{ marginTop: "4px", display: "block" }}
                            >
                              {station.amenities.slice(0, 3).map((amenity) => (
                                <Chip
                                  key={amenity}
                                  label={amenity}
                                  size="small"
                                  variant="outlined"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))}
                              {station.amenities.length > 3 && (
                                <Chip
                                  label={`+${
                                    station.amenities.length - 3
                                  } more`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
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
                        Book Now
                      </Button>
                    </ListItem>

                    {index < filteredStations.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
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
                  Distance: {getDistanceToStation(selectedStation)}km
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Charging Information
                </Typography>
                <Box sx={{ fontSize: "0.875rem", mb: 1 }}>
                  • Max Power: {selectedStation.charging.maxPower}kW
                </Box>
                <Box sx={{ fontSize: "0.875rem", mb: 1 }}>
                  • Available Ports: {selectedStation.charging.availablePorts}/
                  {selectedStation.charging.totalPorts}
                </Box>
                <Box sx={{ fontSize: "0.875rem", mb: 1 }}>
                  • Connector Types:{" "}
                  {selectedStation.charging.connectorTypes.join(", ")}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Pricing
                </Typography>
                <Box sx={{ fontSize: "0.875rem", mb: 1 }}>
                  • AC Charging:{" "}
                  {formatCurrency(selectedStation.charging.pricing.acRate)}/kWh
                </Box>
                {selectedStation.charging.pricing.dcRate && (
                  <Box sx={{ fontSize: "0.875rem", mb: 1 }}>
                    • DC Charging:{" "}
                    {formatCurrency(selectedStation.charging.pricing.dcRate)}
                    /kWh
                  </Box>
                )}
                {selectedStation.charging.pricing.parkingFee > 0 && (
                  <Box sx={{ fontSize: "0.875rem", mb: 1 }}>
                    • Parking:{" "}
                    {formatCurrency(
                      selectedStation.charging.pricing.parkingFee
                    )}
                    /hour
                  </Box>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => handleBookStation(selectedStation)}
                  sx={{ mt: 2 }}
                >
                  Book This Station
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Select a Station
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose a charging station from the list to see detailed
                  information and book your session.
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
