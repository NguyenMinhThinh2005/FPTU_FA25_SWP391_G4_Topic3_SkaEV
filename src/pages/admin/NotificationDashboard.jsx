import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Avatar,
  Chip,
  IconButton,
  Badge,
  Skeleton,
  Alert,
  Fade,
  Zoom,
} from "@mui/material";
import {
  Notifications,
  NotificationsActive,
  ElectricCar,
  Warning,
  Info,
  CheckCircle,
  Error,
  TrendingUp,
  LocationOn,
  People,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";

// Mock data for notifications
const mockNotifications = [
  {
    id: 1,
    title: "New Station Alert",
    message: "A new charging station has been registered in Ho Chi Minh City",
    timestamp: new Date(2025, 9, 1, 10, 30),
    read: false,
    priority: "high",
    category: "station",
  },
  {
    id: 2,
    title: "System Update",
    message: "System maintenance scheduled for tonight at 2 AM",
    timestamp: new Date(2025, 9, 1, 9, 15),
    read: true,
    priority: "medium",
    category: "system",
  },
  // Add more mock notifications as needed
];

const NotificationDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  // Stats for notification counts
  const notificationStats = {
    total: notifications.length,
    unread: notifications.filter((n) => !n.read).length,
    high: notifications.filter((n) => n.priority === "high").length,
    medium: notifications.filter((n) => n.priority === "medium").length,
    low: notifications.filter((n) => n.priority === "low").length,
  };

  // Group notifications by date
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const date = new Date(notification.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {});

  // Function to mark notification as read
  const markAsRead = (id) => {
    setNotifications(
      notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    );
  };

  // Function to mark all as read
  const markAllAsRead = () => {
    setNotifications(
      notifications.map((n) => ({ ...n, read: true }))
    );
  };

  // Function to get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  // Function to format date
  const formatDate = (date) => {
    return new Date(date).toLocaleTimeString();
  };

  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter((notification) => {
    switch (filter) {
      case "unread":
        return !notification.read;
      case "high":
        return notification.priority === "high";
      case "medium":
        return notification.priority === "medium";
      case "low":
        return notification.priority === "low";
      default:
        return true;
    }
  });

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Notifications
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage all system notifications
        </Typography>
      </Box>

      {/* Notification Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              cursor: "pointer",
              border: filter === "all" ? 2 : 0,
              borderColor: "primary.main",
            }}
            onClick={() => setFilter("all")}
          >
            <CardContent sx={{ textAlign: "center" }}>
              <Avatar sx={{ bgcolor: "primary.main", mx: "auto", mb: 1 }}>
                <Notifications />
              </Avatar>
              <Typography variant="h5" fontWeight="bold">
                {notificationStats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              cursor: "pointer",
              border: filter === "unread" ? 2 : 0,
              borderColor: "info.main",
            }}
            onClick={() => setFilter("unread")}
          >
            <CardContent sx={{ textAlign: "center" }}>
              <Avatar sx={{ bgcolor: "info.main", mx: "auto", mb: 1 }}>
                <NotificationsActive />
              </Avatar>
              <Typography variant="h5" fontWeight="bold">
                {notificationStats.unread}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Unread
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Add more stat cards for different priorities */}
      </Grid>

      {/* Actions */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          onClick={markAllAsRead}
          disabled={notificationStats.unread === 0}
        >
          Mark All as Read
        </Button>
      </Box>

      {/* Notifications List */}
      <Box>
        {loading ? (
          // Loading skeleton
          <Box>
            {[1, 2, 3].map((n) => (
              <Card key={n} sx={{ mb: 2 }}>
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : notifications.length === 0 ? (
          // Empty state
          <Card>
            <CardContent sx={{ textAlign: "center", py: 8 }}>
              <Avatar
                sx={{
                  bgcolor: "grey.100",
                  mx: "auto",
                  mb: 2,
                  width: 64,
                  height: 64,
                }}
              >
                <Notifications sx={{ fontSize: 32, color: "grey.400" }} />
              </Avatar>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No notifications found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filter === "all"
                  ? "You have no notifications at the moment"
                  : `No ${
                      filter === "unread" ? "unread" : `${filter} priority`
                    } notifications`}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          // Notifications grouped by date
          Object.entries(groupedNotifications).map(([date, dayNotifications]) => (
            <Box key={date} sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ mb: 2, color: "text.secondary" }}
              >
                {date === new Date().toDateString()
                  ? "Today"
                  : date === new Date(Date.now() - 86400000).toDateString()
                  ? "Yesterday"
                  : date}
              </Typography>

              <Grid container spacing={2}>
                {dayNotifications.map((notification, index) => (
                  <Grid item xs={12} key={notification.id}>
                    <Zoom
                      in={true}
                      style={{ transitionDelay: `${index * 100}ms` }}
                    >
                      <Card
                        sx={{
                          cursor: "pointer",
                          opacity: notification.read ? 0.7 : 1,
                          border: !notification.read ? 1 : 0,
                          borderColor: "primary.light",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: 4,
                          },
                        }}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <CardContent>
                          <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                            <Box sx={{ flexGrow: 1 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mb: 1,
                                }}
                              >
                                <Typography
                                  variant="subtitle1"
                                  fontWeight="bold"
                                  sx={{ flexGrow: 1 }}
                                >
                                  {notification.title}
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <Chip
                                    label={notification.priority}
                                    color={getPriorityColor(notification.priority)}
                                    size="small"
                                  />
                                  {!notification.read && (
                                    <Badge color="primary" variant="dot" />
                                  )}
                                </Box>
                              </Box>

                              <Typography variant="body2" sx={{ mb: 1 }}>
                                {notification.message}
                              </Typography>

                              <Typography variant="caption" color="text.secondary">
                                {formatDate(notification.timestamp)}
                                {notification.category && (
                                  <Chip
                                    label={notification.category}
                                    size="small"
                                    variant="outlined"
                                    sx={{ ml: 1, height: 20 }}
                                  />
                                )}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Zoom>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
};

export default NotificationDashboard;