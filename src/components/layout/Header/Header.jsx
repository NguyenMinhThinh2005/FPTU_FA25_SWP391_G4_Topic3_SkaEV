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

  const handleLogout = () => {
    logout();
    navigate("/");
    handleClose();
  };

  const handleDashboard = () => {
    const dashboardPath = {
      admin: "/admin/dashboard",
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
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #B5FF3D 0%, #1379FF 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 2,
              fontWeight: "bold",
              color: "white",
              fontSize: "1.2rem",
            }}
          >
            S
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
