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
  const [selectedChargingPost, setSelectedChargingPost] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDateTime, setSelectedDateTime] = useState(null);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [resultMessage, setResultMessage] = useState("");

  const steps = [
    "Chọn trụ sạc",
    "Chọn cổng sạc",
    "Chọn thời gian sạc",
    "Xác nhận đặt chỗ",
  ];

  const getChargingPosts = () => {
    if (!station?.charging?.chargingPosts) return [];
    return station.charging.chargingPosts;
  };

  const getAllSlots = () => {
    if (!selectedChargingPost) return [];
    return selectedChargingPost.slots || [];
  };

  const getAvailableSlots = () => {
    if (!selectedChargingPost) return [];
    return selectedChargingPost.slots.filter(
      (slot) => slot.status === "available"
    );
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleChargingPostSelect = (post) => {
    setSelectedChargingPost(post);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleDateTimeChange = (dateTimeData) => {
    setSelectedDateTime(dateTimeData);
  };

  const handleConfirmBooking = async () => {
    if (
      !selectedChargingPost ||
      !selectedSlot ||
      !selectedDateTime ||
      !agreeTerms
    ) {
      return;
    }

    setLoading(true);
    try {
      const baseRate =
        selectedChargingPost.type === "AC"
          ? station.charging.pricing.acRate
          : selectedChargingPost.power >= 150
          ? station.charging.pricing.dcUltraRate ||
            station.charging.pricing.dcRate
          : station.charging.pricing.dcRate;

      const bookingData = {
        stationId: station.id,
        stationName: station.name,
        chargingPost: {
          id: selectedChargingPost.id,
          name: selectedChargingPost.name,
          type: selectedChargingPost.type,
          power: selectedChargingPost.power,
          voltage: selectedChargingPost.voltage,
        },
        slot: {
          id: selectedSlot.id,
          connectorType: selectedSlot.connectorType,
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
      };

      const booking = createBooking(bookingData);
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
    } catch (error) {
      setBookingResult("error");
      setResultMessage("Có lỗi xảy ra khi đặt chỗ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setSelectedChargingPost(null);
    setSelectedSlot(null);
    setSelectedDateTime(null);
    setAgreeTerms(false);
    setLoading(false);
    setBookingResult(null);
    setResultMessage("");
    onClose();
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Chọn trụ sạc phù hợp
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Trạm {station?.name} có {getChargingPosts().length} trụ sạc với
              các công suất khác nhau
            </Typography>

            <Grid container spacing={2}>
              {getChargingPosts().map((post) => (
                <Grid item xs={12} key={post.id}>
                  <ButtonBase
                    onClick={() => handleChargingPostSelect(post)}
                    sx={{ width: "100%", borderRadius: 1 }}
                  >
                    <Card
                      sx={{
                        width: "100%",
                        cursor: "pointer",
                        border: selectedChargingPost?.id === post.id ? 2 : 1,
                        borderColor:
                          selectedChargingPost?.id === post.id
                            ? "primary.main"
                            : "divider",
                        "&:hover": { boxShadow: 2 },
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
                                width: 48,
                                height: 48,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor:
                                  post.type === "AC"
                                    ? "success.light"
                                    : post.power >= 150
                                    ? "error.light"
                                    : "warning.light",
                                color: "white",
                              }}
                            >
                              {post.type === "AC" ? (
                                <Schedule />
                              ) : post.power >= 150 ? (
                                <ElectricCar />
                              ) : (
                                <FlashOn />
                              )}
                            </Box>
                            <Box>
                              <Typography variant="h6" fontWeight="bold">
                                {post.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {post.power} kW • {post.type} • {post.voltage}V
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Số cổng trống: {post.availableSlots}/
                                {post.totalSlots}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: "right" }}>
                            <Typography variant="body2">
                              {post.type === "AC"
                                ? `${station?.charging?.pricing?.acRate?.toLocaleString()} VNĐ/kWh`
                                : `${(
                                    station?.charging?.pricing?.dcRate ||
                                    station?.charging?.pricing?.dcUltraRate
                                  )?.toLocaleString()} VNĐ/kWh`}
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
            {selectedChargingPost && (
              <>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Đã chọn: {selectedChargingPost.name} -{" "}
                  {selectedChargingPost.power}kW
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Số cổng trống: {selectedChargingPost.availableSlots}/
                    {selectedChargingPost.totalSlots}
                  </Typography>
                </Alert>
                <Grid container spacing={2}>
                  {getAllSlots().map((slot) => {
                    const isAvailable = slot.status === "available";
                    const isOccupied = slot.status === "occupied";
                    const isMaintenance = slot.status === "maintenance";

                    return (
                      <Grid item xs={12} sm={6} key={slot.id}>
                        <ButtonBase
                          onClick={() => isAvailable && handleSlotSelect(slot)}
                          disabled={!isAvailable}
                          sx={{ width: "100%", borderRadius: 1 }}
                        >
                          <Card
                            sx={{
                              width: "100%",
                              cursor: isAvailable ? "pointer" : "not-allowed",
                              border: selectedSlot?.id === slot.id ? 2 : 1,
                              borderColor:
                                selectedSlot?.id === slot.id
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
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="h6" fontWeight="bold">
                                    Cổng {slot.id}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Loại đầu cắm: {slot.connectorType}
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
                                          ? "Sẵn sàng"
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
                                  {isMaintenance && slot.lastMaintenance && (
                                    <Typography
                                      variant="caption"
                                      color="error.main"
                                      sx={{ display: "block", mt: 0.5 }}
                                    >
                                      Bảo trì từ:{" "}
                                      {new Date(
                                        slot.lastMaintenance
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
                {getAllSlots().length === 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Trụ sạc này chưa có cổng nào được cấu hình.
                  </Alert>
                )}
                {getAllSlots().length > 0 &&
                  getAvailableSlots().length === 0 && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      Tất cả {getAllSlots().length} cổng của trụ này đang bận
                      hoặc bảo trì. Vui lòng chọn trụ sạc khác.
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
            {selectedSlot && (
              <>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Đã chọn: Cổng {selectedSlot.id} ({selectedSlot.connectorType})
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
                        Trụ sạc:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedChargingPost?.name} (
                        {selectedChargingPost?.power}kW)
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Cổng sạc:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedSlot?.id} - {selectedSlot?.connectorType}
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
                        Giá dự kiến:
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight="medium"
                        color="primary.main"
                      >
                        {selectedChargingPost?.type === "AC"
                          ? `${station?.charging?.pricing?.acRate?.toLocaleString()} VNĐ/kWh`
                          : `${(
                              station?.charging?.pricing?.dcRate ||
                              station?.charging?.pricing?.dcUltraRate
                            )?.toLocaleString()} VNĐ/kWh`}
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
                {/* Checkbox đồng ý điều khoản */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <span>
                      Tôi đồng ý với{" "}
                      <a
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        điều khoản sử dụng
                      </a>{" "}
                      và{" "}
                      <a
                        href="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        chính sách dịch vụ
                      </a>
                    </span>
                  }
                  sx={{ mt: 2, mb: 1 }}
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
        return selectedChargingPost !== null;
      case 1:
        return selectedSlot !== null;
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
        <Typography variant="h5" fontWeight="bold">
          Đặt chỗ sạc xe điện
        </Typography>
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
