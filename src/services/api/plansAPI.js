import axiosInstance from "../axiosConfig";

export const plansAPI = {
    getAll: (params) => axiosInstance.get("/ServicePlans", { params }),

    getById: (id) => axiosInstance.get(`/ServicePlans/${id}`),

    create: (planData) => axiosInstance.post("/ServicePlans", planData),

    update: (id, planData) =>
        axiosInstance.put(`/ServicePlans/${id}`, planData),

    delete: (id) => axiosInstance.delete(`/ServicePlans/${id}`),

    toggleStatus: (id) =>
        axiosInstance.patch(`/ServicePlans/${id}/toggle-status`),
};

export default plansAPI;
