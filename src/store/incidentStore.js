import { create } from 'zustand';
import axiosInstance from '../services/axiosConfig';

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

      const response = await axiosInstance.get(`/incident?${params.toString()}`);
      let data = response.data?.data || response.data || [];
      // Normalize legacy severity values (map 'high' -> 'critical') so UI shows only the 3 levels
      if (Array.isArray(data)) {
        data = data.map((it) => ({
          ...it,
          severity: (it.severity === 'high') ? 'critical' : it.severity
        }));
      }
      set({ incidents: Array.isArray(data) ? data : [], isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching incidents:', error);
    }
  },

  // Fetch incident by ID
  fetchIncidentById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get(`/incident/${id}`);
      let data = response.data?.data || response.data;
      if (data && data.severity === 'high') data.severity = 'critical';
      set({ selectedIncident: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching incident:', error);
    }
  },

  // Fetch incidents by station
  fetchIncidentsByStation: async (stationId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get(`/incident/station/${stationId}`);
      const data = response.data?.data || response.data || [];
      set({ incidents: Array.isArray(data) ? data : [], isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching station incidents:', error);
    }
  },

  // Create new incident
  createIncident: async (incidentData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.post('/incident', incidentData);
      await get().fetchIncidents(); // Refresh list
      set({ isLoading: false });
      return response.data?.data || response.data;
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
      const response = await axiosInstance.put(`/incident/${id}`, updateData);
      await get().fetchIncidents(); // Refresh list
      const data = response.data?.data || response.data;
      set({ selectedIncident: data, isLoading: false });
      return data;
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
      const response = await axiosInstance.get(`/incident/stats${params}`);
      const data = response.data?.data || response.data;
      set({ stats: data, isLoading: false });
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
