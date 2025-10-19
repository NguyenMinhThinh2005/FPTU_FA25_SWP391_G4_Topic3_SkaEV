import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  IconButton,
  Divider,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import {
  Close,
  Save,
  ElectricCar,
  LocationOn,
  Settings,
  Add,
  Delete,
} from "@mui/icons-material";
// formatCurrency imported but reserved for future use
// eslint-disable-next-line no-unused-vars
import { formatCurrency } from "../../utils/helpers";

const EditStationModal = ({ open, onClose, station, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    totalPorts: 4,
    fastChargePorts: 2,
    standardPorts: 2,
    pricePerKwh: 3500,
    operatingHours: "24/7",
    status: "active",
    amenities: [],
    contactPhone: "",
    contactEmail: "",
    managerName: "",
  });

  const [errors, setErrors] = useState({});

  const amenitiesOptions = [
    "WiFi",
    "Restroom",
    "Parking",
    "Cafe",
    "Shopping",
    "ATM",
    "Security",
    "Maintenance",
    "EV Service",
    "Food Court",
  ];

  useEffect(() => {
    if (station) {
      setFormData({
        name: station.name || "",
        description: station.description || "",
        address: station.location?.address || "",
        totalPorts: station.charging?.totalPorts || 4,
        fastChargePorts: station.charging?.fastChargePorts || 2,
        standardPorts: station.charging?.standardPorts || 2,
        pricePerKwh: station.charging?.pricePerKwh || 3500,
        operatingHours: station.operatingHours || "24/7",
        status: station.status || "active",
        amenities: station.amenities || [],
        contactPhone: station.contact?.phone || "",
        contactEmail: station.contact?.email || "",
        managerName: station.contact?.manager || "",
      });
    }
  }, [station]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Tên trạm sạc là bắt buộc";
    if (!formData.address.trim()) newErrors.address = "Địa chỉ là bắt buộc";

    if (formData.totalPorts < 1)
      newErrors.totalPorts = "Tổng số cổng sạc phải lớn hơn 0";
    if (formData.fastChargePorts < 0)
      newErrors.fastChargePorts = "Số cổng sạc nhanh không được âm";
    if (formData.standardPorts < 0)
      newErrors.standardPorts = "Số cổng sạc tiêu chuẩn không được âm";
    if (
      formData.fastChargePorts + formData.standardPorts >
      formData.totalPorts
    ) {
      newErrors.totalPorts =
        "Tổng số cổng sạc nhanh và tiêu chuẩn không được vượt quá tổng số cổng";
    }
    if (formData.pricePerKwh < 0)
      newErrors.pricePerKwh = "Giá mỗi kWh không được âm";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const updatedStationData = {
        name: formData.name,
        description: formData.description,
        location: {
          address: formData.address,
          city: station.location?.city || "TP. Hồ Chí Minh", // Keep existing or default
          province: station.location?.province || "TP. Hồ Chí Minh", // Keep existing or default
          coordinates: station.location?.coordinates || {
            lat: 10.7769,
            lng: 106.7009,
          },
        },
        charging: {
          totalPorts: parseInt(formData.totalPorts),
          availablePorts:
            parseInt(formData.totalPorts) -
            (station.charging?.totalPorts - station.charging?.availablePorts ||
              0),
          fastChargePorts: parseInt(formData.fastChargePorts),
          standardPorts: parseInt(formData.standardPorts),
          pricePerKwh: parseFloat(formData.pricePerKwh),
          connectorTypes: station.charging?.connectorTypes || [
            "Type 2",
            "CCS2",
          ],
        },
        operatingHours: formData.operatingHours,
        amenities: formData.amenities,
        status: formData.status,
        contact: {
          phone: formData.contactPhone,
          email: formData.contactEmail,
          manager: formData.managerName,
        },
        lastUpdated: new Date().toISOString(),
      };

      await onSave(station.id, updatedStationData);
      onClose();
    } catch (error) {
      console.error("Error updating station:", error);
      alert("Có lỗi xảy ra khi cập nhật trạm sạc. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Helper functions reserved for future features
  // eslint-disable-next-line no-unused-vars
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "success";
      case "maintenance":
        return "warning";
      case "offline":
        return "error";
      default:
        return "default";
    }
  };

  // eslint-disable-next-line no-unused-vars
  const getStatusLabel = (status) => {
    switch (status) {
      case "active":
        return "Hoạt động";
      case "maintenance":
        return "Bảo trì";
      case "offline":
        return "Tạm ngưng";
      default:
        return "Không xác định";
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <ElectricCar sx={{ mr: 1, color: "primary.main" }} />
          <Typography variant="h6" fontWeight="bold">
            Chỉnh sửa trạm sạc
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <LocationOn sx={{ mr: 1, color: "primary.main" }} />
              <Typography variant="h6" color="primary">
                Thông tin cơ bản
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Tên trạm sạc *"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={formData.status}
                label="Trạng thái"
                onChange={(e) => handleInputChange("status", e.target.value)}
              >
                <MenuItem value="active">
                  <Chip
                    label="Hoạt động"
                    color="success"
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  Hoạt động
                </MenuItem>
                <MenuItem value="maintenance">
                  <Chip
                    label="Bảo trì"
                    color="warning"
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  Bảo trì
                </MenuItem>
                <MenuItem value="offline">
                  <Chip
                    label="Tạm ngưng"
                    color="error"
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  Tạm ngưng
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Mô tả"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              multiline
              rows={2}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Địa chỉ *"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              error={!!errors.address}
              helperText={errors.address}
            />
          </Grid>

          {/* Charging Configuration */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <ElectricCar sx={{ mr: 1, color: "primary.main" }} />
              <Typography variant="h6" color="primary">
                Cấu hình sạc
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Tổng số cổng sạc *"
              type="number"
              value={formData.totalPorts}
              onChange={(e) =>
                handleInputChange("totalPorts", parseInt(e.target.value) || 0)
              }
              error={!!errors.totalPorts}
              helperText={errors.totalPorts}
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Cổng sạc nhanh (DC)"
              type="number"
              value={formData.fastChargePorts}
              onChange={(e) =>
                handleInputChange(
                  "fastChargePorts",
                  parseInt(e.target.value) || 0
                )
              }
              error={!!errors.fastChargePorts}
              helperText={errors.fastChargePorts}
              inputProps={{ min: 0 }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Cổng sạc tiêu chuẩn (AC)"
              type="number"
              value={formData.standardPorts}
              onChange={(e) =>
                handleInputChange(
                  "standardPorts",
                  parseInt(e.target.value) || 0
                )
              }
              error={!!errors.standardPorts}
              helperText={errors.standardPorts}
              inputProps={{ min: 0 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Giá mỗi kWh (VND)"
              type="number"
              value={formData.pricePerKwh}
              onChange={(e) =>
                handleInputChange(
                  "pricePerKwh",
                  parseFloat(e.target.value) || 0
                )
              }
              error={!!errors.pricePerKwh}
              helperText={errors.pricePerKwh}
              inputProps={{ min: 0, step: 100 }}
              InputProps={{
                endAdornment: (
                  <Typography variant="body2" color="text.secondary">
                    ₫
                  </Typography>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Giờ hoạt động</InputLabel>
              <Select
                value={formData.operatingHours}
                label="Giờ hoạt động"
                onChange={(e) =>
                  handleInputChange("operatingHours", e.target.value)
                }
              >
                <MenuItem value="24/7">24/7</MenuItem>
                <MenuItem value="6:00-22:00">6:00-22:00</MenuItem>
                <MenuItem value="8:00-20:00">8:00-20:00</MenuItem>
                <MenuItem value="Custom">Tùy chỉnh</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Amenities */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Settings sx={{ mr: 1, color: "primary.main" }} />
              <Typography variant="h6" color="primary">
                Tiện ích và dịch vụ
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={amenitiesOptions}
              value={formData.amenities}
              onChange={(event, newValue) =>
                handleInputChange("amenities", newValue)
              }
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    {...getTagProps({ index })}
                    key={option}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tiện ích"
                  placeholder="Chọn tiện ích..."
                />
              )}
            />
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="h6" color="primary" gutterBottom>
              Thông tin liên hệ
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Số điện thoại liên hệ"
              value={formData.contactPhone}
              onChange={(e) =>
                handleInputChange("contactPhone", e.target.value)
              }
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email liên hệ"
              type="email"
              value={formData.contactEmail}
              onChange={(e) =>
                handleInputChange("contactEmail", e.target.value)
              }
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Tên người quản lý"
              value={formData.managerName}
              onChange={(e) => handleInputChange("managerName", e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Hủy
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Save />}
          sx={{ minWidth: 120 }}
        >
          {loading ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditStationModal;
