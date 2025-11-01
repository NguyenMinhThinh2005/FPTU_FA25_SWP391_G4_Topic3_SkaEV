import apiClient from '../axiosConfig';

const demandForecastingAPI = {
  // Get demand forecast for a station
  getStationForecast: async (stationId, startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await apiClient.get(`/DemandForecasting/station/${stationId}`, { params });
    return response.data;
  },

  // Get peak hours prediction
  getPeakHours: async (stationId, date) => {
    const params = {};
    if (date) params.date = date;
    
    const response = await apiClient.get(`/DemandForecasting/station/${stationId}/peak-hours`, { params });
    return response.data;
  },

  // Get demand scores for all stations
  getDemandScores: async () => {
    const response = await apiClient.get('/DemandForecasting/demand-scores');
    return response.data;
  }
};

export default demandForecastingAPI;
