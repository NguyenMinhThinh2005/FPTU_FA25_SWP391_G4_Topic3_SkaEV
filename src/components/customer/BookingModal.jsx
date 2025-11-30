/* eslint-disable */
/**
 * BookingModal Component - Booking Flow for Charging Sessions
 *
 * Steps:
 * 0. Select Charger Type (AC/DC)
 * 1. Select Charging Port/Slot
 * 2. Select Date/Time (TODAY only in Vietnam timezone)
 * 3. Confirm Booking
 *
 * Props:
 * - open: boolean - Modal visibility
 * - onClose: function - Close handler
 * - station: object - Station data with charging poles and ports
 * - onSuccess: function(booking) - Success callback with booking data
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  Chip,
  Divider,
  CircularProgress,
  Stack,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import {
  BoltOutlined as BoltIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckIcon,
  LocalGasStation as StationIcon,
  Schedule as ScheduleIcon,
  FlashOn as FastChargeIcon,
  Battery20 as SlowChargeIcon,
} from "@mui/icons-material";
import {
  format,
  addMinutes,
  setHours,
  setMinutes as setMinutesDate,
} from "date-fns";
import { vi } from "date-fns/locale";
import { bookingsAPI, stationsAPI } from "../../services/api";
import useVehicleStore from "../../store/vehicleStore";
import notificationService from "../../services/notificationService";

const STEPS = ["Chọn loại sạc", "Chọn cổng sạc", "Chọn thời gian", "Xác nhận"];

const BookingModal = ({ open, onClose, station, onSuccess }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Booking form data
  const [selectedChargerType, setSelectedChargerType] = useState(null); // 'AC' or 'DC'
  const [selectedPole, setSelectedPole] = useState(null);
  const [selectedPort, setSelectedPort] = useState(null);
  const [schedulingType, setSchedulingType] = useState("scheduled"); // Always scheduled
  const [scheduledDateTime, setScheduledDateTime] = useState(null); // User must select a time slot
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Get vehicle store
  const { vehicles, fetchVehicles } = useVehicleStore();
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);

  // State for slots data from API
  const [slotsData, setSlotsData] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Fetch vehicles and auto-select valid vehicle when modal opens
  useEffect(() => {
    const initializeVehicles = async () => {
      if (open) {
        try {
          // Fetch latest vehicles from API
          await fetchVehicles();

          // Check if current selectedVehicle is still valid
          if (selectedVehicle && vehicles.length > 0) {
            const isValidVehicle = vehicles.some(
              (v) => v.vehicleId === selectedVehicle.vehicleId
            );
            if (!isValidVehicle) {
              // Auto-select first valid vehicle
              setSelectedVehicle(vehicles[0]);
              console.log("✅ Auto-selected valid vehicle:", vehicles[0]);
            }
          } else if (vehicles.length > 0 && !selectedVehicle) {
            // No vehicle selected, auto-select first one
            setSelectedVehicle(vehicles[0]);
            console.log("✅ Auto-selected first vehicle:", vehicles[0]);
          }
        } catch (error) {
          console.error("❌ Error fetching vehicles:", error);
        }
      }
    };
    initializeVehicles();
  }, [open]);

  // Fetch slots when modal opens
  useEffect(() => {
    const fetchSlots = async () => {
      if (open && station?.stationId && slotsData.length === 0) {
        setLoadingSlots(true);
        try {
          const response = await stationsAPI.getAvailablePosts(
            station.stationId
          );
          const posts = response?.data?.data || response?.data || [];
          console.log("🔍 Posts API Response:", response);
          console.log("📥 Raw Posts (ChargingPostDto[]):", posts);

          // Transform ChargingPostDto[] to flat slots
          const allSlots = [];
          posts.forEach((post) => {
            const postData = {
              postId: post.PostId || post.postId,
              postName: post.PostName || post.postName,
              postType: post.PostType || post.postType,
            };
            const slots = post.Slots || post.slots || [];
            slots.forEach((slot) => {
              const rawStatus = slot.Status || slot.status || "available";
              console.log(
                `🔍 Slot ${slot.SlotId || slot.slotId} raw status:`,
                rawStatus
              );

              allSlots.push({
                slotId: slot.SlotId || slot.slotId,
                postId: postData.postId,
                postName: postData.postName,
                postType: postData.postType,
                status: String(rawStatus).trim().toLowerCase(),
                connectorType: slot.ConnectorType || slot.connectorType,
                powerKw:
                  slot.MaxPower ||
                  slot.maxPower ||
                  slot.PowerKw ||
                  slot.powerKw,
                currentBookingId:
                  slot.CurrentBookingId || slot.currentBookingId,
              });
            });
          });
          console.log("✅ Transformed Slots:", allSlots);
          // Filter for available slots (case-insensitive and trimmed)
          setSlotsData(allSlots.filter((s) => s.status === "available"));
        } catch (error) {
          console.error("❌ Error fetching posts:", error);
          setError("Không thể tải thông tin trụ sạc");
        } finally {
          setLoadingSlots(false);
        }
      }
    };
    fetchSlots();
  }, [open, station?.stationId]);

  // Extract available charger types from slots data (grouped by PostType)
  const chargerTypes = useMemo(() => {
    if (!slotsData || slotsData.length === 0) return [];

    const types = [];

    // Detect AC: Type 2, J1772, or PostType === 'AC'
    const acSlots = slotsData.filter((s) => {
      const isAC =
        s.postType === "AC" ||
        ["Type 2", "Type2", "J1772", "Mennekes"].includes(s.connectorType);
      return isAC && s.status === "available";
    });

    // Detect DC: CCS, CHAdeMO, GB/T or PostType === 'DC'
    const dcSlots = slotsData.filter((s) => {
      const isDC =
        s.postType === "DC" ||
        ["CCS", "CCS2", "CCS1", "CHAdeMO", "GB/T"].includes(s.connectorType);
      return isDC && s.status === "available";
    });

    console.log("⚡ AC Slots:", acSlots.length, acSlots);
    console.log("⚡ DC Slots:", dcSlots.length, dcSlots);

    if (acSlots.length > 0) {
      const maxAcPower = Math.max(...acSlots.map((s) => s.powerKw || 0));
      types.push({
        type: "AC",
        label: "Sạc chậm AC",
        description: "Phù hợp cho sạc qua đêm",
        maxPower: maxAcPower,
        availablePorts: acSlots.length,
        price: 3000, // Default or from station data
        icon: SlowChargeIcon,
        color: "primary",
      });
    }

    if (dcSlots.length > 0) {
      const maxDcPower = Math.max(...dcSlots.map((s) => s.powerKw || 0));
      types.push({
        type: "DC",
        label: "Sạc nhanh DC",
        description: "Sạc nhanh trong 30-60 phút",
        maxPower: maxDcPower,
        availablePorts: dcSlots.length,
        price: 5000, // Default or from station data
        icon: FastChargeIcon,
        color: "secondary",
      });
    }

    return types;
  }, [slotsData]);

  // Get poles (posts) for selected charger type - grouped from slots
  const availablePoles = useMemo(() => {
    if (!slotsData || !selectedChargerType) return [];

    const filteredSlots = slotsData.filter((s) => {
      if (s.status !== "available") return false;

      // Robust filtering matching chargerTypes logic
      if (selectedChargerType === "DC") {
        return (
          s.postType === "DC" ||
          ["CCS", "CCS2", "CCS1", "CHAdeMO", "GB/T"].includes(s.connectorType)
        );
      }
      if (selectedChargerType === "AC") {
        return (
          s.postType === "AC" ||
          ["Type 2", "Type2", "J1772", "Mennekes"].includes(s.connectorType)
        );
      }

      return s.postType === selectedChargerType;
    });

    // Group slots by PostId
    const grouped = filteredSlots.reduce((acc, slot) => {
      if (!acc[slot.postId]) {
        acc[slot.postId] = {
          id: slot.postId,
          poleId: slot.postId,
          name: slot.postName || `Trụ ${slot.postId}`,
          poleNumber: slot.postId,
          type: slot.postType,
          power: slot.powerKw || 0,
          status: "active",
          ports: [],
        };
      }
      acc[slot.postId].ports.push({
        id: slot.slotId,
        portNumber: slot.slotId,
        connectorType: slot.connectorType || "Type 2",
        maxPower: slot.powerKw || 0,
        status: slot.status,
      });
      return acc;
    }, {});

    return Object.values(grouped);
  }, [slotsData, selectedChargerType]);

  // Get ports for selected pole
  const availablePorts = useMemo(() => {
    if (!selectedPole?.ports) return [];
    return selectedPole.ports.filter((p) => p.status === "available");
  }, [selectedPole]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setActiveStep(0);
      setSelectedChargerType(null);
      setSelectedPole(null);
      setSelectedPort(null);
      setSchedulingType("scheduled");
      setScheduledDateTime(null); // Reset to null, user must select a time slot
      setError(null);
      setSlotsData([]);
      setAgreedToTerms(false);
    }
  }, [open]);

  const handleNext = () => {
    setError(null);

    // Validation for each step
    if (activeStep === 0 && !selectedChargerType) {
      setError("Vui lòng chọn loại sạc");
      return;
    }
    if (activeStep === 1 && !selectedPort) {
      setError("Vui lòng chọn cổng sạc");
      return;
    }
    if (activeStep === 2) {
      if (schedulingType === "scheduled" && !scheduledDateTime) {
        setError("Vui lòng chọn thời gian đặt lịch");
        return;
      }
    }

    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((prev) => prev - 1);
  };

  const handleChargerTypeSelect = (type) => {
    setSelectedChargerType(type);
    setSelectedPole(null);
    setSelectedPort(null);
  };

  const handlePoleSelect = (pole) => {
    setSelectedPole(pole);
    setSelectedPort(null);
  };

  const handlePortSelect = (port) => {
    setSelectedPort(port);
  };

  // Generate time slots for next 24 hours, starting from NOW + 30 minutes
  const generateTimeSlots = () => {
    const now = new Date();
    const minTime = new Date(now.getTime() + 30 * 60000); // Now + 30 minutes
    const maxTime = new Date(now.getTime() + 24 * 60 * 60000); // Now + 24 hours

    const slots = [];
    let currentTime = new Date(minTime);

    // Round up to next 30-minute mark
    const minutes = currentTime.getMinutes();
    const roundedMinutes = minutes <= 30 ? 30 : 60;
    currentTime.setMinutes(roundedMinutes, 0, 0);
    if (roundedMinutes === 60) {
      currentTime.setHours(currentTime.getHours() + 1);
      currentTime.setMinutes(0, 0, 0);
    }

    // Generate slots for next 24 hours (max 20 slots to avoid clutter)
    let slotCount = 0;
    const maxSlots = 20;

    while (currentTime <= maxTime && slotCount < maxSlots) {
      slots.push({
        time: format(currentTime, "HH:mm"), // Only show time, no date
        datetime: new Date(currentTime),
        fullDisplay: format(currentTime, "HH:mm - EEEE, dd/MM/yyyy", {
          locale: vi,
        }),
      });

      // Increment by 30 minutes
      currentTime = new Date(currentTime.getTime() + 30 * 60000);
      slotCount++;
    }

    return slots;
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (slot) => {
    setScheduledDateTime(slot.datetime);
    console.log(
      "🕒 Selected time:",
      format(slot.datetime, "HH:mm - dd/MM/yyyy", { locale: vi })
    );
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate scheduled time (must be at least 30 minutes from now and within 24 hours)
      if (schedulingType === "scheduled" && scheduledDateTime) {
        const now = new Date();
        const minAllowedTime = new Date(now.getTime() + 30 * 60000); // Now + 30 minutes
        const maxAllowedTime = new Date(now.getTime() + 24 * 60 * 60000); // Now + 24 hours

        if (scheduledDateTime < minAllowedTime) {
          const minutesFromNow = Math.round(
            (scheduledDateTime.getTime() - now.getTime()) / 60000
          );
          throw new Error(
            `Thời gian đặt phải ít nhất 30 phút từ bây giờ. Hiện tại bạn đang chọn ${minutesFromNow} phút. Vui lòng chọn thời gian xa hơn.`
          );
        }

        if (scheduledDateTime > maxAllowedTime) {
          throw new Error(
            `Chỉ cho phép đặt chỗ trong vòng 24 giờ tới. Vui lòng chọn thời gian sớm hơn.`
          );
        }
      }

      // Validate vehicle (must have valid vehicleId)
      if (!selectedVehicle || !selectedVehicle.vehicleId) {
        throw new Error(
          "Vui lòng chọn xe hợp lệ. Nếu chưa có xe, hãy thêm xe trong phần quản lý xe."
        );
      }

      // Prepare booking payload
      const bookingData = {
        stationId: station.stationId || station.id,
        slotId: selectedPort.id,
        vehicleId: selectedVehicle?.vehicleId || null,
        schedulingType: schedulingType,
        scheduledStartTime:
          schedulingType === "scheduled"
            ? scheduledDateTime?.toISOString()
            : new Date().toISOString(),
        targetSoc: 80, // Default target SOC
      };

      console.log("📤 Creating booking:", bookingData);

      // Call API to create booking
      const response = await bookingsAPI.create(bookingData);

      if (response && response.bookingId) {
        console.log("✅ Booking created successfully:", response);

        // Prepare booking data for parent component
        const bookingResult = {
          bookingId: response.bookingId,
          stationId: station.stationId || station.id,
          stationName: station.name,
          slotId: selectedPort.id,
          scheduledDateTime:
            schedulingType === "scheduled" ? scheduledDateTime : new Date(),
          chargerType: selectedChargerType,
          portNumber: selectedPort.portNumber,
          connectorType: selectedPort.connectorType,
          maxPower: selectedPort.maxPower || selectedPole.power,
          status: "pending",
          ...response,
        };

        notificationService.success(
          "Đặt chỗ thành công!",
          "Booking đã được tạo, bạn có thể đến trạm sạc."
        );

        // Call success callback
        onSuccess?.(bookingResult);
        onClose();
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("❌ Booking error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Có lỗi xảy ra khi đặt chỗ";
      setError(errorMessage);
      notificationService.error("Đặt chỗ thất bại", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Step 0: Select Charger Type
  const renderChargerTypeStep = () => (
    <Box sx={{ py: 2 }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <BoltIcon color="primary" />
        Chọn loại sạc
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Chọn loại sạc phù hợp với xe của bạn
      </Typography>

      <Grid container spacing={2}>
        {chargerTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedChargerType === type.type;

          return (
            <Grid item xs={12} sm={6} key={type.type}>
              <Card
                role="button"
                sx={{
                  cursor: "pointer",
                  border: isSelected ? 2 : 1,
                  borderColor: isSelected ? `${type.color}.main` : "divider",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: `${type.color}.main`,
                    transform: "translateY(-4px)",
                    boxShadow: 3,
                  },
                }}
                onClick={() => handleChargerTypeSelect(type.type)}
              >
                <CardContent>
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Icon
                        sx={{ fontSize: 40, color: `${type.color}.main` }}
                      />
                      {isSelected && <CheckIcon color="success" />}
                    </Box>

                    <Typography variant="h6">{type.label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {type.description}
                    </Typography>

                    <Divider />

                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      <Chip
                        label={`Công suất: ${type.maxPower} kW`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`${type.availablePorts} cổng trống`}
                        size="small"
                        color={type.availablePorts > 0 ? "success" : "error"}
                      />
                      <Chip
                        label={`${type.price.toLocaleString("vi-VN")} đ/kWh`}
                        size="small"
                        color="primary"
                      />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {loadingSlots && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Đang tải thông tin cổng sạc...</Typography>
        </Box>
      )}

      {!loadingSlots && chargerTypes.length === 0 && (
        <Alert severity="warning">
          Không có loại sạc nào khả dụng tại trạm này
        </Alert>
      )}
    </Box>
  );

  // Step 1: Select Charging Port
  const renderPortSelectionStep = () => (
    <Box sx={{ py: 2 }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <StationIcon color="primary" />
        Chọn cổng sạc
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Chọn trụ sạc và cổng sạc cụ thể
      </Typography>

      {availablePoles.map((pole) => (
        <Box key={pole.id || pole.poleId} sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
            {pole.name || `Trụ ${pole.poleNumber}`} - {pole.power}kW {pole.type}
          </Typography>

          <Grid container spacing={2}>
            {pole.ports
              ?.filter((port) => port.status === "available")
              .map((port) => {
                const isSelected = selectedPort?.id === port.id;

                return (
                  <Grid item xs={12} sm={6} md={4} key={port.id}>
                    <Card
                      role="button"
                      sx={{
                        cursor: "pointer",
                        border: isSelected ? 2 : 1,
                        borderColor: isSelected ? "primary.main" : "divider",
                        transition: "all 0.2s",
                        "&:hover": {
                          borderColor: "primary.main",
                          transform: "translateY(-2px)",
                          boxShadow: 2,
                        },
                      }}
                      onClick={() => {
                        handlePoleSelect(pole);
                        handlePortSelect(port);
                      }}
                    >
                      <CardContent>
                        <Stack spacing={1}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="h6">
                              Cổng {port.portNumber}
                            </Typography>
                            {isSelected && <CheckIcon color="success" />}
                          </Box>

                          <Chip
                            label={port.connectorType}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Chip
                            label={`${port.maxPower || pole.power} kW`}
                            size="small"
                          />
                          <Chip label="Sẵn sàng" size="small" color="success" />
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
          </Grid>

          {pole.ports?.filter((port) => port.status === "available").length ===
            0 && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Không có cổng trống tại trụ này
            </Alert>
          )}
        </Box>
      ))}

      {availablePoles.length === 0 && (
        <Alert severity="warning">
          Không có trụ sạc {selectedChargerType} nào khả dụng
        </Alert>
      )}
    </Box>
  );

  // Step 2: Select Date/Time (TODAY ONLY)
  const renderTimeSelectionStep = () => (
    <Box sx={{ py: 2 }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <TimeIcon color="primary" />
        Chọn giờ sạc
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Chọn mốc giờ phù hợp (có thể chọn đến 24h tới)
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Lưu ý:</strong> Bạn có thể đặt lịch sạc trong vòng 24 giờ tới.
          Thời gian đặt phải ít nhất 30 phút từ bây giờ.
        </Typography>
      </Alert>

      {/* Time Slots Selection */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Giờ đã chọn:
        </Typography>
        <Typography
          variant="h6"
          color={scheduledDateTime ? "primary" : "text.secondary"}
          sx={{ mb: 2, fontWeight: "bold" }}
        >
          {scheduledDateTime
            ? format(scheduledDateTime, "HH:mm - EEEE, dd/MM/yyyy", {
                locale: vi,
              })
            : "Vui lòng chọn một mốc giờ bên dưới"}
        </Typography>

        <Grid container spacing={1}>
          {generateTimeSlots().map((slot, index) => {
            const isSelected =
              scheduledDateTime &&
              scheduledDateTime.getTime() === slot.datetime.getTime();
            return (
              <Grid item xs={3} sm={2} key={`slot-${index}`}>
                <Chip
                  label={slot.time}
                  onClick={() => handleTimeSlotSelect(slot)}
                  color={isSelected ? "primary" : "default"}
                  variant={isSelected ? "filled" : "outlined"}
                  sx={{
                    width: "100%",
                    fontWeight: isSelected ? "bold" : "normal",
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: isSelected
                        ? "primary.dark"
                        : "action.hover",
                    },
                  }}
                />
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Box>
  );

  // Step 3: Confirm Booking
  const renderConfirmationStep = () => (
    <Box sx={{ py: 2 }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <CheckIcon color="success" />
        Xác nhận đặt chỗ
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Kiểm tra lại thông tin đặt chỗ của bạn
      </Typography>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Xe sạc
              </Typography>
              {vehicles.length > 0 ? (
                <FormControl fullWidth size="small">
                  <Select
                    value={selectedVehicle?.vehicleId || ""}
                    onChange={(e) => {
                      const v = vehicles.find(
                        (v) => v.vehicleId === e.target.value
                      );
                      setSelectedVehicle(v);
                    }}
                    displayEmpty
                  >
                    {vehicles.map((v) => (
                      <MenuItem key={v.vehicleId} value={v.vehicleId}>
                        {v.model || "Xe không tên"} ({v.licensePlate})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <Button variant="outlined" color="warning" fullWidth>
                  Thêm xe ngay
                </Button>
              )}
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Trạm sạc
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {station?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {station?.location?.address}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Loại sạc
              </Typography>
              <Typography variant="body1">
                {selectedChargerType === "AC" ? "Sạc chậm AC" : "Sạc nhanh DC"}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Cổng sạc
              </Typography>
              <Typography variant="body1">
                {selectedPole?.name || `Trụ ${selectedPole?.poleNumber}`} - Cổng{" "}
                {selectedPort?.portNumber}
              </Typography>
              <Typography variant="body2">
                {selectedPort?.connectorType} •{" "}
                {selectedPort?.maxPower || selectedPole?.power} kW
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Thời gian bắt đầu
              </Typography>
              <Typography variant="body1">
                {format(
                  scheduledDateTime || new Date(),
                  "'Hôm nay,' dd/MM/yyyy 'lúc' HH:mm",
                  { locale: vi }
                )}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Alert severity="info" sx={{ mt: 2 }}>
        Sau khi xác nhận, bạn có thể đến trạm sạc và quét mã QR để bắt đầu sạc
      </Alert>

      <FormControlLabel
        control={
          <Checkbox
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            color="primary"
          />
        }
        label={
          <Typography variant="body2">
            Tôi đồng ý với{" "}
            <Typography
              component="span"
              color="primary"
              sx={{ cursor: "pointer", textDecoration: "underline" }}
              onClick={(e) => {
                e.preventDefault();
                setTermsModalOpen(true);
              }}
            >
              điều khoản sử dụng
            </Typography>{" "}
            và{" "}
            <Typography
              component="span"
              color="primary"
              sx={{ cursor: "pointer", textDecoration: "underline" }}
              onClick={(e) => {
                e.preventDefault();
                setPolicyModalOpen(true);
              }}
            >
              chính sách thanh toán
            </Typography>
          </Typography>
        }
        sx={{ mt: 2 }}
      />
    </Box>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderChargerTypeStep();
      case 1:
        return renderPortSelectionStep();
      case 2:
        return renderTimeSelectionStep();
      case 3:
        return renderConfirmationStep();
      default:
        return null;
    }
  };

  const isNextDisabled = () => {
    switch (activeStep) {
      case 0:
        return !selectedChargerType;
      case 1:
        return !selectedPort;
      case 2:
        return !scheduledDateTime;
      case 3:
        return !agreedToTerms; // Must agree to terms before confirming
      default:
        return false;
    }
  };

  return (
    <>
      {/* Terms Modal */}
      <Dialog
        open={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Điều khoản sử dụng dịch vụ sạc xe điện</DialogTitle>
        <DialogContent dividers>
          <Typography variant="h6" gutterBottom>
            1. Điều khoản chung
          </Typography>
          <Typography variant="body2" paragraph>
            Bằng việc sử dụng dịch vụ sạc xe điện của SkaEV, bạn đồng ý tuân thủ
            các điều khoản và điều kiện được nêu trong tài liệu này.
          </Typography>

          <Typography variant="h6" gutterBottom>
            2. Quy định sử dụng
          </Typography>
          <Typography variant="body2" paragraph>
            • Người dùng phải đặt lịch trước khi đến trạm sạc.
            <br />
            • Chỉ sạc trong khung giờ đã đặt, tối đa 2 giờ mỗi lần.
            <br />
            • Không để xe quá thời gian quy định (phạt 50.000đ/30 phút).
            <br />• Giữ gìn vệ sinh và trang thiết bị tại trạm sạc.
          </Typography>

          <Typography variant="h6" gutterBottom>
            3. Trách nhiệm người dùng
          </Typography>
          <Typography variant="body2" paragraph>
            • Đảm bảo xe điện tương thích với loại cổng sạc đã chọn.
            <br />
            • Kiểm tra kết nối trước khi rời khỏi trạm.
            <br />
            • Báo cáo ngay nếu có sự cố với thiết bị sạc.
            <br />• Chịu trách nhiệm về thiệt hại do sử dụng sai quy định.
          </Typography>

          <Typography variant="h6" gutterBottom>
            4. Chính sách hủy lịch
          </Typography>
          <Typography variant="body2" paragraph>
            • Có thể hủy miễn phí trước 30 phút.
            <br />
            • Hủy trong vòng 30 phút: phạt 20.000đ.
            <br />• Không đến và không hủy: phạt 50.000đ và có thể bị tạm khóa
            tài khoản.
          </Typography>

          <Typography variant="h6" gutterBottom>
            5. Giới hạn trách nhiệm
          </Typography>
          <Typography variant="body2" paragraph>
            SkaEV không chịu trách nhiệm về thiệt hại đối với xe hoặc pin do sử
            dụng dịch vụ, trừ trường hợp lỗi từ thiết bị của chúng tôi.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTermsModalOpen(false)} color="primary">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Policy Modal */}
      <Dialog
        open={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Chính sách thanh toán</DialogTitle>
        <DialogContent dividers>
          <Typography variant="h6" gutterBottom>
            1. Phương thức thanh toán
          </Typography>
          <Typography variant="body2" paragraph>
            • Thanh toán qua ví điện tử
            <br />
            • Thẻ tín dụng/ghi nợ (Visa, Mastercard)
            <br />
            • Chuyển khoản ngân hàng
            <br />• Thanh toán bằng mã QR tại trạm
          </Typography>

          <Typography variant="h6" gutterBottom>
            2. Giá cước sạc
          </Typography>
          <Typography variant="body2" paragraph>
            • Sạc chậm AC: 3.000đ - 4.000đ/kWh
            <br />
            • Sạc nhanh DC: 5.000đ - 7.000đ/kWh
            <br />
            • Giá có thể thay đổi theo khung giờ (giờ cao điểm/thấp điểm)
            <br />• Áp dụng VAT 10% theo quy định
          </Typography>

          <Typography variant="h6" gutterBottom>
            3. Thanh toán và hóa đơn
          </Typography>
          <Typography variant="body2" paragraph>
            • Thanh toán sau khi hoàn tất phiên sạc.
            <br />
            • Hóa đơn điện tử được gửi qua email sau 24 giờ.
            <br />
            • Có thể xem lịch sử giao dịch trong ứng dụng.
            <br />• Yêu cầu hóa đơn VAT cần đăng ký trước khi sạc.
          </Typography>

          <Typography variant="h6" gutterBottom>
            4. Chính sách hoàn tiền
          </Typography>
          <Typography variant="body2" paragraph>
            • Hoàn tiền 100% nếu thiết bị sạc lỗi.
            <br />
            • Hoàn 50% nếu hủy do lý do hợp lệ (xác nhận từ hệ thống).
            <br />
            • Thời gian hoàn tiền: 3-7 ngày làm việc.
            <br />• Không hoàn tiền nếu người dùng hủy không đúng quy định.
          </Typography>

          <Typography variant="h6" gutterBottom>
            5. Chương trình khuyến mãi
          </Typography>
          <Typography variant="body2" paragraph>
            • Giảm 10% cho lần sạc đầu tiên.
            <br />
            • Tích điểm thưởng: 1 điểm = 1.000đ chi tiêu.
            <br />
            • Ưu đãi thành viên VIP: giảm giá đến 20%.
            <br />• Khuyến mãi đặc biệt vào các ngày lễ.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPolicyModalOpen(false)} color="primary">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Main Booking Modal */}
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: "70vh" },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ScheduleIcon color="primary" />
            Đặt chỗ sạc xe
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {renderStepContent()}
        </DialogContent>

        <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
          <Button onClick={onClose} disabled={loading}>
            Hủy
          </Button>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button onClick={handleBack} disabled={activeStep === 0 || loading}>
              Quay lại
            </Button>

            {activeStep < STEPS.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={isNextDisabled() || loading}
              >
                Tiếp tục
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleConfirmBooking}
                disabled={loading}
                startIcon={loading && <CircularProgress size={20} />}
              >
                {loading ? "Đang xử lý..." : "Xác nhận"}
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BookingModal;
