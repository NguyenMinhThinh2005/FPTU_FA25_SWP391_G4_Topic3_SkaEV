import React, { useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Divider,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Settings,
  Security,
  Notifications,
  Language,
  Palette,
  Storage,
  CloudSync,
  Edit,
  Delete,
  Add,
  Save,
  Restore,
} from "@mui/icons-material";

const AdminSettings = () => {
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState({
    // System Settings
    maintenanceMode: false,
    autoBackup: true,
    systemNotifications: true,
    debugMode: false,

    // Security Settings
    twoFactorAuth: true,
    passwordExpiry: 90,
    sessionTimeout: 30,
    loginAttempts: 5,

    // Notification Settings
    emailNotifications: true,
    smsAlerts: false,
    pushNotifications: true,
    alertThreshold: 85,

    // Business Settings
    currency: "VND",
    timezone: "Asia/Ho_Chi_Minh",
    language: "vi",
    dateFormat: "DD/MM/YYYY",
  });

  const [apiKeys] = useState([
    {
      id: 1,
      name: "Payment Gateway API",
      key: "pk_live_***************",
      status: "active",
      lastUsed: "2024-03-15",
    },
    {
      id: 2,
      name: "SMS Service API",
      key: "sk_test_***************",
      status: "active",
      lastUsed: "2024-03-14",
    },
    {
      id: 3,
      name: "Maps Integration",
      key: "AIza***************",
      status: "inactive",
      lastUsed: "2024-03-10",
    },
  ]);

  const [backupHistory] = useState([
    {
      id: 1,
      type: "Full Backup",
      date: "2024-03-15 02:00:00",
      size: "2.3 GB",
      status: "success",
    },
    {
      id: 2,
      type: "Incremental Backup",
      date: "2024-03-14 02:00:00",
      size: "450 MB",
      status: "success",
    },
    {
      id: 3,
      type: "Full Backup",
      date: "2024-03-13 02:00:00",
      size: "2.1 GB",
      status: "failed",
    },
  ]);

  const [editDialog, setEditDialog] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState(null);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSettingChange = (setting, value) => {
    setSettings({ ...settings, [setting]: value });
  };

  const handleSaveSettings = () => {
    // Here you would save settings to backend
    console.log("Saving settings:", settings);
    // Show success message
  };

  const handleEditApiKey = (apiKey) => {
    setSelectedApiKey(apiKey);
    setEditDialog(true);
  };

  const handleCreateBackup = () => {
    console.log("Creating backup...");
    // Implement backup creation
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
      case "success":
        return "success";
      case "inactive":
      case "failed":
        return "error";
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
          Cài đặt hệ thống
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Cấu hình tùy chọn hệ thống và quản lý cài đặt ứng dụng
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Chung" />
          <Tab label="Bảo mật" />
          <Tab label="Thông báo" />
          <Tab label="Khóa API" />
          <Tab label="Sao lưu" />
        </Tabs>
      </Box>

      {/* General Settings */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Cấu hình hệ thống
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.maintenanceMode}
                      onChange={(e) =>
                        handleSettingChange("maintenanceMode", e.target.checked)
                      }
                    />
                  }
                  label="Chế độ bảo trì"
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: 4, mb: 2 }}
                >
                  Bật chế độ bảo trì để ngăn người dùng truy cập trong quá trình cập nhật
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoBackup}
                      onChange={(e) =>
                        handleSettingChange("autoBackup", e.target.checked)
                      }
                    />
                  }
                  label="Sao lưu tự động"
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: 4, mb: 2 }}
                >
                  Tự động sao lưu dữ liệu hệ thống hàng ngày lúc 2:00 sáng
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.systemNotifications}
                      onChange={(e) =>
                        handleSettingChange(
                          "systemNotifications",
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Thông báo hệ thống"
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: 4, mb: 2 }}
                >
                  Bật thông báo toàn hệ thống cho quản trị viên
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.debugMode}
                      onChange={(e) =>
                        handleSettingChange("debugMode", e.target.checked)
                      }
                    />
                  }
                  label="Chế độ gỡ lỗi"
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: 4 }}
                >
                  Bật ghi log chi tiết để khắc phục sự cố
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Cài đặt khu vực
                </Typography>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Tiền tệ</InputLabel>
                  <Select
                    value={settings.currency}
                    label="Tiền tệ"
                    onChange={(e) =>
                      handleSettingChange("currency", e.target.value)
                    }
                  >
                    <MenuItem value="VND">Đồng Việt Nam (VND)</MenuItem>
                    <MenuItem value="USD">Đô la Mỹ (USD)</MenuItem>
                    <MenuItem value="EUR">Euro (EUR)</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Múi giờ</InputLabel>
                  <Select
                    value={settings.timezone}
                    label="Múi giờ"
                    onChange={(e) =>
                      handleSettingChange("timezone", e.target.value)
                    }
                  >
                    <MenuItem value="Asia/Ho_Chi_Minh">
                      Việt Nam (UTC+7)
                    </MenuItem>
                    <MenuItem value="UTC">UTC (UTC+0)</MenuItem>
                    <MenuItem value="America/New_York">
                      New York (UTC-5)
                    </MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Ngôn ngữ</InputLabel>
                  <Select
                    value={settings.language}
                    label="Ngôn ngữ"
                    onChange={(e) =>
                      handleSettingChange("language", e.target.value)
                    }
                  >
                    <MenuItem value="vi">Tiếng Việt</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="zh">中文</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Định dạng ngày</InputLabel>
                  <Select
                    value={settings.dateFormat}
                    label="Định dạng ngày"
                    onChange={(e) =>
                      handleSettingChange("dateFormat", e.target.value)
                    }
                  >
                    <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                    <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                    <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button variant="outlined" startIcon={<Restore />}>
                Đặt lại mặc định
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSaveSettings}
              >
                Lưu cài đặt
              </Button>
            </Box>
          </Grid>
        </Grid>
      )}

      {/* Security Settings */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                Cài đặt xác thực bảo mật hai yếu tố
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.twoFactorAuth}
                      onChange={(e) =>
                        handleSettingChange("twoFactorAuth", e.target.checked)
                      }
                    />
                  }
                    label="Xác thực bảo mật hai yếu tố"
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: 4, mb: 3 }}
                >
                  Yêu cầu xác thực bảo mật hai yếu tố cho tài khoản quản trị viên
                </Typography>

                <TextField
                  fullWidth
                  label="Hạn sử dụng mật khẩu (ngày)"
                  type="number"
                  value={settings.passwordExpiry}
                  onChange={(e) =>
                    handleSettingChange(
                      "passwordExpiry",
                      parseInt(e.target.value)
                    )
                  }
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Hạn sử dụng phiên (phút)"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) =>
                    handleSettingChange(
                      "sessionTimeout",
                      parseInt(e.target.value)
                    )
                  }
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Số lần đăng nhập tối đa"
                  type="number"
                  value={settings.loginAttempts}
                  onChange={(e) =>
                    handleSettingChange(
                      "loginAttempts",
                      parseInt(e.target.value)
                    )
                  }
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Trạng thái bảo mật
                </Typography>

                <Alert severity="success" sx={{ mb: 2 }}>
                  Chứng chỉ SSL hợp lệ đến ngày 31/12/2024
                </Alert>

                <Alert severity="info" sx={{ mb: 2 }}>
                  Lần kiểm tra bảo mật cuối: 15/03/2024
                </Alert>

                <Alert severity="warning">
                  3 lần đăng nhập thất bại trong 24 giờ qua
                </Alert>

                <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
                  Chạy kiểm tra bảo mật
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Notification Settings */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Kênh thông báo
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotifications}
                      onChange={(e) =>
                        handleSettingChange(
                          "emailNotifications",
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Thông báo email"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.smsAlerts}
                      onChange={(e) =>
                        handleSettingChange("smsAlerts", e.target.checked)
                      }
                    />
                  }
                  label="Thông báo SMS"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.pushNotifications}
                      onChange={(e) =>
                        handleSettingChange(
                          "pushNotifications",
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Thông báo đẩy"
                />

                <TextField
                  fullWidth
                    label="Ngưỡng thông báo (%)"
                  type="number"
                  value={settings.alertThreshold}
                  onChange={(e) =>
                    handleSettingChange(
                      "alertThreshold",
                      parseInt(e.target.value)
                    )
                  }
                  sx={{ mt: 2 }}
                  helperText="Gửi thông báo khi sử dụng hệ thống vượt quá tỷ lệ này"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* API Keys */}
      {tabValue === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                  }}
                >
                  <Typography variant="h6" fontWeight="bold">
                    Quản lý khóa API
                  </Typography>
                  <Button startIcon={<Add />} variant="contained">
                    Thêm khóa API
                  </Button>
                </Box>

                <List>
                  {apiKeys.map((apiKey) => (
                    <ListItem key={apiKey.id} divider>
                      <ListItemText
                        primary={apiKey.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" component="span">
                              Key: {apiKey.key}
                            </Typography>
                            <br />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Sử dụng lần cuối: {apiKey.lastUsed}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          label={apiKey.status}
                          color={getStatusColor(apiKey.status)}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleEditApiKey(apiKey)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Backup Settings */}
      {tabValue === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Cài đặt sao lưu
                </Typography>

                <Button
                  variant="contained"
                  startIcon={<CloudSync />}
                  onClick={handleCreateBackup}
                  sx={{ mb: 3 }}
                >
                  Tạo sao lưu ngay
                </Button>

                <Alert severity="info" sx={{ mb: 2 }}>
                  Sao lưu tự động tiếp theo: 16/03/2024 lúc 2:00 sáng
                </Alert>

                <Typography variant="subtitle2" gutterBottom>
                  Cài đặt sao lưu
                </Typography>
                <FormControlLabel
                  control={<Switch checked={settings.autoBackup} />}
                  label="Bật sao lưu tự động"
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Lịch sử sao lưu
                </Typography>

                <List>
                  {backupHistory.slice(0, 5).map((backup) => (
                    <ListItem key={backup.id} divider>
                      <ListItemText
                        primary={backup.type}
                        secondary={
                          <Box>
                            <Typography variant="body2" component="span">
                              {backup.date} • {backup.size}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          label={backup.status}
                          color={getStatusColor(backup.status)}
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

      {/* Edit API Key Dialog */}
      <Dialog
        open={editDialog}
        onClose={() => setEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Chỉnh sửa khóa API</DialogTitle>
        <DialogContent>
          {selectedApiKey && (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Tên khóa API"
                defaultValue={selectedApiKey.name}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="API Key"
                defaultValue={selectedApiKey.key}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select defaultValue={selectedApiKey.status} label="Status">
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button variant="contained">Lưu Thay đổi</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminSettings;
