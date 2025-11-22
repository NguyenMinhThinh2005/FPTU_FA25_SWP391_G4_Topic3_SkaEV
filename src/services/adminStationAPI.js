import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth header
const createAuthAxios = () => {
  const token = localStorage.getItem('token');
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  });
};

/**
 * Admin Station Management API Service
 * Integrates with the new comprehensive station management backend
 */
const adminStationAPI = {
  // ========== Station List & Search ==========
  
  /**
   * Get all stations with filtering, sorting and pagination
   */
  async getStations(filters = {}) {
    const api = createAuthAxios();
    const params = {
      page: filters.page || 1,
      pageSize: filters.pageSize || 20,
      sortBy: filters.sortBy || 'StationName',
      sortDescending: filters.sortDescending || false,
      ...(filters.city && { city: filters.city }),
      ...(filters.status && { status: filters.status }),
      ...(filters.searchTerm && { searchTerm: filters.searchTerm }),
      ...(filters.hasErrors !== undefined && { hasErrors: filters.hasErrors }),
      ...(filters.minUtilization !== undefined && { minUtilization: filters.minUtilization }),
      ...(filters.maxUtilization !== undefined && { maxUtilization: filters.maxUtilization })
    };
    
    const response = await api.get('/admin/stations', { params });
    return response.data;
  },

  /**
   * Get detailed information for a specific station
   */
  async getStationDetail(stationId) {
    const api = createAuthAxios();
    const response = await api.get(`/admin/stations/${stationId}`);
    return response.data;
  },

  // ========== Real-time Monitoring ==========
  
  /**
   * Get real-time monitoring data for a station
   */
  async getStationRealTimeData(stationId) {
    const api = createAuthAxios();
    const response = await api.get(`/admin/stations/${stationId}/realtime`);
    return response.data;
  },

  // ========== Remote Control ==========
  
  /**
   * Control a specific charging point (post)
   * Commands: start, stop, restart, pause, resume, maintenance
   */
  async controlChargingPoint(postId, command, reason = null) {
    const api = createAuthAxios();
    const response = await api.post(`/admin/stations/posts/${postId}/control`, {
      command,
      reason
    });
    return response.data;
  },

  /**
   * Control entire station (all charging points)
   * Commands: enable_all, disable_all, restart_all, maintenance_mode
   */
  async controlStation(stationId, command, reason = null, applyToAllPosts = true) {
    const api = createAuthAxios();
    const response = await api.post(`/admin/stations/${stationId}/control`, {
      command,
      reason,
      applyToAllPosts
    });
    return response.data;
  },

  // ========== Configuration ==========
  
  /**
   * Configure charging point settings
   */
  async configureChargingPoint(postId, config) {
    const api = createAuthAxios();
    const response = await api.put(`/admin/stations/posts/${postId}/config`, config);
    return response.data;
  },

  // ========== Error Management ==========
  
  /**
   * Get error logs for a specific station
   */
  async getStationErrors(stationId, includeResolved = false) {
    const api = createAuthAxios();
    const response = await api.get(`/admin/stations/${stationId}/errors`, {
      params: { includeResolved }
    });
    return response.data;
  },

  /**
   * Mark an error as resolved
   */
  async resolveError(logId, resolution) {
    const api = createAuthAxios();
    const response = await api.patch(`/admin/stations/errors/${logId}/resolve`, {
      resolution
    });
    return response.data;
  },

  /**
   * Log a new station error/warning
   */
  async logStationError(stationId, error) {
    const api = createAuthAxios();
    const response = await api.post(`/admin/stations/${stationId}/errors`, error);
    return response.data;
  },

  // ========== CRUD Operations ==========
  
  /**
   * Create a new charging station
   */
  async createStation(stationData) {
    const api = createAuthAxios();
    const response = await api.post('/admin/stations', stationData);
    return response.data;
  },

  /**
   * Update station information
   */
  async updateStation(stationId, stationData) {
    const api = createAuthAxios();
    const response = await api.put(`/admin/stations/${stationId}`, stationData);
    return response.data;
  },

  /**
   * Delete station (soft delete)
   */
  async deleteStation(stationId) {
    const api = createAuthAxios();
    const response = await api.delete(`/admin/stations/${stationId}`);
    return response.data;
  },

  /**
   * Update manager assignment for a station
   */
  async updateStationManager(stationId, managerUserId) {
    const api = createAuthAxios();
    const response = await api.put(`/admin/stations/${stationId}/manager`, {
      managerUserId,
    });
    return response.data;
  },

  /**
   * Add a new charging post to a station
   */
  async createChargingPost(stationId, postData) {
    const api = createAuthAxios();
    const response = await api.post(`/admin/stations/${stationId}/posts`, postData);
    return response.data;
  },

  // ========== Helper Methods ==========
  
  /**
   * Quick station status toggle
   */
  async toggleStationStatus(stationId, currentStatus) {
    const command = currentStatus === 'active' ? 'disable_all' : 'enable_all';
    return this.controlStation(stationId, command, 'Admin manual toggle');
  },

  /**
   * Emergency stop - disable all posts
   */
  async emergencyStopStation(stationId, reason) {
    return this.controlStation(stationId, 'disable_all', reason);
  },

  /**
   * Restart station - useful for troubleshooting
   */
  async restartStation(stationId, reason = 'Admin initiated restart') {
    return this.controlStation(stationId, 'restart_all', reason);
  },

  /**
   * Set station to maintenance mode
   */
  async setMaintenanceMode(stationId, reason) {
    return this.controlStation(stationId, 'maintenance_mode', reason);
  }
};

export default adminStationAPI;
