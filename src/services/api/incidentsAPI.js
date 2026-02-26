import axiosInstance from "../axiosConfig";

export const incidentsAPI = {
    getAll: (params) => axiosInstance.get("/StaffIssues", { params }),

    getMyIssues: (params) =>
        axiosInstance.get("/StaffIssues/my-issues", { params }),

    getById: (id) => axiosInstance.get(`/StaffIssues/${id}`),

    create: (issueData) => axiosInstance.post("/StaffIssues", issueData),

    update: (id, issueData) =>
        axiosInstance.put(`/StaffIssues/${id}`, issueData),

    assign: (id, assignData) =>
        axiosInstance.patch(`/StaffIssues/${id}/assign`, assignData),

    updateStatus: (id, statusData) =>
        axiosInstance.patch(`/StaffIssues/${id}/status`, statusData),

    addComment: (id, commentData) =>
        axiosInstance.post(`/StaffIssues/${id}/comments`, commentData),

    uploadAttachment: (id, formData) =>
        axiosInstance.post(`/StaffIssues/${id}/attachments`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }),

    delete: (id) => axiosInstance.delete(`/StaffIssues/${id}`),

    getStatistics: (params) =>
        axiosInstance.get("/StaffIssues/statistics", { params }),

    getMaintenanceSchedule: (params) =>
        axiosInstance.get("/StaffIssues/maintenance-schedule", { params }),
};

export default incidentsAPI;
