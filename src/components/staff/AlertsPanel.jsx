import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  Divider
} from "@mui/material";
import {
  Warning,
  Error,
  Info,
  PowerOff,
  Build,
  ArrowForward
} from "@mui/icons-material";

export default function AlertsPanel({ alerts = [], onViewAll, onAlertClick }) {
  const getAlertIcon = (severity) => {
    switch (severity) {
      case "error": return <Error color="error" />;
      case "warning": return <Warning color="warning" />;
      case "maintenance": return <Build color="info" />;
      case "offline": return <PowerOff color="error" />;
      default: return <Info color="info" />;
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case "error": return "error";
      case "warning": return "warning";
      case "maintenance": return "info";
      case "offline": return "error";
      default: return "default";
    }
  };

  const recentAlerts = alerts.slice(0, 5);

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={600}>
            Cảnh báo gần đây
          </Typography>
          {alerts.length > 5 && (
            <Button 
              size="small" 
              endIcon={<ArrowForward />}
              onClick={onViewAll}
            >
              Xem tất cả ({alerts.length})
            </Button>
          )}
        </Box>

        {recentAlerts.length === 0 ? (
          <Box textAlign="center" py={3}>
            <Info color="action" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Không có cảnh báo nào
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {recentAlerts.map((alert, index) => (
              <React.Fragment key={alert.id || index}>
                {index > 0 && <Divider />}
                <ListItem
                  button
                  onClick={() => onAlertClick?.(alert)}
                  sx={{ px: 0 }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getAlertIcon(alert.severity)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight={500}>
                          {alert.stationName}
                        </Typography>
                        <Chip 
                          label={alert.type} 
                          size="small" 
                          color={getAlertColor(alert.severity)}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {alert.message}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(alert.timestamp).toLocaleString('vi-VN')}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
