import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Badge,
  Box,
} from "@mui/material";
import { AccountCircle, Logout, Dashboard } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../../store/authStore";
import { getText } from "../../../utils/vietnameseTexts";
import NotificationCenter from "../NotificationCenter";

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
    handleClose();
  };

  const handleDashboard = () => {
    const dashboardPath = {
      admin: "/admin/stations", // Admin goes to Station Management
      staff: "/staff/dashboard",
      customer: "/customer/charging",
    }[user?.role];

    if (dashboardPath) {
      navigate(dashboardPath);
    }
    handleClose();
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "#EF4444";
      case "staff":
        return "#3B82F6";
      case "customer":
        return "#10B981";
      default:
        return "#6C757D";
    }
  };

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        {/* Logo & Brand */}
        <Box
          component="div"
          sx={{
            flexGrow: 1,
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
          }}
          onClick={() => navigate("/")}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              mr: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              border: "2px solid rgba(19, 121, 255, 0.1)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 8px 25px rgba(19, 121, 255, 0.15)",
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
          <Typography variant="h6" component="div" fontWeight="bold">
            SkaEV
          </Typography>
        </Box>

        {/* User Info & Actions */}
        {user && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Role Badge */}
            <Box
              sx={{
                backgroundColor: getRoleColor(user.role),
                color: "white",
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: "0.75rem",
                fontWeight: "medium",
                textTransform: "uppercase",
              }}
            >
              {user.role}
            </Box>

            {/* Notification Center */}
            <NotificationCenter />

            {/* User Menu */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
                sx={{ p: 0 }}
              >
                <Avatar
                  alt={user.profile?.firstName}
                  src={user.profile?.avatar}
                  sx={{ width: 36, height: 36 }}
                >
                  {user.profile?.firstName?.[0]}
                </Avatar>
              </IconButton>

              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                {user?.role !== "customer" && (
                  <MenuItem onClick={handleDashboard}>
                    <Dashboard sx={{ mr: 1 }} />
                    {getText("nav.dashboard")}
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout}>
                  <Logout sx={{ mr: 1 }} />
                  {getText("auth.logout")}
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        )}

        {/* Login Button for non-authenticated users */}
        {!user && (
          <Button
            color="inherit"
            onClick={() => navigate("/login")}
            variant="outlined"
            sx={{ ml: 2 }}
          >
            {getText("auth.login")}
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
