import React, { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../ui/ConfirmDialog";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Close, ElectricCar, InfoOutlined } from "@mui/icons-material";
import {
  getSupportedBrands,
  getModelsByBrand,
  getModelSpecs,
  getVehicleCategory,
} from "../../data/vehicleCatalog";

const DEFAULT_FORM = {
  make: "",
  model: "",
  nickname: "",
  year: "",
  licensePlate: "",
  color: "",
  batteryCapacity: "",
  maxChargingSpeed: "",
  connectorTypes: [],
  vehicleType: "car",
};

const ensureArray = (value) => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  return [value].filter(Boolean);
};

const normalizeVehicleForForm = (vehicle) => {
  if (!vehicle) {
    return { ...DEFAULT_FORM };
  }

  const make = vehicle.make || vehicle.vehicleMake || "";
  const model = vehicle.model || vehicle.vehicleModel || "";
  const vehicleTypeFromCatalog = getVehicleCategory(make, model);

  return {
    make,
    model,
    nickname: vehicle.nickname || vehicle.vehicleName || "",
    year: vehicle.year
      ? String(vehicle.year)
      : vehicle.vehicleYear
      ? String(vehicle.vehicleYear)
      : "",
    licensePlate: vehicle.licensePlate || "",
    color: vehicle.color || "",
    batteryCapacity:
      vehicle.batteryCapacity !== undefined && vehicle.batteryCapacity !== null
        ? String(vehicle.batteryCapacity)
        : "",
    maxChargingSpeed:
      vehicle.maxChargingSpeed !== undefined &&
      vehicle.maxChargingSpeed !== null
        ? String(vehicle.maxChargingSpeed)
        : "",
    connectorTypes: ensureArray(
      vehicle.connectorTypes ||
        vehicle.connectorType ||
        vehicle.chargingPortType
    ),
    vehicleType:
      vehicle.vehicleType ||
      vehicle.vehicle_type ||
      vehicleTypeFromCatalog ||
      "car",
  };
};

const withSpecDefaults = (form, specs) => {
  if (!specs) {
    return {
      ...form,
      connectorTypes: ensureArray(form.connectorTypes),
    };
  }

  const next = {
    ...form,
    connectorTypes: specs.connectorTypes
      ? ensureArray(specs.connectorTypes)
      : ensureArray(form.connectorTypes),
  };

  if (!form.year && specs.year) {
    next.year = String(specs.year);
  }
  if (!form.nickname && specs.defaultNickname) {
    next.nickname = specs.defaultNickname;
  }
  if (!form.batteryCapacity && specs.batteryCapacity !== undefined) {
    next.batteryCapacity = String(specs.batteryCapacity);
  }
  if (!form.maxChargingSpeed && specs.maxChargingSpeed !== undefined) {
    next.maxChargingSpeed = String(specs.maxChargingSpeed);
  }

  if (specs.category) {
    next.vehicleType = specs.category;
  }

  return next;
};

const formatConnectorList = (connectors) => {
  const normalized = ensureArray(connectors);
  if (!normalized.length) {
    return "";
  }
  return normalized.join(", ");
};

const buildSpecSummary = (specs) => {
  if (!specs) {
    return "";
  }

  const parts = [];
  if (specs.batteryCapacity) {
    parts.push(`Pin ${specs.batteryCapacity} kWh`);
  }
  if (specs.maxChargingSpeed) {
    parts.push(`Sạc tối đa ${specs.maxChargingSpeed} kW`);
  }

  const connectors = formatConnectorList(specs.connectorTypes);
  if (connectors) {
    parts.push(`Cổng ${connectors}`);
  }

  if (specs.notes) {
    parts.push(specs.notes);
  }

  return parts.join(" • ");
};

