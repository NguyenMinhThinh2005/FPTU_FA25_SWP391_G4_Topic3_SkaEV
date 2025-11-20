import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Divider,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  Person,
  Edit,
  Save,
  Cancel,
  Security,
  Work,
  Badge,
  Phone,
  Email,
  LocationOn,
  CalendarToday,
} from "@mui/icons-material";
import staffAPI from "../../services/api/staffAPI";
import useAuthStore from "../../store/authStore";
import { authAPI } from "../../services/api.js";

const StaffProfile = () => {
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState(null);
  const [saveError, setSaveError] = useState(null);
  
  // Get user from authStore
  const { user: authUser, updateProfile: updateAuthProfile } = useAuthStore();
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

      // Get dashboard data for work stats
      const dashboardData = await staffAPI.getDashboardOverview();
      console.log("📊 Dashboard Data:", dashboardData);

      // Set profile data from authStore user (the logged-in staff)
      if (authUser && authUser.full_name) {
        console.log("✓ Parsing name from:", authUser.full_name);
        
        // Parse full name into first and last name
        const fullName = authUser.full_name.trim();
        const nameParts = fullName.split(" ");
        const lastName = nameParts.pop() || ""; // Last word is the last name (Tên)
        const firstName = nameParts.join(" ") || ""; // Rest is first name + middle name (Họ và tên đệm)

        console.log("✓ Parsed - firstName:", firstName, "lastName:", lastName);

        setProfileData({
          firstName: firstName,
          lastName: lastName,
          email: authUser.email || "",
          phone: authUser.phone_number || authUser.phoneNumber || "",
          employeeId: authUser.user_id ? `ST${String(authUser.user_id).padStart(3, '0')}` : "",
          department: "Vận hành",
          position: "Kỹ thuật viên trạm sạc",
          joinDate: authUser.created_at ? new Date(authUser.created_at).toISOString().split('T')[0] : "2025-01-15",
          location: dashboardData?.station?.city || authUser.address || "TP.HCM",
          avatar: authUser.avatar || authUser.profile_image || "",
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

  // Reload when authUser full_name or phone_number changes (after update)
  useEffect(() => {
    if (authUser) {
      console.log("🔄 AuthUser data changed, profile will reload automatically");
    }
  }, [authUser?.full_name, authUser?.phone_number]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleProfileChange = (field, value) => {
    setProfileData({ ...profileData, [field]: value });
    // Clear any previous save messages when user makes changes
    setSaveMessage(null);
    setSaveError(null);
  };

  const handleSaveProfile = async () => {
    try {
      setSaveMessage(null);
      setSaveError(null);
      setLoading(true);

      // Prepare data to send to backend
      // Backend UpdateProfileDto only supports: FullName, PhoneNumber
      const updateData = {
        fullName: `${profileData.firstName} ${profileData.lastName}`.trim(),
        phoneNumber: profileData.phone,
      };

      console.log("💾 Saving profile data:", updateData);

      // Call API to update profile - using correct endpoint
      const response = await authAPI.updateProfile(updateData);
      console.log("✅ Profile updated:", response);

      // Update authStore with new data from response
      if (response.data) {
        const updatedUserData = {
          full_name: response.data.fullName,
          phone_number: response.data.phoneNumber,
        };
        
        console.log("🔄 Updating authStore with:", updatedUserData);
        updateAuthProfile(updatedUserData);
        
        // Verify update
        setTimeout(() => {
          const currentUser = useAuthStore.getState().user;
          console.log("✓ AuthStore after update:", currentUser);
        }, 100);

        // Update local profileData to reflect changes immediately
        const fullName = response.data.fullName.trim();
        const nameParts = fullName.split(" ");
        const lastName = nameParts.pop() || "";
        const firstName = nameParts.join(" ") || "";

        setProfileData(prev => ({
          ...prev,
          firstName: firstName,
          lastName: lastName,
          phone: response.data.phoneNumber || prev.phone,
        }));
      }

      // Show success message
      setSaveMessage("Thông tin đã được cập nhật thành công!");
      setEditMode(false);

    } catch (error) {
      console.error("❌ Error saving profile:", error);
      setSaveError(
        error.response?.data?.message || 
        "Không thể lưu thông tin. Vui lòng thử lại!"
      );
    } finally {
      setLoading(false);
    }
  };

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
          {/* Success/Error Messages */}
          {saveMessage && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSaveMessage(null)}>
              {saveMessage}
            </Alert>
          )}
          {saveError && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSaveError(null)}>
              {saveError}
            </Alert>
          )}

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
                <Button
                  startIcon={editMode ? <Save /> : <Edit />}
                  variant={editMode ? "contained" : "outlined"}
                  onClick={editMode ? handleSaveProfile : () => setEditMode(true)}
                >
                  {editMode ? "Lưu" : "Chỉnh sửa hồ sơ"}
                </Button>
                {editMode && (
                  <Button
                    startIcon={<Cancel />}
                    onClick={() => {
                      setEditMode(false);
                      loadStaffProfile(); // Reload data to reset
                    }}
                    sx={{ ml: 1 }}
                  >
                    Hủy
                  </Button>
                )}
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
                  onChange={(e) =>
                    handleProfileChange("firstName", e.target.value)
                  }
                  disabled={!editMode}
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tên"
                  value={profileData.lastName}
                  onChange={(e) =>
                    handleProfileChange("lastName", e.target.value)
                  }
                  disabled={!editMode}
                />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={profileData.email}
                onChange={(e) => handleProfileChange("email", e.target.value)}
                disabled
                InputProps={{
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
                onChange={(e) => handleProfileChange("phone", e.target.value)}
                disabled={!editMode}
                InputProps={{
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
                onChange={(e) =>
                  handleProfileChange("location", e.target.value)
                }
                disabled
                InputProps={{
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
                  startAdornment: (
                    <Work sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
<<<<<<< HEAD
        </>
=======

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Thông tin cá nhân & Công việc" />
          <Tab label="Nhật ký hoạt động" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {tabValue === 0 && (
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
                    onChange={(e) =>
                      handleProfileChange("firstName", e.target.value)
                    }
                    disabled
                  />
              </Grid>
              <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tên"
                    value={profileData.lastName}
                    onChange={(e) =>
                      handleProfileChange("lastName", e.target.value)
                    }
                    disabled
                  />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleProfileChange("email", e.target.value)}
                  disabled={!editMode}
                  InputProps={{
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
                  onChange={(e) => handleProfileChange("phone", e.target.value)}
                  disabled={!editMode}
                  InputProps={{
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
                  onChange={(e) =>
                    handleProfileChange("location", e.target.value)
                  }
                  disabled={!editMode}
                  InputProps={{
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
                    startAdornment: (
                      <Work sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
              </Grid>
              
              {/* Certifications - render if present to avoid unused variable eslint warnings */}
              {certifications && certifications.length > 0 && (
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Divider />
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
                    Chứng chỉ
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {certifications.map((cert, idx) => (
                      <Chip
                        key={idx}
                        label={cert.name}
                        size="small"
                        color={getCertificationColor(cert.status)}
                      />
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Hoạt động gần đây
            </Typography>
            <List>
              {recentActivities.map((activity) => (
                <ListItem key={activity.id} divider>
                  <ListItemText
                    primary={activity.action}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {activity.location}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {activity.time}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      label={
                        activity.status === "success"
                          ? "Thành công"
                          : activity.status === "info"
                          ? "Thông tin"
                          : activity.status === "warning"
                          ? "Cảnh báo"
                          : activity.status
                      }
                      color={getActivityColor(activity.status)}
                      size="small"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
>>>>>>> 63845a83230bd2c1c6a721f5e2c2559237204949
      )}
    </Box>
  );
};

export default StaffProfile;
