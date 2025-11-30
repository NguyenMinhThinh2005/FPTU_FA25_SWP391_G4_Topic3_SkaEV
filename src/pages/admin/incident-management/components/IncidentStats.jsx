import React from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';
import PropTypes from 'prop-types';

const IncidentStats = ({ stats }) => {
  if (!stats) return null;

  return (
    <Grid container spacing={2} sx={{ mb: 3 }} justifyContent="space-between">
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Tổng số
            </Typography>
            <Typography variant="h4">{stats.totalIncidents}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ borderLeft: 4, borderColor: 'error.main' }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Chưa xử lý
            </Typography>
            <Typography variant="h4" color="error">
              {stats.openIncidents}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ borderLeft: 4, borderColor: 'warning.main' }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Đang xử lý
            </Typography>
            <Typography variant="h4" color="warning.main">
              {stats.inProgressIncidents}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ borderLeft: 4, borderColor: 'success.main' }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Đã xử lý
            </Typography>
            <Typography variant="h4" color="success.main">
              {stats.resolvedIncidents}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

IncidentStats.propTypes = {
  stats: PropTypes.shape({
    totalIncidents: PropTypes.number,
    openIncidents: PropTypes.number,
    inProgressIncidents: PropTypes.number,
    resolvedIncidents: PropTypes.number
  })
};

export default IncidentStats;
