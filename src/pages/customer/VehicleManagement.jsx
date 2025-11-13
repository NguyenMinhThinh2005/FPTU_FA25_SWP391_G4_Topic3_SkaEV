import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import useVehicleStore from "../../store/vehicleStore";
import useAuthStore from "../../store/authStore";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Avatar,
  IconButton,
  Chip,
  Alert,
  Divider,
  Container,
  Stack,
  Paper,
  LinearProgress,
} from "@mui/material";
import {
  DirectionsCar,
  Add,
  Edit,
  Delete,
  ElectricCar,
  Battery80,
  Speed,
  Info,
} from "@mui/icons-material";
import VehicleEditModal from "../../components/customer/VehicleEditModal";

const VehicleManagement = () => {
  const [searchParams] = useSearchParams();

  // Store hooks
  const {
    vehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    setDefaultVehicle,
    initializeData,
    isLoading,
    error,
    clearError,
    pendingRetry,
    nextRetryAt,
    cancelPendingRetry,
  } = useVehicleStore();
  const { user } = useAuthStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const isRetryWaiting = pendingRetry && !isLoading;
  const showStatusAlert =
    !pendingRetry && (error || actionError || actionSuccess);

  useEffect(() => {
    if (!actionSuccess) {
      return undefined;
    }
    const timeout = setTimeout(() => {
      setActionSuccess("");
    }, 4000);
    return () => clearTimeout(timeout);
  }, [actionSuccess]);

  useEffect(() => {
    if (error) {
      console.error("[VehicleManagement] Store error", error);
    }
  }, [error]);

  useEffect(() => {
    if (actionError) {
      console.error("[VehicleManagement] Action error", actionError);
    }
  }, [actionError]);

  useEffect(() => {
    if (!pendingRetry || !nextRetryAt) {
      setRetryCountdown(0);
      return undefined;
    }

    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.ceil((nextRetryAt - Date.now()) / 1000)
      );
      setRetryCountdown(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 500);
    return () => clearInterval(interval);
  }, [pendingRetry, nextRetryAt]);

  // Initialize store with user data
  useEffect(() => {
    if (user) {
      Promise.resolve(initializeData()).catch(() => {
        // Error state is handled inside the store; prevent unhandled promise rejection.
      });
    }
  }, [user, initializeData]);

  useEffect(() => () => cancelPendingRetry(), [cancelPendingRetry]);

  // Remove mock data, use store instead
  const connectorTypes = [
    { value: "CCS2", label: "CCS2 (Combined Charging System)" },
    { value: "CHAdeMO", label: "CHAdeMO" },
    { value: "Type2", label: "Type 2 (AC)" },
    { value: "Tesla", label: "Tesla Supercharger" },
  ];

  const handleAddNew = useCallback(() => {
    console.debug("[VehicleManagement] Opening add vehicle modal");
    setSelectedVehicle(null);
    setActionError("");
    clearError();
    setDialogOpen(true);
  }, [clearError]);

  const handleEdit = useCallback(
    (vehicle) => {
      setSelectedVehicle(vehicle);
      setActionError("");
      clearError();
      setDialogOpen(true);
    },
    [clearError]
  );

  const handleDelete = useCallback(
    async (vehicleId) => {
      setActionError("");
      clearError();
      try {
        await deleteVehicle(vehicleId);
        setActionSuccess("Đã xóa xe thành công");
      } catch (err) {
        setActionError(err.message || "Không thể xóa xe");
      }
    },
    [clearError, deleteVehicle]
  );

  const handleSetDefault = useCallback(
    async (vehicleId) => {
      setActionError("");
      clearError();
      try {
        await setDefaultVehicle(vehicleId);
        setActionSuccess("Đã đặt xe mặc định thành công");
      } catch (err) {
        setActionError(err.message || "Không thể đặt xe mặc định");
      }
    },
    [clearError, setDefaultVehicle]
  );

  const handleSave = useCallback(
    async (formData, isDefault) => {
      if (isSubmitting) {
        console.debug(
          "[VehicleManagement] Ignoring save request while submitting"
        );
        return;
      }

      setIsSubmitting(true);
      setActionError("");
      clearError();
      if (formData && formData._delete) {
        const idToDelete =
          formData._id || (selectedVehicle && selectedVehicle.id);
        if (idToDelete) {
          await handleDelete(idToDelete);
        }
        setDialogOpen(false);
        setSelectedVehicle(null);
        setIsSubmitting(false);
        return;
      }
      try {
        if (selectedVehicle) {
          const updated = await updateVehicle(selectedVehicle.id, {
            ...formData,
            isDefault: isDefault ?? selectedVehicle.isDefault,
          });

          if (isDefault) {
            await setDefaultVehicle(updated?.id || selectedVehicle.id);
          }
          setActionSuccess("Đã cập nhật thông tin xe");
        } else {
          const newVehicle = await addVehicle({
            ...formData,
            isDefault,
          });
          if (isDefault && newVehicle?.id) {
            await setDefaultVehicle(newVehicle.id);
          }
          setActionSuccess("Đã thêm xe mới thành công");
        }
      } catch (err) {
        console.error("[VehicleManagement] Failed to save vehicle", err);
        setActionError(err.message || "Không thể lưu thông tin xe");
        return;
      } finally {
        setIsSubmitting(false);
      }
      setDialogOpen(false);
      setSelectedVehicle(null);
    },
    [
      addVehicle,
      clearError,
      handleDelete,
      isSubmitting,
      selectedVehicle,
      setDefaultVehicle,
      updateVehicle,
    ]
  );

  // Handle query parameters for navigation from CustomerProfile
  useEffect(() => {
    const editId = searchParams.get("edit");
    const shouldAdd = searchParams.get("add");

    if (editId && vehicles.length > 0) {
      const vehicleToEdit = vehicles.find(
        (v) => String(v.id) === editId || String(v.vehicleId) === editId
      );
      if (vehicleToEdit) {
        handleEdit(vehicleToEdit);
      }
    } else if (shouldAdd === "true") {
      handleAddNew();
    }
  }, [handleAddNew, handleEdit, searchParams, vehicles]);

  const getConnectorTypeLabel = (types) => {
    if (Array.isArray(types)) {
      return types
        .map((type) => {
          const connector = connectorTypes.find((c) => c.value === type);
          return connector ? connector.label : type;
        })
        .join(", ");
    }
    // Fallback for single type (backward compatibility)
    const connector = connectorTypes.find((c) => c.value === types);
    return connector ? connector.label : types;
  };

  const hasVehicles = vehicles.length > 0;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {hasVehicles && (
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            background: "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)",
            borderRadius: 3,
            p: { xs: 3, md: 3.5 },
            color: "white",
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              right: 0,
              width: "28%",
              height: "100%",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            },
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 2, md: 3 }}
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack direction="row" alignItems="center" spacing={2.5}>
              <Avatar
                sx={{
                  width: 68,
                  height: 68,
                  background: "rgba(255,255,255,0.18)",
                  border: "2px solid rgba(255,255,255,0.28)",
                }}
              >
                <DirectionsCar sx={{ fontSize: 34, color: "white" }} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Quản lý xe của bạn
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Theo dõi cấu hình và đặt xe mặc định cho những chuyến sạc kế
                  tiếp.
                </Typography>
              </Box>
            </Stack>
            <Button
              variant="contained"
              size="medium"
              startIcon={<Add />}
              onClick={handleAddNew}
              sx={{
                background: "rgba(255,255,255,0.25)",
                border: "1px solid rgba(255,255,255,0.3)",
                "&:hover": { background: "rgba(255,255,255,0.35)" },
                minWidth: 150,
              }}
            >
              Thêm xe mới
            </Button>
          </Stack>
        </Paper>
      )}

      {hasVehicles && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Info />
            <Typography variant="body2">
              Thông tin xe giúp hệ thống đề xuất trạm sạc và cài đặt sạc phù hợp
              với xe của bạn.
            </Typography>
          </Box>
        </Alert>
      )}

      {isRetryWaiting && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Info />
              <Typography variant="body2">
                Đang thử kết nối lại với máy chủ xe. Danh sách sẽ tự động tải
                lại
                {retryCountdown > 0
                  ? ` trong ${retryCountdown}s`
                  : " ngay khi sẵn sàng"}
                .
              </Typography>
            </Box>
            <LinearProgress sx={{ height: 6, borderRadius: 3 }} />
          </Box>
        </Alert>
      )}

      {/* Vehicle List */}
      {showStatusAlert && (
        <Alert
          severity={actionError ? "error" : error ? "error" : "success"}
          sx={{ mb: 3 }}
          onClose={() => {
            setActionError("");
            setActionSuccess("");
            clearError();
          }}
        >
          {actionError || error || actionSuccess}
        </Alert>
      )}

      {!hasVehicles && !isLoading ? (
        <Card sx={{ textAlign: "center", py: 6 }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
              <ElectricCar sx={{ fontSize: 56, color: "grey.400" }} />
            </Box>
            <Typography variant="h6" color="text.primary" sx={{ mb: 1 }}>
              Thêm xe điện đầu tiên của bạn
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Cung cấp thông tin để SkaEV gợi ý trạm sạc và cấu hình chính xác
              hơn.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddNew}
            >
              Thêm xe đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {vehicles.map((vehicle) => (
            <Grid item xs={12} md={6} key={vehicle.id || vehicle.vehicleId}>
              <Card
                sx={{
                  border: vehicle.isDefault ? 2 : 1,
                  borderColor: vehicle.isDefault ? "primary.main" : "divider",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 2,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: vehicle.isDefault
                            ? "primary.main"
                            : "grey.300",
                        }}
                      >
                        <ElectricCar />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {vehicle.nickname ||
                            vehicle.displayName ||
                            vehicle.licensePlate ||
                            "Xe điện"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {[vehicle.make, vehicle.model]
                            .filter(Boolean)
                            .join(" ") || ""}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(vehicle)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() =>
                          handleDelete(vehicle.id || vehicle.vehicleId)
                        }
                        disabled={vehicle.isDefault}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>

                  {vehicle.isDefault && (
                    <Chip
                      label="Xe mặc định"
                      size="small"
                      color="primary"
                      sx={{ mb: 2 }}
                    />
                  )}

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <Battery80
                          sx={{ fontSize: 16, color: "success.main" }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          Dung lượng pin
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="medium">
                        {vehicle.batteryCapacity} kWh
                      </Typography>
                    </Grid>

                    <Grid item xs={6}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <Speed sx={{ fontSize: 16, color: "info.main" }} />
                        <Typography variant="body2" color="text.secondary">
                          Tốc độ sạc tối đa
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="medium">
                        {vehicle.maxChargingSpeed} kW
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Loại cổng sạc:{" "}
                        {getConnectorTypeLabel(
                          vehicle.connectorTypes ||
                            [vehicle.connectorType].filter(Boolean)
                        )}
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Biển số: <strong>{vehicle.licensePlate || "--"}</strong>{" "}
                        • Màu: <strong>{vehicle.color || "--"}</strong>
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  {!vehicle.isDefault && (
                    <Button
                      size="small"
                      onClick={() =>
                        handleSetDefault(vehicle.id || vehicle.vehicleId)
                      }
                    >
                      Đặt làm xe mặc định
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
          {isLoading && (
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Đang tải danh sách xe...
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Add/Edit Vehicle Dialog */}
      <VehicleEditModal
        open={dialogOpen}
        onClose={() => {
          if (isSubmitting) {
            return;
          }
          setDialogOpen(false);
          setSelectedVehicle(null);
          setActionError("");
          clearError();
        }}
        vehicle={selectedVehicle}
        onSave={handleSave}
        submitting={isSubmitting}
      />
    </Container>
  );
};

export default VehicleManagement;
