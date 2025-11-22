import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useAIForecasting } from './ai-forecasting/hooks/useAIForecasting';
import ForecastingHeader from './ai-forecasting/components/ForecastingHeader';
import StationSelector from './ai-forecasting/components/StationSelector';
import ForecastSummary from './ai-forecasting/components/ForecastSummary';
import PeakHoursChart from './ai-forecasting/components/PeakHoursChart';
import DemandScoresTable from './ai-forecasting/components/DemandScoresTable';

const AIForecasting = () => {
  const {
    loading,
    error,
    setError,
    stations,
    selectedStation,
    setSelectedStation,
    forecast,
    peakHours,
    demandScores
  } = useAIForecasting();

  if (loading && !forecast) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <ForecastingHeader error={error} onErrorClose={() => setError(null)} />

      <StationSelector 
        stations={stations} 
        selectedStation={selectedStation} 
        onStationChange={setSelectedStation} 
      />

      <ForecastSummary forecast={forecast} />

      <PeakHoursChart peakHours={peakHours} />

      <DemandScoresTable demandScores={demandScores} />
    </Box>
  );
};

export default AIForecasting;
