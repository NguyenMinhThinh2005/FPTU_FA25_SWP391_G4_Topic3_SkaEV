import axiosInstance from "../axiosConfig";

export const bookingsAPI = {
    getAll: (params) => axiosInstance.get("/bookings", { params }),

    // Backwards-compatible alias
    get: (params) => axiosInstance.get("/bookings", { params }),

    getById: (id) => axiosInstance.get(`/bookings/${id}`),

    getUserBookings: (params = {}) => axiosInstance.get("/bookings", { params }),

    create: (bookingData) => axiosInstance.post("/bookings", bookingData),

    update: (id, bookingData) =>
        axiosInstance.put(`/bookings/${id}`, bookingData),

    cancel: (id, reason) =>
        axiosInstance.post(`/bookings/${id}/cancel`, { reason }),

    start: (id) => axiosInstance.put(`/bookings/${id}/start`),

    complete: (id, completeData) =>
        axiosInstance.put(`/bookings/${id}/complete`, completeData),

    getAvailableSlots: (stationId) =>
        axiosInstance.get(`/stations/${stationId}/slots`),

    scanQRCode: (qrScanData) =>
        axiosInstance.post("/bookings/qr-scan", qrScanData),
};

export default bookingsAPI;
