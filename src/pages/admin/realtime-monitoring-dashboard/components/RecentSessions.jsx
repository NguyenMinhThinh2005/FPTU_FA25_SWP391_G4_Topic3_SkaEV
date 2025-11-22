import React from "react";
import { Card, CardContent, Typography, Divider, Grid, Paper, Box, Chip } from "@mui/material";
import { EvStation } from "@mui/icons-material";

const RecentSessions = ({ realtimeData }) => {
  if (!realtimeData?.recentSessions || realtimeData.recentSessions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Phiên sạc gần đây
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {realtimeData.recentSessions.map((session, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper sx={{ p: 2 }} variant="outlined">
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Chip
                    label={session.status || "active"}
                    color={
                      session.status === "in_progress"
                        ? "success"
                        : "default"
                    }
                    size="small"
                  />
                  <EvStation color="action" />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Người dùng: {session.userName || "N/A"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Năng lượng: {session.energyConsumed?.toFixed(2) || 0} kWh
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Bắt đầu:{" "}
                  {session.startTime
                    ? new Date(session.startTime).toLocaleTimeString(
                        "vi-VN"
                      )
                    : "N/A"}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default RecentSessions;