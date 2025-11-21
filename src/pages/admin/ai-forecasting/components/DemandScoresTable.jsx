import React from 'react';
import { Card, CardContent, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Chip } from '@mui/material';

const DemandScoresTable = ({ demandScores }) => {
  const getDemandColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Station Demand Scores
        </Typography>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Station Name</TableCell>
                <TableCell align="right">Demand Score</TableCell>
                <TableCell align="right">Avg Daily Bookings</TableCell>
                <TableCell>Category</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {demandScores.slice(0, 10).map((score) => (
                <TableRow key={score.stationId}>
                  <TableCell>{score.stationName}</TableCell>
                  <TableCell align="right">
                    <strong>{score.demandScore}</strong>
                  </TableCell>
                  <TableCell align="right">{score.avgDailyBookings}</TableCell>
                  <TableCell>
                    <Chip
                      label={score.category.toUpperCase()}
                      color={getDemandColor(score.category)}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default DemandScoresTable;