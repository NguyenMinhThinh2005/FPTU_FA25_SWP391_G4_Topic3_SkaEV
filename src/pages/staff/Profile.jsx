import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Avatar,
  Divider,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Person,
  Work,
  Badge,
  Phone,
  Email,
  LocationOn,
  CalendarToday,
  Info,
} from "@mui/icons-material";
import staffAPI from "../../services/api/staffAPI";
import useAuthStore from "../../store/authStore";
import { authAPI } from "../../services/api.js";

const StaffProfile = () => {
  const [loading, setLoading] = useState(true);
  
  // Get user from authStore
  const { user: authUser } = useAuthStore();
  
  // State for profile data
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    employeeId: "",
    department: "",
    position: "",
    joinDate: "",
    location: "",
    avatar: "",
  });
  
  // State for work statistics
  const [workStats, setWorkStats] = useState({
    totalStationsManaged: 0,
    maintenanceCompleted: 0,
    activeSessionsNow: 0,
    totalConnectors: 0,
  });

  const loadStaffProfile = useCallback(async () => {
    setLoading(true);
    try {
      console.log("📋 Loading profile - Auth User from store:", authUser);

      // Get user profile from backend API to get phone number and other details
      let userProfileData = null;
      try {
        const profileResponse = await authAPI.getProfile();
        console.log("🔍 Full Profile API Response:", profileResponse);
        
        // Backend returns data directly (not wrapped in .data)
        userProfileData = profileResponse.data || profileResponse;
        console.log("👤 User Profile Data from API:", userProfileData);
        console.log("📞 PhoneNumber field from API:", userProfileData?.PhoneNumber || userProfileData?.phoneNumber);
      } catch (error) {
        console.error("⚠️ Could not load user profile:", error);
        console.error("⚠️ Error response:", error.response?.data);
      }

      // Get dashboard data for work stats
      const dashboardData = await staffAPI.getDashboardOverview();
      console.log("📊 Dashboard Data:", dashboardData);

      // Set profile data from API response (preferred) or authStore user (fallback)
      if (authUser) {
        console.log("✓ Parsing name from:", authUser.full_name);
        
        // Parse full name into first and last name
        const fullName = (userProfileData?.fullName || authUser.full_name || "").trim();
        const nameParts = fullName.split(" ");
        const lastName = nameParts.pop() || ""; // Last word is the last name (Tên)
        const firstName = nameParts.join(" ") || ""; // Rest is first name + middle name (Họ và tên đệm)

        console.log("✓ Parsed - firstName:", firstName, "lastName:", lastName);
        
        // Backend returns PhoneNumber (capital P) not phoneNumber
        const phoneFromAPI = userProfileData?.PhoneNumber || userProfileData?.phoneNumber;
        console.log("📞 Phone from profile API:", phoneFromAPI);
        console.log("📞 Phone from authUser:", authUser.phone_number);

        setProfileData({
          firstName: firstName,
          lastName: lastName,
          email: userProfileData?.Email || userProfileData?.email || authUser.email || "",
          phone: phoneFromAPI || authUser.phone_number || "",
          employeeId: (userProfileData?.UserId || userProfileData?.userId || authUser.user_id) ? `ST${String(userProfileData?.UserId || userProfileData?.userId || authUser.user_id).padStart(3, '0')}` : "",
          department: userProfileData?.department || "Vận hành",
          position: userProfileData?.position || "Kỹ thuật viên trạm sạc",
          joinDate: (() => {
            // Get the raw date value
            const rawDate = userProfileData?.CreatedAt || userProfileData?.createdAt || authUser.created_at || "2025-01-15";
            // Format to DD-MM-YYYY
            const dateObj = new Date(rawDate);
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const year = dateObj.getFullYear();
            return `${day}-${month}-${year}`;
          })(),
          location: userProfileData?.location || dashboardData?.station?.city || "Hồ Chí Minh",
          avatar: userProfileData?.AvatarUrl || userProfileData?.avatarUrl || authUser.avatar || authUser.profile_image || "",
        });
      }

      // Calculate work stats from dashboard
      if (dashboardData) {
        const stats = dashboardData.dailyStats || {};
        
        // Total stations managed (the assigned station)
        const totalStations = dashboardData.station ? 1 : 0;
        
        // Completed sessions today
        const completedToday = stats.completedSessions || 0;
        
        // Active sessions right now
        const activeNow = stats.activeSessions || 0;
        
        setWorkStats({
          totalStationsManaged: totalStations,
          maintenanceCompleted: completedToday,
          activeSessionsNow: activeNow,
          totalConnectors: dashboardData.connectors?.length || 0,
        });
      }

    } catch (error) {
      console.error("❌ Error loading staff profile:", error);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  // Load staff profile data on mount
  useEffect(() => {
    loadStaffProfile();
  }, [loadStaffProfile]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Hồ sơ nhân viên
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quản lý thông tin cá nhân và cài đặt công việc
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Info Alert - Staff can only view */}
          <Alert severity="info" icon={<Info />} sx={{ mb: 3 }}>
            Thông tin cá nhân và công việc chỉ có thể được chỉnh sửa bởi quản trị viên. Nếu bạn cần cập nhật thông tin, vui lòng liên hệ admin.
          </Alert>

          {/* Profile Overview Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Avatar
                  src={profileData.avatar}
                  sx={{ width: 100, height: 100, mr: 3 }}
                >
                  <Person sx={{ fontSize: 40 }} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" fontWeight="bold">
                    {profileData.firstName} {profileData.lastName}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    {profileData.position} • {profileData.department}
                  </Typography>
                  <Chip
                    icon={<Badge />}
                    label={`ID: ${profileData.employeeId}`}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    icon={<LocationOn />}
                    label={profileData.location}
                    size="small"
                    color="primary"
                  />
                </Box>
              </Box>

              {/* Quick Stats - CHỈ 4 CHỈ SỐ THỰC TẾ */}
              <Grid container spacing={3}>
                <Grid item xs={6} sm={6} md={3}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h4" color="primary.main" fontWeight="bold">
                      {workStats.totalStationsManaged}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Trạm quản lý
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={6} md={3}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      {workStats.maintenanceCompleted}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Phiên hoàn thành hôm nay
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={6} md={3}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h4" color="info.main" fontWeight="bold">
                      {workStats.activeSessionsNow}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Xe đang sạc hiện tại
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={6} md={3}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h4" color="warning.main" fontWeight="bold">
                      {workStats.totalConnectors}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tổng số điểm sạc
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

      {/* Only show the personal & work info section, no tabs */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Thông tin cá nhân
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Họ"
                  value={profileData.firstName}
                  disabled
                  InputProps={{
                    readOnly: true,
                  }}
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tên"
                  value={profileData.lastName}
                  disabled
                  InputProps={{
                    readOnly: true,
                  }}
                />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={profileData.email}
                disabled
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <Email sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Số điện thoại"
                value={profileData.phone}
                disabled
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <Phone sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Địa điểm"
                value={profileData.location}
                disabled
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <LocationOn sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ngày vào làm"
                value={profileData.joinDate}
                disabled
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <CalendarToday sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />
            </Grid>

            {/* Phần Chi tiết công việc - GỘP VÀO ĐÂY */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Divider />
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
                Chi tiết công việc
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mã nhân viên"
                value={profileData.employeeId}
                disabled
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <Badge sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phòng ban"
                value={profileData.department}
                disabled
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <Work sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Chức vụ"
                value={profileData.position}
                disabled
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <Work sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
        </>
      )}
    </Box>
  );
};

export default StaffProfile;
