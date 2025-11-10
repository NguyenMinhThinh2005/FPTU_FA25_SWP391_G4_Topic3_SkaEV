import axiosInstance from "../axiosConfig";

const adminAPI = {
  // User Analytics
  getUserAnalytics: async (timeRange = "30d") => {
    // axiosInstance already returns response.data via interceptor
    return axiosInstance.get(`/admin/users/analytics`, {
      params: { timeRange },
    });
  },

  // Station Analytics
  getStationAnalytics: async (timeRange = "30d") => {
    return axiosInstance.get(`/admin/stations/analytics`, {
      params: { timeRange },
    });
  },

  // User Management
  getAllUsers: async (params = {}) => {
    // Use the same admin users path as other service helpers
    return axiosInstance.get("/admin/adminusers", { params });
  },

  // Backwards compatible alias used by some hooks/components
  getUsers: async (params = {}) => {
    return axiosInstance.get("/admin/adminusers", { params });
  },

  getUserDetail: async (userId) => {
    return axiosInstance.get(`/admin/adminusers/${userId}`);
  },

  createUser: async (userData) => {
    return axiosInstance.post("/admin/adminusers", userData);
  },

  updateUser: async (userId, userData) => {
    return axiosInstance.put(`/admin/adminusers/${userId}`, userData);
  },

  updateUserRole: async (userId, role) => {
    return axiosInstance.patch(`/admin/adminusers/${userId}/role`, { role });
  },

  deleteUser: async (userId) => {
    return axiosInstance.delete(`/admin/adminusers/${userId}`);
  },

  activateUser: async (userId) => {
    return axiosInstance.patch(`/admin/adminusers/${userId}/activate`);
  },

  deactivateUser: async (userId, reason) => {
    return axiosInstance.patch(`/admin/adminusers/${userId}/deactivate`, { reason });
  },

  getUserActivity: async (userId) => {
    return axiosInstance.get(`/admin/adminusers/${userId}/activity`);
  },

  getUserStatistics: async () => {
    return axiosInstance.get("/admin/adminusers/statistics");
  },
};

export default adminAPI;
