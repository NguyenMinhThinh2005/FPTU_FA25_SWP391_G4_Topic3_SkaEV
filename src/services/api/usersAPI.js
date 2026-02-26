import axiosInstance from "../axiosConfig";

export const usersAPI = {
    getAll: (params) => axiosInstance.get("/admin/adminusers", { params }),

    getById: (id) => axiosInstance.get(`/admin/adminusers/${id}`),

    create: (userData) => axiosInstance.post("/admin/adminusers", userData),

    update: (id, userData) =>
        axiosInstance.put(`/admin/adminusers/${id}`, userData),

    delete: (id) => axiosInstance.delete(`/admin/adminusers/${id}`),

    changePassword: (passwordData) =>
        axiosInstance.post("/users/change-password", passwordData),

    updateRole: (id, roleData) =>
        axiosInstance.patch(`/admin/adminusers/${id}/role`, roleData),

    activate: (id) => axiosInstance.patch(`/admin/adminusers/${id}/activate`),

    deactivate: (id, reason) =>
        axiosInstance.patch(`/admin/adminusers/${id}/deactivate`, { reason }),

    resetPassword: (id) =>
        axiosInstance.post(`/admin/adminusers/${id}/reset-password`),

    getActivity: (id) =>
        axiosInstance.get(`/admin/adminusers/${id}/activity`),

    getStatistics: () =>
        axiosInstance.get("/admin/adminusers/statistics"),
};

export default usersAPI;
