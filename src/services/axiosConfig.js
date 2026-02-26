import axios from "axios";

// ─── Backend API Base URL ───────────────────────────────────────────
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// ─── Single shared Axios instance ──────────────────────────────────
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request interceptor: attach auth token ────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token =
      sessionStorage.getItem("token") || localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor: ApiResponse unwrap + token refresh ──────
axiosInstance.interceptors.response.use(
  (response) => {
    const data = response.data;

    // Unwrap ApiResponse<T> format: { success, data, message }
    if (
      data &&
      typeof data === "object" &&
      "success" in data &&
      "data" in data
    ) {
      if (data.success) {
        return data.data;
      }
      return Promise.reject(new Error(data.message || "Operation failed"));
    }

    // Non-ApiResponse endpoints: return raw data
    return data;
  },
  async (error) => {
    const originalRequest = error.config;

    // 401 — attempt token refresh once
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken =
          sessionStorage.getItem("refreshToken") ||
          localStorage.getItem("refreshToken");
        if (refreshToken) {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          const { token } = res.data;
          sessionStorage.setItem("token", token);
          localStorage.setItem("token", token);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        }
      } catch {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("refreshToken");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    // Enrich error for downstream consumers
    const errorMessage =
      error.response?.data?.message || error.message || "An error occurred";
    const customError = new Error(errorMessage);
    customError.response = error.response;
    customError.status = error.response?.status;

    console.error("🚨 API Error:", {
      message: errorMessage,
      status: error.response?.status,
      url: error.config?.url,
    });

    return Promise.reject(customError);
  }
);

export { API_BASE_URL };
export default axiosInstance;
