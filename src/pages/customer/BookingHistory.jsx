/* eslint-disable */
import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  History,
  ElectricCar,
  AccessTime,
  LocationOn,
  Receipt,
  Visibility,
  Download,
} from "@mui/icons-material";
import { formatCurrency, formatDate } from "../../utils/helpers";
import { useMasterDataSync } from "../../hooks/useMasterDataSync";
import { getText } from "../../utils/vietnameseTexts";

const BookingHistory = () => {
  const { bookingHistory, isDataReady } = useMasterDataSync();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Use bookings from store
  const userBookings = bookingHistory;

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "success";
      case "active":
        return "primary";
      case "cancelled":
        return "error";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "completed":
        return getText("booking.completed");
      case "active":
        return "Äang hoáº¡t Ä‘á»™ng";
      case "cancelled":
        return getText("booking.cancelled");
      case "pending":
        return getText("booking.pending");
      default:
        return status;
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setDetailDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedBooking(null);
    setDetailDialogOpen(false);
  };

  const calculateDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMinutes = Math.floor((end - start) / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
        <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
          <History />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {getText("history.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {getText("history.subtitle")}
          </Typography>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {userBookings.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tổng số lượt
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {userBookings.filter((b) => b.status === "completed").length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hoàn thành
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" fontWeight="bold" color="info.main">
                {formatCurrency(
                  userBookings.reduce((sum, b) => sum + b.cost, 0)
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tổng chi phí
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {userBookings
                  .reduce((sum, b) => sum + (b.energyDelivered || 0), 0)
                  .toFixed(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getText("units.kwh")} đã sạc
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bookings Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Lịch sử sạc gần đây
          </Typography>

          {userBookings.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <ElectricCar sx={{ fontSize: 60, color: "grey.400", mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {getText("history.noBookings")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getText("history.noBookingsDescription")}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Trạm sạc</TableCell>
                    <TableCell>Ngày & Giờ</TableCell>
                    <TableCell>Thời lượng</TableCell>
                    <TableCell>Năng lượng</TableCell>
                    <TableCell>Chi phí</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell align="center">Thao tÃ¡c</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userBookings.map((booking) => (
                    <TableRow key={booking.id} hover>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: "primary.main",
                              width: 32,
                              height: 32,
                            }}
                          >
                            <ElectricCar sx={{ fontSize: 18 }} />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="medium">
                              {stations.find(
                                (s) => s.id === booking.stationId
                              )?.name || "Trạm không xác định"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Cá»•ng {booking.portNumber || "KhÃ´ng cÃ³"}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(booking.actualStartTime || booking.scheduledTime)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(booking.actualStartTime || booking.scheduledTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {booking.endTime
                            ? calculateDuration(
                              booking.startTime,
                              booking.endTime
                            )
                            : "Äang tiáº¿n hÃ nh"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {booking.energyDelivered
                            ? `${booking.energyDelivered} ${getText("units.kwh")}`
                            : "KhÃ´ng cÃ³"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(booking.cost?.total || booking.estimatedCost || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusText(booking.status)}
                          color={getStatusColor(booking.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={getText("history.viewDetails")}>
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(booking)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Táº£i xuá»‘ng hÃ³a Ä‘Æ¡n">
                          <IconButton size="small">
                            <Download />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Booking Details Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{getText("booking.bookingDetails")}</DialogTitle>
        <DialogContent dividers>
          {selectedBooking && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Thông tin phiên sạc
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {getText("booking.bookingId")}
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    #{selectedBooking.id}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {getText("booking.station")}
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {
                      stations.find(
                        (s) => s.id === selectedBooking.stationId
                      )?.name
                    }
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Số cổng
                  </Typography>
                    <Typography variant="body1" fontWeight="medium">
                    {selectedBooking.portNumber || "Không có"}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {getText("booking.status")}
                  </Typography>
                  <Chip
                    label={getStatusText(selectedBooking.status)}
                    color={getStatusColor(selectedBooking.status)}
                    size="small"
                  />
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Chi tiết sạc
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Thời gian bắt đầu
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDate(selectedBooking.actualStartTime || selectedBooking.scheduledTime)} lúc{" "}
                    {new Date(selectedBooking.actualStartTime || selectedBooking.scheduledTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
                {(selectedBooking.endTime || selectedBooking.estimatedEndTime) && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Thá»i gian káº¿t thÃºc {selectedBooking.estimatedEndTime && !selectedBooking.endTime ? '(Æ°á»›c tÃ­nh)' : ''}
                    </Typography>
                      <Typography variant="body1" fontWeight="medium">
                      {formatDate(selectedBooking.endTime || selectedBooking.estimatedEndTime)} lúc{" "}
                      {new Date(selectedBooking.endTime || selectedBooking.estimatedEndTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {getText("booking.duration")}
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedBooking.endTime
                      ? calculateDuration(
                        selectedBooking.startTime,
                        selectedBooking.endTime
                      )
                      : "Đang tiến hành"}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Năng lượng đã sạc
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedBooking.energyDelivered
                      ? `${selectedBooking.energyDelivered} ${getText("units.kwh")}`
                      : "N/A"}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {getText("booking.totalCost")}
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    color="primary.main"
                  >
                    {formatCurrency(selectedBooking.cost)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{getText("common.close")}</Button>
            <Button variant="contained" startIcon={<Download />}>
            Tải hóa đơn
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookingHistory;

