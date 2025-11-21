import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import PropTypes from "prop-types";

const StationDialog = ({
  open,
  onClose,
  selectedStation,
  stationForm,
  setStationForm,
  errors,
  setErrors,
  staffUsers,
  handleSaveStation,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {selectedStation
          ? "Chỉnh sửa: " + selectedStation.name
          : "Thêm trạm sạc nhanh"}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tên trạm sạc *"
                value={stationForm.name}
                onChange={(e) => {
                  setStationForm({ ...stationForm, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Địa chỉ *"
                value={stationForm.address}
                onChange={(e) => {
                  setStationForm({ ...stationForm, address: e.target.value });
                  if (errors.address) setErrors({ ...errors, address: "" });
                }}
                error={!!errors.address}
                helperText={errors.address}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tổng cổng"
                type="number"
                value={stationForm.totalPorts}
                onChange={(e) => {
                  setStationForm({
                    ...stationForm,
                    totalPorts: parseInt(e.target.value) || 0,
                  });
                  if (errors.totalPorts)
                    setErrors({ ...errors, totalPorts: "" });
                }}
                error={!!errors.totalPorts}
                helperText={errors.totalPorts}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Sạc nhanh (DC)"
                type="number"
                value={stationForm.fastChargePorts}
                onChange={(e) => {
                  setStationForm({
                    ...stationForm,
                    fastChargePorts: parseInt(e.target.value) || 0,
                  });
                  if (errors.fastChargePorts)
                    setErrors({ ...errors, fastChargePorts: "" });
                }}
                error={!!errors.fastChargePorts}
                helperText={errors.fastChargePorts}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Sạc tiêu chuẩn (AC)"
                type="number"
                value={stationForm.standardPorts}
                onChange={(e) => {
                  setStationForm({
                    ...stationForm,
                    standardPorts: parseInt(e.target.value) || 0,
                  });
                  if (errors.standardPorts)
                    setErrors({ ...errors, standardPorts: "" });
                }}
                error={!!errors.standardPorts}
                helperText={errors.standardPorts}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Giá (VND/kWh)"
                type="number"
                value={stationForm.pricePerKwh}
                onChange={(e) => {
                  setStationForm({
                    ...stationForm,
                    pricePerKwh: parseFloat(e.target.value) || 0,
                  });
                  if (errors.pricePerKwh)
                    setErrors({ ...errors, pricePerKwh: "" });
                }}
                error={!!errors.pricePerKwh}
                helperText={errors.pricePerKwh}
              />
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={stationForm.status}
                  label="Trạng thái"
                  onChange={(e) =>
                    setStationForm({ ...stationForm, status: e.target.value })
                  }
                >
                  <MenuItem value="active">Đang hoạt động</MenuItem>
                  <MenuItem value="maintenance">Bảo trì</MenuItem>
                  <MenuItem value="offline">Ngoại tuyến</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Nhân viên quản lý</InputLabel>
                <Select
                  value={stationForm.managerUserId || ""}
                  label="Nhân viên quản lý"
                  onChange={(e) =>
                    setStationForm({
                      ...stationForm,
                      managerUserId: e.target.value || null,
                    })
                  }
                >
                  <MenuItem value="">
                    <em>Không có</em>
                  </MenuItem>
                  {staffUsers.map((staff) => (
                    <MenuItem key={staff.userId} value={staff.userId}>
                      {staff.fullName || staff.email} - {staff.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cổng có sẵn"
                type="number"
                value={stationForm.availableSlots}
                onChange={(e) => {
                  setStationForm({
                    ...stationForm,
                    availableSlots: parseInt(e.target.value) || 0,
                  });
                  if (errors.availableSlots)
                    setErrors({ ...errors, availableSlots: "" });
                }}
                error={!!errors.availableSlots}
                helperText={errors.availableSlots}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
        <Button variant="contained" onClick={handleSaveStation}>
          {selectedStation ? "Lưu" : "Tạo trạm sạc"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

StationDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedStation: PropTypes.object,
  stationForm: PropTypes.object.isRequired,
  setStationForm: PropTypes.func.isRequired,
  errors: PropTypes.object.isRequired,
  setErrors: PropTypes.func.isRequired,
  staffUsers: PropTypes.array.isRequired,
  handleSaveStation: PropTypes.func.isRequired,
};

export default StationDialog;
