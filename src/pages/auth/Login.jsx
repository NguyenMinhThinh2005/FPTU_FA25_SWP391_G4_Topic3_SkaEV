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
} from "@mui/material";
import { ElectricCar, Login } from "@mui/icons-material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { getText } from "../../utils/vietnameseTexts";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

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
      // Navigation will be handled by the PublicRoute component
      console.log("Login successful");
    }
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
      email: "john.doe@gmail.com",
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
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #1379FF 0%, #B5FF3D 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                color: "white",
                fontSize: "2rem",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "scale(1.05)",
                  boxShadow: "0 8px 25px rgba(19, 121, 255, 0.3)",
                },
              }}
            >
              <ElectricCar fontSize="large" />
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

          <Box sx={{ textAlign: "center", mt: 3, mb: 3 }}>
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
                startIcon={<img src="/assets/google-icon.svg" alt="Google" width="20" height="20" />}
                onClick={() => console.log("Google login")}
                sx={{ textTransform: "none" }}
              >
                Google
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<img src="/assets/facebook-icon.svg" alt="Facebook" width="20" height="20" />}
                onClick={() => console.log("Facebook login")}
                sx={{ textTransform: "none" }}
              >
                Facebook
              </Button>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {getText("auth.demoAccounts")}
            </Typography>
          </Divider>          {/* Demo Accounts */}
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
    </Box>
  );
};

export default LoginPage;
