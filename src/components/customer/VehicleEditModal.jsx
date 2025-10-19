/* eslint-disable */
import React, { useState, useEffect } from "react";
import ConfirmDialog from "../ui/ConfirmDialog";
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
  FormControlLabel,
  Switch,
  Divider
} from "@mui/material";
import {
  Close,
  Add,
  Delete,
  ElectricCar,
  BatteryFull,
  Speed,
  EmojiNature
} from "@mui/icons-material";
import { CONNECTOR_TYPES } from "../../utils/constants";

const VehicleEditModal = ({ open, onClose, vehicle, onSave, onSetDefault }) => {
  const [formData, setFormData] = useState({
    nickname: "",
    make: "",
    model: "",
    year: "",
    batteryCapacity: "",
    maxChargingSpeed: "",
    connectorTypes: [],
    licensePlate: "",
    color: ""
  });
  const [isDefault, setIsDefault] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [newConnectorType, setNewConnectorType] = useState("");

  const connectorTypeOptions = [
    { value: CONNECTOR_TYPES.TYPE2, label: "Type 2 (AC)" },
    { value: CONNECTOR_TYPES.CCS2, label: "CCS2 (DC)" },
    { value: CONNECTOR_TYPES.CHADEMO, label: "CHAdeMO" },
    { value: CONNECTOR_TYPES.GB_T, label: "GB/T" },
    { value: CONNECTOR_TYPES.TESLA, label: "Tesla Supercharger" }
  ];

  useEffect(() => {
    if (vehicle) {
      setFormData({
        nickname: vehicle.nickname || "",
        make: vehicle.make || "",
        model: vehicle.model || "",
        year: vehicle.year || "",
        batteryCapacity: vehicle.batteryCapacity || "",
        maxChargingSpeed: vehicle.maxChargingSpeed || "",
        connectorTypes: vehicle.connectorTypes || [],
        licensePlate: vehicle.licensePlate || "",
        color: vehicle.color || ""
      });
      setIsDefault(vehicle.isDefault || false);
    } else {
      setIsDefault(false);
    }
  }, [vehicle]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddConnectorType = () => {
    if (newConnectorType && !formData.connectorTypes.includes(newConnectorType)) {
      setFormData(prev => ({
        ...prev,
        connectorTypes: [...prev.connectorTypes, newConnectorType]
      }));
      setNewConnectorType("");
    }
  };

  const handleRemoveConnectorType = (typeToRemove) => {
    setFormData(prev => ({
      ...prev,
      connectorTypes: prev.connectorTypes.filter(type => type !== typeToRemove)
    }));
  };


  const handleSave = () => {
    // Validate required fields
    if (!formData.make || !formData.model || !formData.year) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc (Hãng xe, Model, Năm sản xuất)");
      return;
    }
    if (formData.connectorTypes.length === 0) {
      alert("Vui lòng chọn ít nhất một loại sạc hỗ trợ");
      return;
    }
    onSave(formData, isDefault);
    onClose();
  };

  // Delete vehicle logic
  const handleDelete = () => {
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    setConfirmOpen(false);
    if (typeof onSave === 'function') {
      onSave({ ...formData, _delete: true, _id: vehicle?.id });
    }
    onClose();
  };

  const calculateRange = () => {
    const capacity = parseFloat(formData.batteryCapacity);
    const efficiency = 5.2; // km/kWh
    return capacity ? Math.floor(capacity * efficiency) : 0;
  };

  return (
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
          <ElectricCar sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight="bold">
            Chỉnh sửa thông tin xe
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
            <Typography variant="h6" gutterBottom color="primary">
              Thông tin cơ bản
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Tên xe (nickname)"
              value={formData.nickname}
              onChange={(e) => handleInputChange('nickname', e.target.value)}
              placeholder="Ví dụ: Xe chính, Xe gia đình"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Hãng xe *"
              value={formData.make}
              onChange={(e) => handleInputChange('make', e.target.value)}
              placeholder="Ví dụ: Tesla, VinFast, BMW"
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Model *"
              value={formData.model}
              onChange={(e) => handleInputChange('model', e.target.value)}
              placeholder="Ví dụ: Model 3, VF8, iX"
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Năm sản xuất *"
              value={formData.year}
              onChange={(e) => handleInputChange('year', e.target.value)}
              placeholder="Ví dụ: 2024"
              type="number"
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Biển số xe"
              value={formData.licensePlate}
              onChange={(e) => handleInputChange('licensePlate', e.target.value)}
              placeholder="Ví dụ: 30A-123.45"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Màu sắc"
              value={formData.color}
              onChange={(e) => handleInputChange('color', e.target.value)}
              placeholder="Ví dụ: Xanh, Trắng, Đen"
            />
          </Grid>

          {/* Technical Specifications */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Thông số kỹ thuật
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Dung lượng pin (kWh)"
              value={formData.batteryCapacity}
              onChange={(e) => handleInputChange('batteryCapacity', e.target.value)}
              placeholder="Ví dụ: 87.7"
              type="number"
              InputProps={{
                endAdornment: <BatteryFull sx={{ color: 'text.secondary' }} />
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Tốc độ sạc tối đa (kW)"
              value={formData.maxChargingSpeed}
              onChange={(e) => handleInputChange('maxChargingSpeed', e.target.value)}
              placeholder="Ví dụ: 150"
              type="number"
              InputProps={{
                endAdornment: <Speed sx={{ color: 'text.secondary' }} />
              }}
            />
          </Grid>

          {/* Range Preview */}
          {formData.batteryCapacity && (
            <Grid item xs={12}>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <EmojiNature color="primary" />
                <Typography variant="body2" color="text.secondary">
                  Quãng đường ước tính: <strong>{calculateRange()} km</strong> 
                  (hiệu suất 5.2 km/kWh)
                </Typography>
              </Box>
            </Grid>
          )}

          {/* Charging Types */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Loại sạc hỗ trợ *
            </Typography>
          </Grid>

          <Grid item xs={12} sm={8}>
            <FormControl fullWidth>
              <InputLabel>Thêm loại sạc</InputLabel>
              <Select
                value={newConnectorType}
                onChange={(e) => setNewConnectorType(e.target.value)}
                label="Thêm loại sạc"
              >
                {connectorTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Add />}
              onClick={handleAddConnectorType}
              disabled={!newConnectorType}
              sx={{ height: '56px' }}
            >
              Thêm
            </Button>
          </Grid>

          {/* Selected Connector Types */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {formData.connectorTypes.map((type, index) => (
                <Chip
                  key={index}
                  label={connectorTypeOptions.find(opt => opt.value === type)?.label || type}
                  onDelete={() => handleRemoveConnectorType(type)}
                  deleteIcon={<Delete />}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>

          {/* Default Vehicle Setting */}

        </Grid>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          <Button onClick={onClose} variant="outlined" sx={{ mr: 1 }}>
            Hủy
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            color="primary"
            sx={{ minWidth: 120 }}
          >
            Lưu thay đổi
          </Button>
        </Box>
        <Button 
          onClick={handleDelete} 
          variant="outlined" 
          color="error"
        >
          Xóa xe
        </Button>
        <ConfirmDialog
          open={confirmOpen}
          title="Xác nhận xóa xe"
          message="Bạn có chắc chắn muốn xóa xe này? Hành động này không thể hoàn tác."
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmOpen(false)}
        />
      </DialogActions>
    </Dialog>
  );
};

export default VehicleEditModal;
