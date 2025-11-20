import { create } from 'zustand';
import { incidentsAPI } from '../services/api';

const incidentStore = create((set, get) => ({
  incidents: [],
  selectedIncident: null,
  stats: null,
  isLoading: false,
  error: null,
  filters: {
    status: null,
    priority: null,
    stationId: null
  },

  // Fetch all incidents with filters
  fetchIncidents: async () => {
    set({ isLoading: true, error: null });
    try {
      const { status, priority, stationId } = get().filters;
      const params = {};
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (stationId) params.stationId = stationId;

      const response = await incidentsAPI.getAll(params);
      // Backend returns { data: [], pagination: {} }
      set({ incidents: response.data || [], isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching incidents:', error);
    }
  },

  // Fetch incident by ID
  fetchIncidentById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await incidentsAPI.getById(id);
      set({ selectedIncident: response, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching incident:', error);
    }
  },

  // Fetch incidents by station
  fetchIncidentsByStation: async (stationId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await incidentsAPI.getAll({ stationId });
      set({ incidents: response.data || [], isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching station incidents:', error);
    }
  },

  // Create new incident
  createIncident: async (incidentData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await incidentsAPI.create(incidentData);
      await get().fetchIncidents(); // Refresh list
      set({ isLoading: false });
      return response;
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
      const response = await incidentsAPI.update(id, updateData);
      await get().fetchIncidents(); // Refresh list
      set({ selectedIncident: response, isLoading: false });
      return response;
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
      const params = stationId ? { stationId } : {};
      const response = await incidentsAPI.getStatistics(params);
      set({ stats: response, isLoading: false });
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
    set({ filters: { status: null, priority: null, stationId: null } });
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
