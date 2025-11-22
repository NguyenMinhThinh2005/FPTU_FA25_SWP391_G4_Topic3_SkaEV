import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Rating,
  TextField,
  Box,
  Grid,
  Divider,
  Chip,
  Avatar,
  Alert,
  Card,
  CardContent,
  LinearProgress,
  FormControlLabel,
  Checkbox,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Badge,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Star,
  Speed,
  LocationOn,
  ElectricBolt,
  AccessTime,
  ThumbUp,
  ThumbDown,
  Send,
  ExpandMore,
  CheckCircle,
  Cancel,
  Info,
  CleaningServices,
  Security,
  Wifi,
  LocalParking,
  Wc,
  Restaurant,
  ShoppingCart,
  Phone,
  Warning,
  AttachMoney,
  Battery20,
  Battery50,
  Battery80,
  BatteryFull,
} from "@mui/icons-material";
import { formatCurrency } from "../../utils/helpers";
import useReviewStore from "../../store/reviewStore";

const RatingModal = ({
  open,
  onClose,
  chargingSession,
  completedSession,
  station,
  onSuccess,
}) => {
  // Debug log để kiểm tra data nhận được
  useEffect(() => {
    if (open) {
      console.log("🔍 RatingModal Debug:");
      console.log("  - chargingSession:", chargingSession);
      console.log("  - completedSession:", completedSession);
      console.log("  - station:", station);
    }
  }, [open, chargingSession, completedSession, station]);

  // Provide default values to prevent errors
  const rawSessionData = completedSession || chargingSession || {};

  // Normalize data structure from different sources
  const sessionData = {
    energyDelivered: rawSessionData.energyDelivered || 0,
    duration: rawSessionData.chargingDuration || rawSessionData.duration || 0,
    totalAmount:
      rawSessionData.totalAmount ||
      rawSessionData.cost ||
      rawSessionData.totalCost ||
      0,
    initialSOC: rawSessionData.initialSOC || rawSessionData.currentSOC || 0,
    targetSOC: rawSessionData.finalSOC || rawSessionData.targetSOC || 0,
    chargingRate: rawSessionData.chargingRate || 0,
    bookingId: rawSessionData.bookingId,
  };

  const safeStation = station || { id: "unknown", name: "Trạm sạc" };
  // Chỉ giữ các đánh giá quan trọng
  const [ratings, setRatings] = useState({
    overall: 0,
    chargingSpeed: 0,
    cleanliness: 0,
    accessibility: 0,
  });

  const [review, setReview] = useState("");
  const [quickFeedback, setQuickFeedback] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [allowPublicReview, setAllowPublicReview] = useState(true);
  const [stationIssues, setStationIssues] = useState([]);
  const [chargingEfficiency, setChargingEfficiency] = useState("excellent");
  const [errorMessage, setErrorMessage] = useState("");
  const [wasUpdated, setWasUpdated] = useState(false);

  const submitReview = useReviewStore((state) => state.submitReview);
  const fetchStationReviews = useReviewStore(
    (state) => state.fetchStationReviews
  );
  const fetchStationSummary = useReviewStore(
    (state) => state.fetchStationSummary
  );
  const clearReviewError = useReviewStore((state) => state.clearError);
  const storeError = useReviewStore((state) => state.error);
  const submitting = useReviewStore((state) => state.submitting);

  useEffect(() => {
    if (!open) {
      setSubmitted(false);
      setErrorMessage("");
      clearReviewError();
      return;
    }

    if (storeError) {
      setErrorMessage(storeError);
    }
  }, [open, storeError, clearReviewError]);

  // Add error boundary protection
  if (!open) return null;

  const quickFeedbackOptions = [
    // Positive feedback
    {
      id: "fast_charging",
      label: "Sạc nhanh chính xác",
      icon: <Speed />,
      type: "positive",
    },
    {
      id: "clean_station",
      label: "Trạm sạch sẽ, gọn gàng",
      icon: <ThumbUp />,
      type: "positive",
    },
    {
      id: "easy_access",
      label: "Dễ tiếp cận, đỗ xe thuận tiện",
      icon: <LocalParking />,
      type: "positive",
    },
    {
      id: "good_price",
      label: "Giá cả hợp lý",
      icon: <AttachMoney />,
      type: "positive",
    },
    {
      id: "reliable_equipment",
      label: "Thiết bị ổn định",
      icon: <CheckCircle />,
      type: "positive",
    },
    {
      id: "good_wifi",
      label: "WiFi miễn phí tốt",
      icon: <Wifi />,
      type: "positive",
    },
    {
      id: "safe_location",
      label: "Vị trí an toàn",
      icon: <Security />,
      type: "positive",
    },
    {
      id: "good_amenities",
      label: "Tiện ích đầy đủ",
      icon: <Restaurant />,
      type: "positive",
    },

    // Negative feedback
    {
      id: "slow_charging",
      label: "Sạc chậm hơn quảng cáo",
      icon: <AccessTime />,
      type: "negative",
    },
    {
      id: "dirty_station",
      label: "Trạm bẩn, bừa bộn",
      icon: <ThumbDown />,
      type: "negative",
    },
    {
      id: "hard_access",
      label: "Khó tìm, đỗ xe khó",
      icon: <Warning />,
      type: "negative",
    },
    {
      id: "expensive",
      label: "Giá cao bất hợp lý",
      icon: <AttachMoney />,
      type: "negative",
    },
    {
      id: "equipment_issues",
      label: "Thiết bị có vấn đề",
      icon: <Cancel />,
      type: "negative",
    },
    {
      id: "no_wifi",
      label: "Không có WiFi hoặc yếu",
      icon: <Wifi />,
      type: "negative",
    },
    {
      id: "unsafe_location",
      label: "Vị trí không an toàn",
      icon: <Warning />,
      type: "negative",
    },
    {
      id: "poor_amenities",
      label: "Thiếu tiện ích cơ bản",
      icon: <Cancel />,
      type: "negative",
    },
  ];

  // Chỉ giữ các tiêu chí đánh giá quan trọng
  // eslint-disable-next-line no-unused-vars
  const ratingCategories = [
    {
      key: "overall",
      label: "Đánh giá tổng thể",
      icon: <Star />,
      description: "Trải nghiệm chung của bạn",
    },
    {
      key: "chargingSpeed",
      label: "Tốc độ sạc",
      icon: <Speed />,
      description: "Hiệu suất sạc thực tế",
    },
    {
      key: "cleanliness",
      label: "Độ sạch sẽ",
      icon: <CleaningServices />,
      description: "Vệ sinh trạm/khu vực",
    },
    {
      key: "accessibility",
      label: "Khả năng tiếp cận",
      icon: <LocationOn />,
      description: "Dễ tìm, đỗ xe, sử dụng",
    },
  ];

  const issueOptions = [
    {
      id: "connector_damaged",
      label: "Cổng sạc hỏng/lỏng lẻo",
      icon: <Warning />,
    },
    {
      id: "display_error",
      label: "Màn hình lỗi/không hiển thị",
      icon: <Cancel />,
    },
    {
      id: "payment_failed",
      label: "Thanh toán không thành công",
      icon: <AttachMoney />,
    },
    { id: "app_connection", label: "Không kết nối được app", icon: <Phone /> },
    { id: "slow_internet", label: "WiFi chậm/không ổn định", icon: <Wifi /> },
    {
      id: "parking_blocked",
      label: "Bãi đỗ bị chiếm chỗ",
      icon: <LocalParking />,
    },
    { id: "lighting_poor", label: "Thiếu ánh sáng ban đêm", icon: <Warning /> },
    { id: "vandalism", label: "Thiết bị bị phá hoại", icon: <Security /> },
  ];

  const handleRatingChange = (category, value) => {
    setRatings((prev) => ({ ...prev, [category]: value }));
  };

  const toggleQuickFeedback = (feedbackId) => {
    setQuickFeedback((prev) =>
      prev.includes(feedbackId)
        ? prev.filter((id) => id !== feedbackId)
        : [...prev, feedbackId]
    );
  };

  const resolveStationId = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (!value) {
      return null;
    }
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
      return numeric;
    }
    const digits = String(value).match(/\d+/);
    return digits ? Number(digits[0]) : null;
  };

  const handleSubmit = async () => {
    setErrorMessage("");
    clearReviewError();

    const stationId = resolveStationId(
      safeStation?.stationId ?? safeStation?.id
    );

    if (!stationId) {
      setErrorMessage("Không xác định được trạm sạc để gửi đánh giá.");
      return;
    }

    const feedbackLabels = quickFeedback
      .map(
        (feedbackId) =>
          quickFeedbackOptions.find((option) => option.id === feedbackId)?.label
      )
      .filter(Boolean)
      .join(", ");

    const issuesLabels = stationIssues
      .map(
        (issueId) => issueOptions.find((option) => option.id === issueId)?.label
      )
      .filter(Boolean)
      .join(", ");

    const sessionSummaryParts = [
      sessionData?.energyDelivered
        ? `${sessionData.energyDelivered} kWh`
        : null,
      sessionData?.duration ? `${sessionData.duration} phút` : null,
      sessionData?.totalCost ? formatCurrency(sessionData.totalCost) : null,
    ].filter(Boolean);

    const commentSections = [];

    if (review && review.trim()) {
      commentSections.push(review.trim());
    }

    if (feedbackLabels) {
      commentSections.push(`Phản hồi nhanh: ${feedbackLabels}`);
    }

    if (issuesLabels) {
      commentSections.push(`Vấn đề gặp phải: ${issuesLabels}`);
    }

    commentSections.push(
      `Sẵn sàng giới thiệu: ${wouldRecommend ? "Có" : "Không"}`
    );

    if (!allowPublicReview) {
      commentSections.push("Yêu cầu giữ đánh giá ở chế độ riêng tư.");
    }

    if (sessionSummaryParts.length > 0) {
      commentSections.push(`Phiên sạc: ${sessionSummaryParts.join(" • ")}`);
    }

    commentSections.push(`Hiệu suất sạc: ${chargingEfficiency}`);

    const commentPayload = commentSections.join("\n\n");

    try {
      const { review: createdReview, wasUpdated: reviewWasUpdated } =
        await submitReview({
          stationId,
          rating: ratings.overall,
          comment: commentPayload,
        });

      // Refresh latest data for this station but do not block UI if API fails
      Promise.allSettled([
        fetchStationSummary(stationId),
        fetchStationReviews(stationId, 1, 5),
      ]).catch(() => null);

      setWasUpdated(Boolean(reviewWasUpdated));
      setSubmitted(true);

      if (onSuccess) {
        onSuccess(createdReview, reviewWasUpdated);
      }

      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message ||
        error?.message ||
        storeError ||
        "Không thể gửi đánh giá, vui lòng thử lại.";
      const messageText =
        typeof apiMessage === "string"
          ? apiMessage
          : "Không thể gửi đánh giá, vui lòng thử lại.";
      if (messageText.toLowerCase().includes("already reviewed")) {
        setErrorMessage(
          "Bạn đã đánh giá trạm này rồi. Hãy chỉnh sửa đánh giá hiện có của bạn."
        );
      } else {
        setErrorMessage(messageText);
      }
    }
  };

  const handleClose = () => {
    setRatings({
      overall: 0,
      chargingSpeed: 0,
      cleanliness: 0,
      accessibility: 0,
      pricing: 0,
      connectivity: 0,
      safety: 0,
      amenities: 0,
    });
    setReview("");
    setQuickFeedback([]);
    setWouldRecommend(true);
    setAllowPublicReview(true);
    setStationIssues([]);
    setChargingEfficiency("excellent");
    setSubmitted(false);
    setErrorMessage("");
    setWasUpdated(false);
    clearReviewError();
    onClose();
  };

  const stationIdIsValid = Boolean(
    resolveStationId(safeStation?.stationId ?? safeStation?.id)
  );

  const isFormValid = ratings.overall > 0 && stationIdIsValid;

  if (submitted) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogContent sx={{ textAlign: "center", py: 6 }}>
          <Box sx={{ mb: 3 }}>
            <CheckCircle sx={{ fontSize: 80, color: "success.main", mb: 2 }} />
            <Typography variant="h5" gutterBottom color="success.dark">
              {wasUpdated
                ? "Đánh giá của bạn đã được cập nhật!"
                : "Đánh giá đã được gửi thành công!"}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Cảm ơn bạn đã dành thời gian chia sẻ trải nghiệm
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary">
            Đánh giá sẽ được xem xét và hiển thị trong 24h tới.
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: "primary.main" }}>
            <Star />
          </Avatar>
          <Box>
            <Typography variant="h6">Đánh giá trải nghiệm sạc</Typography>
            <Typography variant="body2" color="text.secondary">
              {safeStation.name}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        {/* Comprehensive Charging Session Summary */}
        <Card
          sx={{
            mb: 3,
            bgcolor: "success.50",
            border: "1px solid",
            borderColor: "success.200",
          }}
        >
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <CheckCircle sx={{ color: "success.main", mr: 1 }} />
              <Typography variant="h6" color="success.dark">
                Phiên sạc hoàn thành thành công!
              </Typography>
            </Box>

            <Grid container spacing={2}>
              {/* Main metrics */}
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: "center", p: 1 }}>
                  <ElectricBolt
                    sx={{ fontSize: 24, color: "warning.main", mb: 0.5 }}
                  />
                  <Typography variant="h6" color="primary.main">
                    {sessionData.energyDelivered.toFixed(1)} kWh
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Năng lượng nạp
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: "center", p: 1 }}>
                  <AccessTime
                    sx={{ fontSize: 24, color: "info.main", mb: 0.5 }}
                  />
                  <Typography variant="h6" color="primary.main">
                    {sessionData.duration} phút
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Thời gian sạc
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: "center", p: 1 }}>
                  <AttachMoney
                    sx={{ fontSize: 24, color: "success.main", mb: 0.5 }}
                  />
                  <Typography variant="h6" color="primary.main">
                    {formatCurrency(sessionData.totalAmount)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tổng chi phí
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: "center", p: 1 }}>
                  <Speed
                    sx={{ fontSize: 24, color: "primary.main", mb: 0.5 }}
                  />
                  <Typography variant="h6" color="primary.main">
                    {sessionData.chargingRate > 0
                      ? sessionData.chargingRate.toFixed(1)
                      : (
                          sessionData.energyDelivered /
                          (sessionData.duration / 60 || 1)
                        ).toFixed(1)}{" "}
                    kW
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tốc độ TB
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Battery progress */}
            <Box sx={{ mt: 2 }}>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Pin: {sessionData.initialSOC}% → {sessionData.targetSOC}%
                </Typography>
                <Typography
                  variant="body2"
                  color="success.main"
                  fontWeight="medium"
                >
                  +{sessionData.targetSOC - sessionData.initialSOC}% (+
                  {sessionData.energyDelivered.toFixed(1)} kWh)
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Battery20 sx={{ color: "warning.main" }} />
                <LinearProgress
                  variant="determinate"
                  value={sessionData.targetSOC}
                  sx={{
                    flexGrow: 1,
                    height: 8,
                    borderRadius: 1,
                    bgcolor: "grey.200",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: "success.main",
                      borderRadius: 1,
                    },
                  }}
                />
                <BatteryFull sx={{ color: "success.main" }} />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Đánh giá tổng thể - tối giản, nổi bật */}
        <Box sx={{ maxWidth: 400, mx: "auto", mb: 3, textAlign: "center" }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "primary.main",
              mb: 1,
              letterSpacing: 0.5,
            }}
          >
            Đánh giá tổng thể
          </Typography>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 4,
              boxShadow: "0 2px 12px rgba(25,118,210,0.08)",
              p: 0,
              background: "#f8fafc",
              minHeight: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CardContent
              sx={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                p: 3,
              }}
            >
              <Rating
                name="overall"
                value={ratings.overall || 0}
                onChange={(_, value) => handleRatingChange("overall", value)}
                size="large"
                sx={{ fontSize: 38, mx: "auto" }}
              />
            </CardContent>
          </Card>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Quick Feedback with Categories */}
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <ThumbUp sx={{ color: "primary.main" }} />
          Phản hồi nhanh về trải nghiệm
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Chọn những điểm nổi bật hoặc vấn đề bạn gặp phải (có thể chọn nhiều)
        </Typography>

        {/* Positive Feedback */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ThumbUp sx={{ color: "success.main" }} />
              <Typography fontWeight="medium" color="success.main">
                Điểm tích cực (
                {
                  quickFeedback.filter(
                    (id) =>
                      quickFeedbackOptions.find((opt) => opt.id === id)
                        ?.type === "positive"
                  ).length
                }
                )
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {quickFeedbackOptions
                .filter((option) => option.type === "positive")
                .map((option) => (
                  <Chip
                    key={option.id}
                    label={option.label}
                    icon={option.icon}
                    clickable
                    color={
                      quickFeedback.includes(option.id) ? "success" : "default"
                    }
                    variant={
                      quickFeedback.includes(option.id) ? "filled" : "outlined"
                    }
                    onClick={() => toggleQuickFeedback(option.id)}
                    sx={{
                      borderColor: "success.main",
                      "&:hover": {
                        bgcolor: "success.50",
                      },
                    }}
                  />
                ))}
            </Box>
          </AccordionDetails>
        </Accordion>

        <Box sx={{ my: 3 }} />

        {/* Issue Reporting */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Warning sx={{ color: "error.main" }} />
              <Typography fontWeight="medium">
                Báo cáo sự cố kỹ thuật ({stationIssues.length} vấn đề)
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Nếu gặp vấn đề kỹ thuật, hãy báo cáo để chúng tôi xử lý nhanh
              chóng
            </Typography>
            <Grid container spacing={2}>
              {issueOptions.map((issue) => (
                <Grid item xs={12} sm={6} key={issue.id}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={stationIssues.includes(issue.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setStationIssues((prev) => [...prev, issue.id]);
                          } else {
                            setStationIssues((prev) =>
                              prev.filter((id) => id !== issue.id)
                            );
                          }
                        }}
                      />
                    }
                    label={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {issue.icon}
                        <Typography variant="body2">{issue.label}</Typography>
                      </Box>
                    }
                  />
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 3 }} />

        {/* Written Review */}
        <Typography variant="h6" gutterBottom>
          Nhận xét chi tiết (tùy chọn)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Chia sẻ trải nghiệm cụ thể để giúp cộng đồng EV đưa ra quyết định tốt
          hơn
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder="VD: Trạm sạc rất sạch sẽ và dễ tìm. Tốc độ sạc đúng như quảng cáo 45kW. Có toilet và cửa hàng tiện lợi gần đó. Sẽ quay lại sạc lần sau..."
          value={review}
          onChange={(e) => setReview(e.target.value)}
          variant="outlined"
          helperText={`${review.length}/500 ký tự`}
          inputProps={{ maxLength: 500 }}
        />
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: "grey.50" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              Đánh giá của bạn giúp cải thiện trải nghiệm cho cộng đồng EV
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button onClick={handleClose} size="large" variant="outlined">
              Bỏ qua
            </Button>
            <Tooltip
              title={
                !isFormValid ? "Vui lòng chọn ít nhất đánh giá tổng thể" : ""
              }
              arrow
            >
              <span>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSubmit}
                  disabled={!isFormValid || submitting}
                  startIcon={submitting ? null : <Send />}
                  sx={{ minWidth: 140 }}
                >
                  {submitting ? "Đang gửi..." : "Gửi đánh giá"}
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

// Error boundary wrapper for RatingModal
const RatingModalWithErrorBoundary = (props) => {
  try {
    return <RatingModal {...props} />;
  } catch (error) {
    console.error("Error in RatingModal:", error);
    // Fallback UI
    return (
      <Dialog open={props.open} onClose={props.onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Lỗi</DialogTitle>
        <DialogContent>
          <Alert severity="error">
            <Typography>
              Đã xảy ra lỗi khi hiển thị form đánh giá. Vui lòng thử lại sau.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose}>Đóng</Button>
          <Button
            variant="contained"
            onClick={() => (window.location.href = "/")}
          >
            Về trang chủ
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
};

export default RatingModalWithErrorBoundary;
