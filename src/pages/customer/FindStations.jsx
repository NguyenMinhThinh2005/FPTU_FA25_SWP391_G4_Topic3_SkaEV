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
  Rating,
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
import useReviewStore from "../../store/reviewStore";
import { formatCurrency, calculateDistance } from "../../utils/helpers";
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

  const { getCompatibleConnectorTypes, getCurrentVehicleConnectors } =
    useVehicleStore();

  const summaries = useReviewStore((state) => state.summaries);
  const stationReviews = useReviewStore((state) => state.stationReviews);
  const fetchReviewSummary = useReviewStore(
    (state) => state.fetchStationSummary
  );
  const fetchReviews = useReviewStore((state) => state.fetchStationReviews);
  const reviewLoading = useReviewStore((state) => state.loading);

  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState({
    lat: 10.7769,
    lng: 106.7009,
  });
  const [selectedStation, setSelectedStation] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [stationToBook, setStationToBook] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");

  const selectedStationId =
    selectedStation?.stationId ?? selectedStation?.id ?? null;

  const filteredStations = React.useMemo(() => {
    console.log("🔄 FindStations: Re-computing filtered stations");
    console.log("Current filters:", filters);
    console.log("Search query:", searchQuery);

    try {
      const storeFiltered = getFilteredStations();
      console.log("Store filtered results:", storeFiltered.length, "stations");

      if (!searchQuery.trim()) {
        console.log(
          "No search query, returning store filtered:",
          storeFiltered.map((s) => s.name)
        );
        return storeFiltered;
      }

      const query = searchQuery.toLowerCase();
      const searchFiltered = storeFiltered.filter((station) => {
        if (!station || !station.name || !station.location) return false;

        return (
          station.name.toLowerCase().includes(query) ||
          (station.location.address &&
            station.location.address.toLowerCase().includes(query)) ||
          (station.location.city &&
            station.location.city.toLowerCase().includes(query)) ||
          (station.location.district &&
            station.location.district.toLowerCase().includes(query))
        );
      });

      console.log(
        "After search filter:",
        searchFiltered.map((s) => s.name)
      );
      return searchFiltered;
    } catch (error) {
      console.error("Error filtering stations:", error);
      return [];
    }
  }, [getFilteredStations, searchQuery, filters]);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  useEffect(() => {
    let isMounted = true;

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
    } else if (isMounted) {
      fetchNearbyStations(userLocation, filters.maxDistance);
    }

    return () => {
      isMounted = false;
    };
  }, [fetchNearbyStations, filters.maxDistance, userLocation]);

  useEffect(() => {
    const pending = filteredStations
      .map((station) => station?.stationId ?? station?.id)
      .filter((stationId) => stationId && !summaries[stationId]);

    if (pending.length === 0) {
      return;
    }

    pending.slice(0, 10).forEach((stationId) => {
      fetchReviewSummary(stationId).catch(() => null);
    });
  }, [filteredStations, summaries, fetchReviewSummary]);

  useEffect(() => {
    if (!selectedStationId) {
      return;
    }

    if (!summaries[selectedStationId]) {
      fetchReviewSummary(selectedStationId).catch(() => null);
    }

    if (!stationReviews[selectedStationId]) {
      fetchReviews(selectedStationId, 1, 5).catch(() => null);
    }
  }, [
    selectedStationId,
    summaries,
    stationReviews,
    fetchReviewSummary,
    fetchReviews,
  ]);

  const handleBookStation = (station) => {
    setStationToBook(station);
    setBookingModalOpen(true);
  };

  const handleBookingModalClose = () => {
    setBookingModalOpen(false);
    setStationToBook(null);

    const { bookings } = useBookingStore.getState();
    const latestBooking = bookings[bookings.length - 1];
    if (
      latestBooking &&
      new Date(latestBooking.createdAt) > new Date(Date.now() - 5000)
    ) {
      setBookingMessage(
        formatText("stations.bookingSuccess", {
          stationName: latestBooking.stationName,
          bookingId: latestBooking.id,
        })
      );
      setBookingSuccess(true);
    }
  };

  const getDistanceToStation = (station) =>
    calculateDistance(
      userLocation.lat,
      userLocation.lng,
      station.location.coordinates.lat,
      station.location.coordinates.lng
    );

  const getStatusChip = (station) => {
    const availablePorts = station.charging.availablePorts;
    const totalPorts = station.charging.totalPorts;

    if (station.status !== "active") {
      return (
        <Chip label={getText("stations.offline")} color="error" size="small" />
      );
    }

    if (availablePorts === 0) {
      return (
        <Chip label={getText("stations.full")} color="warning" size="small" />
      );
    }

    if (availablePorts === totalPorts) {
      return (
        <Chip
          label={getText("stations.available")}
          color="success"
          size="small"
        />
      );
    }

    return (
      <Chip
        label={`${availablePorts}/${totalPorts} Có sẵn`}
        color="info"
        size="small"
      />
    );
  };

  const selectedSummary = selectedStationId
    ? summaries[selectedStationId]
    : null;
  const selectedReviewData = selectedStationId
    ? stationReviews[selectedStationId]?.data || []
    : [];
  const recentReviews = selectedReviewData.slice(0, 3);

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
                <InputLabel id="findstations-connector-label">
                  {getText("stations.connectorType")}
                </InputLabel>
                <Select
                  labelId="findstations-connector-label"
                  id="findstations-connector-select"
                  label={getText("stations.connectorType")}
                  value={
                    Array.isArray(filters.connectorTypes)
                      ? filters.connectorTypes[0] || ""
                      : filters.connectorTypes || ""
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    console.log("Selected connector:", value);
                    updateFilters({ connectorTypes: value || "" });
                  }}
                  renderValue={(selected) => (selected ? selected : null)}
                >
                  {Object.values(CONNECTOR_TYPES).map((type) => {
                    const isVehicleCompatible =
                      getCurrentVehicleConnectors().includes(type);
                    return (
                      <MenuItem key={type} value={type}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            width: "100%",
                          }}
                        >
                          {type}
                          {isVehicleCompatible && (
                            <Chip
                              size="small"
                              label="Xe của bạn"
                              color="primary"
                              sx={{
                                ml: "auto",
                                fontSize: "0.7rem",
                                height: "20px",
                              }}
                            />
                          )}
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5, display: "block" }}
                >
                  {getCurrentVehicleConnectors().length > 0 &&
                    `Xe hiện tại hỗ trợ: ${getCurrentVehicleConnectors().join(
                      ", "
                    )}`}
                </Typography>
              </FormControl>
            </Grid>

            {/* Additional filters placeholder */}
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Station List */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {loading
                  ? "Đang tải..."
                  : `${filteredStations.length} ${getText(
                      "stations.stationsFound"
                    )}`}
              </Typography>

              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <Typography>Đang tìm trạm sạc gần bạn...</Typography>
                </Box>
              ) : (
                <List>
                  {filteredStations.map((station, index) => {
                    const stationId =
                      station?.stationId ?? station?.id ?? station?.stationID;
                    const summary = stationId ? summaries[stationId] : null;
                    const averageValue = summary?.averageRating
                      ? Number(summary.averageRating)
                      : 0;
                    const summaryLabel = summary
                      ? `${averageValue.toFixed(1)} / 5 • ${
                          summary.totalReviews
                        } đánh giá`
                      : reviewLoading
                      ? "Đang tải đánh giá..."
                      : "Chưa có đánh giá";
                    const isSelected =
                      stationId && selectedStationId
                        ? selectedStationId === stationId
                        : selectedStationId === (station?.id ?? null);

                    return (
                      <React.Fragment
                        key={stationId || station?.id || `station-${index}`}
                      >
                        <ListItem
                          onClick={() => setSelectedStation(station)}
                          sx={{
                            borderRadius: 2,
                            mb: 1,
                            border: isSelected ? 2 : 1,
                            borderColor: isSelected
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
                                e.target.src =
                                  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="60"%3E%3Crect fill="%231379FF" width="60" height="60"/%3E%3Ctext fill="white" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="12"%3EStation%3C/text%3E%3C/svg%3E';
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
                                <span
                                  style={{
                                    fontWeight: "bold",
                                    fontSize: "1.25rem",
                                  }}
                                >
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
                                    gap: "6px",
                                    marginBottom: "6px",
                                  }}
                                >
                                  <Rating
                                    value={averageValue}
                                    precision={0.5}
                                    readOnly
                                    size="small"
                                    sx={{ mr: 0.5 }}
                                  />
                                  <span
                                    style={{
                                      fontSize: "0.875rem",
                                      color: "rgba(0, 0, 0, 0.6)",
                                    }}
                                  >
                                    {summaryLabel}
                                  </span>
                                </span>

                                <span
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    marginBottom: "4px",
                                  }}
                                >
                                  <LocationOn
                                    sx={{
                                      fontSize: 16,
                                      color: "text.secondary",
                                    }}
                                  />
                                  <span
                                    style={{
                                      fontSize: "0.875rem",
                                      color: "rgba(0, 0, 0, 0.6)",
                                    }}
                                  >
                                    {station.location.address} •{" "}
                                    {getDistanceToStation(station)}
                                    {getText("units.km")}{" "}
                                    {getText("stations.away")}
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
                                      sx={{
                                        fontSize: 16,
                                        color: "primary.main",
                                      }}
                                    />
                                    <span style={{ fontSize: "0.875rem" }}>
                                      {getText("stations.upTo")}{" "}
                                      {station.charging.maxPower}
                                      {getText("units.kw")}
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

                        {index < filteredStations.length - 1 && <Divider />}
                      </React.Fragment>
                    );
                  })}
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
                    e.target.src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect fill="%231379FF" width="400" height="200"/%3E%3Ctext fill="white" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="20"%3ECharging Station%3C/text%3E%3C/svg%3E';
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

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 1,
                  }}
                >
                  <Rating
                    value={
                      selectedSummary?.averageRating
                        ? Number(selectedSummary.averageRating)
                        : 0
                    }
                    precision={0.5}
                    readOnly
                    size="small"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {selectedSummary
                      ? `${Number(selectedSummary.averageRating).toFixed(
                          1
                        )} / 5 • ${selectedSummary.totalReviews} đánh giá`
                      : "Chưa có đánh giá"}
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {getText("stations.distance")}:{" "}
                  {getDistanceToStation(selectedStation)}
                  {getText("units.km")}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  {getText("stations.chargingInfo")}
                </Typography>
                <Box sx={{ fontSize: "0.875rem", mb: 1 }}>
                  • {getText("stations.maxPower")}:{" "}
                  {selectedStation.charging.maxPower}
                  {getText("units.kw")}
                </Box>
                <Box sx={{ fontSize: "0.875rem", mb: 1 }}>
                  • {getText("stations.availablePorts")}:{" "}
                  {selectedStation.charging.availablePorts}/
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
                  {formatCurrency(selectedStation.charging.pricing.acRate)}
                  {getText("units.perKwh")}
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

                <Divider sx={{ my: 2 }} />

                {recentReviews.length > 0 ? (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Đánh giá gần đây
                    </Typography>
                    <List dense disablePadding>
                      {recentReviews.map((review) => (
                        <ListItem
                          key={review.reviewId}
                          alignItems="flex-start"
                          disableGutters
                          sx={{ mb: 1 }}
                        >
                          <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: "primary.main",
                              }}
                            >
                              {review.userName
                                ? review.userName.charAt(0).toUpperCase()
                                : "U"}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  flexWrap: "wrap",
                                }}
                              >
                                <Typography variant="subtitle2">
                                  {review.userName || "Khách hàng"}
                                </Typography>
                                <Rating
                                  value={Number(review.rating) || 0}
                                  readOnly
                                  size="small"
                                  precision={0.5}
                                />
                                {review.createdAt && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {new Date(
                                      review.createdAt
                                    ).toLocaleDateString("vi-VN")}
                                  </Typography>
                                )}
                              </Box>
                            }
                            secondary={
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {review.comment?.split("\n\n")[0] ||
                                  "Không có nội dung đánh giá"}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                    {selectedSummary?.totalReviews > recentReviews.length && (
                      <Typography variant="caption" color="text.secondary">
                        (Còn{" "}
                        {selectedSummary.totalReviews - recentReviews.length}{" "}
                        đánh giá khác)
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Chưa có đánh giá cho trạm này. Hãy là người đầu tiên chia sẻ
                    trải nghiệm!
                  </Typography>
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
