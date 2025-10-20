import React, { useState } from "react";
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

const StaffProfile = () => {
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: "Nguyễn",
    lastName: "Văn Minh",
    email: "staff@skaev.com",
    phone: "0987654321",
    employeeId: "ST001",
    department: "Vận hành",
    position: "Kỹ thuật viên trạm sạc",
    joinDate: "2025-01-15",
    location: "Hà Nội",
    avatar: "/api/placeholder/150/150",
  });

  const [workStats] = useState({
    totalStationsManaged: 8,
    maintenanceCompleted: 45,
    averageResponseTime: "12 minutes",
    satisfactionRating: 4.8,
    certificationsCount: 3,
  });

  const [recentActivities] = useState([
    {
      id: 1,
      action: "Hoàn thành bảo trì",
      location: "Vincom Royal City - Charger #3",
      time: "2 hours ago",
      status: "success",
    },
    {
      id: 2,
      action: "Phản hồi cảnh báo",
      location: "AEON Mall - Charger #7",
      time: "5 hours ago",
      status: "info",
    },
    {
      id: 3,
      action: "Đã lên lịch kiểm tra",
      location: "Lotte Center - All Chargers",
      time: "1 day ago",
      status: "warning",
    },
  ]);

  const [certifications] = useState([
    {
      name: "EV Charging Systems Level 2",
      issuer: "Viện xe điện",
      expiry: "2025-06-15",
      status: "active",
    },
    {
      name: "Chứng chỉ an toàn điện",
      issuer: "Hội đồng an toàn",
      expiry: "2025-12-30",
      status: "expiring",
    },
    {
      name: "Technical Support Level 1",
      issuer: "Đào tạo SkaEV",
      expiry: "2025-03-20",
      status: "active",
    },
  ]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleProfileChange = (field, value) => {
    setProfileData({ ...profileData, [field]: value });
  };

  const handleSaveProfile = () => {
    // Here you would save the profile data to your backend
    console.log("Saving profile:", profileData);
    setEditMode(false);
    // Show success message
  };

  const getCertificationColor = (status) => {
    switch (status) {
      case "active":
        return "success";
      case "expiring":
        return "warning";
      case "expired":
        return "error";
      default:
        return "default";
    }
  };

  const getActivityColor = (status) => {
    switch (status) {
      case "success":
        return "success";
      case "info":
        return "info";
      case "warning":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Staff Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your personal information and work settings
        </Typography>
      </Box>

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
              {editMode ? "Save" : "Edit Profile"}
            </Button>
            {editMode && (
              <Button
                startIcon={<Cancel />}
                onClick={() => {
                  setEditMode(false);
                  // Reset form data
                }}
                sx={{ ml: 1 }}
              >
                Cancel
              </Button>
            )}
          </Box>

          {/* Quick Stats */}
          <Grid container spacing={3}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="primary.main" fontWeight="bold">
                  {workStats.totalStationsManaged}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Stations Managed
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {workStats.maintenanceCompleted}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Maintenance Completed
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="info.main" fontWeight="bold">
                  {workStats.averageResponseTime}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Response Time
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {workStats.satisfactionRating}/5
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Customer Rating
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Personal Info" />
          <Tab label="Work Details" />
          <Tab label="Activity Log" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Personal Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
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
                  label="Last Name"
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
                  label="Phone"
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
                  label="Location"
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
                  label="Join Date"
                  value={profileData.joinDate}
                  disabled
                  InputProps={{
                    startAdornment: (
                      <CalendarToday sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Work Information
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Employee ID
                  </Typography>
                  <Typography variant="body1">
                    {profileData.employeeId}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Department
                  </Typography>
                  <Typography variant="body1">
                    {profileData.department}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Position
                  </Typography>
                  <Typography variant="body1">
                    {profileData.position}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Work Location
                  </Typography>
                  <Typography variant="body1">
                    {profileData.location}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Certifications
                </Typography>
                <List>
                  {certifications.map((cert, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={cert.name}
                        secondary={`${cert.issuer} • Expires: ${cert.expiry}`}
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          label={cert.status}
                          color={getCertificationColor(cert.status)}
                          size="small"
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Recent Activity
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
                      label={activity.status}
                      color={getActivityColor(activity.status)}
                      size="small"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default StaffProfile;
