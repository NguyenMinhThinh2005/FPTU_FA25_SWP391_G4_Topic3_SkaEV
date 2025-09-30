// Constants for SkaEV application

// API Endpoints (Mock)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    REFRESH: "/api/auth/refresh",
    PROFILE: "/api/auth/profile",
  },
  STATIONS: {
    LIST: "/api/stations",
    DETAIL: "/api/stations/:id",
    NEARBY: "/api/stations/nearby",
    AVAILABILITY: "/api/stations/:id/availability",
  },
  BOOKINGS: {
    CREATE: "/api/bookings",
    LIST: "/api/bookings",
    DETAIL: "/api/bookings/:id",
    CANCEL: "/api/bookings/:id/cancel",
  },
  USERS: {
    LIST: "/api/users",
    CREATE: "/api/users",
    UPDATE: "/api/users/:id",
    DELETE: "/api/users/:id",
  },
};

// User Roles
export const USER_ROLES = {
  ADMIN: "admin",
  STAFF: "staff",
  CUSTOMER: "customer",
};

// Charging Station Status
export const STATION_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  MAINTENANCE: "maintenance",
  OFFLINE: "offline",
};

// Booking Status
export const BOOKING_STATUS = {
  SCHEDULED: "scheduled",
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  FAILED: "failed",
};

// Connector Types - Must match mockData.js
export const CONNECTOR_TYPES = {
  TYPE2: "Type 2",
  CCS2: "CCS2",
  CHADEMO: "CHAdeMO",
};

// Power Levels
export const POWER_LEVELS = {
  SLOW: { min: 0, max: 22, label: "Slow (AC)" },
  FAST: { min: 23, max: 99, label: "Fast (DC)" },
  RAPID: { min: 100, max: 350, label: "Rapid (DC)" },
};

// Payment Methods
export const PAYMENT_METHODS = {
  CREDIT_CARD: "credit-card",
  E_WALLET: "e-wallet",
  CASH: "cash",
  SUBSCRIPTION: "subscription",
};

// Currency
export const CURRENCY = {
  VND: "VND",
  SYMBOL: "₫",
};

// Default Values
export const DEFAULTS = {
  SEARCH_RADIUS: 20, // km
  SESSION_TIMEOUT: 30, // minutes
  REFRESH_INTERVAL: 5000, // ms
  PAGINATION_SIZE: 10,
  MAP_ZOOM: 13,
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "skaev_auth_token",
  USER_PREFERENCES: "skaev_user_preferences",
  RECENT_SEARCHES: "skaev_recent_searches",
  FAVORITES: "skaev_favorites",
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network connection error. Please try again.",
  UNAUTHORIZED: "Please login to continue.",
  FORBIDDEN: "You do not have permission to access this resource.",
  NOT_FOUND: "The requested resource was not found.",
  SERVER_ERROR: "Server error. Please try again later.",
  VALIDATION_ERROR: "Please check your input and try again.",
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: "Login successful!",
  LOGOUT_SUCCESS: "Logout successful!",
  BOOKING_CREATED: "Booking created successfully!",
  BOOKING_CANCELLED: "Booking cancelled successfully!",
  PROFILE_UPDATED: "Profile updated successfully!",
  STATION_CREATED: "Station created successfully!",
};

export default {
  API_ENDPOINTS,
  USER_ROLES,
  STATION_STATUS,
  BOOKING_STATUS,
  CONNECTOR_TYPES,
  POWER_LEVELS,
  PAYMENT_METHODS,
  CURRENCY,
  DEFAULTS,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};
