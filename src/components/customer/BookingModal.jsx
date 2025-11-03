import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  ButtonBase,
  Chip,
  Alert,
  FormControlLabel,
  Checkbox,
  Paper,
  CircularProgress,
} from "@mui/material";
import {
  ElectricCar,
  Schedule,
  FlashOn,
  CheckCircle,
  Close,
} from "@mui/icons-material";
import useBookingStore from "../../store/bookingStore";
import useStationStore from "../../store/stationStore";
import ChargingDateTimePicker from "../ui/ChargingDateTimePicker/ChargingDateTimePicker";
import notificationService from "../../services/notificationService";
import { stationsAPI } from "../../services/api";

const BookingModal = ({ open, onClose, station, onSuccess }) => {
  const { createBooking } = useBookingStore();
  const { initializeData } = useStationStore();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedPost, setSelectedPost] = useState(null); // Selected charging post
  const [selectedSlot, setSelectedSlot] = useState(null); // Selected charging slot
  const [selectedDateTime, setSelectedDateTime] = useState(null);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [openTerms, setOpenTerms] = useState(false);
  const [openPolicy, setOpenPolicy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [resultMessage, setResultMessage] = useState("");

  // State for posts and slots from API
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const steps = [
    "Chọn trụ sạc",
    "Chọn cổng sạc",
    "Chọn thời gian sạc",
    "Xác nhận đặt chỗ",
  ];

  // Fetch available posts and slots from API when modal opens
  useEffect(() => {
    const fetchPosts = async () => {
      if (!open || !station?.id) return;

      setLoadingPosts(true);
      try {
        const response = await stationsAPI.getAvailablePosts(station.id);
        const postsData = response.data?.data || response.data || [];
        setPosts(postsData);
        console.log("📡 Fetched posts from API:", postsData);
      } catch (error) {
        console.error("Error fetching posts:", error);
        notificationService.error("Không thể tải thông tin trụ sạc");
        setPosts([]);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchPosts();
  }, [open, station?.id]);

  // Helper to format post name: "POST-01" -> "Trụ sạc 1"
  const formatPostName = (postNumber) => {
    if (!postNumber) return "Trụ sạc";
    const match = postNumber.match(/\d+$/);
    const num = match ? match[0] : "1";
    return `Trụ sạc ${num}`;
  };

  // Helper to format slot name: "SLOT-AC-01", "A1", "SLOT-04" -> "Cổng 1", "Cổng 2", etc.
  const formatSlotName = (slotNumber, slotIndex) => {
    if (!slotNumber) return `Cổng ${slotIndex + 1}`;

    // Try different slot naming patterns
    // Pattern 1: SLOT-AC-01, SLOT-DC-02 -> extract "01", "02"
    let match = slotNumber.match(/SLOT-(?:AC|DC)?-?(\d+)/i);
    if (match) return `Cổng ${match[1]}`;

    // Pattern 2: SLOT-04 -> extract "04"
    match = slotNumber.match(/SLOT-(\d+)/i);
    if (match) return `Cổng ${match[1]}`;

    // Pattern 3: A1, A2, A3 -> extract "1", "2", "3"
    match = slotNumber.match(/[A-Z](\d+)/i);
    if (match) return `Cổng ${match[1]}`;

    // Pattern 4: Just numbers at the end
    match = slotNumber.match(/\d+$/);
    if (match) return `Cổng ${match[0]}`;

    // Fallback: use index
    return `Cổng ${slotIndex + 1}`;
  };

  // Get available slots for selected post
  const getSlotsForPost = () => {
    if (!selectedPost) return [];
    return selectedPost.slots || [];
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handlePostSelect = (post) => {
    setSelectedPost(post);
    setSelectedSlot(null); // Reset slot when post changes
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleDateTimeChange = (dateTimeData) => {
    setSelectedDateTime(dateTimeData);
  };

  const handleConfirmBooking = async () => {
    if (!selectedPost || !selectedSlot || !selectedDateTime || !agreeTerms) {
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        stationId: station.id,
        stationName: station.name,
        slotId: selectedSlot.slotId,
        slotNumber: selectedSlot.slotNumber,
        postId: selectedPost.postId,
        postNumber: selectedPost.postNumber,
        connectorType: selectedSlot.connectorType,
        maxPower: selectedSlot.maxPower,
        bookingTime: new Date().toISOString(),
        schedulingType: selectedDateTime?.schedulingType || "scheduled",
        scheduledDateTime: selectedDateTime?.scheduledDateTime || null,
        scheduledDate: selectedDateTime?.scheduledDate
          ? selectedDateTime.scheduledDate.toISOString().split("T")[0]
          : null,
        scheduledTime: selectedDateTime?.scheduledTime
          ? selectedDateTime.scheduledTime.toISOString()
          : null,
        initialSOC: 20,
        targetSOC: 80,
        estimatedDuration: 60,
      };

      // Call API to create booking
      const booking = await createBooking(bookingData);

      if (!booking) {
        throw new Error("Failed to create booking");
      }

      setBookingResult("success");
      setResultMessage(
        `Đặt lịch thành công!\n` +
          `Mã đặt chỗ: ${booking.id}\n` +
          `Thời gian: ${new Date(bookingData.scheduledDateTime).toLocaleString(
            "vi-VN"
          )}\n\n` +
          `📱 Hãy đến trạm vào đúng giờ và quét mã QR để bắt đầu sạc!`
      );

      notificationService.notifyBookingConfirmed({
        stationName: station.name,
        id: booking.id,
      });

      if (onSuccess) {
        onSuccess(booking);
      }

      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (error) {
      console.error("❌ Booking error:", error);
      setBookingResult("error");

      const errorMessage =
        error?.response?.data?.message || error?.message || "";

      if (
        errorMessage.includes("Slot is not available") ||
        errorMessage.includes("not available")
      ) {
        setResultMessage(
          "❌ Cổng sạc này hiện không còn trống!\n\n" +
            "Vui lòng chọn cổng sạc khác hoặc trạm khác.\n" +
            "Danh sách trạm sẽ được làm mới sau khi đóng."
        );

        setTimeout(() => {
          initializeData();
        }, 3500);
      } else {
        setResultMessage(
          "❌ Có lỗi xảy ra khi đặt chỗ\n\n" +
            (errorMessage || "Vui lòng thử lại hoặc chọn trạm khác.")
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setSelectedPost(null);
    setSelectedSlot(null);
    setSelectedDateTime(null);
    setAgreeTerms(false);
    setLoading(false);
    setBookingResult(null);
    setResultMessage("");
    onClose();
  };

  React.useEffect(() => {
    if (open) {
      try {
        const active = document.activeElement;
        if (active && typeof active.blur === "function") {
          active.blur();
        }
      } catch {
        // ignore
      }
    }
  }, [open]);

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        // Step 1: Choose charging post
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Chọn trụ sạc phù hợp
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Trạm {station?.name} có {posts.length} trụ sạc đang sẵn sàng
            </Typography>

            {loadingPosts && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {!loadingPosts && posts.length === 0 && (
              <Alert severity="warning">
                Hiện tại không có trụ sạc nào sẵn sàng tại trạm này.
              </Alert>
            )}

            <Grid container spacing={2}>
              {posts.map((post) => (
                <Grid item xs={12} key={post.postId}>
                  <ButtonBase
                    onClick={() => handlePostSelect(post)}
                    sx={{ width: "100%", borderRadius: 1 }}
                  >
                    <Card
                      sx={{
                        width: "100%",
                        cursor: "pointer",
                        border: selectedPost?.postId === post.postId ? 2 : 1,
                        borderColor:
                          selectedPost?.postId === post.postId
                            ? "primary.main"
                            : "divider",
                        "&:hover": { boxShadow: 2 },
                      }}
                    >
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Box
                              sx={{
                                width: 56,
                                height: 56,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor:
                                  post.postType === "AC"
                                    ? "success.light"
                                    : post.powerOutput >= 150
                                    ? "error.light"
                                    : "warning.light",
                                color: "white",
                              }}
                            >
                              {post.postType === "AC" ? (
                                <Schedule fontSize="large" />
                              ) : post.powerOutput >= 150 ? (
                                <ElectricCar fontSize="large" />
                              ) : (
                                <FlashOn fontSize="large" />
                              )}
                            </Box>
                            <Box sx={{ textAlign: "left", width: "100%" }}>
                              <Typography variant="h6" fontWeight="bold">
                                {post.postType === "AC"
                                  ? "Sạc chậm AC"
                                  : post.powerOutput >= 150
                                  ? "Sạc siêu nhanh DC"
                                  : "Sạc nhanh DC"}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ textAlign: "left" }}
                              >
                                {post.powerOutput} kW • {post.postType}
                              </Typography>
                              <Chip
                                label={`${post.availableSlots}/${post.totalSlots} cổng đang sẵn sàng`}
                                size="small"
                                color="success"
                                sx={{ mt: 0.5, height: 22 }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </ButtonBase>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 1:
        // Step 2: Choose specific slot
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Chọn cổng sạc
            </Typography>
            {selectedPost && (
              <>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Đã chọn: {selectedPost.postType === "AC"
                    ? "Sạc chậm AC"
                    : selectedPost.powerOutput >= 150
                    ? "Sạc siêu nhanh DC"
                    : "Sạc nhanh DC"}
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {selectedPost.postType} • {selectedPost.powerOutput} kW • Số
                    cổng trống: {selectedPost.availableSlots}
                  </Typography>
                </Alert>
                <Grid container spacing={2}>
                  {getSlotsForPost().map((slot, index) => {
                    const uniqueKey = `${slot.slotId}-${index}`;

                    return (
                      <Grid item xs={12} sm={6} key={uniqueKey}>
                        <ButtonBase
                          onClick={() => handleSlotSelect(slot)}
                          sx={{ width: "100%", borderRadius: 1 }}
                        >
                          <Card
                            sx={{
                              width: "100%",
                              cursor: "pointer",
                              border:
                                selectedSlot?.slotId === slot.slotId ? 2 : 1,
                              borderColor:
                                selectedSlot?.slotId === slot.slotId
                                  ? "primary.main"
                                  : "divider",
                              "&:hover": { boxShadow: 2 },
                            }}
                          >
                            <CardContent>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                }}
                              >
                                <Box sx={{ flex: 1, textAlign: "left" }}>
                                  <Typography variant="h6" fontWeight="bold">
                                    {formatPostName(selectedPost.postNumber)} —{" "}
                                    {formatSlotName(slot.slotNumber, index)}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {slot.connectorType} • {slot.maxPower}kW •{" "}
                                    {selectedPost.postType}
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                      mt: 0.5,
                                    }}
                                  >
                                    <Chip
                                      label="Đang sẵn sàng"
                                      size="small"
                                      color="success"
                                      sx={{ height: 20, fontSize: "0.7rem" }}
                                    />
                                  </Box>
                                </Box>
                                <CheckCircle
                                  sx={{ color: "success.main", fontSize: 32 }}
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        </ButtonBase>
                      </Grid>
                    );
                  })}
                </Grid>
                {getSlotsForPost().length === 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Trụ sạc này chưa có cổng nào sẵn sàng.
                  </Alert>
                )}
              </>
            )}
          </Box>
        );

      case 2:
        // Step 3: Choose date and time
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Chọn thời gian sạc
            </Typography>
            {selectedSlot && (
              <>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Đã chọn: {formatPostName(selectedPost?.postNumber)} —{" "}
                  {formatSlotName(selectedSlot?.slotNumber, 0)} (
                  {selectedSlot.connectorType})
                </Alert>
                <ChargingDateTimePicker
                  station={station}
                  onDateTimeChange={handleDateTimeChange}
                  initialDateTime={selectedDateTime}
                />
              </>
            )}
          </Box>
        );

      case 3:
        // Step 4: Confirm booking
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Xác nhận thông tin đặt chỗ
            </Typography>

            {bookingResult === "success" && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography>
                  <strong>✅ {resultMessage}</strong>
                </Typography>
              </Alert>
            )}

            {bookingResult === "error" && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography>
                  <strong>❌ {resultMessage}</strong>
                </Typography>
              </Alert>
            )}

            {!bookingResult && (
              <>
                <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                  >
                    📍 Thông tin đặt chỗ
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Trạm sạc:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {station?.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Địa chỉ:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {station?.location?.address}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Trụ sạc:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatPostName(selectedPost?.postNumber)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Cổng sạc:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatSlotName(selectedSlot?.slotNumber, 0)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Đầu cắm:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedSlot?.connectorType}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Công suất:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedSlot?.maxPower} kW
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Thời gian:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedDateTime?.scheduledDateTime?.toLocaleString(
                          "vi-VN"
                        ) || "Chưa chọn"}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>

                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    💡 <strong>Lưu ý:</strong> Vui lòng có mặt tại trạm sạc
                    trước 15 phút.
                  </Typography>
                </Alert>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                    />
                  }
                  label={
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        fontSize: 16,
                      }}
                    >
                      <span style={{ marginRight: 6 }}>Tôi đồng ý với</span>
                      <Button
                        variant="text"
                        sx={{
                          p: 0,
                          minWidth: "unset",
                          textTransform: "none",
                          color: "primary.main",
                          fontWeight: 500,
                          fontSize: 16,
                          mx: 0.5,
                        }}
                        onClick={() => setOpenTerms(true)}
                      >
                        điều khoản sử dụng
                      </Button>
                      <span style={{ margin: "0 6px" }}>và</span>
                      <Button
                        variant="text"
                        sx={{
                          p: 0,
                          minWidth: "unset",
                          textTransform: "none",
                          color: "primary.main",
                          fontWeight: 500,
                          fontSize: 16,
                          mx: 0.5,
                        }}
                        onClick={() => setOpenPolicy(true)}
                      >
                        chính sách thanh toán
                      </Button>
                    </Box>
                  }
                />

                {/* Modal: Terms */}
                <Dialog
                  open={openTerms}
                  onClose={() => setOpenTerms(false)}
                  maxWidth="md"
                  fullWidth
                >
                  <DialogTitle>Điều khoản sử dụng</DialogTitle>
                  <DialogContent dividers>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      gutterBottom
                    >
                      A. ĐIỀU KHOẢN SỬ DỤNG
                    </Typography>
                    <Typography variant="body2" paragraph>
                      1. Phạm vi áp dụng
                      <br />
                      Các điều khoản này áp dụng cho tất cả người dùng đặt chỗ,
                      sử dụng dịch vụ sạc tại các trạm sạc trong hệ thống của
                      SkaEV thông qua ứng dụng di động hoặc website.
                    </Typography>
                    <Typography variant="body2" paragraph>
                      2. Quy định về Đặt chỗ
                      <br />
                      Xác nhận đặt chỗ: Việc đặt chỗ của bạn chỉ được xem là
                      thành công khi nhận được thông báo xác nhận qua ứng dụng
                      hoặc email từ hệ thống của chúng tôi.
                      <br />
                      Thời gian giữ chỗ: Hệ thống sẽ giữ chỗ sạc cho bạn trong
                      vòng 10 phút kể từ thời điểm bạn đặt. Nếu bạn không đến và
                      kết nối sạc trong khoảng thời gian này, lượt đặt chỗ của
                      bạn có thể sẽ tự động bị hủy để nhường cho người dùng
                      khác.
                      <br />
                      Hủy đặt chỗ: Bạn có thể hủy lượt đặt chỗ miễn phí trước
                      thời điểm hẹn 15 phút.
                    </Typography>
                    <Typography variant="body2" paragraph>
                      3. Trách nhiệm của Người dùng
                      <br />
                      Cung cấp thông tin chính xác khi đăng ký tài khoản và đặt
                      chỗ.
                      <br />
                      Tuân thủ đúng hướng dẫn sử dụng tại trạm sạc để đảm bảo an
                      toàn cho bản thân, phương tiện và thiết bị.
                      <br />
                      Sử dụng đúng loại cổng sạc tương thích với xe của mình.
                      SkaEV không chịu trách nhiệm cho các hư hỏng nếu người
                      dùng kết nối sai loại sạc.
                      <br />
                      Khi sạc đầy hoặc hết thời gian đặt chỗ, người dùng có
                      trách nhiệm di chuyển xe ra khỏi vị trí sạc để nhường cho
                      người khác. Việc chiếm dụng vị trí sau khi đã sạc xong có
                      thể bị tính "phí chiếm chỗ" (chi tiết trong Chính sách
                      Thanh toán).
                      <br />
                      Báo ngay cho bộ phận hỗ trợ của chúng tôi qua hotline
                      0917123123 nếu phát hiện bất kỳ sự cố, hư hỏng nào tại
                      trạm sạc.
                      <br />
                      Tự bảo quản tài sản cá nhân. Chúng tôi không chịu trách
                      nhiệm cho bất kỳ mất mát hay hư hỏng nào đối với tài sản
                      của bạn tại trạm sạc.
                    </Typography>
                    <Typography variant="body2" paragraph>
                      4. Quyền và Trách nhiệm của chúng tôi
                      <br />
                      Đảm bảo cung cấp dịch vụ ổn định và thiết bị sạc hoạt động
                      tốt.
                      <br />
                      Có quyền từ chối hoặc hủy phiên sạc nếu phát hiện người
                      dùng vi phạm các điều khoản, có hành vi gian lận hoặc gây
                      mất an toàn.
                      <br />
                      Trong trường hợp trạm sạc gặp sự cố kỹ thuật đột xuất,
                      chúng tôi sẽ nỗ lực thông báo sớm nhất cho bạn và hỗ trợ
                      tìm kiếm trạm sạc thay thế gần nhất. Chúng tôi không chịu
                      trách nhiệm bồi thường cho bất kỳ thiệt hại gián tiếp nào
                      phát sinh từ sự cố này.
                    </Typography>
                    <Typography variant="body2" paragraph>
                      5. Miễn trừ Trách nhiệm
                      <br />
                      Chúng tôi không chịu trách nhiệm cho bất kỳ hư hỏng nào
                      đối với phương tiện của bạn, trừ khi lỗi đó được xác định
                      là do thiết bị của chúng tôi gây ra một cách trực tiếp.
                    </Typography>
                  </DialogContent>
                  <DialogActions>
                    <Button
                      onClick={() => setOpenTerms(false)}
                      variant="contained"
                    >
                      Đóng
                    </Button>
                  </DialogActions>
                </Dialog>

                {/* Modal: Payment Policy */}
                <Dialog
                  open={openPolicy}
                  onClose={() => setOpenPolicy(false)}
                  maxWidth="md"
                  fullWidth
                >
                  <DialogTitle>Chính sách thanh toán</DialogTitle>
                  <DialogContent dividers>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      gutterBottom
                    >
                      B. CHÍNH SÁCH THANH TOÁN
                    </Typography>
                    <Typography variant="body2" paragraph>
                      1. Chi phí Sạc
                      <br />
                      Chi phí cho phiên sạc được tính dựa trên lượng điện năng
                      tiêu thụ (số kWh) nhân với đơn giá tại thời điểm sạc.
                      <br />
                      Đơn giá (VNĐ/kWh) được niêm yết rõ ràng trên ứng dụng và
                      tại màn hình trụ sạc trước khi bạn bắt đầu phiên sạc.
                      <br />
                      Ngoài chi phí sạc, có thể phát sinh các loại phí sau:
                      <br />
                      Phí chiếm chỗ: Áp dụng nếu xe của bạn vẫn chiếm vị trí sạc
                      sau khi đã sạc đầy một khoảng thời gian nhất định (ví dụ:
                      sau 15 phút). Mức phí này sẽ được thông báo rõ trên ứng
                      dụng.
                    </Typography>
                    <Typography variant="body2" paragraph>
                      2. Phương thức Thanh toán
                      <br />
                      Chúng tôi chấp nhận thanh toán qua các phương thức sau:
                      <br />
                      Thẻ tín dụng/ghi nợ quốc tế (Visa, Mastercard).
                      <br />
                      Thẻ ATM nội địa.
                      <br />
                      Ví điện tử (Momo, ZaloPay, VNPay,...).
                      <br />
                      Bạn cần liên kết một phương thức thanh toán hợp lệ vào tài
                      khoản trên ứng dụng để có thể bắt đầu phiên sạc.
                    </Typography>
                    <Typography variant="body2" paragraph>
                      3. Quy trình Thanh toán
                      <br />
                      Khi phiên sạc kết thúc, tổng chi phí sẽ được tính toán tự
                      động.
                      <br />
                      Hệ thống sẽ tự động trừ tiền từ phương thức thanh toán mà
                      bạn đã chọn được đăng ký trên tài khoản.
                      <br />
                      Hóa đơn chi tiết cho phiên sạc sẽ được gửi đến email của
                      bạn và lưu lại trong lịch sử giao dịch trên ứng dụng.
                    </Typography>
                    <Typography variant="body2" paragraph>
                      4. Hoàn tiền
                      <br />
                      Việc hoàn tiền chỉ được xem xét trong trường hợp phiên sạc
                      không thành công hoặc bị gián đoạn do lỗi từ hệ thống hoặc
                      thiết bị của chúng tôi.
                      <br />
                      Vui lòng liên hệ bộ phận chăm sóc khách hàng qua hotline
                      0917123123 để được hướng dẫn và xử lý yêu cầu hoàn tiền.
                    </Typography>
                    <Typography variant="body2" paragraph>
                      5. Thay đổi Chính sách
                      <br />
                      Chúng tôi có quyền thay đổi, cập nhật biểu phí và chính
                      sách thanh toán. Mọi thay đổi sẽ được thông báo đến bạn
                      qua ứng dụng hoặc email trước khi có hiệu lực.
                    </Typography>
                  </DialogContent>
                  <DialogActions>
                    <Button
                      onClick={() => setOpenPolicy(false)}
                      variant="contained"
                    >
                      Đóng
                    </Button>
                  </DialogActions>
                </Dialog>
              </>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  const isStepComplete = (step) => {
    switch (step) {
      case 0:
        return selectedPost !== null;
      case 1:
        return selectedSlot !== null;
      case 2:
        return (
          selectedDateTime !== null &&
          selectedDateTime.isValid &&
          selectedDateTime.scheduledDateTime
        );
      case 3:
        return agreeTerms;
      default:
        return false;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, maxHeight: "90vh" } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        <Box component="span" sx={{ fontWeight: "bold", fontSize: "1.5rem" }}>
          Đặt chỗ sạc xe điện
        </Box>
        <Button
          onClick={handleClose}
          sx={{ minWidth: "auto", p: 1 }}
          disabled={loading}
        >
          <Close />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label} completed={isStepComplete(index)}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={handleBack}
          disabled={activeStep === 0 || loading}
          size="large"
        >
          Quay lại
        </Button>
        <Box sx={{ flex: 1 }} />
        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!isStepComplete(activeStep) || loading}
            size="large"
          >
            Tiếp tục
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleConfirmBooking}
            disabled={!isStepComplete(activeStep) || loading}
            size="large"
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? "Đang xử lý..." : "Xác nhận đặt"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BookingModal;
