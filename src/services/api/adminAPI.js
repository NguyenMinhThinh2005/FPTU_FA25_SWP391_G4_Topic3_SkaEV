import axiosInstance from "../axiosConfig";

const adminAPI = {
  // User Analytics
  getUserAnalytics: async (timeRange = "30d") => {
    const response = await axiosInstance.get(`/admin/users/analytics`, {
      params: { timeRange },
    });
    return response.data;
  },

  // Station Analytics
  getStationAnalytics: async (timeRange = "30d") => {
    const response = await axiosInstance.get(`/admin/stations/analytics`, {
      params: { timeRange },
    });
    return response.data;
  },

  // User Management
  getAllUsers: async (params = {}) => {
    const response = await axiosInstance.get("/admin/users", { params });
    return response.data;
  },

  getUserDetail: async (userId) => {
    const response = await axiosInstance.get(`/admin/users/${userId}`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await axiosInstance.post("/admin/users", userData);
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await axiosInstance.put(`/admin/users/${userId}`, userData);
    return response.data;
  },

  updateUserRole: async (userId, role) => {
    const response = await axiosInstance.patch(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await axiosInstance.delete(`/admin/users/${userId}`);
    return response.data;
  },

  activateUser: async (userId) => {
    const response = await axiosInstance.patch(`/admin/users/${userId}/activate`);
    return response.data;
  },

  deactivateUser: async (userId, reason) => {
    const response = await axiosInstance.patch(`/admin/users/${userId}/deactivate`, { reason });
    return response.data;
  },

  getUserActivity: async (userId) => {
    const response = await axiosInstance.get(`/admin/users/${userId}/activity`);
    return response.data;
  },

  getUserStatistics: async () => {
    const response = await axiosInstance.get("/admin/users/statistics");
    return response.data;
  },
};

export default adminAPI;
