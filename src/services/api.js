// ─── SkaEV API Service ─────────────────────────────────────────────
// Re-export hub: all API modules are now in ./api/ for better organization.
// This file preserves backward compatibility for existing imports:
//   import { authAPI, bookingsAPI } from "../services/api";
//   import axiosInstance from "../services/api";

import axiosInstance from "./axiosConfig";

// Domain API re-exports
export { authAPI } from "./api/authAPI";
export { bookingsAPI } from "./api/bookingsAPI";
export { usersAPI } from "./api/usersAPI";
export { postsAPI } from "./api/postsAPI";
export { vehiclesAPI } from "./api/vehiclesAPI";
export { reviewsAPI } from "./api/reviewsAPI";
export { incidentsAPI } from "./api/incidentsAPI";
export { plansAPI } from "./api/plansAPI";
export { qrCodesAPI } from "./api/qrCodesAPI";
export { chargingAPI } from "./api/chargingAPI";
export { invoicesAPI } from "./api/invoicesAPI";
export {
  paymentsAPI,
  paymentMethodsAPI,
  mockPaymentAPI,
  vnpayAPI,
} from "./api/paymentsAPI";
export { walletAPI, healthAPI } from "./api/walletAPI";

// Stations API — re-export the object-style used by stores
export const stationsAPI = {
  getAll: (params) => axiosInstance.get("/stations", { params }),
  getById: (id) => axiosInstance.get(`/stations/${id}`),
  getNearby: (latitude, longitude, radius = 10) =>
    axiosInstance.get("/stations/nearby", {
      params: { latitude, longitude, radius },
    }),
  getAvailability: (id) => axiosInstance.get(`/stations/${id}/availability`),
  getAvailableSlots: (stationId) =>
    axiosInstance.get(`/stations/${stationId}/slots`),
  getStationSlots: (stationId) =>
    axiosInstance.get(`/stations/${stationId}/slots`),
  getAvailablePosts: (stationId) =>
    axiosInstance.get(`/stations/${stationId}/posts`),
  create: (stationData) => axiosInstance.post("/stations", stationData),
  update: (id, stationData) =>
    axiosInstance.put(`/stations/${id}`, stationData),
  delete: (id) => axiosInstance.delete(`/stations/${id}`),
  search: (searchQuery) =>
    axiosInstance.get("/stations/search", { params: { q: searchQuery } }),
};

export default axiosInstance;
