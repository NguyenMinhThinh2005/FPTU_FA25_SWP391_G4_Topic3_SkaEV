// Mock API service for SkaEV
import { mockData } from "../data/mockData";
import { API_ENDPOINTS } from "../utils/constants";

// Simulate network delay
const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock HTTP client
class MockApiClient {
  async get(url, params = {}) {
    await delay();
    return this._handleRequest("GET", url, null, params);
  }

  async post(url, data = {}) {
    await delay();
    return this._handleRequest("POST", url, data);
  }

  async put(url, data = {}) {
    await delay();
    return this._handleRequest("PUT", url, data);
  }

  async delete(url) {
    await delay();
    return this._handleRequest("DELETE", url);
  }

  _handleRequest(method, url, data, params) {
    // Simulate different responses based on URL patterns
    if (url.includes("/auth/login")) {
      return this._handleLogin(data);
    }

    if (url.includes("/stations")) {
      return this._handleStations(method, url, data, params);
    }

    if (url.includes("/bookings")) {
      return this._handleBookings(method, url, data, params);
    }

    if (url.includes("/users")) {
      return this._handleUsers(method, url, data, params);
    }

    // Default response
    return {
      success: true,
      data: null,
      message: "Mock API response",
    };
  }

  _handleLogin(credentials) {
    const { email, password } = credentials;
    const user = mockData.users.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      throw new Error("Email hoặc mật khẩu không đúng");
    }

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          profile: user.profile,
          business: user.business || null,
        },
        token: `mock-token-${user.id}-${Date.now()}`,
        refreshToken: `mock-refresh-${user.id}-${Date.now()}`,
      },
      message: "Đăng nhập thành công",
    };
  }

  _handleStations(method, url, data, params) {
    switch (method) {
      case "GET":
        if (url.includes("/nearby")) {
          // Filter stations by distance (mock)
          // params.lat/lng unused in mock implementation; rename to _lat/_lng to avoid lint warnings
          const { lat: _lat, lng: _lng, radius = 20 } = params || {};
          const nearbyStations = mockData.stations.filter(
            () => Math.random() > 0.3
          );
          return {
            success: true,
            data: nearbyStations,
            message: "Đã tải các trạm gần đây",
          };
        }

        if (url.includes("/stations/")) {
          // Get single station
          const stationId = url.split("/").pop();
          const station = mockData.stations.find((s) => s.id === stationId);
          return {
            success: true,
            data: station,
            message: "Station retrieved",
          };
        }

        // Get all stations
        return {
          success: true,
          data: mockData.stations,
          message: "Stations retrieved",
        };

      default:
        return {
          success: true,
          data: null,
          message: "Station operation completed",
        };
    }
  }

  _handleBookings(method, url, data, params) {
    switch (method) {
      case "GET":
        // Get user bookings or all bookings based on user role
        return {
          success: true,
          data: mockData.bookings,
          message: "Bookings retrieved",
        };

      case "POST": {
        // Create booking
        const newBooking = {
          id: `booking-${Date.now()}`,
          ...data,
          status: "scheduled",
          createdAt: new Date().toISOString(),
        };

        return {
          success: true,
          data: newBooking,
          message: "Tạo đặt chỗ thành công",
        };
      }

      default:
        return {
          success: true,
          data: null,
          message: "Hoàn thành thao tác đặt chỗ",
        };
    }
  }

  _handleUsers(method, url, data, params) {
    switch (method) {
      case "GET":
        return {
          success: true,
          data: mockData.users.map((u) => ({ ...u, password: undefined })), // Don't return passwords
          message: "Đã tải danh sách người dùng",
        };

      default:
        return {
          success: true,
          data: null,
          message: "User operation completed",
        };
    }
  }
}

// Create singleton instance
const apiClient = new MockApiClient();

// API service functions
export const authAPI = {
  login: (credentials) => apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials),
  logout: () => apiClient.post(API_ENDPOINTS.AUTH.LOGOUT),
  refreshToken: (refreshToken) =>
    apiClient.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken }),
  getProfile: () => apiClient.get(API_ENDPOINTS.AUTH.PROFILE),
};

export const stationsAPI = {
  getAll: (params) => apiClient.get(API_ENDPOINTS.STATIONS.LIST, params),
  getById: (id) =>
    apiClient.get(API_ENDPOINTS.STATIONS.DETAIL.replace(":id", id)),
  getNearby: (coordinates, radius) =>
    apiClient.get(API_ENDPOINTS.STATIONS.NEARBY, {
      lat: coordinates.lat,
      lng: coordinates.lng,
      radius,
    }),
  getAvailability: (id) =>
    apiClient.get(API_ENDPOINTS.STATIONS.AVAILABILITY.replace(":id", id)),
  create: (stationData) =>
    apiClient.post(API_ENDPOINTS.STATIONS.LIST, stationData),
  update: (id, stationData) =>
    apiClient.put(
      API_ENDPOINTS.STATIONS.DETAIL.replace(":id", id),
      stationData
    ),
  delete: (id) =>
    apiClient.delete(API_ENDPOINTS.STATIONS.DETAIL.replace(":id", id)),
};

export const bookingsAPI = {
  getAll: (params) => apiClient.get(API_ENDPOINTS.BOOKINGS.LIST, params),
  getById: (id) =>
    apiClient.get(API_ENDPOINTS.BOOKINGS.DETAIL.replace(":id", id)),
  create: (bookingData) =>
    apiClient.post(API_ENDPOINTS.BOOKINGS.CREATE, bookingData),
  cancel: (id) =>
    apiClient.delete(API_ENDPOINTS.BOOKINGS.CANCEL.replace(":id", id)),
};

export const usersAPI = {
  getAll: (params) => apiClient.get(API_ENDPOINTS.USERS.LIST, params),
  create: (userData) => apiClient.post(API_ENDPOINTS.USERS.CREATE, userData),
  update: (id, userData) =>
    apiClient.put(API_ENDPOINTS.USERS.UPDATE.replace(":id", id), userData),
  delete: (id) =>
    apiClient.delete(API_ENDPOINTS.USERS.DELETE.replace(":id", id)),
};

export default apiClient;
