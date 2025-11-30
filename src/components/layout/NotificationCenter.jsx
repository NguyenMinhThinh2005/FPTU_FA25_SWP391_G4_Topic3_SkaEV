import React, { useState, useEffect } from 'react';
import {
    IconButton,
    Badge,
    Menu,
    MenuItem,
    Box,
    Typography,
    Divider,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Chip,
    Paper,
    Tooltip
} from '@mui/material';
import {
    Notifications,
    NotificationsActive,
    CheckCircle,
    Info,
    Warning,
    Error as ErrorIcon,
    Delete,
    DoneAll,
    ClearAll
} from '@mui/icons-material';
import notificationService from '../../services/notificationService';

const NotificationCenter = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const open = Boolean(anchorEl);

    useEffect(() => {
        // Subscribe to notification changes
        const unsubscribe = notificationService.subscribe(({ notifications, unreadCount }) => {
            setNotifications(notifications);
            setUnreadCount(unreadCount);
        });

        // Load initial data
        setNotifications(notificationService.getAll());
        setUnreadCount(notificationService.getUnreadCount());

        // Request notification permission on mount
        notificationService.requestPermission();

        return unsubscribe;
    }, []);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = (notification) => {
        notificationService.markAsRead(notification.id);
        if (notification.onClick) {
            notification.onClick();
        }
        handleClose();
    };

    const handleMarkAllAsRead = () => {
        notificationService.markAllAsRead();
    };

    const handleClearAll = () => {
        notificationService.clearAll();
        handleClose();
    };

    const handleDeleteNotification = (notificationId, event) => {
        event.stopPropagation();
        notificationService.deleteNotification(notificationId);
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'success':
                return <CheckCircle sx={{ color: 'success.main' }} />;
            case 'info':
                return <Info sx={{ color: 'info.main' }} />;
            case 'warning':
                return <Warning sx={{ color: 'warning.main' }} />;
            case 'error':
                return <ErrorIcon sx={{ color: 'error.main' }} />;
            default:
                return <Notifications sx={{ color: 'primary.main' }} />;
        }
    };

    const getTimeAgo = (timestamp) => {
        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now - then;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return then.toLocaleDateString('vi-VN');
    };

    return (
        <>
            <Tooltip title="Thông báo">
                <IconButton
                    onClick={handleClick}
                    sx={{ ml: 1 }}
                >
                    <Badge badgeContent={unreadCount} color="error">
                        {unreadCount > 0 ? (
                            <NotificationsActive color="primary" />
                        ) : (
                            <Notifications />
                        )}
                    </Badge>
                </IconButton>
            </Tooltip>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                    sx: {
                        width: 400,
                        maxHeight: 600,
                        mt: 1.5
                    }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                {/* Header */}
                <Box sx={{ p: 2, pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" fontWeight="bold">
                            Thông báo
                        </Typography>
                        {unreadCount > 0 && (
                            <Chip
                                label={`${unreadCount} mới`}
                                color="error"
                                size="small"
                            />
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {unreadCount > 0 && (
                            <Button
                                size="small"
                                startIcon={<DoneAll />}
                                onClick={handleMarkAllAsRead}
                            >
                                Đánh dấu đã đọc
                            </Button>
                        )}
                        {notifications.length > 0 && (
                            <Button
                                size="small"
                                startIcon={<ClearAll />}
                                onClick={handleClearAll}
                                color="error"
                            >
                                Xóa tất cả
                            </Button>
                        )}
                    </Box>
                </Box>

                <Divider />

                {/* Notification List */}
                {notifications.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Notifications sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                            Không có thông báo mới
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
                        {notifications.map((notification) => (
                            <ListItem
                                key={notification.id}
                                button
                                onClick={() => handleNotificationClick(notification)}
                                sx={{
                                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                                    '&:hover': {
                                        bgcolor: 'action.selected'
                                    },
                                    borderLeft: notification.read ? 'none' : '4px solid',
                                    borderColor: 'primary.main',
                                    py: 1.5
                                }}
                                secondaryAction={
                                    <IconButton
                                        edge="end"
                                        size="small"
                                        onClick={(e) => handleDeleteNotification(notification.id, e)}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                }
                            >
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: 'background.paper' }}>
                                        {getNotificationIcon(notification.type)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                            <Typography variant="subtitle2" fontWeight="medium">
                                                {notification.title}
                                            </Typography>
                                            {!notification.read && (
                                                <Box
                                                    sx={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: '50%',
                                                        bgcolor: 'primary.main'
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    }
                                    secondary={
                                        <Box>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                {notification.message}
                                            </Typography>
                                            <Typography variant="caption" color="text.disabled">
                                                {getTimeAgo(notification.timestamp)}
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </Menu>
        </>
    );
};

export default NotificationCenter;
