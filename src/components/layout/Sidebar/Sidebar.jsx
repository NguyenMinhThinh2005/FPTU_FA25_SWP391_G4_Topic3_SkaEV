import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
} from "@mui/material";
import {
  Dashboard,
  LocationOn,
  History,
  Payment,
  Person,
  Business,
  Analytics,
  People,
  ElectricCar,
  Warning,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../../../store/authStore";
import { getText } from "../../../utils/vietnameseTexts";

const drawerWidth = 260;

const Sidebar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const getNavigationItems = () => {
    switch (user?.role) {
      case "admin":
        return [
          // Admin dashboard intentionally hidden from the main nav to
          // reduce clutter for admin workflows. Keep other admin routes.
          {
            text: getText("nav.advancedAnalytics"),
            icon: <Analytics />,
            path: "/admin/analytics",
          },
          {
            text: getText("nav.stationManagement"),
            icon: <LocationOn />,
            path: "/admin/stations",
          },
          {
            text: getText("nav.userManagement"),
            icon: <People />,
            path: "/admin/users",
          },
          {
            text: "Quản lý báo cáo sự cố",
            icon: <Warning />,
            path: "/admin/incidents",
          },
        ];

      case "staff":
        return [
          {
            text: "Tổng quan Trạm sạc",
            icon: <Dashboard />,
            path: "/staff/dashboard",
          },
          {
            text: "Quản lý Phiên sạc",
            icon: <ElectricCar />,
            path: "/staff/charging-sessions",
          },
          {
            text: "Theo dõi & Báo cáo",
            icon: <LocationOn />,
            path: "/staff/monitoring",
          },
          {
            text: "Tài khoản",
            icon: <Person />,
            path: "/staff/profile",
          },
        ];

      case "customer":
        return [
          // 1. Hồ sơ cá nhân (giữ nguyên quản lý xe và lịch sử sạc)
          {
            text: "Hồ sơ cá nhân",
            icon: <Person />,
            path: "/customer/profile",
          },
          // 2. Đặt chỗ sạc (luồng sạc chính)
          {
            text: "Đặt chỗ sạc",
            icon: <ElectricCar />,
            path: "/customer/charging",
          },
          // 3. Thanh toán (tách riêng)
          {
            text: "Thanh toán",
            icon: <Payment />,
            path: "/customer/payment",
          },
        ];

      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const drawerContent = (
    <Box
      sx={{ width: drawerWidth, height: "100%", bgcolor: "background.paper" }}
    >
      {/* Sidebar Header */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              mr: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
              boxShadow: "0 3px 8px rgba(0,0,0,0.08)",
              border: "1.5px solid rgba(19, 121, 255, 0.08)",
              transition: "all 0.2s ease",
              "&:hover": {
                boxShadow: "0 5px 15px rgba(19, 121, 255, 0.12)",
                border: "1.5px solid rgba(19, 121, 255, 0.2)",
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
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))",
              }}
            />
          </Box>
          <Typography variant="h6" fontWeight="bold">
            SkaEV
          </Typography>
        </Box>
        {user && (
          <Typography variant="body2" color="text.secondary">
            {getText("nav.welcome")}, {user.profile?.firstName}
          </Typography>
        )}
      </Box>

      {/* Navigation Menu */}
      <List sx={{ px: 2, py: 1 }}>
        {user?.role === "customer" ? (
          <>
            {/* Trang chủ */}
            {navigationItems
              .filter((item) => !item.category)
              .map((item) => (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => handleNavigation(item.path)}
                    selected={isActivePath(item.path)}
                    sx={{
                      borderRadius: 2,
                      "&.Mui-selected": {
                        backgroundColor: "primary.main",
                        color: "white",
                        "& .MuiListItemIcon-root": {
                          color: "white",
                        },
                        "&:hover": {
                          backgroundColor: "primary.dark",
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: "0.9rem",
                        fontWeight: isActivePath(item.path) ? 600 : 400,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}

            <Divider sx={{ my: 2 }} />

            {/* Quản lý tài khoản */}
            <Typography
              variant="overline"
              sx={{
                px: 2,
                py: 1,
                color: "text.secondary",
                fontWeight: 600,
                display: "none",
              }}
            >
              Tài khoản
            </Typography>
            {navigationItems
              .filter((item) => item.category === "account")
              .map((item) => (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => handleNavigation(item.path)}
                    selected={isActivePath(item.path)}
                    sx={{
                      borderRadius: 2,
                      pl: 2,
                      "&.Mui-selected": {
                        backgroundColor: "primary.main",
                        color: "white",
                        "& .MuiListItemIcon-root": {
                          color: "white",
                        },
                        "&:hover": {
                          backgroundColor: "primary.dark",
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 35 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: "0.9rem",
                        fontWeight: isActivePath(item.path) ? 600 : 400,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}

            {/* Sạc xe */}
            <Typography
              variant="overline"
              sx={{
                px: 2,
                py: 1,
                mt: 2,
                color: "text.secondary",
                fontWeight: 600,
                display: "none",
              }}
            >
              Sạc xe
            </Typography>
            {navigationItems
              .filter((item) => item.category === "charging")
              .map((item) => (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => handleNavigation(item.path)}
                    selected={isActivePath(item.path)}
                    sx={{
                      borderRadius: 2,
                      pl: 2,
                      "&.Mui-selected": {
                        backgroundColor: "primary.main",
                        color: "white",
                        "& .MuiListItemIcon-root": {
                          color: "white",
                        },
                        "&:hover": {
                          backgroundColor: "primary.dark",
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 35 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: "0.9rem",
                        fontWeight: isActivePath(item.path) ? 600 : 400,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
          </>
        ) : (
          // For other roles (admin, staff)
          <>
            {navigationItems.map((item) => (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  selected={isActivePath(item.path)}
                  sx={{
                    borderRadius: 2,
                    "&.Mui-selected": {
                      backgroundColor: "primary.main",
                      color: "white",
                      "& .MuiListItemIcon-root": {
                        color: "white",
                      },
                      "&:hover": {
                        backgroundColor: "primary.dark",
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: "0.9rem",
                      fontWeight: isActivePath(item.path) ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </>
        )}
      </List>

      <Divider sx={{ mx: 2, my: 2 }} />
    </Box>
  );

  return (
    <>
      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            position: "relative",
            height: "calc(100vh - 64px)", // Subtract header height
            borderRight: 1,
            borderColor: "divider",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;
