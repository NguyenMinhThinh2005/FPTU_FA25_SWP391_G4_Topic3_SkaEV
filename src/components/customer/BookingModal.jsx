import React, { useState } from "react";
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
  Typography,
  Grid,
  Card,
  CardContent,
  ButtonBase,
  Chip,
  Alert,
  FormControlLabel,
  Checkbox,
  Paper,
  CircularProgress,
} from "@mui/material";
import {
  ElectricCar,
  Schedule,
  FlashOn,
  CheckCircle,
  Close,
} from "@mui/icons-material";
import useBookingStore from "../../store/bookingStore";
import ChargingDateTimePicker from "../ui/ChargingDateTimePicker/ChargingDateTimePicker";
import notificationService from "../../services/notificationService";

const BookingModal = ({ open, onClose, station, onSuccess }) => {
  const { createBooking } = useBookingStore();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedChargingType, setSelectedChargingType] = useState(null); // Step 1: Choose charging type
  const [selectedPort, setSelectedPort] = useState(null); // Step 2: Choose specific port
  const [selectedDateTime, setSelectedDateTime] = useState(null);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [resultMessage, setResultMessage] = useState("");

  const steps = [
    "Chọn loại sạc",
    "Chọn cổng sạc",
    "Chọn thời gian sạc",
    "Xác nhận đặt chỗ",
  ];

  // Helper to render pole label and ensure a single leading "Trụ" prefix
  // - removes any leading/repeated occurrences of the word 'Trụ' from the
  //   raw pole name, then prefixes a single 'Trụ ' to the cleaned name.
  // This avoids results like "Trụ Trụ sạc 1" when the stored name already
  // contains the word 'Trụ'.
  const formatPoleLabel = (poleName) => {
    if (!poleName) return "";
    let name = String(poleName).trim();
    // Remove any number of leading 'Trụ' tokens, plus surrounding punctuation/spaces
    // Examples cleaned:
    //  - "Trụ sạc 1" -> "sạc 1"
    //  - "Trụ Trụ sạc 1" -> "sạc 1"
    //  - "TRỤ: A01" -> "A01"
    name = name.replace(/^((?:Trụ)[:\s\-–—]*)+/i, "").trim();
    // If cleaning produced an empty name, fallback to original trimmed name
    if (!name) {
      name = String(poleName).trim();
      // as a last resort, remove duplicated 'Trụ' words anywhere
      name = name.replace(/(Trụ)\s+/gi, "Trụ ").trim();
    }
    // Ensure single prefix
    if (/^Trụ\b/i.test(name)) return name;
    return `Trụ ${name}`;
  };

  // Get unique charging types from all poles
  const getChargingTypes = () => {
    if (!station?.charging?.poles) return [];

    const typesMap = new Map();
    station.charging.poles.forEach((pole) => {
      const key = `${pole.type}-${pole.power}`;
      if (!typesMap.has(key)) {
        typesMap.set(key, {
          id: key,
          type: pole.type,
          power: pole.power,
          voltage: pole.voltage,
          name:
            pole.type === "AC"
              ? `Sạc chậm AC`
              : pole.power >= 150
              ? `Sạc siêu nhanh DC`
              : `Sạc nhanh DC`,
          rate:
            pole.type === "AC"
              ? station.charging.pricing.acRate
              : pole.power >= 150
              ? station.charging.pricing.dcFastRate ||
                station.charging.pricing.dcRate
              : station.charging.pricing.dcRate,
          availableCount: 0,
        });
      }
      // Count available ports on this pole
      const availablePorts = (pole.ports || []).filter(
        (p) => p.status === "available"
      ).length;
      const current = typesMap.get(key);
      current.availableCount += availablePorts;
    });

    return Array.from(typesMap.values());
  };

  // Get all ports matching selected charging type
  const getPortsForType = () => {
    if (!selectedChargingType || !station?.charging?.poles) return [];

    const ports = [];
    station.charging.poles.forEach((pole) => {
      if (
        pole.type === selectedChargingType.type &&
        pole.power === selectedChargingType.power
      ) {
        (pole.ports || []).forEach((port) => {
          ports.push({
            ...port,
            poleName: pole.name,
            poleId: pole.id,
            power: pole.power,
            type: pole.type,
          });
        });
      }
    });

    return ports;
  };

  const getAvailablePortsForType = () => {
    return getPortsForType().filter((port) => port.status === "available");
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleChargingTypeSelect = (type) => {
    setSelectedChargingType(type);
    setSelectedPort(null); // Reset port when type changes
  };

  const handlePortSelect = (port) => {
    setSelectedPort(port);
  };

  const handleDateTimeChange = (dateTimeData) => {
    setSelectedDateTime(dateTimeData);
  };

  const handleConfirmBooking = async () => {
    if (
      !selectedChargingType ||
      !selectedPort ||
      !selectedDateTime ||
      !agreeTerms
    ) {
      return;
    }

    setLoading(true);
    try {
      const baseRate = selectedChargingType.rate;

      const bookingData = {
        stationId: station.id,
        stationName: station.name,
        chargerType: {
          id: selectedChargingType.id,
          name: selectedChargingType.name,
          type: selectedChargingType.type,
          power: selectedChargingType.power,
          voltage: selectedChargingType.voltage,
        },
        port: {
          id: selectedPort.id,
          connectorType: selectedPort.connectorType,
          poleId: selectedPort.poleId,
          poleName: selectedPort.poleName,
        },
        pricing: {
          baseRate,
          parkingFee: station.charging.pricing.parkingFee || 0,
        },
        bookingTime: new Date().toISOString(),
        schedulingType: selectedDateTime?.schedulingType || "scheduled", // Changed from "immediate" to "scheduled"
        scheduledDateTime: selectedDateTime?.scheduledDateTime || null,
        scheduledDate: selectedDateTime?.scheduledDate
          ? selectedDateTime.scheduledDate.toISOString().split("T")[0]
          : null,
        scheduledTime: selectedDateTime?.scheduledTime
          ? selectedDateTime.scheduledTime.toISOString()
          : null,
        // Add SOC data
        initialSOC: 20, // Default value, should come from vehicle
        targetSOC: 80, // Default value, should come from user input
        estimatedDuration: 60, // Default 60 minutes
      };

      // Call async createBooking - it will now call API
      const booking = await createBooking(bookingData);

      if (!booking) {
        throw new Error("Failed to create booking");
      }

      setBookingResult("success");

      // Success message for scheduled booking
      setResultMessage(
        `Đặt lịch thành công!\n` +
          `Mã đặt chỗ: ${booking.id}\n` +
          `Thời gian: ${new Date(bookingData.scheduledDateTime).toLocaleString(
            "vi-VN"
          )}\n\n` +
          `📱 Hãy đến trạm vào đúng giờ và quét mã QR để bắt đầu sạc!`
      );

      // Send notification
      notificationService.notifyBookingConfirmed({
        stationName: station.name,
        id: booking.id,
      });

      // Call onSuccess callback immediately after successful booking
      if (onSuccess) {
        onSuccess(booking);
      }

      // Don't automatically start charging - user needs to scan QR first
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch {
      setBookingResult("error");
      setResultMessage("Có lỗi xảy ra khi đặt chỗ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setSelectedChargingType(null);
    setSelectedPort(null);
    setSelectedDateTime(null);
    setAgreeTerms(false);
    setLoading(false);
    setBookingResult(null);
    setResultMessage("");
    onClose();
  };

  // Accessibility: when dialog opens, blur any currently focused element
  // to avoid aria-hidden warnings where a focused element is hidden from
  // assistive technology. MUI Dialog will manage focus internally.
  React.useEffect(() => {
    if (open) {
      try {
        const active = document.activeElement;
        if (active && typeof active.blur === "function") {
          active.blur();
        }
      } catch {
        // ignore
      }
    }
  }, [open]);

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Chọn loại sạc phù hợp
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Trạm {station?.name} có các loại sạc với mức giá khác nhau
            </Typography>

            <Grid container spacing={2}>
              {getChargingTypes().map((type) => (
                <Grid item xs={12} key={type.id}>
                  <ButtonBase
                    onClick={() => handleChargingTypeSelect(type)}
                    sx={{ width: "100%", borderRadius: 1 }}
                    disabled={type.availableCount === 0}
                  >
                    <Card
                      sx={{
                        width: "100%",
                        cursor:
                          type.availableCount > 0 ? "pointer" : "not-allowed",
                        border: selectedChargingType?.id === type.id ? 2 : 1,
                        borderColor:
                          selectedChargingType?.id === type.id
                            ? "primary.main"
                            : "divider",
                        opacity: type.availableCount > 0 ? 1 : 0.5,
                        "&:hover":
                          type.availableCount > 0 ? { boxShadow: 2 } : {},
                      }}
                    >
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Box
                              sx={{
                                width: 56,
                                height: 56,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor:
                                  type.type === "AC"
                                    ? "success.light"
                                    : type.power >= 150
                                    ? "error.light"
                                    : "warning.light",
                                color: "white",
                              }}
                            >
                              {type.type === "AC" ? (
                                <Schedule fontSize="large" />
                              ) : type.power >= 150 ? (
                                <ElectricCar fontSize="large" />
                              ) : (
                                <FlashOn fontSize="large" />
                              )}
                            </Box>
                            <Box sx={{ textAlign: "left", width: "100%" }}>
                              <Typography variant="h6" fontWeight="bold">
                                {type.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ textAlign: "left" }}
                              >
                                {type.power} kW • {type.type}
                              </Typography>
                              <Chip
                                label={`${type.availableCount} cổng đang sẵn sàng`}
                                size="small"
                                color={
                                  type.availableCount > 0
                                    ? "success"
                                    : "default"
                                }
                                sx={{ mt: 0.5, height: 22 }}
                              />
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: "right" }}>
                            <Typography
                              variant="h6"
                              fontWeight="bold"
                              color="primary.main"
                            >
                              {type.rate?.toLocaleString()} VNĐ/kWh
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Giá sạc
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </ButtonBase>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Chọn cổng sạc
            </Typography>
            {selectedChargingType && (
              <>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Đã chọn: {selectedChargingType.name}
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Giá: {selectedChargingType.rate?.toLocaleString()} VNĐ/kWh •
                    Số cổng trống: {getAvailablePortsForType().length}
                  </Typography>
                </Alert>
                <Grid container spacing={2}>
                  {getPortsForType().map((port, index) => {
                    const isAvailable = port.status === "available";
                    const isOccupied = port.status === "occupied";
                    const isMaintenance = port.status === "maintenance";

                    // Create unique key with fallback
                    const uniqueKey = `${port.poleId || "pole"}-${
                      port.id || index
                    }-${port.poleName || ""}-${index}`;

                    return (
                      <Grid item xs={12} sm={6} key={uniqueKey}>
                        <ButtonBase
                          onClick={() => isAvailable && handlePortSelect(port)}
                          disabled={!isAvailable}
                          sx={{ width: "100%", borderRadius: 1 }}
                        >
                          <Card
                            sx={{
                              width: "100%",
                              cursor: isAvailable ? "pointer" : "not-allowed",
                              border: selectedPort?.id === port.id ? 2 : 1,
                              borderColor:
                                selectedPort?.id === port.id
                                  ? "primary.main"
                                  : "divider",
                              opacity: isAvailable ? 1 : 0.6,
                              bgcolor: !isAvailable
                                ? "action.disabledBackground"
                                : "background.paper",
                              "&:hover": isAvailable ? { boxShadow: 2 } : {},
                            }}
                          >
                            <CardContent>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                }}
                              >
                                <Box sx={{ flex: 1, textAlign: "left" }}>
                                  <Typography variant="h6" fontWeight="bold">
                                    {formatPoleLabel(port.poleName)} — Cổng{" "}
                                    {port.portNumber || port.id}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {port.connectorType} • {port.power}kW •{" "}
                                    {port.type}
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                      mt: 0.5,
                                    }}
                                  >
                                    <Chip
                                      label={
                                        isAvailable
                                          ? "Đang sẵn sàng"
                                          : isOccupied
                                          ? "Đang sử dụng"
                                          : isMaintenance
                                          ? "Bảo trì"
                                          : "Không khả dụng"
                                      }
                                      size="small"
                                      color={
                                        isAvailable
                                          ? "success"
                                          : isOccupied
                                          ? "warning"
                                          : isMaintenance
                                          ? "error"
                                          : "default"
                                      }
                                      sx={{ height: 20, fontSize: "0.7rem" }}
                                    />
                                  </Box>
                                  {isMaintenance && port.lastMaintenance && (
                                    <Typography
                                      variant="caption"
                                      color="error.main"
                                      sx={{ display: "block", mt: 0.5 }}
                                    >
                                      Bảo trì từ:{" "}
                                      {new Date(
                                        port.lastMaintenance
                                      ).toLocaleString("vi-VN", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </Typography>
                                  )}
                                </Box>
                                {isAvailable && (
                                  <CheckCircle
                                    sx={{ color: "success.main", fontSize: 32 }}
                                  />
                                )}
                                {isMaintenance && (
                                  <Box
                                    sx={{
                                      bgcolor: "error.main",
                                      color: "white",
                                      borderRadius: "50%",
                                      p: 1,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      fontWeight="bold"
                                    >
                                      ⚠️
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </CardContent>
                          </Card>
                        </ButtonBase>
                      </Grid>
                    );
                  })}
                </Grid>
                {getPortsForType().length === 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Loại sạc này chưa có cổng nào được cấu hình.
                  </Alert>
                )}
                {getPortsForType().length > 0 &&
                  getAvailablePortsForType().length === 0 && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      Tất cả {getPortsForType().length} cổng của loại này đang
                      bận hoặc bảo trì. Vui lòng chọn loại sạc khác.
                    </Alert>
                  )}
              </>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Chọn thời gian sạc
            </Typography>
            {selectedPort && (
              <>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Đã chọn: {formatPoleLabel(selectedPort?.poleName)} — Cổng{" "}
                  {selectedPort?.portNumber || selectedPort?.id} (
                  {selectedPort.connectorType})
                </Alert>
                <ChargingDateTimePicker
                  station={station}
                  onDateTimeChange={handleDateTimeChange}
                  initialDateTime={selectedDateTime}
                />
              </>
            )}
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Xác nhận thông tin đặt chỗ
            </Typography>

            {bookingResult === "success" && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography>
                  <strong>✅ {resultMessage}</strong>
                </Typography>
              </Alert>
            )}

            {bookingResult === "error" && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography>
                  <strong>❌ {resultMessage}</strong>
                </Typography>
              </Alert>
            )}

            {!bookingResult && (
              <>
                <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                  >
                    📍 Thông tin đặt chỗ
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Trạm sạc:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {station?.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Địa chỉ:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {station?.location?.address}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Loại sạc:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedChargingType?.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Cổng sạc:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatPoleLabel(selectedPort?.poleName)} — Cổng{" "}
                        {selectedPort?.portNumber || selectedPort?.id}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Đầu cắm:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedPort?.connectorType}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Thời gian:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedDateTime?.scheduledDateTime?.toLocaleString(
                          "vi-VN"
                        ) || "Chưa chọn"}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Giá sạc:
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight="medium"
                        color="primary.main"
                      >
                        {selectedChargingType?.rate?.toLocaleString()} VNĐ/kWh
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>

                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    💡 <strong>Lưu ý:</strong> Vui lòng có mặt tại trạm sạc
                    trước 15 phút.
                  </Typography>
                </Alert>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                    />
                  }
                  label="Tôi đồng ý với điều khoản sử dụng và chính sách thanh toán"
                />
              </>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  const isStepComplete = (step) => {
    switch (step) {
      case 0:
        return selectedChargingType !== null;
      case 1:
        return selectedPort !== null;
      case 2:
        return (
          selectedDateTime !== null &&
          selectedDateTime.isValid &&
          selectedDateTime.scheduledDateTime
        );
      case 3:
        return agreeTerms;
      default:
        return false;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, maxHeight: "90vh" } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        <Box component="span" sx={{ fontWeight: "bold", fontSize: "1.5rem" }}>
          Đặt chỗ sạc xe điện
        </Box>
        <Button
          onClick={handleClose}
          sx={{ minWidth: "auto", p: 1 }}
          disabled={loading}
        >
          <Close />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label} completed={isStepComplete(index)}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={handleBack}
          disabled={activeStep === 0 || loading}
          size="large"
        >
          Quay lại
        </Button>
        <Box sx={{ flex: 1 }} />
        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!isStepComplete(activeStep) || loading}
            size="large"
          >
            Tiếp tục
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleConfirmBooking}
            disabled={!isStepComplete(activeStep) || loading}
            size="large"
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? "Đang xử lý..." : "Xác nhận đặt"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BookingModal;
