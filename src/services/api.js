// Real API service for SkaEV - Connects to ASP.NET Core Backend
import axios from "axios";

// Backend API Base URL
// Use HTTP port 5000 if running with dotnet run, or HTTPS port 5001 if running from Visual Studio
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add auth token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    // Try sessionStorage first (used by authStore), fallback to localStorage
    const token =
      sessionStorage.getItem("token") || localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
axiosInstance.interceptors.response.use(
  (response) => {
    // Return data directly
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken =
          sessionStorage.getItem("refreshToken") ||
          localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { token } = response.data;
          sessionStorage.setItem("token", token);
          localStorage.setItem("token", token);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - logout user
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("refreshToken");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    const errorMessage =
      error.response?.data?.message || error.message || "An error occurred";

    // Create error object with response data preserved
    const customError = new Error(errorMessage);
    customError.response = error.response; // Preserve response for debugging
    customError.status = error.response?.status;

    console.error("🚨 API Error:", {
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });

    return Promise.reject(customError);
  }
);

// API service functions
export const authAPI = {
  login: async (credentials) => {
    const response = await axiosInstance.post("/auth/login", credentials);
    // Store tokens
    if (response.token) {
      localStorage.setItem("token", response.token);
      localStorage.setItem("refreshToken", response.refreshToken || "");
    }
    return response;
  },

  register: (userData) => {
    return axiosInstance.post("/auth/register", userData);
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    return axiosInstance.post("/auth/logout");
  },

  refreshToken: (refreshToken) => {
    return axiosInstance.post("/auth/refresh", { refreshToken });
  },

  getProfile: () => {
    return axiosInstance.get("/auth/profile");
  },

  updateProfile: (profileData) => {
    return axiosInstance.put("/UserProfiles/me", profileData);
  },
};

export const stationsAPI = {
  getAll: (params) => {
    return axiosInstance.get("/stations", { params });
  },

  getById: (id) => {
    return axiosInstance.get(`/stations/${id}`);
  },

  getNearby: (latitude, longitude, radius = 10) => {
    return axiosInstance.get("/stations/nearby", {
      params: { latitude, longitude, radius },
    });
  },

  getAvailability: (id) => {
    return axiosInstance.get(`/stations/${id}/availability`);
  },

  create: (stationData) => {
    return axiosInstance.post("/stations", stationData);
  },

  update: (id, stationData) => {
    return axiosInstance.put(`/stations/${id}`, stationData);
  },

  delete: (id) => {
    return axiosInstance.delete(`/stations/${id}`);
  },

  search: (searchQuery) => {
    return axiosInstance.get("/stations/search", {
      params: { q: searchQuery },
    });
  },

  // Get station slots (poles/ports) with real-time status
  getStationSlots: (stationId) => {
    return axiosInstance.get(`/stations/${stationId}/slots`);
  },
};

export const bookingsAPI = {
  getAll: (params) => {
    return axiosInstance.get("/bookings", { params });
  },

  getById: (id) => {
    return axiosInstance.get(`/bookings/${id}`);
  },

  getUserBookings: () => {
    return axiosInstance.get("/bookings/my-bookings");
  },

  create: (bookingData) => {
    return axiosInstance.post("/bookings", bookingData);
  },

  update: (id, bookingData) => {
    return axiosInstance.put(`/bookings/${id}`, bookingData);
  },

  cancel: (id, reason) => {
    return axiosInstance.post(`/bookings/${id}/cancel`, { reason });
  },

  complete: (id, completeData) => {
    // Backend expects: { finalSoc, totalEnergyKwh, unitPrice }
    return axiosInstance.put(`/bookings/${id}/complete`, completeData);
  },

  // Get available slots for a station
  getAvailableSlots: (stationId) => {
    return axiosInstance.get(`/stations/${stationId}/slots`);
  },
};

