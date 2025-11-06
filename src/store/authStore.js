import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authAPI } from "../services/api";

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
          // Clear tokens from sessionStorage
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("refreshToken");

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

      updateProfile: async (profileUpdates) => {
        const currentUser = get().user;
        if (!currentUser) {
          return { success: false, error: "Người dùng chưa đăng nhập" };
        }

        set({ loading: true, error: null });

        try {
          const response = await authAPI.updateProfile(profileUpdates);

          const updatedUser = {
            ...currentUser,
            // Normalize common fields so both camelCase & snake_case consumers work
            fullName: response.fullName ?? currentUser.fullName,
            full_name: response.fullName ?? currentUser.full_name,
            phoneNumber: response.phoneNumber ?? currentUser.phoneNumber,
            phone_number: response.phoneNumber ?? currentUser.phone_number,
            profile: {
              ...(currentUser.profile || {}),
              address:
                response.address ??
                response.profile?.address ??
                currentUser.profile?.address,
              city: response.city ?? currentUser.profile?.city,
              preferredPaymentMethod:
                response.preferredPaymentMethod ??
                currentUser.profile?.preferredPaymentMethod,
              notificationPreferences:
                response.notificationPreferences ??
                currentUser.profile?.notificationPreferences,
              dateOfBirth:
                response.dateOfBirth ?? currentUser.profile?.dateOfBirth,
              updatedAt: response.updatedAt ?? currentUser.profile?.updatedAt,
            },
          };

          set({
            user: updatedUser,
            loading: false,
          });

          return { success: true, data: response };
        } catch (error) {
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            "Cập nhật hồ sơ không thành công";

          set({ loading: false, error: errorMessage });
          return { success: false, error: errorMessage };
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
