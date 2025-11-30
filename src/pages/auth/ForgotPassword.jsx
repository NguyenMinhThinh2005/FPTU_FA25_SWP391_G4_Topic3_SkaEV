/* eslint-disable */
import React, { useState } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    Alert,
    CircularProgress,
    Avatar,
    Stack,
    Link,
} from "@mui/material";
import {
    LockReset,
    ArrowBack,
    Email,
    CheckCircle,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { validateEmail } from "../../utils/helpers";

const ForgotPassword = () => {
    const navigate = useNavigate();

    const [step, setStep] = useState("email"); // email, sent, reset
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [resetCode, setResetCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState({});

    const handleSendReset = async () => {
        if (!validateEmail(email)) {
            setErrors({ email: "Email không hợp lệ" });
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1200));

            // Simulate different scenarios
            if (email === "notfound@example.com") {
                setErrors({ email: "Không tìm thấy tài khoản với email này" });
                return;
            }

            setStep("sent");
        } catch (error) {
            setErrors({ general: "Có lỗi xảy ra. Vui lòng thử lại." });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (resetCode.length !== 6) {
            setErrors({ code: "Mã xác thực phải có 6 số" });
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            if (resetCode === "123456") {
                setStep("reset");
            } else {
                setErrors({ code: "Mã xác thực không chính xác" });
            }
        } catch (error) {
            setErrors({ general: "Có lỗi xảy ra. Vui lòng thử lại." });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        const validationErrors = {};

        if (newPassword.length < 6) {
            validationErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
        }

        if (newPassword !== confirmPassword) {
            validationErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
        }

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Success - redirect to login
            navigate("/login?reset=success");
        } catch (error) {
            setErrors({ general: "Có lỗi xảy ra. Vui lòng thử lại." });
        } finally {
            setLoading(false);
        }
    };

    const renderEmailStep = () => (
        <>
            <Box sx={{ textAlign: "center", mb: 4 }}>
                <Avatar sx={{
                    bgcolor: "primary.main",
                    width: 64,
                    height: 64,
                    mx: "auto",
                    mb: 2
                }}>
                    <LockReset sx={{ fontSize: 32 }} />
                </Avatar>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Quên mật khẩu?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Nhập email của bạn để nhận link đặt lại mật khẩu
                </Typography>
            </Box>

            {errors.general && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {errors.general}
                </Alert>
            )}

            <TextField
                fullWidth
                label="Địa chỉ email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                sx={{ mb: 3 }}
                InputProps={{
                    startAdornment: <Email sx={{ mr: 1, color: "text.secondary" }} />
                }}
            />

            <Button
                fullWidth
                variant="contained"
                onClick={handleSendReset}
                disabled={loading || !email}
                sx={{
                    background: "linear-gradient(135deg, #B5FF3D 0%, #1379FF 100%)",
                    py: 1.5,
                    fontWeight: "bold",
                    mb: 2,
                }}
            >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Gửi link đặt lại"}
            </Button>
        </>
    );

    const renderSentStep = () => (
        <>
            <Box sx={{ textAlign: "center", mb: 4 }}>
                <Avatar sx={{
                    bgcolor: "success.main",
                    width: 64,
                    height: 64,
                    mx: "auto",
                    mb: 2
                }}>
                    <Email sx={{ fontSize: 32 }} />
                </Avatar>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Email đã được gửi! 📧
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Chúng tôi đã gửi mã xác thực 6 số đến:
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="primary.main">
                    {email}
                </Typography>
            </Box>

            {errors.general && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {errors.general}
                </Alert>
            )}

            <TextField
                fullWidth
                label="Mã xác thực 6 số"
                placeholder="Nhập mã từ email"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                error={!!errors.code}
                helperText={errors.code || "Kiểm tra thư mục spam nếu không thấy email"}
                sx={{ mb: 3 }}
                inputProps={{
                    maxLength: 6,
                    style: { textAlign: "center", fontSize: "1.2rem", letterSpacing: "0.5rem" }
                }}
            />

            <Button
                fullWidth
                variant="contained"
                onClick={handleVerifyCode}
                disabled={loading || resetCode.length !== 6}
                sx={{
                    background: "linear-gradient(135deg, #B5FF3D 0%, #1379FF 100%)",
                    py: 1.5,
                    fontWeight: "bold",
                    mb: 2,
                }}
            >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Xác thực mã"}
            </Button>

            <Button
                fullWidth
                variant="outlined"
                onClick={() => setStep("email")}
            >
                Gửi lại mã
            </Button>
        </>
    );

    const renderResetStep = () => (
        <>
            <Box sx={{ textAlign: "center", mb: 4 }}>
                <Avatar sx={{
                    bgcolor: "success.main",
                    width: 64,
                    height: 64,
                    mx: "auto",
                    mb: 2
                }}>
                    <CheckCircle sx={{ fontSize: 32 }} />
                </Avatar>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Đặt mật khẩu mới
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Tạo mật khẩu mạnh để bảo vệ tài khoản của bạn
                </Typography>
            </Box>

            {errors.general && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {errors.general}
                </Alert>
            )}

            <TextField
                fullWidth
                label="Mật khẩu mới"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={!!errors.password}
                helperText={errors.password || "Ít nhất 6 ký tự"}
                sx={{ mb: 2 }}
            />

            <TextField
                fullWidth
                label="Xác nhận mật khẩu"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                sx={{ mb: 3 }}
            />

            <Button
                fullWidth
                variant="contained"
                onClick={handleResetPassword}
                disabled={loading || !newPassword || !confirmPassword}
                sx={{
                    background: "linear-gradient(135deg, #B5FF3D 0%, #1379FF 100%)",
                    py: 1.5,
                    fontWeight: "bold",
                    mb: 2,
                }}
            >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Đổi mật khẩu"}
            </Button>
        </>
    );

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                p: 2,
            }}
        >
            <Card sx={{ maxWidth: 420, width: "100%", borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                    {/* Header */}
                    <Box sx={{ textAlign: "center", mb: 3 }}>
                        <Typography variant="h6" fontWeight="bold" color="primary.main">
                            SkaEV
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Khôi phục tài khoản
                        </Typography>
                    </Box>

                    {/* Step Content */}
                    {step === "email" && renderEmailStep()}
                    {step === "sent" && renderSentStep()}
                    {step === "reset" && renderResetStep()}

                    {/* Back to Login */}
                    <Stack direction="row" justifyContent="center" sx={{ mt: 3 }}>
                        <Link
                            component="button"
                            onClick={() => navigate("/login")}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                textDecoration: "none",
                                color: "text.secondary",
                                "&:hover": { color: "primary.main" }
                            }}
                        >
                            <ArrowBack sx={{ fontSize: 16, mr: 0.5 }} />
                            Quay lại đăng nhập
                        </Link>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
};

export default ForgotPassword;