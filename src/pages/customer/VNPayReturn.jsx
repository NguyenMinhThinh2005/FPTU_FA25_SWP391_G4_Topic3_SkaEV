import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Alert,
  Divider,
} from "@mui/material";
import {
  CheckCircle,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import axios from "axios";

/**
 * VNPay Return Page
 * Handles callback from VNPay payment gateway
 * CRITICAL: Always verify payment result with backend, never trust URL parameters
 */
const VNPayReturn = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // States
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [paymentResult, setPaymentResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verify payment with backend immediately when component loads
    verifyPaymentWithBackend();
  }, []);

  /**
   * Send full query string to backend for signature verification
   * Backend will validate vnp_SecureHash to ensure data integrity
   */
  const verifyPaymentWithBackend = async () => {
    try {
      setVerifying(true);
      setError(null);

      // Get all query parameters from URL
      const queryString = window.location.search;

      if (!queryString || queryString.length < 10) {
        throw new Error("URL không hợp lệ - thiếu thông tin giao dịch");
      }

      console.log("🔐 Verifying payment with backend...");
      console.log("Query string:", queryString);

      // Call backend to verify VNPay signature
      // Backend endpoint: GET /api/vnpay/vnpay-return
      // Backend will validate vnp_SecureHash and return verified result
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

      const response = await axios.get(
        `${API_BASE_URL}/vnpay/verify-return${queryString}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          // Don't send auth token - this is public callback
        }
      );

      console.log("✅ Backend verification response:", response.data);

      // Extract result from backend response
      const result = response.data;

      if (result.success) {
        // Payment verified successfully by backend
        setPaymentResult({
          success: true,
          transactionRef:
            result.transactionRef || searchParams.get("vnp_TxnRef"),
          amount: result.amount || 0,
          bankCode: result.bankCode || "",
          transactionNo: result.transactionNo || "",
          message: result.message || "Thanh toán thành công!",
        });
      } else {
        // Payment failed or signature invalid
        setPaymentResult({
          success: false,
          message: result.message || "Thanh toán không thành công",
          responseCode: result.responseCode || "",
        });
      }
    } catch (err) {
      console.error("❌ Error verifying payment:", err);

      // Handle different error types
      if (err.response) {
        // Backend returned error response
        setError(
          err.response.data?.message ||
            "Không thể xác thực giao dịch. Vui lòng liên hệ hỗ trợ."
        );
      } else if (err.request) {
        // Network error
        setError(
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng."
        );
      } else {
        // Other errors
        setError(err.message || "Có lỗi xảy ra khi xác thực thanh toán.");
      }

      setPaymentResult({
        success: false,
        message: "Không thể xác thực giao dịch",
      });
    } finally {
      setVerifying(false);
      setLoading(false);
    }
  };

  /**
   * Handle navigation after payment
   */
  const handleContinue = () => {
    // Clear any pending payment data
    sessionStorage.removeItem("pendingPaymentInvoiceId");
    sessionStorage.removeItem("pendingPaymentBookingId");
    sessionStorage.removeItem("returnToChargingFlow");

    if (paymentResult?.success) {
      // Success - go to customer dashboard or booking history
      navigate("/customer/dashboard", { replace: true });
    } else {
      // Failed - go back to charging flow to retry
      navigate("/customer/charging", { replace: true });
    }
  };

  /**
   * Handle retry payment
   */
  const handleRetry = () => {
    // Clear payment data
    sessionStorage.removeItem("pendingPaymentInvoiceId");
    sessionStorage.removeItem("pendingPaymentBookingId");

    // Go back to charging flow
    navigate("/customer/charging", { replace: true });
  };

  /**
   * Render loading state
   */
  if (loading || verifying) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: "center" }}>
        <Paper elevation={3} sx={{ p: 6 }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
            Đang xác thực thanh toán...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Vui lòng chờ trong giây lát
          </Typography>
          <Alert severity="info" sx={{ mt: 3, textAlign: "left" }}>
            <Typography variant="body2">
              🔐 Hệ thống đang xác thực chữ ký điện tử từ VNPay để đảm bảo giao
              dịch hợp lệ.
            </Typography>
          </Alert>
        </Paper>
      </Container>
    );
  }

  /**
   * Render error state (verification failed)
   */
  if (error && !paymentResult) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: "center",
            background: "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)",
          }}
        >
          <WarningIcon
            sx={{
              fontSize: 100,
              color: "warning.main",
              mb: 2,
            }}
          />

          <Typography
            variant="h4"
            fontWeight="bold"
            gutterBottom
            color="warning.main"
          >
            Không thể xác thực thanh toán
          </Typography>

          <Alert severity="error" sx={{ mt: 3, mb: 3, textAlign: "left" }}>
            <Typography variant="body2">
              <strong>Lỗi:</strong> {error}
            </Typography>
          </Alert>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Vui lòng liên hệ bộ phận hỗ trợ hoặc thử lại sau.
          </Typography>

          <Box
            sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 4 }}
          >
            <Button
              variant="outlined"
              size="large"
              onClick={() => window.location.reload()}
            >
              Thử lại
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/customer/dashboard")}
            >
              Về trang chủ
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  /**
   * Render payment result (success or failed)
   */
  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          textAlign: "center",
          background: paymentResult?.success
            ? "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)"
            : "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
        }}
      >
        {/* Icon */}
        {paymentResult?.success ? (
          <CheckCircle
            sx={{
              fontSize: 120,
              color: "success.main",
              mb: 2,
              animation: "scaleIn 0.5s ease-out",
              "@keyframes scaleIn": {
                "0%": { transform: "scale(0)" },
                "100%": { transform: "scale(1)" },
              },
            }}
          />
        ) : (
          <ErrorIcon
            sx={{
              fontSize: 120,
              color: "error.main",
              mb: 2,
              animation: "shake 0.5s ease-out",
              "@keyframes shake": {
                "0%, 100%": { transform: "translateX(0)" },
                "25%": { transform: "translateX(-10px)" },
                "75%": { transform: "translateX(10px)" },
              },
            }}
          />
        )}

        {/* Title */}
        <Typography
          variant="h4"
          fontWeight="bold"
          gutterBottom
          color={paymentResult?.success ? "success.main" : "error.main"}
        >
          {paymentResult?.success
            ? "Thanh toán thành công!"
            : "Thanh toán thất bại"}
        </Typography>

        {/* Message */}
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {paymentResult?.message}
        </Typography>

        <Divider sx={{ my: 3 }} />

        {/* Transaction Details (Success only) */}
        {paymentResult?.success && (
          <Box sx={{ mb: 3, textAlign: "left" }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>✅ Giao dịch đã được xác thực bởi VNPay</strong>
              </Typography>
              {paymentResult.transactionRef && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Mã giao dịch:</strong> {paymentResult.transactionRef}
                </Typography>
              )}
              {paymentResult.transactionNo && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Mã GD VNPay:</strong> {paymentResult.transactionNo}
                </Typography>
              )}
              {paymentResult.amount > 0 && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Số tiền:</strong>{" "}
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(paymentResult.amount)}
                </Typography>
              )}
              {paymentResult.bankCode && (
                <Typography variant="body2">
                  <strong>Ngân hàng:</strong> {paymentResult.bankCode}
                </Typography>
              )}
            </Alert>
          </Box>
        )}

        {/* Error Details (Failed only) */}
        {!paymentResult?.success && paymentResult?.responseCode && (
          <Alert severity="error" sx={{ mb: 3, textAlign: "left" }}>
            <Typography variant="body2">
              <strong>Mã lỗi:</strong> {paymentResult.responseCode}
            </Typography>
          </Alert>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 4 }}>
          {paymentResult?.success ? (
            <>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate("/customer/payment-history")}
                sx={{ minWidth: 150 }}
              >
                Lịch sử thanh toán
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={handleContinue}
                sx={{ minWidth: 150 }}
              >
                Về trang chủ
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate("/customer/dashboard")}
                sx={{ minWidth: 150 }}
              >
                Về trang chủ
              </Button>
              <Button
                variant="contained"
                size="large"
                color="error"
                onClick={handleRetry}
                sx={{ minWidth: 150 }}
              >
                Thử lại
              </Button>
            </>
          )}
        </Box>

        {/* Security Notice */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 3 }}
        >
          🔒 Giao dịch được xác thực bởi cổng thanh toán VNPay
        </Typography>
      </Paper>
    </Container>
  );
};

export default VNPayReturn;
