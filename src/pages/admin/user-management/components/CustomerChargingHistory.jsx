import React from 'react';
import { 
  Box, Typography, Alert, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Chip 
} from '@mui/material';
import { CheckCircle, Cancel, BatteryChargingFull, Schedule } from '@mui/icons-material';

const CustomerChargingHistory = ({ chargingHistory }) => {
  const getStatusChip = (status) => {
    const statusMap = {
      completed: { label: "Hoàn thành", color: "success", icon: <CheckCircle /> },
      cancelled: { label: "Đã hủy", color: "error", icon: <Cancel /> },
      in_progress: { label: "Đang sạc", color: "info", icon: <BatteryChargingFull /> },
      scheduled: { label: "Đã đặt", color: "warning", icon: <Schedule /> },
    };
    
    const config = statusMap[status] || { label: status, color: "default" };
    return <Chip label={config.label} color={config.color} size="small" icon={config.icon} />;
  };

  const formatCurrency = (amount) => {
    const value = Number.isFinite(amount) ? amount : 0;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          Lịch sử sạc điện ({chargingHistory.length})
        </Typography>
      </Box>

      {chargingHistory.length === 0 ? (
        <Alert severity="info">Chưa có lịch sử sạc điện</Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mã booking</TableCell>
                <TableCell>Trạm sạc</TableCell>
                <TableCell>Vị trí</TableCell>
                <TableCell align="center">Trạng thái</TableCell>
                <TableCell align="right">Năng lượng (kWh)</TableCell>
                <TableCell align="right">Thành tiền</TableCell>
                <TableCell align="right">Thời gian</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {chargingHistory.map((session) => (
                <TableRow key={session.bookingId} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {session.bookingCode}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{session.stationName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {session.postNumber} / {session.slotNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {session.stationAddress}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">{getStatusChip(session.status)}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium" color="success.main">
                      {session.energyConsumedKwh?.toFixed(2) || "0.00"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(session.totalAmountVnd || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(session.startTime)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default CustomerChargingHistory;
