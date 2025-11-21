import React from 'react';
import { Box, Typography, Chip, Button, Grid, Paper } from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationIcon,
  Power as PowerIcon,
  Refresh as RefreshIcon,
  Block as BlockIcon
} from '@mui/icons-material';

const StationDetailHeader = ({ stationDetail, onBack, onControlStation }) => {
  if (!stationDetail) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={onBack}
        sx={{ mb: 2 }}
      >
        Quay lại danh sách
      </Button>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h4" fontWeight="bold">
              {stationDetail.name}
            </Typography>
            <Chip 
              label={stationDetail.status} 
              color={stationDetail.status === 'Active' ? 'success' : 'error'}
              size="small"
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 2 }}>
            <LocationIcon fontSize="small" />
            <Typography>{stationDetail.address}</Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <Typography variant="h6">{stationDetail.posts?.length || 0}</Typography>
                <Typography variant="body2">Trụ sạc</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                <Typography variant="h6">
                  {stationDetail.posts?.reduce((acc, post) => acc + (post.isAvailable ? 1 : 0), 0)}
                </Typography>
                <Typography variant="body2">Khả dụng</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="warning"
            startIcon={<RefreshIcon />}
            onClick={() => onControlStation('Reset')}
            fullWidth
          >
            Khởi động lại trạm
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<BlockIcon />}
            onClick={() => onControlStation('Stop')}
            fullWidth
          >
            Dừng khẩn cấp toàn trạm
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StationDetailHeader;
