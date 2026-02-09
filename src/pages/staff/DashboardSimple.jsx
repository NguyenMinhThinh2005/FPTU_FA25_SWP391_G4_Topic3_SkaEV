import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Grid,
} from "@mui/material";
import { Refresh } from "@mui/icons-material";
import staffAPI from "../../services/api/staffAPI";
import useAuthStore from "../../store/authStore";

const DashboardSimple = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const { user } = useAuthStore();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("🔄 Loading dashboard...");
      console.log("👤 Current user:", user);
      console.log("🔑 Token:", sessionStorage.getItem('token'));
      
      const response = await staffAPI.getDashboardOverview();
      console.log("✅ Dashboard data:", response);
      
      setDashboardData(response);
    } catch (err) {
      console.error("❌ Dashboard error:", err);
      console.error("Error response:", err.response);
      setError(err.response?.data?.message || err.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography ml={2}>Đang tải dữ liệu...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          🏢 Quản lý Trạm sạc - Staff Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadDashboard}
        >
          Làm mới
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <strong>Lỗi:</strong> {error}
          <br />
          <Typography variant="caption">
            Kiểm tra: Backend API đang chạy? Token còn hợp lệ?
          </Typography>
        </Alert>
      )}

      {dashboardData ? (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📊 Dữ liệu Dashboard
                </Typography>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '16px', 
                  borderRadius: '4px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(dashboardData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </Grid>

          {dashboardData.station && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🔌 Thông tin Trạm sạc
                  </Typography>
                  <Typography><strong>Tên:</strong> {dashboardData.station.stationName}</Typography>
                  <Typography><strong>Địa chỉ:</strong> {dashboardData.station.address}</Typography>
                  <Typography><strong>Thành phố:</strong> {dashboardData.station.city}</Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {dashboardData.staff && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    👤 Thông tin Nhân viên
                  </Typography>
                  <Typography><strong>Họ tên:</strong> {dashboardData.staff.fullName}</Typography>
                  <Typography><strong>Email:</strong> {dashboardData.staff.email}</Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      ) : (
        <Alert severity="info">
          Không có dữ liệu. Hãy thử tải lại.
        </Alert>
      )}
    </Container>
  );
};

export default DashboardSimple;
