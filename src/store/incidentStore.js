import { create } from 'zustand';
<<<<<<< HEAD
import { incidentsAPI } from '../services/api';
=======
import axiosInstance from '../services/axiosConfig';
>>>>>>> 63845a83230bd2c1c6a721f5e2c2559237204949

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

<<<<<<< HEAD
      const response = await incidentsAPI.getAll(params);
      // Backend returns { data: [], pagination: {} }
      set({ incidents: response.data || [], isLoading: false });
=======
      const response = await axiosInstance.get(`/incident?${params.toString()}`);
      let data = response.data?.data || response.data || [];
      // Normalize legacy severity values (map 'high' -> 'critical') and normalize status
      // so UI always works with the 3-state model: open, in_progress, resolved
      if (Array.isArray(data)) {
        data = data.map((it) => ({
          ...it,
          severity: (it.severity === 'high') ? 'critical' : it.severity,
          // map legacy/alternate status values into the simplified UI model
          status: (it.status === 'closed') ? 'resolved' : it.status
        }));
      }
      set({ incidents: Array.isArray(data) ? data : [], isLoading: false });
>>>>>>> 63845a83230bd2c1c6a721f5e2c2559237204949
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching incidents:', error);
    }
  },

  // Fetch incident by ID
  fetchIncidentById: async (id) => {
    set({ isLoading: true, error: null });
    try {
<<<<<<< HEAD
      const response = await incidentsAPI.getById(id);
      set({ selectedIncident: response, isLoading: false });
=======
      const response = await axiosInstance.get(`/incident/${id}`);
      let data = response.data?.data || response.data;
      if (data) {
        if (data.severity === 'high') data.severity = 'critical';
        if (data.status === 'closed') data.status = 'resolved';
      }
      set({ selectedIncident: data, isLoading: false });
>>>>>>> 63845a83230bd2c1c6a721f5e2c2559237204949
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching incident:', error);
    }
  },

  // Fetch incidents by station
  fetchIncidentsByStation: async (stationId) => {
    set({ isLoading: true, error: null });
    try {
<<<<<<< HEAD
      const response = await incidentsAPI.getAll({ stationId });
      set({ incidents: response.data || [], isLoading: false });
=======
      const response = await axiosInstance.get(`/incident/station/${stationId}`);
      const data = response.data?.data || response.data || [];
      set({ incidents: Array.isArray(data) ? data : [], isLoading: false });
>>>>>>> 63845a83230bd2c1c6a721f5e2c2559237204949
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching station incidents:', error);
    }
  },

  // Create new incident
  createIncident: async (incidentData) => {
    set({ isLoading: true, error: null });
    try {
<<<<<<< HEAD
      const response = await incidentsAPI.create(incidentData);
      await get().fetchIncidents(); // Refresh list
      set({ isLoading: false });
      return response;
=======
      const response = await axiosInstance.post('/incident', incidentData);
      await get().fetchIncidents(); // Refresh list
      set({ isLoading: false });
      return response.data?.data || response.data;
>>>>>>> 63845a83230bd2c1c6a721f5e2c2559237204949
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
<<<<<<< HEAD
      const response = await incidentsAPI.update(id, updateData);
      await get().fetchIncidents(); // Refresh list
      set({ selectedIncident: response, isLoading: false });
      return response;
=======
      const response = await axiosInstance.put(`/incident/${id}`, updateData);
      await get().fetchIncidents(); // Refresh list
      const data = response.data?.data || response.data;
      set({ selectedIncident: data, isLoading: false });
      return data;
>>>>>>> 63845a83230bd2c1c6a721f5e2c2559237204949
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
<<<<<<< HEAD
      const params = stationId ? { stationId } : {};
      const response = await incidentsAPI.getStatistics(params);
      set({ stats: response, isLoading: false });
=======
      const params = stationId ? `?stationId=${stationId}` : '';
      const response = await axiosInstance.get(`/incident/stats${params}`);
      const data = response.data?.data || response.data;
      set({ stats: data, isLoading: false });
>>>>>>> 63845a83230bd2c1c6a721f5e2c2559237204949
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
