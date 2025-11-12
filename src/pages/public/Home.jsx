import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import {
  ElectricCar,
  Speed,
  LocationOn,
  Security,
  TrendingUp,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { getText } from "../../utils/vietnameseTexts";
import statisticsAPI from "../../services/api/statisticsAPI";

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [stats, setStats] = useState([
    { label: "Trạm sạc đang hoạt động", value: "30", color: "primary" },
    { label: "Khách hàng đăng ký", value: "1,000+", color: "success" },
    { label: "Lượt sạc thành công", value: "20,000+", color: "warning" },
    { label: "Độ tin cậy hệ thống", value: "99.8%", color: "secondary" },
  ]);

  // Fetch real statistics from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await statisticsAPI.getHomeStats();
        if (response.success && response.data) {
          const { activeStations, registeredUsers, successfulSessions, systemReliability } = response.data;
          
          setStats([
            { 
              label: "Trạm sạc đang hoạt động", 
              value: activeStations.toString(), 
              color: "primary" 
            },
            { 
              label: "Khách hàng đăng ký", 
              value: registeredUsers >= 1000 ? `${Math.floor(registeredUsers / 1000)},${registeredUsers % 1000}+` : registeredUsers.toString(), 
              color: "success" 
            },
            { 
              label: "Lượt sạc thành công", 
              value: successfulSessions >= 1000 ? `${Math.floor(successfulSessions / 1000)},${String(successfulSessions % 1000).padStart(3, '0')}+` : successfulSessions.toString(), 
              color: "warning" 
            },
            { 
              label: "Độ tin cậy hệ thống", 
              value: `${systemReliability}%`, 
              color: "secondary" 
            },
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch statistics:", error);
        // Keep default values if API fails
      }
    };

    fetchStats();
  }, []);

  const features = [
    {
      icon: <Speed sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "Sạc nhanh DC/AC",
      description:
        "Hỗ trợ sạc nhanh DC lên đến 150kW và AC 22kW, rút ngắn thời gian chờ đợi",
    },
    {
      icon: <LocationOn sx={{ fontSize: 40, color: "success.main" }} />,
      title: "Mạng lưới rộng khắp",
      description:
        "3 trạm sạc tại trung tâm thành phố, cung cấp đầy đủ nhu cầu sử dụng cho khu đô thị",
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40, color: "secondary.main" }} />,
      title: "Theo dõi thời gian thực",
      description:
        "Giám sát trạng thái trạm sạc, thời gian chờ và quá trình sạc trực tiếp trên app",
    },
    {
      icon: <Security sx={{ fontSize: 40, color: "info.main" }} />,
      title: "Thanh toán an toàn",
      description:
        "Hỗ trợ đa dạng phương thức thanh toán: QR Code, thẻ RFID, ví điện tử",
    },
  ];

  const handleGetStarted = () => {
    if (isAuthenticated) {
      // Redirect to appropriate dashboard/main page
      const redirectPath = {
        admin: "/admin/dashboard",
        staff: "/staff/dashboard",
        customer: "/customer/charging", // Customer goes to charging flow
      }[user?.role];
      if (redirectPath) navigate(redirectPath);
    } else {
      navigate("/login");
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
        m: 0,
        p: 0,
        minHeight: "100vh",
        position: "relative",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #1379FF 0%, #B5FF3D 100%)",
          color: "white",
          position: "relative",
          overflow: "hidden",
          width: "100%",
        }}
      >
        {/* Navigation */}
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              py: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  mr: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "18px",
                  background: "rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(10px)",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                }}
              >
                <img
                  src="/assets/images/skaev_logo.png"
                  alt="SkaEV Logo"
                  style={{
                    width: "150%",
                    height: "150%",
                    objectFit: "contain",
                    filter: "brightness(1.1) contrast(1.1)",
                  }}
                />
              </Box>
              <Typography variant="h5" fontWeight="bold">
                SkaEV
              </Typography>
            </Box>

            {!isAuthenticated && (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => navigate("/login")}
                  sx={{
                    borderColor: "rgba(255,255,255,0.5)",
                    "&:hover": {
                      borderColor: "white",
                      backgroundColor: "rgba(255,255,255,0.1)",
                    },
                  }}
                >
                  {getText("auth.login")}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate("/register")}
                  sx={{
                    backgroundColor: "#B5FF3D",
                    color: "#000000",
                    fontWeight: "bold",
                    border: "1px solid #B5FF3D",
                    textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                    "&:hover": {
                      backgroundColor: "#9FE830",
                      color: "#000000",
                      transform: "translateY(-1px)",
                      boxShadow: "0 4px 12px rgba(181, 255, 61, 0.4)",
                    },
                  }}
                >
                  {getText("auth.register")}
                </Button>
              </Box>
            )}
          </Box>
        </Container>

        {/* Hero Section */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h2"
                fontWeight="bold"
                gutterBottom
                sx={{ fontSize: { xs: "2.5rem", md: "3.5rem" } }}
              >
                Hệ thống quản lý trạm sạc xe điện thông minh
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
                Giải pháp toàn diện cho việc tìm kiếm, đặt chỗ và thanh toán tại
                các trạm sạc xe điện trên toàn quốc
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexWrap: "wrap",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { xs: "stretch", sm: "center" },
                }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleGetStarted}
                  sx={{
                    backgroundColor: "#B5FF3D",
                    color: "#1a1a1a",
                    fontWeight: "bold",
                    "&:hover": {
                      backgroundColor: "#9FE830",
                      color: "#000000",
                      transform: "translateY(-2px)",
                      boxShadow: "0 8px 25px rgba(181, 255, 61, 0.3)",
                    },
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 15px rgba(181, 255, 61, 0.2)",
                  }}
                >
                  {isAuthenticated
                    ? user?.role === "customer"
                      ? getText("home.findStations")
                      : getText("home.goToDashboard")
                    : getText("auth.getStarted")}
                </Button>

                {!isAuthenticated && (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate("/register")}
                    sx={{
                      backgroundColor: "#FF6B35",
                      color: "#ffffff",
                      fontWeight: "bold",
                      border: "none",
                      fontSize: "1.1rem",
                      textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                      "&:hover": {
                        backgroundColor: "#E55A2B",
                        color: "#ffffff",
                        border: "none",
                        transform: "translateY(-2px)",
                        boxShadow: "0 8px 25px rgba(255, 107, 53, 0.4)",
                      },
                      transition: "all 0.3s ease",
                      boxShadow: "0 4px 15px rgba(255, 107, 53, 0.3)",
                    }}
                  >
                    {getText("auth.signUpFree")}
                  </Button>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  textAlign: "center",
                  position: "relative",
                  width: "100%",
                  height: { xs: "200px", md: "300px" },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <ElectricCar
                  sx={{
                    fontSize: { xs: 150, md: 250 },
                    opacity: 0.3,
                    animation: "float 3s ease-in-out infinite",
                    color: "rgba(255, 255, 255, 0.8)",
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={3}>
          {stats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Card
                sx={{
                  textAlign: "center",
                  height: "100%",
                  border: 1,
                  borderColor: "grey.200",
                  "&:hover": {
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent>
                  <Typography
                    variant="h3"
                    fontWeight="bold"
                    color={`${stat.color}.main`}
                    gutterBottom
                  >
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Box sx={{ backgroundColor: "grey.50", py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Tại sao chọn SkaEV?
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Nền tảng quản lý trạm sạc xe điện hàng đầu Việt Nam với công nghệ
              tiên tiến
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    height: "100%",
                    textAlign: "center",
                    p: 2,
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 6,
                      transition: "all 0.3s ease",
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="lg" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Đang sẵn sàng bắt đầu hành trình xe điện?
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Tham gia cùng hàng nghìn tài xế xe điện đang sử dụng mạng lưới sạc
          SkaEV
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={handleGetStarted}
          sx={{
            mt: 3,
            backgroundColor: "#1379FF",
            color: "white",
            fontWeight: "bold",
            "&:hover": {
              backgroundColor: "#0056CC",
              transform: "translateY(-2px)",
              boxShadow: "0 8px 25px rgba(19, 121, 255, 0.3)",
            },
            transition: "all 0.3s ease",
            boxShadow: "0 4px 15px rgba(19, 121, 255, 0.2)",
          }}
        >
          {isAuthenticated
            ? getText("home.goToDashboard")
            : getText("auth.getStartedToday")}
        </Button>
      </Container>

      {/* Footer */}
      <Box sx={{ backgroundColor: "grey.900", color: "white", py: 4 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              SkaEV
            </Typography>
            <Typography variant="body2" color="grey.400">
              © 2025 SkaEV. Nền tảng quản lý sạc xe điện thông minh - Phát triển
              bởi FPTU SWP391
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Animation Keyframes */}
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
        `}
      </style>
    </Box>
  );
};

export default HomePage;
