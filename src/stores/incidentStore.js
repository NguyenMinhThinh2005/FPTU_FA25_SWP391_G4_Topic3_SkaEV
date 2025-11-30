import { create } from 'zustand';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const incidentStore = create((set, get) => ({
  incidents: [],
  selectedIncident: null,
  stats: null,
  isLoading: false,
  error: null,
  filters: {
    status: null,
    severity: null,
    stationId: null
  },

  // Fetch all incidents with filters
  fetchIncidents: async () => {
    set({ isLoading: true, error: null });
    try {
      const { status, severity, stationId } = get().filters;
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (severity) params.append('severity', severity);
      if (stationId) params.append('stationId', stationId);

      const response = await axios.get(`${API_URL}/incident?${params.toString()}`);
      set({ incidents: response.data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching incidents:', error);
    }
  },

  // Fetch incident by ID
  fetchIncidentById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/incident/${id}`);
      set({ selectedIncident: response.data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching incident:', error);
    }
  },

  // Fetch incidents by station
  fetchIncidentsByStation: async (stationId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/incident/station/${stationId}`);
      set({ incidents: response.data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching station incidents:', error);
    }
  },

  // Create new incident
  createIncident: async (incidentData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/incident`, incidentData);
      await get().fetchIncidents(); // Refresh list
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error creating incident:', error);
      throw error;
    }
  },

  // Update incident
  updateIncident: async (id, updateData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`${API_URL}/incident/${id}`, updateData);
      await get().fetchIncidents(); // Refresh list
      set({ selectedIncident: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error updating incident:', error);
      throw error;
    }
  },

  // Fetch incident statistics
  fetchStats: async (stationId = null) => {
    set({ isLoading: true, error: null });
    try {
      const params = stationId ? `?stationId=${stationId}` : '';
      const response = await axios.get(`${API_URL}/incident/stats${params}`);
      set({ stats: response.data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching stats:', error);
    }
  },

  // Set filters
  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
    get().fetchIncidents();
  },

  // Clear filters
  clearFilters: () => {
    set({ filters: { status: null, severity: null, stationId: null } });
    get().fetchIncidents();
  },

  // Clear selected incident
  clearSelectedIncident: () => {
    set({ selectedIncident: null });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  }
}));

export default incidentStore;
