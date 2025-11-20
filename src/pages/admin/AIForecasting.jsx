<<<<<<< HEAD
import { useCallback, useEffect, useState } from "react";
=======
import { useEffect, useState, useCallback } from 'react';
>>>>>>> 63845a83230bd2c1c6a721f5e2c2559237204949
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Timeline as TimelineIcon,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import demandForecastingAPI from "../../services/api/demandForecastingAPI";
import stationsAPI from "../../services/api/stationsAPI";

const AIForecasting = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState("");
  const [forecast, setForecast] = useState(null);
  const [peakHours, setPeakHours] = useState([]);
  const [demandScores, setDemandScores] = useState([]);

<<<<<<< HEAD
=======
  // stabilize functions with useCallback so they can be safely included in
  // dependency arrays without triggering exhaustive-deps warnings
>>>>>>> 63845a83230bd2c1c6a721f5e2c2559237204949
  const fetchStations = useCallback(async () => {
    try {
      const data = await stationsAPI.getAllStations();
      setStations(data);
      if (data.length > 0) {
        setSelectedStation(data[0].stationID);
      }
    } catch (err) {
      console.error("Error fetching stations:", err);
      setError("Failed to load stations");
    }
  }, []);

<<<<<<< HEAD
  const fetchForecast = useCallback(async () => {
    if (!selectedStation) return;

=======
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
>>>>>>> 63845a83230bd2c1c6a721f5e2c2559237204949
    try {
      setLoading(true);
      const data = await demandForecastingAPI.getStationForecast(
        selectedStation
      );
      setForecast(data);
    } catch (err) {
      console.error("Error fetching forecast:", err);
      setError("Failed to load forecast data");
    } finally {
      setLoading(false);
    }
  }, [selectedStation]);

  const fetchPeakHours = useCallback(async () => {
    if (!selectedStation) return;
<<<<<<< HEAD

=======
>>>>>>> 63845a83230bd2c1c6a721f5e2c2559237204949
    try {
      const data = await demandForecastingAPI.getPeakHours(selectedStation);
      setPeakHours(data);
    } catch (err) {
      console.error("Error fetching peak hours:", err);
    }
  }, [selectedStation]);

<<<<<<< HEAD
  const fetchDemandScores = useCallback(async () => {
    try {
      const data = await demandForecastingAPI.getDemandScores();
      setDemandScores(data);
    } catch (err) {
      console.error("Error fetching demand scores:", err);
    }
  }, []);

  useEffect(() => {
    fetchStations();
    fetchDemandScores();
  }, [fetchDemandScores, fetchStations]);

  useEffect(() => {
    if (selectedStation) {
      fetchForecast();
      fetchPeakHours();
    }
=======
  useEffect(() => {
    fetchStations();
    fetchDemandScores();
  }, [fetchStations, fetchDemandScores]);

  useEffect(() => {
    if (selectedStation) {
      fetchForecast();
      fetchPeakHours();
    }
>>>>>>> 63845a83230bd2c1c6a721f5e2c2559237204949
  }, [fetchForecast, fetchPeakHours, selectedStation]);

  const getTrendIcon = (trend) => {
    switch (trend?.toLowerCase()) {
      case "increasing":
        return <TrendingUpIcon color="success" />;
      case "decreasing":
        return <TrendingDownIcon color="error" />;
      case "stable":
        return <TrendingFlatIcon color="action" />;
      default:
        return <TimelineIcon color="action" />;
    }
  };

  const getDemandColor = (category) => {
    switch (category?.toLowerCase()) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  if (loading && !forecast) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        AI Demand Forecasting
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Station Selector */}
      <FormControl fullWidth sx={{ mb: 3, maxWidth: 400 }}>
        <InputLabel>Select Station</InputLabel>
        <Select
          value={selectedStation}
          label="Select Station"
          onChange={(e) => setSelectedStation(e.target.value)}
        >
          {stations.map((station) => (
            <MenuItem key={station.stationID} value={station.stationID}>
              {station.stationName}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Forecast Summary */}
      {forecast && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Predicted Daily Bookings
                </Typography>
                <Typography variant="h4">
                  {forecast.predictedDailyBookings}
                </Typography>
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
                <Typography variant="h4">
                  {forecast.predictedEnergyDemand.toFixed(2)}
                </Typography>
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
                  {forecast.trendPercentage > 0 ? "+" : ""}
                  {forecast.trendPercentage}%
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
                <Typography variant="h4">
                  {forecast.confidenceScore}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Forecast reliability
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Peak Hours Chart */}
      {peakHours.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Predicted Peak Hours
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="hour"
                  label={{
                    value: "Hour of Day",
                    position: "insideBottom",
                    offset: -5,
                  }}
                />
                <YAxis
                  label={{
                    value: "Predicted Bookings",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="predictedBookings"
                  fill="#8884d8"
                  name="Predicted Bookings"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Demand Scores Table */}
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
                    <TableCell align="right">
                      {score.avgDailyBookings}
                    </TableCell>
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
    </Box>
  );
};

export default AIForecasting;
