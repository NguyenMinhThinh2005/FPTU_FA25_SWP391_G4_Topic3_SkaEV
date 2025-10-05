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
  Alert,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Card,
  CardContent,
} from "@mui/material";
import {
  Close,
  Schedule,
  Build,
  Warning,
  CheckCircle,
  CalendarToday,
  AccessTime,
} from "@mui/icons-material";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { vi } from "date-fns/locale";

const ScheduleMaintenanceModal = ({ open, onClose, station, onSchedule }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    maintenanceType: "routine",
    priority: "medium",
    scheduledDate: new Date(),
    scheduledTime: new Date(),
    estimatedDuration: 4, // hours
    description: "",
    affectedPorts: [],
    notifyUsers: true,
    maintenanceTeam: "",
    contactPerson: "",
    contactPhone: "",
    specialInstructions: "",
  });

  const [errors, setErrors] = useState({});

  const maintenanceTypes = [
    { value: "routine", label: "Bảo trì định kỳ", color: "info" },
    { value: "repair", label: "Sửa chữa", color: "warning" },
    { value: "upgrade", label: "Nâng cấp", color: "success" },
    { value: "emergency", label: "Khẩn cấp", color: "error" },
    { value: "inspection", label: "Kiểm tra", color: "default" },
  ];

  const priorityLevels = [
    { value: "low", label: "Thấp", color: "success" },
    { value: "medium", label: "Trung bình", color: "warning" },
    { value: "high", label: "Cao", color: "error" },
    { value: "critical", label: "Khẩn cấp", color: "error" },
  ];

  useEffect(() => {
    if (station) {
      // Generate available ports based on station configuration
      const totalPorts = station.charging?.totalPorts || 4;
      const availablePorts = [];
      for (let i = 1; i <= totalPorts; i++) {
        availablePorts.push(`Port ${i}`);
      }
      
      setFormData(prev => ({
        ...prev,
        affectedPorts: availablePorts, // Default to all ports
      }));
    }
  }, [station]);

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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.description.trim()) {
      newErrors.description = "Mô tả bảo trì là bắt buộc";
    }
    
    if (!formData.scheduledDate) {
      newErrors.scheduledDate = "Ngày bảo trì là bắt buộc";
    }
    
    if (!formData.scheduledTime) {
      newErrors.scheduledTime = "Giờ bảo trì là bắt buộc";
    }
    
    if (formData.estimatedDuration < 0.5) {
      newErrors.estimatedDuration = "Thời gian ước tính phải ít nhất 30 phút";
    }
    
    if (formData.affectedPorts.length === 0) {
      newErrors.affectedPorts = "Phải chọn ít nhất một cổng sạc";
    }
    
    if (!formData.maintenanceTeam.trim()) {
      newErrors.maintenanceTeam = "Đội bảo trì là bắt buộc";
    }
    
    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = "Người liên hệ là bắt buộc";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSchedule = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const maintenanceData = {
        stationId: station.id,
        stationName: station.name,
        type: formData.maintenanceType,
        priority: formData.priority,
        scheduledDateTime: new Date(
          formData.scheduledDate.getFullYear(),
          formData.scheduledDate.getMonth(),
          formData.scheduledDate.getDate(),
          formData.scheduledTime.getHours(),
          formData.scheduledTime.getMinutes()
        ),
        estimatedDuration: formData.estimatedDuration,
        description: formData.description,
        affectedPorts: formData.affectedPorts,
        notifyUsers: formData.notifyUsers,
        maintenanceTeam: formData.maintenanceTeam,
        contactPerson: formData.contactPerson,
        contactPhone: formData.contactPhone,
        specialInstructions: formData.specialInstructions,
        status: "scheduled",
        createdAt: new Date().toISOString(),
        createdBy: "admin", // Should be current user
      };

      await onSchedule(maintenanceData);
      onClose();
      
    } catch (error) {
      console.error("Error scheduling maintenance:", error);
      alert("Có lỗi xảy ra khi lên lịch bảo trì. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type) => {
    const typeConfig = maintenanceTypes.find(t => t.value === type);
    return typeConfig?.color || "default";
  };

  const getPriorityColor = (priority) => {
    const priorityConfig = priorityLevels.find(p => p.value === priority);
    return priorityConfig?.color || "default";
  };

  const generateAvailablePorts = () => {
    const totalPorts = station?.charging?.totalPorts || 4;
    const ports = [];
    for (let i = 1; i <= totalPorts; i++) {
      ports.push(`Port ${i}`);
    }
    return ports;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pb: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Build sx={{ mr: 1, color: 'warning.main' }} />
            <Typography variant="h6" fontWeight="bold">
              Lên lịch bảo trì
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 3 }}>
          {/* Station Info */}
          <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h6" color="primary" gutterBottom>
                {station?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {station?.location?.address}, {station?.location?.city}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip 
                  label={`${station?.charging?.totalPorts || 0} cổng sạc`} 
                  size="small" 
                  color="info" 
                />
                <Chip 
                  label={station?.status === 'active' ? 'Hoạt động' : 'Không hoạt động'} 
                  size="small" 
                  color={station?.status === 'active' ? 'success' : 'error'} 
                />
              </Box>
            </CardContent>
          </Card>

          <Grid container spacing={3}>
            {/* Maintenance Type & Priority */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Build sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" color="primary">
                  Loại bảo trì
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Loại bảo trì</InputLabel>
                <Select
                  value={formData.maintenanceType}
                  label="Loại bảo trì"
                  onChange={(e) => handleInputChange('maintenanceType', e.target.value)}
                >
                  {maintenanceTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Chip 
                        label={type.label} 
                        color={type.color} 
                        size="small" 
                        sx={{ mr: 1 }} 
                      />
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Mức độ ưu tiên</InputLabel>
                <Select
                  value={formData.priority}
                  label="Mức độ ưu tiên"
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                >
                  {priorityLevels.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      <Chip 
                        label={priority.label} 
                        color={priority.color} 
                        size="small" 
                        sx={{ mr: 1 }} 
                      />
                      {priority.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mô tả bảo trì *"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                error={!!errors.description}
                helperText={errors.description}
                multiline
                rows={3}
                placeholder="Mô tả chi tiết về công việc bảo trì cần thực hiện..."
              />
            </Grid>

            {/* Schedule */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" color="primary">
                  Lịch trình
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Ngày bảo trì *"
                value={formData.scheduledDate}
                onChange={(newValue) => handleInputChange('scheduledDate', newValue)}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    fullWidth 
                    error={!!errors.scheduledDate}
                    helperText={errors.scheduledDate}
                  />
                )}
                minDate={new Date()}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TimePicker
                label="Giờ bắt đầu *"
                value={formData.scheduledTime}
                onChange={(newValue) => handleInputChange('scheduledTime', newValue)}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    fullWidth 
                    error={!!errors.scheduledTime}
                    helperText={errors.scheduledTime}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Thời gian ước tính (giờ) *"
                type="number"
                value={formData.estimatedDuration}
                onChange={(e) => handleInputChange('estimatedDuration', parseFloat(e.target.value) || 0)}
                error={!!errors.estimatedDuration}
                helperText={errors.estimatedDuration}
                inputProps={{ min: 0.5, step: 0.5 }}
                InputProps={{
                  endAdornment: <Typography variant="body2" color="text.secondary">giờ</Typography>
                }}
              />
            </Grid>

            {/* Affected Ports */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="h6" color="primary" gutterBottom>
                Cổng sạc bị ảnh hưởng *
              </Typography>
              <FormControl fullWidth error={!!errors.affectedPorts}>
                <InputLabel>Chọn cổng sạc</InputLabel>
                <Select
                  multiple
                  value={formData.affectedPorts}
                  onChange={(e) => handleInputChange('affectedPorts', e.target.value)}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {generateAvailablePorts().map((port) => (
                    <MenuItem key={port} value={port}>
                      {port}
                    </MenuItem>
                  ))}
                </Select>
                {errors.affectedPorts && (
                  <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                    {errors.affectedPorts}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Team & Contact */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="h6" color="primary" gutterBottom>
                Thông tin đội bảo trì
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Đội bảo trì *"
                value={formData.maintenanceTeam}
                onChange={(e) => handleInputChange('maintenanceTeam', e.target.value)}
                error={!!errors.maintenanceTeam}
                helperText={errors.maintenanceTeam}
                placeholder="Ví dụ: Đội kỹ thuật A"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Người liên hệ *"
                value={formData.contactPerson}
                onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                error={!!errors.contactPerson}
                helperText={errors.contactPerson}
                placeholder="Ví dụ: Nguyễn Văn A"
              />
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
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.notifyUsers}
                    onChange={(e) => handleInputChange('notifyUsers', e.target.checked)}
                    color="primary"
                  />
                }
                label="Thông báo cho người dùng"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hướng dẫn đặc biệt"
                value={formData.specialInstructions}
                onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                multiline
                rows={2}
                placeholder="Các hướng dẫn đặc biệt hoặc lưu ý cho đội bảo trì..."
              />
            </Grid>
          </Grid>

          {/* Warning Alert */}
          <Alert severity="warning" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Lưu ý:</strong> Trong thời gian bảo trì, các cổng sạc được chọn sẽ không khả dụng. 
              {formData.notifyUsers && " Người dùng sẽ được thông báo trước về lịch bảo trì này."}
            </Typography>
          </Alert>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} variant="outlined">
            Hủy
          </Button>
          <Button 
            onClick={handleSchedule} 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Schedule />}
            sx={{ minWidth: 140 }}
          >
            {loading ? 'Đang lên lịch...' : 'Lên lịch bảo trì'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ScheduleMaintenanceModal;

