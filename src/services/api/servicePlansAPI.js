import api from '../axiosConfig';

// Using shared axios instance from axiosConfig

const servicePlansAPI = {
  // Get all service plans
  getAll: async (planType = null) => {
    const params = planType ? { planType } : {};
    const response = await api.get('/api/ServicePlans', { params });
    return response.data;
  },

  // Get service plan by ID
  getById: async (id) => {
    const response = await api.get(`/api/ServicePlans/${id}`);
    return response.data;
  },

  // Create new service plan (Admin only)
  create: async (planData) => {
    const response = await api.post('/api/ServicePlans', planData);
    return response.data;
  },

  // Update service plan (Admin only)
  update: async (id, planData) => {
    const response = await api.put(`/api/ServicePlans/${id}`, planData);
    return response.data;
  },

  // Delete service plan (Admin only)
  delete: async (id) => {
    const response = await api.delete(`/api/ServicePlans/${id}`);
    return response.data;
  },

  // Toggle service plan status (Admin only)
  toggleStatus: async (id) => {
    const response = await api.patch(`/api/ServicePlans/${id}/toggle-status`);
    return response.data;
  },
};

export default servicePlansAPI;
