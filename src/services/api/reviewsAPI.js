import axiosInstance from "../axiosConfig";

export const reviewsAPI = {
    getStationReviews: (stationId, params = {}) =>
        axiosInstance.get(`/reviews/station/${stationId}`, { params }),

    getStationSummary: (stationId) =>
        axiosInstance.get(`/reviews/station/${stationId}/summary`),

    getMyReviews: (params = {}) =>
        axiosInstance.get("/reviews/my-reviews", { params }),

    getById: (reviewId) => axiosInstance.get(`/reviews/${reviewId}`),

    create: (payload) => axiosInstance.post("/reviews", payload),

    update: (reviewId, payload) =>
        axiosInstance.put(`/reviews/${reviewId}`, payload),

    delete: (reviewId) => axiosInstance.delete(`/reviews/${reviewId}`),
};

export default reviewsAPI;
