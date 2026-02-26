import axiosInstance from "../axiosConfig";

export const chargingAPI = {
    startCharging: (bookingId) =>
        axiosInstance.put(`/bookings/${bookingId}/start`),

    completeCharging: (bookingId, completeData) =>
        axiosInstance.put(`/bookings/${bookingId}/complete`, completeData),
};

export default chargingAPI;
