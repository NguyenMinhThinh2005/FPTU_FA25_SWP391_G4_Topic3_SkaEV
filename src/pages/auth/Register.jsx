/* eslint-disable */
import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Google,
  Phone,
  PersonAdd,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { getText } from "../../utils/vietnameseTexts";
import { googleAuth } from "../../services/socialAuthService";
import PhoneOTPModal from "../../components/auth/PhoneOTPModal";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { loading, error, clearError, register, socialRegister } =
    useAuthStore();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "customer",
    agreeToTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [socialLoading, setSocialLoading] = useState({
    google: false,
    phone: false,
  });
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "agreeToTerms" ? checked : value,
    }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: "" }));
    if (error) clearError();
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.firstName.trim())
      errors.firstName = getText("errors.required");
    if (!formData.lastName.trim()) errors.lastName = getText("errors.required");
    if (!formData.email.trim()) errors.email = getText("errors.emailRequired");
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      errors.email = getText("errors.emailInvalid");
    if (!formData.phone.trim()) errors.phone = getText("errors.required");
    else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, "")))
      errors.phone = getText("errors.phoneInvalid");
    if (!formData.password)
      errors.password = getText("errors.passwordRequired");
    else if (formData.password.length < 6)
      errors.password = getText("errors.passwordTooShort");
    if (!formData.confirmPassword)
      errors.confirmPassword = getText("errors.required");
    else if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = "Mật khẩu xác nhận không khớp";
    if (!formData.agreeToTerms)
      errors.agreeToTerms = "Bạn phải đồng ý với điều khoản sử dụng";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const result = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
      });

      if (result.success) {
        if (result.requiresVerification)
          navigate(
            `/verify-email?email=${encodeURIComponent(
              formData.email
            )}&mode=auto`
          );
        else navigate("/customer/dashboard");
      }
    } catch (err) {
      console.error("Registration failed:", err);
    }
  };

  const handleGoogleRegister = async () => {
    setSocialLoading({ ...socialLoading, google: true });
    try {
      const googleResult = await googleAuth.signUp();
      if (googleResult.success) {
        const authResult = await socialRegister("google", googleResult.user);
        if (authResult.success) navigate("/customer/dashboard");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSocialLoading({ ...socialLoading, google: false });
    }
  };

  const handlePhoneRegister = () => setPhoneModalOpen(true);
  const handlePhoneOTPSuccess = async (phoneData) => {
    try {
      const authResult = await socialRegister("phone", {
        phone: phoneData.phoneNumber,
        name: phoneData.name || "Người dùng",
        email: phoneData.email || `${phoneData.phoneNumber}@skaev.temp`,
        verified: true,
      });
      if (authResult.success) {
        setPhoneModalOpen(false);
        navigate("/customer/dashboard");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1379FF 0%, #B5FF3D 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 500,
          width: "100%",
          borderRadius: 3,
          boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header with circular clickable logo */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box
              onClick={() => navigate("/")}
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                border: "2px solid rgba(19, 121, 255, 0.1)",
                cursor: "pointer",
                overflow: "hidden",
              }}
            >
              <img
                src="/assets/images/skaev_logo.png"
                alt="SkaEV Logo"
                style={{
                  width: "120%",
                  height: "120%",
                  objectFit: "contain",
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                }}
              />
            </Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {getText("auth.registerTitle")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {getText("auth.registerSubtitle")}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <TextField
                name="firstName"
                label={getText("auth.firstName")}
                value={formData.firstName}
                onChange={handleInputChange}
                error={!!formErrors.firstName}
                helperText={formErrors.firstName}
                fullWidth
                required
              />
              <TextField
                name="lastName"
                label={getText("auth.lastName")}
                value={formData.lastName}
                onChange={handleInputChange}
                error={!!formErrors.lastName}
                helperText={formErrors.lastName}
                fullWidth
                required
              />
            </Box>

            <TextField
              name="email"
              label={getText("auth.email")}
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              error={!!formErrors.email}
              helperText={formErrors.email}
              fullWidth
              required
              sx={{ mb: 2 }}
            />

            <TextField
              name="phone"
              label={getText("auth.phone")}
              value={formData.phone}
              onChange={handleInputChange}
              error={!!formErrors.phone}
              helperText={formErrors.phone}
              fullWidth
              required
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <TextField
                name="password"
                label={getText("auth.password")}
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange}
                error={!!formErrors.password}
                helperText={formErrors.password}
                fullWidth
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                name="confirmPassword"
                label={getText("auth.confirmPassword")}
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                error={!!formErrors.confirmPassword}
                helperText={formErrors.confirmPassword}
                fullWidth
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        edge="end"
                      >
                        {showConfirmPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                />
              }
              label={
                <Typography variant="body2">
                  Tôi đồng ý với{" "}
                  <a href="/terms" target="_blank" rel="noreferrer">
                    Điều khoản
                  </a>
                </Typography>
              }
              sx={{ mb: 2 }}
            />
            {formErrors.agreeToTerms && (
              <Typography
                variant="caption"
                color="error"
                sx={{ display: "block", mb: 1 }}
              >
                {formErrors.agreeToTerms}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={
                loading ? <CircularProgress size={20} /> : <PersonAdd />
              }
              sx={{ mb: 2, py: 1.5, fontWeight: "bold" }}
            >
              {loading ? getText("auth.registering") : getText("auth.register")}
            </Button>

            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Đã có tài khoản?{" "}
                <span
                  onClick={() => navigate("/login")}
                  style={{
                    color: "#1379FF",
                    textDecoration: "none",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  Đăng nhập
                </span>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
      <PhoneOTPModal
        open={phoneModalOpen}
        onClose={() => setPhoneModalOpen(false)}
        onSuccess={handlePhoneOTPSuccess}
      />
    </Box>
  );
};

export default RegisterPage;