const VehicleEditModal = ({
  open,
  onClose,
  vehicle,
  onSave,
  submitting = false,
}) => {
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [isDefault, setIsDefault] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const brandOptions = useMemo(() => getSupportedBrands(), []);
  const modelOptions = useMemo(
    () => getModelsByBrand(formData.make),
    [formData.make]
  );
  const selectedSpec = useMemo(
    () => getModelSpecs(formData.make, formData.model),
    [formData.make, formData.model]
  );
  const connectorChoices = useMemo(
    () => ensureArray(selectedSpec?.connectorTypes),
    [selectedSpec]
  );
  const specSummary = useMemo(
    () => buildSpecSummary(selectedSpec),
    [selectedSpec]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (vehicle) {
      const normalized = normalizeVehicleForForm(vehicle);
      const specs = getModelSpecs(normalized.make, normalized.model);
      setFormData(withSpecDefaults(normalized, specs));
      setIsDefault(Boolean(vehicle.isDefault));
    } else {
      setFormData({ ...DEFAULT_FORM });
      setIsDefault(false);
    }

    setValidationError("");
  }, [open, vehicle]);

  useEffect(() => {
    if (!open) {
      setConfirmOpen(false);
    }
  }, [open]);

  const handleBrandChange = (brand) => {
    setFormData((prev) => ({
      ...DEFAULT_FORM,
      make: brand,
      nickname: prev.nickname,
    }));
  };

  const handleModelChange = (modelName) => {
    setFormData((prev) => {
      const previousSpec = getModelSpecs(prev.make, prev.model);
      const previousDefault = previousSpec?.defaultNickname || "";
      const specs = getModelSpecs(prev.make, modelName);
      const next = withSpecDefaults({ ...prev, model: modelName }, specs);

      if (
        prev.nickname &&
        previousDefault &&
        prev.nickname !== "" &&
        prev.nickname !== previousDefault
      ) {
        next.nickname = prev.nickname;
      } else if (specs?.defaultNickname) {
        next.nickname = specs.defaultNickname;
      }

      return next;
    });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleConfirmDelete = () => {
    setConfirmOpen(false);
    onSave?.({
      ...formData,
      _delete: true,
      _id: vehicle?.id ?? vehicle?.vehicleId ?? null,
    });
  };

  const handleSave = async () => {
    setValidationError("");

    if (!formData.nickname?.trim()) {
      setValidationError("Vui lòng nhập tên gợi nhớ cho xe");
      return;
    }

    if (!formData.make) {
      setValidationError("Vui lòng chọn hãng xe");
      return;
    }

    if (!formData.model) {
      setValidationError("Vui lòng chọn mẫu xe");
      return;
    }

    const connectorSelection = ensureArray(
      formData.connectorTypes.length
        ? formData.connectorTypes
        : connectorChoices
    );

    const payload = {
      ...formData,
      nickname: formData.nickname?.trim() || "",
      year: formData.year?.trim() || "",
      licensePlate: formData.licensePlate?.trim() || "",
      color: formData.color?.trim() || "",
      connectorTypes: connectorSelection,
      vehicleType: getVehicleCategory(formData.make, formData.model),
    };

    try {
      await onSave?.(payload, isDefault);
    } catch (error) {
      console.error("[VehicleEditModal] Failed to save vehicle", error);
      setValidationError(error?.message || "Không thể lưu thông tin xe");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ElectricCar sx={{ color: "primary.main" }} />
          <Typography variant="h6" fontWeight="bold">
            {vehicle ? "Chỉnh sửa thông tin xe" : "Thêm xe mới"}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          disabled={submitting}
          aria-label="Đóng"
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="body1" fontWeight={600} gutterBottom>
              Thông tin xe điện của bạn
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Chúng tôi sử dụng thông tin này để gợi ý trạm sạc và giữ hồ sơ xe
              chính xác.
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required disabled={submitting}>
              <InputLabel>Hãng xe</InputLabel>
              <Select
                value={formData.make}
                label="Hãng xe"
                onChange={(event) => handleBrandChange(event.target.value)}
              >
                {brandOptions.map((brand) => (
                  <MenuItem key={brand} value={brand}>
                    {brand}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Chọn hãng để xem các mẫu xe hỗ trợ bởi SkaEV
              </FormHelperText>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl
              fullWidth
              required
              disabled={!formData.make || submitting}
            >
              <InputLabel>Mẫu xe</InputLabel>
              <Select
                value={formData.model}
                label="Mẫu xe"
                onChange={(event) => handleModelChange(event.target.value)}
              >
                {modelOptions.map(({ name, notes }) => (
                  <MenuItem key={name} value={name}>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Typography variant="body1">{name}</Typography>
                      {notes && (
                        <Typography variant="caption" color="text.secondary">
                          {notes}
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {formData.make
                  ? "Chọn mẫu xe bạn đang sử dụng"
                  : "Vui lòng chọn hãng xe trước"}
              </FormHelperText>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Tên gợi nhớ"
              placeholder="Ví dụ: Xe gia đình"
              value={formData.nickname}
              onChange={(event) =>
                handleInputChange("nickname", event.target.value)
              }
              disabled={submitting}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Năm sản xuất"
              value={formData.year}
              onChange={(event) =>
                handleInputChange("year", event.target.value)
              }
              placeholder="Ví dụ: 2024"
              type="number"
              inputProps={{ min: 1990, max: new Date().getFullYear() + 1 }}
              disabled={submitting}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Biển số"
              value={formData.licensePlate}
              onChange={(event) =>
                handleInputChange("licensePlate", event.target.value)
              }
              placeholder="Thêm nếu bạn muốn đồng bộ nhanh hơn"
              disabled={submitting}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Màu sắc"
              value={formData.color}
              onChange={(event) =>
                handleInputChange("color", event.target.value)
              }
              placeholder="Ví dụ: Trắng, Đen"
              disabled={submitting}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={isDefault}
                  onChange={(event) => setIsDefault(event.target.checked)}
                  color="primary"
                  disabled={submitting}
                />
              }
              label="Đặt làm xe mặc định"
            />
          </Grid>

          {specSummary && (
            <Grid item xs={12}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Tooltip
                  title="Thông tin kỹ thuật được SkaEV gợi ý tự động"
                  arrow
                >
                  <InfoOutlined
                    sx={{ fontSize: 18, color: "text.secondary" }}
                  />
                </Tooltip>
                <Typography variant="body2" color="text.secondary">
                  {specSummary}
                </Typography>
              </Box>
            </Grid>
          )}

          {validationError && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {validationError}
              </Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, justifyContent: "space-between" }}>
        <Box>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{ mr: 1 }}
            disabled={submitting}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            disabled={submitting}
            sx={{ minWidth: 140 }}
          >
            {submitting ? "Đang lưu..." : "Lưu thông tin"}
          </Button>
        </Box>
        {!!vehicle && (
          <Button
            onClick={() => setConfirmOpen(true)}
            variant="outlined"
            color="error"
            disabled={submitting}
          >
            Xóa xe
          </Button>
        )}
      </DialogActions>

      <ConfirmDialog
        open={confirmOpen}
        title="Xác nhận xóa xe"
        message="Bạn có chắc chắn muốn xóa xe này? Hành động này không thể hoàn tác."
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </Dialog>
  );
};

export default VehicleEditModal;
