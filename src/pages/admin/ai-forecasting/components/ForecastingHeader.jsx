import React from 'react';
import { Typography, Alert, Box } from '@mui/material';

const ForecastingHeader = ({ error, onErrorClose }) => {
  return (
    <Box mb={3}>
      <Typography variant="h4" gutterBottom>
        AI Demand Forecasting
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={onErrorClose}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default ForecastingHeader;