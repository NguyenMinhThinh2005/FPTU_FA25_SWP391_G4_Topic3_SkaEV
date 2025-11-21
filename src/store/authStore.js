import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authAPI } from "../services/api";
import axiosInstance from "../services/api";

// Import stores for logout cleanup (lazy import to avoid circular dependency)
let bookingStoreModule = null;
let customerStoreModule = null;

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      // Actions
      login: async (email, password) => {
        set({ loading: true, error: null });

        try {
          // Real API call - backend returns: { userId, email, fullName, role, token, expiresAt }
          const response = await authAPI.login({ email, password });

          // Transform backend response to expected format
          const userData = {
            user_id: response.userId,
            email: response.email,
            full_name: response.fullName,
            role: response.role.toLowerCase(), // Normalize role to lowercase
          };

          // Store token in sessionStorage (will be cleared when browser closes)
          sessionStorage.setItem("token", response.token);
          if (response.refreshToken) {
            sessionStorage.setItem("refreshToken", response.refreshToken);
          }

          set({
            user: userData,
            isAuthenticated: true,
            loading: false,
          });

          return {
            success: true,
            data: {
              user: userData,
              token: response.token,
            },
          };
        } catch (error) {
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            "Email hoặc mật khẩu không đúng";
          set({ loading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      register: async (userData) => {
        set({ loading: true, error: null });

        try {
          // Real API call
          const response = await authAPI.register(userData);

          // Backend returns RegisterResponseDto directly (not wrapped in success/data)
          if (response && response.userId) {
            const user = {
              user_id: response.userId,
              email: response.email,
              full_name: response.fullName,
              role: userData.role, // Use role from request
            };

            set({
              user: user,
              isAuthenticated: false, // May require verification
              loading: false,
              error: null, // Clear any previous errors
            });

            return {
              success: true,
              user: user,
              requiresVerification: false, // Set to false to trigger success message
              message: response.message,
            };
          } else {
            throw new Error(response.message || "Đăng ký thất bại");
          }
        } catch (error) {
          const errorMessage = error.message || "Đã xảy ra lỗi khi đăng ký";
          set({ loading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      socialRegister: async (provider, socialData) => {
        set({ loading: true, error: null });

        try {
          // For social auth, backend should handle this endpoint
          const response = await authAPI.register({
            ...socialData,
            provider,
            role: "customer",
          });

          if (response.success && response.data) {
            set({
              user: response.data.user,
              isAuthenticated: true, // Social registration is immediate
              loading: false,
            });

            return { success: true, user: response.data.user };
          } else {
            throw new Error(response.message || "Đăng ký thất bại");
          }
        } catch (error) {
          const errorMessage =
            error.message || "Đã xảy ra lỗi khi đăng ký qua mạng xã hội";
          set({ loading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      logout: async () => {
        set({ loading: true });
        try {
          // Call logout API to invalidate token on backend
          await authAPI.logout();
        } catch (error) {
          console.error("Logout API error:", error);
          // Continue with local logout even if API fails
        } finally {
          // Clear tokens from both sessionStorage and localStorage
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("refreshToken");
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");

          // Clear persist storage of authStore
          sessionStorage.removeItem("skaev-auth-storage");
          localStorage.removeItem("skaev-auth-storage");

          // Clear persist storage of bookingStore
          sessionStorage.removeItem("booking-store");
          localStorage.removeItem("booking-store");

          // Clear persist storage of customerStore
          sessionStorage.removeItem("customer-unified-store");
          localStorage.removeItem("customer-unified-store");

          // Clear charging session data from sessionStorage
          sessionStorage.removeItem("chargingCurrentBooking");
          sessionStorage.removeItem("chargingCurrentBookingData");
          sessionStorage.removeItem("chargingSession");
          sessionStorage.removeItem("chargingSessionData");

          // Reset booking store state (if available)
          try {
            if (!bookingStoreModule) {
              bookingStoreModule = await import("./bookingStore");
            }
            const bookingState = bookingStoreModule.default.getState();
            if (bookingState.resetFlowState) {
              bookingState.resetFlowState();
            }
            // Also clear booking history and current booking
            bookingStoreModule.default.setState({
              currentBooking: null,
              chargingSession: null,
              bookings: [],
              bookingHistory: [],
              socTracking: {},
            });
          } catch (err) {
            console.warn("Could not reset booking store:", err);
          }

          // Reset customer store state (if available)
          try {
            if (!customerStoreModule) {
              customerStoreModule = await import("./customerStore");
            }
            customerStoreModule.default.setState({
              initialized: false,
              lastSync: null,
              loading: false,
              error: null,
            });
          } catch (err) {
            console.warn("Could not reset customer store:", err);
          }

          // Reset auth store state
          set({
            user: null,
            isAuthenticated: false,
            loading: false,
            error: null,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setUser: (userData) => {
        set({ user: userData });
      },

      updateProfile: async (profileData) => {
        const currentUser = get().user;
        if (!currentUser) {
          return { success: false, error: "No user logged in" };
        }

        try {
          // Call API to update profile
          const response = await axiosInstance.put(
            "/auth/profile",
            profileData
          );

          if (response.data?.success && response.data?.data) {
            // Update local state with response data
            set({
              user: {
                ...currentUser,
                ...response.data.data,
              },
            });
            return { success: true, data: response.data.data };
          }

          return {
            success: false,
            error: response.data?.message || "Update failed",
          };
        } catch (error) {
          console.error("❌ Update profile error:", error);
          return {
            success: false,
            error:
              error.response?.data?.message || error.message || "Network error",
          };
        }
      },

      // Helper getters
      isAdmin: () => get().user?.role === "admin",
      isStaff: () => get().user?.role === "staff",
      isCustomer: () => get().user?.role === "customer",
    }),
    {
      name: "skaev-auth-storage",
      // Use sessionStorage instead of localStorage to clear session on browser close
      storage: {
        getItem: (name) => {
          const value = sessionStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
        },
      },
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
