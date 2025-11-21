import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Card,
  CardContent,
  Box,
  Avatar,
  Typography,
  Chip,
  Grid,
  Tabs,
  Tab,
  TextField,
  Divider,
  Alert,
  Tooltip,
} from "@mui/material";
import {
  Badge,
  LocationOn,
  Person,
  Email,
  Phone,
  CalendarToday,
  Work,
  CheckCircle,
} from "@mui/icons-material";
import PropTypes from "prop-types";

const StaffEditDialog = ({
  open,
  onClose,
  form,
  setForm,
  staffEditTab,
  setStaffEditTab,
  stations,
  selectedStation,
  selectedStationId,
  toggleStationSelection,
  getStationManager,
  isStationDisabled,
  handleSaveStaff,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Quản lý thông tin cá nhân và cài đặt công việc</DialogTitle>
      <DialogContent dividers>
        {/* Header Card với Avatar và Stats */}
        <Card sx={{ mb: 3, bgcolor: "primary.50" }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  mr: 3,
                  bgcolor: "primary.main",
                  fontSize: 40,
                }}
              >
                {(form.firstName || "N")[0].toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" fontWeight="bold">
                  {form.firstName} {form.lastName}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {form.position || "Kỹ thuật viên trạm sạc"} •{" "}
                  {form.department || "Vận hành"}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                  <Chip
                    icon={<Badge />}
                    label={`ID: ${form.employeeId || "ST001"}`}
                    size="small"
                    color="primary"
                  />
                  <Chip
                    icon={<LocationOn />}
                    label={form.location || "Hà Nội"}
                    size="small"
                    color="info"
                  />
                </Box>
              </Box>
            </Box>

            {/* Stats Row */}
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <Box
                  sx={{
                    textAlign: "center",
                    p: 1.5,
                    bgcolor: "white",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    8
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Trạm quản lý
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box
                  sx={{
                    textAlign: "center",
                    p: 1.5,
                    bgcolor: "white",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="h5" fontWeight="bold" color="primary.main">
                    45
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Bảo trì hoàn thành
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box
                  sx={{
                    textAlign: "center",
                    p: 1.5,
                    bgcolor: "white",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="h5" fontWeight="bold" color="info.main">
                    12m
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Thời gian phản hồi TB
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box
                  sx={{
                    textAlign: "center",
                    p: 1.5,
                    bgcolor: "white",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="h5" fontWeight="bold" color="warning.main">
                    4.8/5
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Đánh giá khách hàng
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs value={staffEditTab} onChange={(e, v) => setStaffEditTab(v)}>
            <Tab label="THÔNG TIN CÁ NHÂN & CÔNG VIỆC" />
            <Tab label="PHÂN QUYỀN TRẠM SẠC" />
            <Tab label="NHẬT KÝ HOẠT ĐỘNG" />
          </Tabs>
        </Box>

        {/* Tab 0: Thông tin cá nhân & Công việc */}
        {staffEditTab === 0 && (
          <Box>
            {/* Phần Thông tin cá nhân */}
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Thông tin cá nhân
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Họ"
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <Person sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tên"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <Person sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <Email sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Số điện thoại"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <Phone sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Địa điểm"
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <LocationOn sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Ngày vào làm"
                  type="date"
                  value={form.joinDate}
                  onChange={(e) =>
                    setForm({ ...form, joinDate: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <CalendarToday sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
              </Grid>
            </Grid>

            {/* Divider */}
            <Divider sx={{ my: 3 }}>
              <Chip label="Chi tiết công việc" icon={<Work />} />
            </Divider>

            {/* Phần Chi tiết công việc */}
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Chi tiết công việc
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Mã nhân viên"
                  value={form.employeeId}
                  onChange={(e) =>
                    setForm({ ...form, employeeId: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <Badge sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phòng ban"
                  value={form.department}
                  onChange={(e) =>
                    setForm({ ...form, department: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <Work sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Chức vụ"
                  value={form.position}
                  onChange={(e) =>
                    setForm({ ...form, position: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <Work sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Tab 1: Phân quyền trạm sạc */}
        {staffEditTab === 1 && (
          <Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Phân quyền trạm sạc cho nhân viên
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Chọn trạm sạc mà nhân viên{" "}
                <strong>
                  {form.firstName} {form.lastName}
                </strong>{" "}
                sẽ quản lý
              </Typography>
              <Chip
                label={
                  selectedStation
                    ? `Trạm: ${
                        selectedStation.name || selectedStation.stationName
                      }`
                    : "Chưa chọn trạm"
                }
                color={selectedStation ? "success" : "default"}
                size="small"
                sx={{ mt: 1 }}
                icon={<CheckCircle />}
              />
            </Box>

            {stations.length === 0 ? (
              <Alert severity="info">Chưa có trạm sạc nào trong hệ thống</Alert>
            ) : (
              <Grid container spacing={2}>
                {stations.map((station) => {
                  const stationKey = station.stationId ?? station.id;
                  const manager = getStationManager(station);
                  const disabled = isStationDisabled(station);
                  const isSelected = selectedStationId === stationKey;
                  const totalPorts =
                    station.charging?.totalPorts ?? station.totalChargers ?? 0;
                  const availablePorts =
                    station.charging?.availablePorts ??
                    station.availablePosts ??
                    0;

                  return (
                    <Grid item xs={12} sm={6} key={stationKey}>
                      <Tooltip
                        title={
                          disabled && manager
                            ? `Đã phân công cho ${
                                manager.name || manager.email || "nhân viên khác"
                              }`
                            : ""
                        }
                        disableHoverListener={!disabled || isSelected}
                      >
                        <Box>
                          <Card
                            variant="outlined"
                            sx={{
                              cursor: disabled ? "not-allowed" : "pointer",
                              border: isSelected ? 2 : 1,
                              borderColor: isSelected
                                ? "success.main"
                                : "divider",
                              bgcolor: isSelected
                                ? "success.50"
                                : "transparent",
                              opacity: disabled && !isSelected ? 0.6 : 1,
                              transition: "all 0.2s",
                              "&:hover": disabled
                                ? {}
                                : {
                                    borderColor: "success.main",
                                    transform: "translateY(-2px)",
                                    boxShadow: 2,
                                  },
                            }}
                            onClick={() => {
                              if (!disabled) {
                                toggleStationSelection(stationKey);
                              }
                            }}
                          >
                            <CardContent>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  justifyContent: "space-between",
                                }}
                              >
                                <Box sx={{ flex: 1, pr: 1 }}>
                                  <Typography
                                    variant="subtitle2"
                                    fontWeight="bold"
                                    gutterBottom
                                  >
                                    {station.name}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                    }}
                                  >
                                    <LocationOn fontSize="inherit" />
                                    {station.location?.address ||
                                      station.address}
                                  </Typography>
                                  <Box
                                    sx={{
                                      mt: 1,
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: 0.5,
                                    }}
                                  >
                                    <Chip
                                      label={`${totalPorts} cổng`}
                                      size="small"
                                      variant="outlined"
                                    />
                                    <Chip
                                      label={`Trống: ${availablePorts}`}
                                      size="small"
                                      variant="outlined"
                                      color="info"
                                    />
                                  </Box>
                                  <Chip
                                    icon={<Person fontSize="small" />}
                                    label={
                                      manager
                                        ? `Quản lý: ${
                                            manager.name ||
                                            manager.email ||
                                            "Nhân viên khác"
                                          }`
                                        : "Chưa phân công nhân viên"
                                    }
                                    size="small"
                                    color={
                                      manager
                                        ? disabled && !isSelected
                                          ? "default"
                                          : "success"
                                        : "primary"
                                    }
                                    variant={manager ? "filled" : "outlined"}
                                    sx={{ mt: 1, maxWidth: "100%" }}
                                  />
                                </Box>
                                {isSelected && <CheckCircle color="success" />}
                              </Box>
                            </CardContent>
                          </Card>
                        </Box>
                      </Tooltip>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        )}

        {/* Tab 2: Nhật ký hoạt động */}
        {staffEditTab === 2 && (
          <Box>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Hoạt động gần đây
            </Typography>
            <Alert severity="info" sx={{ mt: 2 }}>
              Chức năng nhật ký hoạt động đang được phát triển.
            </Alert>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={handleSaveStaff}>
          Lưu thay đổi
        </Button>
      </DialogActions>
    </Dialog>
  );
};

StaffEditDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  form: PropTypes.object.isRequired,
  setForm: PropTypes.func.isRequired,
  staffEditTab: PropTypes.number.isRequired,
  setStaffEditTab: PropTypes.func.isRequired,
  stations: PropTypes.array.isRequired,
  selectedStation: PropTypes.object,
  selectedStationId: PropTypes.number,
  toggleStationSelection: PropTypes.func.isRequired,
  getStationManager: PropTypes.func.isRequired,
  isStationDisabled: PropTypes.func.isRequired,
  handleSaveStaff: PropTypes.func.isRequired,
};

export default StaffEditDialog;
