import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider,
  Stack,
} from "@mui/material";
import { LocationOn } from "@mui/icons-material";
import PropTypes from 'prop-types';
import { formatCurrency } from "../../../../utils/helpers";

const StationDetailsPanel = ({ selectedStationForDetail }) => {
  const getStatusChip = (status) => {
    const statusLower = (status || '').toLowerCase();
    const configs = {
      active: { label: "Đang hoạt động", color: "success" },
      inactive: { label: "Không hoạt động", color: "error" },
      maintenance: { label: "Bảo trì", color: "warning" },
    };

    const config = configs[statusLower] || configs.inactive;
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  if (!selectedStationForDetail) {
    return (
      <Card elevation={2}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <LocationOn sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Chọn một trạm
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Nhấp vào trạm bất kỳ để xem thông tin chi tiết
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Chi tiết trạm
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          {selectedStationForDetail.name}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Avatar
            sx={{
              width: "100%",
              height: 150,
              borderRadius: 2,
              bgcolor: "primary.main",
            }}
          >
            <LocationOn sx={{ fontSize: 40 }} />
          </Avatar>
        </Box>

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
          {selectedStationForDetail.location.address}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ mb: 1.5 }}>
          Thông tin trạm
        </Typography>
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">Trạng thái:</Typography>
            {getStatusChip(selectedStationForDetail.status)}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Số trụ:</Typography>
            <Typography variant="body2" fontWeight="bold">{selectedStationForDetail.charging?.totalPoles ?? selectedStationForDetail.totalPosts ?? selectedStationForDetail.chargingPostsCount ?? 0}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Tổng cổng:</Typography>
            <Typography variant="body2" fontWeight="bold">{selectedStationForDetail.charging?.totalPorts ?? selectedStationForDetail.totalSlots ?? 0}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Cổng khả dụng:</Typography>
            {(selectedStationForDetail.status || '').toLowerCase() === 'active' ? (
              <Typography variant="body2" fontWeight="bold" color="success.main">
                {selectedStationForDetail.availableSlots}
              </Typography>
            ) : (
              <Typography variant="body2" fontWeight="bold" color="error.main">
                0 (Trạm không hoạt động)
              </Typography>
            )}
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ mb: 1.5 }}>
          Hiệu suất
        </Typography>
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Phiên sạc:</Typography>
            <Typography variant="body2" fontWeight="bold">{selectedStationForDetail.bookingsCount}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Tỷ lệ sử dụng:</Typography>
            <Typography variant="body2" fontWeight="bold" color="primary.main">
              {selectedStationForDetail.utilization.toFixed(1)}%
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Doanh thu:</Typography>
            <Typography variant="body2" fontWeight="bold" color="success.main">
              {formatCurrency(selectedStationForDetail.revenue)}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

StationDetailsPanel.propTypes = {
  selectedStationForDetail: PropTypes.object,
};

export default StationDetailsPanel;
