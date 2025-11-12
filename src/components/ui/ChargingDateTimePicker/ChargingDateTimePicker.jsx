/* eslint-disable */
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
} from "@mui/material";
import {
  DatePicker,
  TimePicker,
  LocalizationProvider,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { vi } from "date-fns/locale";
import {
  AccessTime,
  CalendarToday,
  Schedule,
  Warning,
  CheckCircle,
} from "@mui/icons-material";
import {
  addDays,
  format,
  isAfter,
  isBefore,
  setHours,
  setMinutes,
  startOfDay,
} from "date-fns";

const ChargingDateTimePicker = ({
  onDateTimeChange,
  station = null,
  initialDateTime = null,
  disabled = false,
}) => {
  // CHANGE: Auto-set date to today only, cannot be changed
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedTime, setSelectedTime] = useState(
    initialDateTime?.time || null
  );
  const [schedulingType, setSchedulingType] = useState("immediate"); // Changed to immediate for same-day booking
  const [errors, setErrors] = useState({});
  const [availableSlots, setAvailableSlots] = useState([]);

  // Common time slots
  const commonTimeSlots = [
    "07:00",
    "07:30",
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
    "20:30",
    "21:00",
    "21:30",
  ];

  useEffect(() => {
    validateDateTime();
    updateAvailableSlots();
  }, [selectedDate, selectedTime, schedulingType]);

  useEffect(() => {
    // Notify parent component when date/time changes
    if (onDateTimeChange) {
      onDateTimeChange({
        schedulingType,
        scheduledDate: selectedDate,
        scheduledTime: selectedTime,
        scheduledDateTime:
          selectedDate && selectedTime
            ? new Date(
                selectedDate.getFullYear(),
                selectedDate.getMonth(),
                selectedDate.getDate(),
                selectedTime.getHours(),
                selectedTime.getMinutes()
              )
            : null,
        isValid: Object.keys(errors).length === 0,
      });
    }
  }, [selectedDate, selectedTime, schedulingType, errors]);

  const validateDateTime = () => {
    const newErrors = {};
    const now = new Date();
    const today = startOfDay(now);

    // CHANGE: Validate that selected date is today only
    if (!selectedDate) {
      newErrors.date = "Ngày đặt chỗ: Hôm nay";
    } else {
      const selectedDay = startOfDay(selectedDate);

      // Only allow today's date
      if (selectedDay.getTime() !== today.getTime()) {
        newErrors.date = "Chỉ có thể đặt chỗ cho hôm nay";
        // Auto-correct to today
        setSelectedDate(today);
      }
    }

    // Validate time
    if (!selectedTime) {
      newErrors.time = "Vui lòng chọn giờ sạc";
    } else {
      const selectedDateTime = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        selectedTime.getHours(),
        selectedTime.getMinutes()
      );

      // Check if selected time is in the past (for today)
      const thirtyMinLater = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now minimum
      if (isBefore(selectedDateTime, thirtyMinLater)) {
        newErrors.time = "Vui lòng chọn thời gian ít nhất 30 phút sau hiện tại";
      }

      // Check station operating hours
      if (station?.operatingHours && station.operatingHours !== "24/7") {
        const openTime = station.operatingHours.open;
        const closeTime = station.operatingHours.close;
        const selectedHour = format(selectedTime, "HH:mm");

        if (selectedHour < openTime || selectedHour > closeTime) {
          newErrors.time = `Trạm sạc chỉ hoạt động từ ${openTime} - ${closeTime}`;
        }
      }
    }

    setErrors(newErrors);
  };

  const updateAvailableSlots = () => {
    if (!selectedDate) {
      setAvailableSlots([]);
      return;
    }

    // Mock available slots (in real app, this would come from API)
    const mockOccupiedSlots = ["09:00", "14:00", "18:30"]; // Some slots are taken
    const available = commonTimeSlots.filter(
      (slot) => !mockOccupiedSlots.includes(slot)
    );
    setAvailableSlots(available);
  };

  const handleSchedulingTypeChange = (type) => {
    // Removed immediate option, always scheduled
    setSchedulingType("scheduled");
  };

  const handleQuickDateSelect = (days) => {
    const newDate = addDays(new Date(), days);
    setSelectedDate(newDate);
  };

  const handleQuickTimeSelect = (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const timeDate = setMinutes(setHours(new Date(), hours), minutes);
    setSelectedTime(timeDate);
  };

  const getDateHelperText = () => {
    if (errors.date) return errors.date;
    if (selectedDate) {
      const today = startOfDay(new Date());
      const selected = startOfDay(selectedDate);
      if (selected.getTime() === today.getTime()) return "Hôm nay";
      if (selected.getTime() === addDays(today, 1).getTime()) return "Ngày mai";
      return format(selectedDate, "EEEE, dd/MM/yyyy", { locale: vi });
    }
    return "Chọn ngày bạn muốn sạc";
  };

  const getTimeHelperText = () => {
    if (errors.time) return errors.time;
    if (selectedTime) {
      return `Thời gian đã chọn: ${format(selectedTime, "HH:mm")}`;
    }
    return "Chọn giờ bắt đầu sạc";
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
      <Card elevation={0} sx={{ border: "1px solid #e0e0e0" }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Schedule color="primary" />
            Lên lịch sạc
          </Typography>

          {/* Today-Only Booking - Date locked to today */}
          <Box>
            {/* Date locked notification */}
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Đặt chỗ hôm nay:</strong>{" "}
                {format(today, "dd/MM/yyyy (EEEE)", { locale: vi })}
              </Typography>
              <Typography variant="caption">
                Hệ thống chỉ cho phép đặt chỗ trong ngày hiện tại
              </Typography>
            </Alert>

            {/* Time Picker Only */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12}>
                <TimePicker
                  label="Chọn giờ sạc hôm nay"
                  value={selectedTime}
                  onChange={(newTime) => setSelectedTime(newTime)}
                  disabled={disabled}
                  ampm={false}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.time,
                      helperText: getTimeHelperText(),
                      InputProps: {
                        startAdornment: (
                          <AccessTime sx={{ mr: 1, color: "action.active" }} />
                        ),
                      },
                    },
                  }}
                />
              </Grid>
            </Grid>

            {/* Quick Time Selection */}
            {selectedDate && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Khung giờ phổ biến:
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                  {["07:00", "09:00", "12:00", "15:00", "18:00", "20:00"].map(
                    (time) => (
                      <Chip
                        key={time}
                        label={time}
                        onClick={() => handleQuickTimeSelect(time)}
                        variant={
                          selectedTime && format(selectedTime, "HH:mm") === time
                            ? "filled"
                            : "outlined"
                        }
                        color={
                          availableSlots.includes(time) ? "primary" : "default"
                        }
                        disabled={disabled || !availableSlots.includes(time)}
                      />
                    )
                  )}
                </Box>
              </Box>
            )}

            {/* Station Operating Hours Info */}
            {station?.operatingHours && (
              <Alert severity="info" sx={{ mb: 2 }} icon={<AccessTime />}>
                <Typography variant="body2">
                  <strong>Giờ hoạt động của trạm:</strong>{" "}
                  {station.operatingHours === "24/7"
                    ? "24/7"
                    : `${station.operatingHours.open} - ${station.operatingHours.close}`}
                </Typography>
              </Alert>
            )}

            {/* Validation Messages */}
            {Object.keys(errors).length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }} icon={<Warning />}>
                <Typography variant="body2">
                  Vui lòng kiểm tra lại thông tin đã chọn
                </Typography>
              </Alert>
            )}
          </Box>

          {/* Summary */}
          {selectedDate && selectedTime && Object.keys(errors).length === 0 && (
            <Paper
              elevation={1}
              sx={{ p: 2, bgcolor: "#f8f9fa", border: "1px solid #e3f2fd" }}
            >
              <Typography variant="subtitle2" color="primary" gutterBottom>
                📅 Tóm tắt lịch sạc
              </Typography>
              <Typography variant="body2">
                <strong>Ngày:</strong>{" "}
                {format(selectedDate, "EEEE, dd/MM/yyyy", { locale: vi })}
              </Typography>
              <Typography variant="body2">
                <strong>Giờ:</strong> {format(selectedTime, "HH:mm")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vui lòng có mặt tại trạm sạc trước 15 phút
              </Typography>
            </Paper>
          )}
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
};

export default ChargingDateTimePicker;
