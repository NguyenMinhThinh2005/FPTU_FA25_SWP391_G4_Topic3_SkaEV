import { useState, useEffect, useCallback } from 'react';
import demandForecastingAPI from '../../../../services/api/demandForecastingAPI';
import stationsAPI from '../../../../services/api/stationsAPI';

export const useAIForecasting = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState('');
  const [forecast, setForecast] = useState(null);
  const [peakHours, setPeakHours] = useState([]);
  const [demandScores, setDemandScores] = useState([]);

  const fetchStations = useCallback(async () => {
    try {
      const data = await stationsAPI.getAllStations();
      setStations(data);
      if (data.length > 0) {
        setSelectedStation(data[0].stationID);
      }
    } catch (err) {
      console.error('Error fetching stations:', err);
      setError('Failed to load stations');
    }
  }, []);

  const fetchDemandScores = useCallback(async () => {
    try {
      const data = await demandForecastingAPI.getDemandScores();
      setDemandScores(data);
    } catch (err) {
      console.error('Error fetching demand scores:', err);
    }
  }, []);

  const fetchForecast = useCallback(async () => {
    if (!selectedStation) return;
    try {
      setLoading(true);
      const data = await demandForecastingAPI.getStationForecast(selectedStation);
      setForecast(data);
    } catch (err) {
      console.error('Error fetching forecast:', err);
      setError('Failed to load forecast data');
    } finally {
      setLoading(false);
    }
  }, [selectedStation]);

  const fetchPeakHours = useCallback(async () => {
    if (!selectedStation) return;
    try {
      const data = await demandForecastingAPI.getPeakHours(selectedStation);
      setPeakHours(data);
    } catch (err) {
      console.error('Error fetching peak hours:', err);
    }
  }, [selectedStation]);

  useEffect(() => {
    fetchStations();
    fetchDemandScores();
  }, [fetchStations, fetchDemandScores]);

  useEffect(() => {
    if (selectedStation) {
      fetchForecast();
      fetchPeakHours();
    }
  }, [fetchForecast, fetchPeakHours, selectedStation]);

  return {
    loading,
    error,
    setError,
    stations,
    selectedStation,
    setSelectedStation,
    forecast,
    peakHours,
    demandScores
  };
};