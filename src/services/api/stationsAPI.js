import api from '../axiosConfig';

/**
 * Get all charging stations
 */
export const getAllStations = async () => {
  const response = await api.get('/stations');
  return response.data;
};

/**
 * Get station by ID
 */
export const getStationById = async (id) => {
  const response = await api.get(`/stations/${id}`);
  return response.data;
};

/**
 * Get available slots for a station
 */
export const getAvailableSlots = async (stationId, date) => {
  // Backend endpoint: GET /api/Stations/{stationId}/slots
  // Optional date param currently unused by API; include only if provided
  const config = date ? { params: { date } } : undefined;
  const response = await api.get(`/stations/${stationId}/slots`, config);
  return response.data;
};

/**
 * Get nearby stations
 */
export const getNearbyStations = async (latitude, longitude, radius = 10) => {
  const response = await api.get('/stations/nearby', {
    params: { latitude, longitude, radius }
  });
  return response.data;
};

/**
 * Search stations
 */
export const searchStations = async (query) => {
  const response = await api.get('/stations/search', {
    params: { query }
  });
  return response.data;
};

/**
 * Get station statistics
 */
export const getStationStats = async (stationId) => {
  const response = await api.get(`/stations/${stationId}/stats`);
  return response.data;
};

/**
 * Get stations by filter
 */
export const filterStations = async (filters) => {
  const response = await api.get('/stations/filter', {
    params: filters
  });
  return response.data;
};

export default {
  getAllStations,
  getStationById,
  getAvailableSlots,
  getNearbyStations,
  searchStations,
  getStationStats,
  filterStations
};
