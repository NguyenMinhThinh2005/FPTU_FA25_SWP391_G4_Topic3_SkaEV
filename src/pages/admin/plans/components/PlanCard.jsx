import React from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  FormControlLabel,
  Switch
} from "@mui/material";
import {
  Edit,
  Delete,
  Star,
  CheckCircle,
  Cancel
} from "@mui/icons-material";

const PlanCard = ({ plan, onEdit, onDelete, onToggleStatus }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getPlanTypeColor = (type) => {
    switch (type) {
      case "prepaid":
        return "primary";
      case "postpaid":
        return "secondary";
      case "vip":
        return "warning";
      default:
        return "default";
    }
  };

  const getPlanTypeLabel = (type) => {
    switch (type) {
      case "prepaid":
        return "Trả trước";
      case "postpaid":
        return "Trả sau";
      case "vip":
        return "VIP";
      default:
        return type;
    }
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        border: plan.planType === "vip" ? "2px solid gold" : "none",
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {plan.planName}
              {plan.planType === "vip" && (
                <Star sx={{ color: "gold", ml: 1, verticalAlign: "middle" }} />
              )}
            </Typography>
            <Chip
              label={getPlanTypeLabel(plan.planType)}
              color={getPlanTypeColor(plan.planType)}
              size="small"
              sx={{ mr: 1 }}
            />
            <Chip
              label={plan.isActive ? "Hoạt động" : "Tạm dừng"}
              color={plan.isActive ? "success" : "default"}
              size="small"
              icon={plan.isActive ? <CheckCircle /> : <Cancel />}
            />
          </Box>
          <Box>
            <IconButton size="small" onClick={() => onEdit(plan)}>
              <Edit fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => onDelete(plan.planId)} color="error">
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Description */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {plan.description}
        </Typography>

        {/* Pricing */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" color="primary" fontWeight="bold">
            {formatCurrency(plan.pricePerKwh)}/kWh
          </Typography>
          {plan.monthlyFee && (
            <Typography variant="body2" color="text.secondary">
              + {formatCurrency(plan.monthlyFee)}/tháng
            </Typography>
          )}
          {plan.discountPercentage && (
            <Typography variant="body2" color="success.main">
              Giảm giá: {plan.discountPercentage}%
            </Typography>
          )}
        </Box>

        {/* Features */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {plan.maxPowerKw && (
            <Typography variant="body2">
              ⚡ Công suất tối đa: {plan.maxPowerKw} kW
            </Typography>
          )}
          {plan.priorityAccess && (
            <Typography variant="body2" color="primary">
              ✓ Ưu tiên booking
            </Typography>
          )}
          {plan.freeCancellation && (
            <Typography variant="body2" color="success.main">
              ✓ Hủy miễn phí
            </Typography>
          )}
        </Box>

        {/* Toggle Status */}
        <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #eee" }}>
          <FormControlLabel
            control={
              <Switch
                checked={plan.isActive}
                onChange={() => onToggleStatus(plan.planId)}
              />
            }
            label={plan.isActive ? "Đang kích hoạt" : "Tạm dừng"}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default PlanCard;
