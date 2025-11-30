import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  FormControlLabel,
  Switch,
  Autocomplete,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from "@mui/material";
import {
  ArrowBack,
  Add,
  LocationOn,
  ElectricCar,
  Settings,
  CheckCircle,
  Save,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import useStationStore from "../../store/stationStore";
import { formatCurrency } from "../../utils/helpers";

const AddStation = () => {
  const navigate = useNavigate();
  const { addStation } = useStationStore();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    // Basic Information
    name: "",
    description: "",
    address: "",
    
    // Charging Configuration
    totalPorts: 4,
    fastChargePorts: 2,
    standardPorts: 2,
    pricePerKwh: 3500,
    
    // Operating Details
    operatingHours: "24/7",
    status: "active",
    
    // Amenities
    amenities: [],
    
    // Contact Information
    contactPhone: "",
    contactEmail: "",
    managerName: "",
  });

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

  const steps = [
    { label: "Thông tin cơ bản", icon: <LocationOn /> },
    { label: "Cấu hình sạc", icon: <ElectricCar /> },
    { label: "Tiện ích & Dịch vụ", icon: <Settings /> },
    { label: "Xác nhận", icon: <CheckCircle /> },
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0: // Basic Information
        if (!formData.name.trim()) newErrors.name = "Tên trạm sạc là bắt buộc";
        if (!formData.address.trim()) newErrors.address = "Địa chỉ là bắt buộc";
        break;
        
      case 1: // Charging Configuration
        if (formData.totalPorts < 1) newErrors.totalPorts = "Tổng số cổng sạc phải lớn hơn 0";
        if (formData.fastChargePorts < 0) newErrors.fastChargePorts = "Số cổng sạc nhanh không được âm";
        if (formData.standardPorts < 0) newErrors.standardPorts = "Số cổng sạc tiêu chuẩn không được âm";
        if (formData.fastChargePorts + formData.standardPorts > formData.totalPorts) {
          newErrors.totalPorts = "Tổng số cổng sạc nhanh và tiêu chuẩn không được vượt quá tổng số cổng";
        }
        if (formData.pricePerKwh < 0) newErrors.pricePerKwh = "Giá mỗi kWh không được âm";
        break;
        
      case 2: // Amenities & Services
        // No validation needed for amenities
        break;
        
      case 3: // Confirmation
        // Final validation
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;
    
    setLoading(true);
    
    try {
      // Build payload matching backend CreateStationDto
      const stationData = {
        stationName: formData.name,
        address: formData.address,
        city: "TP. Hồ Chí Minh", // Default city
        latitude: 10.7769, // Default coordinates for Ho Chi Minh City
        longitude: 106.7009,
        operatingHours: formData.operatingHours,
        amenities: formData.amenities,
        stationImageUrl: null,
        status: formData.status,
        totalPorts: Number(formData.totalPorts) || 0,
        fastChargePorts: Number(formData.fastChargePorts) || 0,
        standardPorts: Number(formData.standardPorts) || 0,
        pricePerKwh: Number(formData.pricePerKwh) || 0,
        fastChargePowerKw: formData.fastChargePorts > 0 ? 120 : null,
        standardChargePowerKw: formData.standardPorts > 0 ? 22 : null,
      };

      await addStation(stationData);
      
      // Show success message and navigate back to Station Management
      alert("Trạm sạc đã được thêm thành công!");
      navigate("/admin/stations");
      
    } catch (error) {
      console.error("Error adding station:", error);
      alert("Có lỗi xảy ra khi thêm trạm sạc. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tên trạm sạc *"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                placeholder="Ví dụ: Green Mall Charging Hub"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mô tả"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                multiline
                rows={3}
                placeholder="Mô tả về trạm sạc, vị trí, đặc điểm..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Địa chỉ *"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                error={!!errors.address}
                helperText={errors.address}
                placeholder="Ví dụ: 123 Đường Nguyễn Huệ"
              />
            </Grid>
            
            
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Cấu hình cổng sạc
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Tổng số cổng sạc *"
                type="number"
                value={formData.totalPorts}
                onChange={(e) => handleInputChange('totalPorts', parseInt(e.target.value) || 0)}
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
                onChange={(e) => handleInputChange('fastChargePorts', parseInt(e.target.value) || 0)}
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
                onChange={(e) => handleInputChange('standardPorts', parseInt(e.target.value) || 0)}
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
                onChange={(e) => handleInputChange('pricePerKwh', parseFloat(e.target.value) || 0)}
                error={!!errors.pricePerKwh}
                helperText={errors.pricePerKwh}
                inputProps={{ min: 0, step: 100 }}
                InputProps={{
                  endAdornment: <Typography variant="body2" color="text.secondary">₫</Typography>
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Giờ hoạt động</InputLabel>
                <Select
                  value={formData.operatingHours}
                  label="Giờ hoạt động"
                  onChange={(e) => handleInputChange('operatingHours', e.target.value)}
                >
                  <MenuItem value="24/7">24/7</MenuItem>
                  <MenuItem value="6:00-22:00">6:00-22:00</MenuItem>
                  <MenuItem value="8:00-20:00">8:00-20:00</MenuItem>
                  <MenuItem value="Custom">Tùy chỉnh</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={formData.status}
                  label="Trạng thái"
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  <MenuItem value="active">Hoạt động</MenuItem>
                  <MenuItem value="maintenance">Bảo trì</MenuItem>
                  <MenuItem value="offline">Tạm ngưng</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Tiện ích và dịch vụ
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Chọn các tiện ích có sẵn tại trạm sạc
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={amenitiesOptions}
                value={formData.amenities}
                onChange={(event, newValue) => handleInputChange('amenities', newValue)}
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
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Thông tin liên hệ
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Số điện thoại liên hệ"
                value={formData.contactPhone}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                placeholder="Ví dụ: +84 901 234 567"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email liên hệ"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                placeholder="Ví dụ: contact@station.com"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tên người quản lý"
                value={formData.managerName}
                onChange={(e) => handleInputChange('managerName', e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn A"
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Xác nhận thông tin trạm sạc
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" color="primary">
                    {formData.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formData.address}, TP. Hồ Chí Minh
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" fontWeight="medium">
                    Tổng số cổng sạc: {formData.totalPorts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Sạc nhanh (DC): {formData.fastChargePorts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Sạc tiêu chuẩn (AC): {formData.standardPorts}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" fontWeight="medium">
                    Giá: {formatCurrency(formData.pricePerKwh)}/kWh
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Giờ hoạt động: {formData.operatingHours}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Trạng thái: {formData.status === 'active' ? 'Hoạt động' : 
                               formData.status === 'maintenance' ? 'Bảo trì' : 'Tạm ngưng'}
                  </Typography>
                </Grid>
                
                {formData.amenities.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                      Tiện ích:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {formData.amenities.map((amenity) => (
                        <Chip key={amenity} label={amenity} size="small" />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>
            
            <Alert severity="info">
              Sau khi tạo trạm sạc, thông tin sẽ được cập nhật vào bảng "Station Performance" 
              trong trang Dashboard.
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate("/admin/stations")} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Thêm trạm sạc mới
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tạo trạm sạc mới cho mạng lưới SkaEV
          </Typography>
        </Box>
      </Box>

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} orientation="horizontal">
          {steps.map((step) => (
            <Step key={step.label}>
              <StepLabel icon={step.icon}>
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step Content */}
      <Card>
        <CardContent sx={{ p: 4 }}>
          {renderStepContent(activeStep)}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          onClick={handleBack}
          disabled={activeStep === 0}
          startIcon={<ArrowBack />}
        >
          Quay lại
        </Button>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<Add />}
            >
              Tiếp theo
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Save />}
              sx={{ minWidth: 120 }}
            >
              {loading ? 'Đang tạo...' : 'Tạo trạm sạc'}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default AddStation;
