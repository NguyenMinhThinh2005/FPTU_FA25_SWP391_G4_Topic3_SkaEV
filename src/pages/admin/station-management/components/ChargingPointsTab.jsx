import React from 'react';
import { 
  Grid, Card, CardContent, Typography, Box, Chip, 
  IconButton, Tooltip, Divider, LinearProgress 
} from '@mui/material';
import {
  EvStation as EvStationIcon,
  PowerSettingsNew as PowerIcon,
  History as HistoryIcon,
  Build as BuildIcon
} from '@mui/icons-material';

const ChargingPointsTab = ({ posts, onControlClick }) => {
  if (!posts || posts.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
        <Typography>Chưa có trụ sạc nào được lắp đặt tại trạm này.</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {posts.map((post) => (
        <Grid item xs={12} md={6} lg={4} key={post.id}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EvStationIcon color="primary" />
                  <Typography variant="h6">{post.sku}</Typography>
                </Box>
                <Chip 
                  label={post.status} 
                  color={post.status === 'Available' ? 'success' : post.status === 'Charging' ? 'primary' : 'default'}
                  size="small"
                />
              </Box>

              <Divider sx={{ my: 1 }} />

              <Box sx={{ my: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">Công suất hiện tại</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {post.currentPower || 0} kW
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(((post.currentPower || 0) / 11) * 100, 100)} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Cập nhật: {new Date().toLocaleTimeString()}
                </Typography>
                <Box>
                  <Tooltip title="Khởi động lại">
                    <IconButton 
                      size="small" 
                      color="warning"
                      onClick={() => onControlClick(post, 'Reset')}
                    >
                      <HistoryIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Bảo trì">
                    <IconButton 
                      size="small" 
                      color="info"
                      onClick={() => onControlClick(post, 'Maintenance')}
                    >
                      <BuildIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Ngắt nguồn">
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => onControlClick(post, 'Stop')}
                    >
                      <PowerIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default ChargingPointsTab;
