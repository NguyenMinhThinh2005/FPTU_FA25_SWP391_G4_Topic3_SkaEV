 
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  Paper,
  Chip,
} from '@mui/material';
import { CalendarToday, Schedule, CheckCircle } from '@mui/icons-material';
import ChargingDateTimePicker from '../components/ui/ChargingDateTimePicker/ChargingDateTimePicker';
import BookingModal from '../components/customer/BookingModal';
import useStationStore from '../store/stationStore';
import useBookingStore from '../store/bookingStore';

const DateTimePickerDemo = () => {
  const [showDateTimePicker, setShowDateTimePicker] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [dateTimeData, setDateTimeData] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);

  const { stations } = useStationStore();
  const { getScheduledBookings, getUpcomingBookings } = useBookingStore();

  const scheduledBookings = getScheduledBookings();
  const upcomingBookings = getUpcomingBookings();

  const handleDateTimeChange = (data) => {
    console.log('DateTime changed:', data);
    setDateTimeData(data);
  };

  const handleStationSelect = (station) => {
    setSelectedStation(station);
    setShowBookingModal(true);
  };

  const handleBookingComplete = (booking) => {
    console.log('Booking completed:', booking);
    setShowBookingModal(false);
    setSelectedStation(null);
  };

  const formatScheduledTime = (booking) => {
    if (booking.schedulingType === 'immediate') {
      return 'Sạc ngay';
    }

    if (booking.scheduledDateTime) {
      return new Date(booking.scheduledDateTime).toLocaleString('vi-VN');
    }

    return 'Chưa xác định';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Demo Chọn Ngày Giờ Sạc
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Tính năng cho phép customer chọn ngày và giờ sạc cụ thể hoặc sạc ngay
      </Typography>

      <Grid container spacing={3}>
        {/* DateTime Picker Demo */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarToday color="primary" />
                Chọn Ngày Giờ Độc Lập
              </Typography>

              {showDateTimePicker && (
                <ChargingDateTimePicker
                  station={stations[0]}
                  onDateTimeChange={handleDateTimeChange}
                />
              )}

              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={() => setShowDateTimePicker(!showDateTimePicker)}
                >
                  {showDateTimePicker ? 'Ẩn' : 'Hiện'} DateTime Picker
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Current Selection */}
          {dateTimeData && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  📊 Dữ liệu hiện tại
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2">
                    <strong>Loại:</strong> {dateTimeData.schedulingType === 'immediate' ? 'Sạc ngay' : 'Đặt lịch'}
                  </Typography>
                  {dateTimeData.schedulingType === 'scheduled' && (
                    <>
                      <Typography variant="body2">
                        <strong>Ngày:</strong> {dateTimeData.scheduledDate?.toLocaleDateString('vi-VN') || 'Chưa chọn'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Giờ:</strong> {dateTimeData.scheduledTime?.toLocaleTimeString('vi-VN') || 'Chưa chọn'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Ngày giờ đầy đủ:</strong> {dateTimeData.scheduledDateTime?.toLocaleString('vi-VN') || 'Chưa đầy đủ'}
                      </Typography>
                    </>
                  )}
                  <Typography variant="body2">
                    <strong>Hợp lệ:</strong> {dateTimeData.isValid ? '✅ Có' : '❌ Không'}
                  </Typography>
                </Paper>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Booking Integration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule color="primary" />
                Test Booking với DateTime
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Chọn trạm để mở BookingModal có tích hợp DateTime picker:
              </Typography>

              {stations.slice(0, 3).map((station) => (
                <Paper key={station.id} sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {station.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {station.location.address}
                      </Typography>
                      <br />
                      <Chip
                        label={`${station.charging.availablePorts}/${station.charging.totalPorts} ports`}
                        size="small"
                        color={station.charging.availablePorts > 0 ? "success" : "default"}
                      />
                    </Box>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleStationSelect(station)}
                    >
                      Đặt sạc
                    </Button>
                  </Box>
                </Paper>
              ))}
            </CardContent>
          </Card>

          {/* Bookings List */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📅 Lịch sạc đã đặt
              </Typography>

              {upcomingBookings.length > 0 ? (
                upcomingBookings.map((booking) => (
                  <Paper key={booking.id} sx={{ p: 2, mb: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                    <Box sx={{ display: 'flex', justify: 'space-between', alignItems: 'start' }}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {booking.stationName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Mã: {booking.id}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Lịch sạc:</strong> {formatScheduledTime(booking)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Loại:</strong> {booking.chargerType?.name} • {booking.connector?.name}
                        </Typography>
                      </Box>
                      <Chip
                        label={booking.status === 'scheduled' ? 'Đã lên lịch' : 'Đã xác nhận'}
                        color={booking.status === 'scheduled' ? 'warning' : 'success'}
                        size="small"
                      />
                    </Box>
                  </Paper>
                ))
              ) : (
                <Alert severity="info">
                  Chưa có lịch sạc nào được đặt. Hãy thử đặt lịch từ các trạm bên trên!
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Booking Modal */}
      {showBookingModal && selectedStation && (
        <BookingModal
          open={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedStation(null);
          }}
          station={selectedStation}
          onBookingComplete={handleBookingComplete}
        />
      )}
    </Box>
  );
};

export default DateTimePickerDemo;