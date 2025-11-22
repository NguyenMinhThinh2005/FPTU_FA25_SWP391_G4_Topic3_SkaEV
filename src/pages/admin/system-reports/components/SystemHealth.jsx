import React from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip
} from "@mui/material";

const SystemHealth = ({ loading, systemHealth }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "excellent":
        return "success";
      case "good":
        return "info";
      case "warning":
        return "warning";
      case "critical":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Alert severity="info" sx={{ mb: 3 }}>
          Các chỉ số tình trạng hệ thống được cập nhật theo thời gian thực từ database.
          Tất cả các giá trị hiển thị là dữ liệu thật từ lần kiểm tra hệ thống gần nhất.
        </Alert>
      </Grid>

      {loading ? (
        <Grid item xs={12}>
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        </Grid>
      ) : systemHealth.length === 0 ? (
        <Grid item xs={12}>
          <Alert severity="warning">Không thể tải dữ liệu sức khỏe hệ thống</Alert>
        </Grid>
      ) : (
        systemHealth.map((metric, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" fontWeight="bold">
                    {metric.metric}
                  </Typography>
                  <Chip
                    label={metric.status}
                    color={getStatusColor(metric.status)}
                    size="small"
                  />
                </Box>
                <Typography
                  variant="h3"
                  fontWeight="bold"
                  color="primary.main"
                  gutterBottom
                >
                  {metric.value}
                  {metric.unit || ""}
                </Typography>
                {metric.status === "excellent" && (
                  <Typography variant="body2" color="success.main">
                    ✓ Hoạt động trong tham số tối ưu
                  </Typography>
                )}
                {metric.status === "good" && (
                  <Typography variant="body2" color="info.main">
                    → Hiệu suất ổn định
                  </Typography>
                )}
                {metric.status === "warning" && (
                  <Typography variant="body2" color="warning.main">
                    ⚠ Cần chú ý
                  </Typography>
                )}
                {metric.status === "critical" && (
                  <Typography variant="body2" color="error.main">
                    ✕ Cần can thiệp ngay
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))
      )}
    </Grid>
  );
};

export default SystemHealth;
