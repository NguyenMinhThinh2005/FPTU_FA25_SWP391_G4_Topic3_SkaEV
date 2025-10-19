import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    CircularProgress,
    InputAdornment,
    Grid,
    IconButton,
    Fade,
    Paper
} from '@mui/material';
import {
    Phone,
    Sms,
    Timer,
    Close,
    Refresh,
    CheckCircle,
    Warning
} from '@mui/icons-material';
import useAuthStore from '../../store/authStore';
import { socialAuthService } from '../../services/socialAuthService';

const PhoneOTPModal = ({ open, onClose, onSuccess }) => {
    const [step, setStep] = useState(1); // 1: Phone input, 2: OTP verification
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [canResend, setCanResend] = useState(true);

    const login = useAuthStore(state => state.login);
    const otpRefs = useRef([]);

    // Countdown timer for resend OTP
    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        } else if (countdown === 0 && step === 2) {
            setCanResend(true);
        }
        return () => clearTimeout(timer);
    }, [countdown, step]);

    // Format phone number display
    const formatPhoneDisplay = (phone) => {
        if (!phone) return '';
        if (phone.startsWith('+84')) {
            return phone.replace('+84', '0');
        }
        return phone;
    };

    // Validate Vietnamese phone number
    const validatePhoneNumber = (phone) => {
        const phoneRegex = /^(\+84|0)(3|5|7|8|9)[0-9]{8}$/;
        return phoneRegex.test(phone);
    };

    // Send OTP to phone number
    const handleSendOTP = async () => {
        if (!validatePhoneNumber(phoneNumber)) {
            setError('Vui lòng nhập số điện thoại hợp lệ (VD: 0901234567)');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await socialAuthService.loginWithPhone(phoneNumber);

            if (response.success) {
                setStep(2);
                setCountdown(300); // 5 minutes
                setCanResend(false);
                setSuccess(response.message);

                // Auto-focus first OTP input
                setTimeout(() => {
                    if (otpRefs.current[0]) {
                        otpRefs.current[0].focus();
                    }
                }, 100);
            }
        } catch (err) {
            setError(err.message || 'Gửi OTP thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    // Handle OTP input change
    const handleOtpChange = (index, value) => {
        // Only allow numbers
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1); // Only take last character
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }

        // Auto-verify when all digits entered
        if (index === 5 && value) {
            const fullOtp = newOtp.join('');
            if (fullOtp.length === 6) {
                setTimeout(() => handleVerifyOTP(fullOtp), 100);
            }
        }
    };

    // Handle OTP input keydown
    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowLeft' && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowRight' && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    // Verify OTP code
    const handleVerifyOTP = async (otpCode = null) => {
        const codeToVerify = otpCode || otp.join('');

        if (codeToVerify.length !== 6) {
            setError('Vui lòng nhập đầy đủ 6 chữ số');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await socialAuthService.verifyPhoneOTP(phoneNumber, codeToVerify);

            if (response.user) {
                // Login user
                await login({
                    email: response.user.phone,
                    password: 'phone-login' // Mock password for phone login
                });

                setSuccess('Đăng nhập thành công!');

                setTimeout(() => {
                    onSuccess?.(response);
                    onClose();
                }, 1000);
            }
        } catch (err) {
            setError(err.message || 'Mã OTP không chính xác');
            // Clear OTP inputs on error
            setOtp(['', '', '', '', '', '']);
            otpRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResendOTP = async () => {
        if (!canResend || loading) return;

        setLoading(true);
        setError('');
        setOtp(['', '', '', '', '', '']);

        try {
            const response = await socialAuthService.loginWithPhone(phoneNumber);

            if (response.success) {
                setCountdown(300);
                setCanResend(false);
                setSuccess('Mã OTP mới đã được gửi');
                otpRefs.current[0]?.focus();
            }
        } catch (err) {
            setError(err.message || 'Gửi lại OTP thất bại');
        } finally {
            setLoading(false);
        }
    };

    // Reset modal state on close
    const handleClose = () => {
        setStep(1);
        setPhoneNumber('');
        setOtp(['', '', '', '', '', '']);
        setError('');
        setSuccess('');
        setCountdown(0);
        setCanResend(true);
        onClose();
    };

    // Format countdown display
    const formatCountdown = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 2 }
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                        <Phone color="primary" />
                        <Typography variant="h6">
                            {step === 1 ? 'Đăng nhập bằng số điện thoại' : 'Xác thực OTP'}
                        </Typography>
                    </Box>
                    <IconButton onClick={handleClose} size="small">
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent>
                <Fade in={step === 1}>
                    <Box display={step === 1 ? 'block' : 'none'}>
                        <Typography variant="body2" color="text.secondary" mb={3}>
                            Nhập số điện thoại để nhận mã OTP xác thực
                        </Typography>

                        <TextField
                            fullWidth
                            label="Số điện thoại"
                            placeholder="VD: 0901234567"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Phone fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                            helperText="Hỗ trợ các mạng: Viettel, Vinaphone, Mobifone, Vietnamobile, Gmobile"
                            disabled={loading}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                        />

                        {error && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {error}
                            </Alert>
                        )}
                    </Box>
                </Fade>

                <Fade in={step === 2}>
                    <Box display={step === 2 ? 'block' : 'none'}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                bgcolor: 'primary.50',
                                border: '1px solid',
                                borderColor: 'primary.200',
                                mb: 3
                            }}
                        >
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <Sms color="primary" fontSize="small" />
                                <Typography variant="body2" fontWeight="medium">
                                    Mã OTP đã được gửi đến
                                </Typography>
                            </Box>
                            <Typography variant="h6" color="primary">
                                {formatPhoneDisplay(phoneNumber)}
                            </Typography>
                        </Paper>

                        <Typography variant="body2" color="text.secondary" mb={3} textAlign="center">
                            Nhập mã OTP gồm 6 chữ số
                        </Typography>

                        {/* OTP Input Grid */}
                        <Grid container spacing={1} justifyContent="center" mb={3}>
                            {otp.map((digit, index) => (
                                <Grid item key={index}>
                                    <TextField
                                        inputRef={el => otpRefs.current[index] = el}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        inputProps={{
                                            maxLength: 1,
                                            style: {
                                                textAlign: 'center',
                                                fontSize: '1.5rem',
                                                fontWeight: 'bold'
                                            }
                                        }}
                                        sx={{
                                            width: 56,
                                            '& .MuiOutlinedInput-root': {
                                                height: 56
                                            }
                                        }}
                                        disabled={loading}
                                    />
                                </Grid>
                            ))}
                        </Grid>

                        {/* Countdown & Resend */}
                        <Box textAlign="center" mb={2}>
                            {countdown > 0 ? (
                                <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                    <Timer fontSize="small" color="action" />
                                    <Typography variant="body2" color="text.secondary">
                                        Gửi lại sau {formatCountdown(countdown)}
                                    </Typography>
                                </Box>
                            ) : (
                                <Button
                                    startIcon={<Refresh />}
                                    onClick={handleResendOTP}
                                    disabled={loading || !canResend}
                                    variant="text"
                                    size="small"
                                >
                                    Gửi lại mã OTP
                                </Button>
                            )}
                        </Box>

                        {error && (
                            <Alert severity="error" sx={{ mt: 2 }} icon={<Warning />}>
                                {error}
                            </Alert>
                        )}

                        {success && (
                            <Alert severity="success" sx={{ mt: 2 }} icon={<CheckCircle />}>
                                {success}
                            </Alert>
                        )}
                    </Box>
                </Fade>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button
                    onClick={handleClose}
                    disabled={loading}
                    variant="outlined"
                >
                    Hủy
                </Button>

                {step === 1 ? (
                    <Button
                        onClick={handleSendOTP}
                        disabled={loading || !phoneNumber}
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={16} /> : <Sms />}
                    >
                        {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
                    </Button>
                ) : (
                    <Button
                        onClick={() => handleVerifyOTP()}
                        disabled={loading || otp.join('').length !== 6}
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={16} /> : <CheckCircle />}
                    >
                        {loading ? 'Đang xác thực...' : 'Xác thực'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default PhoneOTPModal;