export const usersAPI = {
  getAll: (params) => {
    return axiosInstance.get("/admin/adminusers", { params });
  },

  getById: (id) => {
    return axiosInstance.get(`/admin/adminusers/${id}`);
  },

  create: (userData) => {
    return axiosInstance.post("/admin/adminusers", userData);
  },

  update: (id, userData) => {
    return axiosInstance.put(`/admin/adminusers/${id}`, userData);
  },

  delete: (id) => {
    return axiosInstance.delete(`/admin/adminusers/${id}`);
  },

  changePassword: (passwordData) => {
    return axiosInstance.post("/users/change-password", passwordData);
  },

  // Additional admin user endpoints
  updateRole: (id, roleData) => {
    return axiosInstance.patch(`/admin/adminusers/${id}/role`, roleData);
  },

  activate: (id) => {
    return axiosInstance.patch(`/admin/adminusers/${id}/activate`);
  },

  deactivate: (id, reason) => {
    return axiosInstance.patch(`/admin/adminusers/${id}/deactivate`, {
      reason,
    });
  },

  resetPassword: (id) => {
    return axiosInstance.post(`/admin/adminusers/${id}/reset-password`);
  },

  getActivity: (id) => {
    return axiosInstance.get(`/admin/adminusers/${id}/activity`);
  },

  getStatistics: () => {
    return axiosInstance.get("/admin/adminusers/statistics");
  },
};

export const postsAPI = {
  getAll: (params) => {
    return axiosInstance.get("/posts", { params });
  },

  getById: (id) => {
    return axiosInstance.get(`/posts/${id}`);
  },

  getByStation: (stationId) => {
    return axiosInstance.get(`/stations/${stationId}/posts`);
  },

  create: (postData) => {
    return axiosInstance.post("/posts", postData);
  },

  update: (id, postData) => {
    return axiosInstance.put(`/posts/${id}`, postData);
  },

  delete: (id) => {
    return axiosInstance.delete(`/posts/${id}`);
  },
};

export const paymentsAPI = {
  getAll: (params) => {
    return axiosInstance.get("/payments", { params });
  },

  getById: (id) => {
    return axiosInstance.get(`/payments/${id}`);
  },

  create: (paymentData) => {
    return axiosInstance.post("/payments", paymentData);
  },

  process: (id, paymentDetails) => {
    return axiosInstance.post(`/payments/${id}/process`, paymentDetails);
  },

  refund: (id, refundData) => {
    return axiosInstance.post(`/payments/${id}/refund`, refundData);
  },
};

export const vehiclesAPI = {
  getAll: (params) => {
    return axiosInstance.get("/vehicles", { params });
  },

  getById: (id) => {
    return axiosInstance.get(`/vehicles/${id}`);
  },

  getUserVehicles: () => {
    return axiosInstance.get("/vehicles/my-vehicles");
  },

  create: (vehicleData) => {
    return axiosInstance.post("/vehicles", vehicleData);
  },

  update: (id, vehicleData) => {
    return axiosInstance.put(`/vehicles/${id}`, vehicleData);
  },

  delete: (id) => {
    return axiosInstance.delete(`/vehicles/${id}`);
  },

  setDefault: (id) => {
    return axiosInstance.post(`/vehicles/${id}/set-default`);
  },
};

// QR Code API
export const qrCodesAPI = {
  // Generate QR code for instant charging
  generate: (generateData) => {
    return axiosInstance.post("/qrcodes/generate", generateData);
  },

  // Get QR code by ID
  getById: (id) => {
    return axiosInstance.get(`/qrcodes/${id}`);
  },

  // Get my active QR codes
  getMyQRCodes: () => {
    return axiosInstance.get("/qrcodes/my-qrcodes");
  },

  // Validate QR code (Staff only)
  validate: (qrCodeData) => {
    return axiosInstance.post("/qrcodes/validate", { qrCodeData });
  },

  // Use QR code to start charging (Staff only)
  use: (id, useData) => {
    return axiosInstance.post(`/qrcodes/${id}/use`, useData);
  },

  // Cancel/revoke QR code
  cancel: (id) => {
    return axiosInstance.delete(`/qrcodes/${id}`);
  },

  // Get QR code image
  getImage: (id) => {
    return axiosInstance.get(`/qrcodes/${id}/image`, { responseType: "blob" });
  },
};

// Charging Session API (via Bookings)
export const chargingAPI = {
  // Start charging session
  startCharging: (bookingId) => {
    return axiosInstance.put(`/bookings/${bookingId}/start`);
  },

  // Complete charging session
  completeCharging: (bookingId, completeData) => {
    // completeData: { finalSoc, totalEnergyKwh, unitPrice }
    return axiosInstance.put(`/bookings/${bookingId}/complete`, completeData);
  },
};

// Health check
export const healthAPI = {
  check: () => {
    return axios.get("http://localhost:5000/health");
  },
};

export default axiosInstance;
