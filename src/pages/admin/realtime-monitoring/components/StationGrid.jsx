import React from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';
import StationStatusCard from './StationStatusCard';

const StationGrid = ({ stations }) => {
  if (stations.length === 0) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="body1" color="text.secondary" textAlign="center">
                No realtime station data available. Stations will appear here when updates are received.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      {stations.map((station) => (
        <Grid item xs={12} sm={6} md={4} key={station.stationID}>
          <StationStatusCard station={station} />
        </Grid>
      ))}
    </Grid>
  );
};

export default StationGrid;
