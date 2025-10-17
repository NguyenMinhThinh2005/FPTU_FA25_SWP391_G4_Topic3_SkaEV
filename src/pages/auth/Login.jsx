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
  Divider,
  Grid,
  Chip,
  Link,
  IconButton,
} from "@mui/material";
import { ElectricCar, Login, Google, Phone } from "@mui/icons-material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { authAPI } from "../../services/api";
import { getText } from "../../utils/vietnameseTexts";
import { googleAuth } from "../../services/socialAuthService";
import PhoneOTPModal from "../../components/auth/PhoneOTPModal";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [socialLoading, setSocialLoading] = useState({
    google: false,
  });

  const [phoneModalOpen, setPhoneModalOpen] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData.email, formData.password);

    if (result.success) {
      console.log("Login successful", result.data);

      // Try to get role from login result first
      let userRole = result.data?.user?.role;

      // If backend only returned token, fetch profile to get role
      if (!userRole) {
        try {
          const profile = await authAPI.getProfile();
          userRole = profile?.role || profile?.Role || profile?.roleName;
        } catch (err) {
          console.warn("Failed to fetch profile after login:", err);
        }
      }

      // Normalize role to lowercase when present
      if (typeof userRole === "string") userRole = userRole.toLowerCase();

      // Navigate based on user role
      switch (userRole) {
        case "admin":
          navigate("/admin/dashboard");
          break;
        case "staff":
          navigate("/staff/dashboard");
          break;
        case "customer":
          navigate("/customer/charging");
          break;
        default:
          navigate("/");
      }
    }
  };

  // Social login handlers
  const handleGoogleLogin = async () => {
    setSocialLoading((prev) => ({ ...prev, google: true }));
    try {
      const response = await googleAuth.signIn();
      if (response.success && response.user) {
        await login(response.user.email, "social-login");
        console.log("Google login successful:", response.user.name);
        // Show success message
        alert(`Chào mừng ${response.user.name}! Đăng nhập Google thành công.`);
      } else if (!response.success) {
        console.error("Google login failed:", response.error);
      }
    } catch (error) {
      console.error("Google login failed:", error.message);
      // Show user-friendly error
      if (error.message.includes("cancelled")) {
        // User cancelled, no need to show error
        return;
      }
      alert(`Đăng nhập Google thất bại: ${error.message}`);
    } finally {
      setSocialLoading((prev) => ({ ...prev, google: false }));
    }
  };

  const handlePhoneLoginSuccess = (response) => {
    console.log("Phone login successful:", response);
  };

  const demoAccounts = [
    {
      email: "admin@skaev.com",
      password: "Admin123!",
      role: getText("users.admin"),
      color: "error",
    },
    {
      email: "staff@skaev.com",
      password: "Staff123!",
      role: getText("users.staff"),
      color: "info",
    },
    {
      email: "nguyenvanan@gmail.com",
      password: "Customer123!",
      role: getText("users.customer"),
      color: "success",
    },
  ];

  const fillDemoAccount = (account) => {
    setFormData({
      email: account.email,
      password: account.password,
    });
    if (error) clearError();
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
          maxWidth: 480,
          width: "100%",
          borderRadius: 3,
          boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Logo & Title */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box
              onClick={() => navigate("/")}
              sx={{
                width: 80,
                height: 80,
                borderRadius: "20px",
                background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                border: "2px solid rgba(19, 121, 255, 0.1)",
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "scale(1.05)",
                  boxShadow: "0 8px 25px rgba(19, 121, 255, 0.3)",
                  border: "2px solid rgba(19, 121, 255, 0.3)",
                },
              }}
            >
              <img
                src="/assets/images/skaev_logo.png"
                alt="SkaEV Logo"
                style={{
                  width: "150%",
                  height: "150%",
                  objectFit: "contain",
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                }}
              />
            </Box>
            <Typography
              variant="h4"
              fontWeight="bold"
              gutterBottom
              onClick={() => navigate("/")}
              sx={{
                cursor: "pointer",
                transition: "color 0.3s ease",
                "&:hover": {
                  color: "primary.main",
                },
              }}
            >
              SkaEV
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {getText("auth.loginSubtitle")}
            </Typography>
          </Box>
          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label={getText("auth.email")}
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label={getText("auth.password")}
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Login />}
              sx={{ mb: 3 }}
            >
              {loading ? getText("auth.signingIn") : getText("auth.login")}
            </Button>
          </form>
          <Box sx={{ textAlign: "center", mt: 2, mb: 2 }}>
            <Link
              component={RouterLink}
              to="/forgot-password"
              sx={{
                textDecoration: "none",
                fontWeight: "medium",
                fontSize: "0.875rem",
              }}
            >
              Quên mật khẩu?
            </Link>
          </Box>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {getText("auth.dontHaveAccount")}{" "}
              <Link
                component={RouterLink}
                to="/register"
                sx={{ textDecoration: "none", fontWeight: "medium" }}
              >
                {getText("auth.registerHere")}
              </Link>
            </Typography>
          </Box>
          {/* Social Login */}
          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Hoặc đăng nhập với
            </Typography>
          </Divider>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={
                  socialLoading.google ? (
                    <CircularProgress size={16} />
                  ) : (
                    <Google />
                  )
                }
                onClick={handleGoogleLogin}
                disabled={socialLoading.google || loading}
                sx={{
                  textTransform: "none",
                  borderColor: "#db4437",
                  color: "#db4437",
                  "&:hover": {
                    borderColor: "#db4437",
                    bgcolor: "#db4437",
                    color: "white",
                  },
                }}
              >
                Google
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Phone />}
                onClick={() => setPhoneModalOpen(true)}
                disabled={loading}
                sx={{
                  textTransform: "none",
                  borderColor: "#28a745",
                  color: "#28a745",
                  "&:hover": {
                    borderColor: "#28a745",
                    bgcolor: "#28a745",
                    color: "white",
                  },
                }}
              >
                Số điện thoại
              </Button>
            </Grid>
          </Grid>
          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {getText("auth.demoAccounts")}
            </Typography>
          </Divider>{" "}
          {/* Demo Accounts */}
          <Grid container spacing={2}>
            {demoAccounts.map((account, index) => (
              <Grid item xs={12} key={index}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => fillDemoAccount(account)}
                  disabled={loading}
                  sx={{
                    justifyContent: "space-between",
                    textTransform: "none",
                    py: 1.5,
                  }}
                >
                  <Box sx={{ textAlign: "left" }}>
                    <Typography variant="body2" fontWeight="medium">
                      {account.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {account.password}
                    </Typography>
                  </Box>
                  <Chip
                    label={account.role}
                    color={account.color}
                    size="small"
                  />
                </Button>
              </Grid>
            ))}
          </Grid>
          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {getText("auth.clickToFill")}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Phone OTP Modal */}
      <PhoneOTPModal
        open={phoneModalOpen}
        onClose={() => setPhoneModalOpen(false)}
        onSuccess={handlePhoneLoginSuccess}
      />
    </Box>
  );
};

export default LoginPage;
