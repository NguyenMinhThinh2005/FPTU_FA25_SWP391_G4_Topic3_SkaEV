import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

const ForecastSummary = ({ forecast }) => {
  if (!forecast) return null;

  const getTrendIcon = (trend) => {
    switch (trend?.toLowerCase()) {
      case 'increasing':
        return <TrendingUpIcon color="success" />;
      case 'decreasing':
        return <TrendingDownIcon color="error" />;
      case 'stable':
        return <TrendingFlatIcon color="action" />;
      default:
        return <TimelineIcon color="action" />;
    }
  };

  return (
    <Grid container spacing={3} mb={3}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Predicted Daily Bookings
            </Typography>
            <Typography variant="h4">{forecast.predictedDailyBookings}</Typography>
            <Typography variant="caption" color="text.secondary">
              Historical avg: {forecast.historicalAverage}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Predicted Energy Demand
            </Typography>
            <Typography variant="h4">{forecast.predictedEnergyDemand.toFixed(2)}</Typography>
            <Typography variant="caption" color="text.secondary">
              kWh per day
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography color="text.secondary">Trend</Typography>
              {getTrendIcon(forecast.trend)}
            </Box>
            <Typography variant="h4">
              {forecast.trendPercentage > 0 ? '+' : ''}{forecast.trendPercentage}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              vs last period
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Confidence Score
            </Typography>
            <Typography variant="h4">{forecast.confidenceScore}%</Typography>
            <Typography variant="caption" color="text.secondary">
              Forecast reliability
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ForecastSummary;