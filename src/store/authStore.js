import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mockUsers } from "../data/mockData";

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
          // Mock API call - find user in mock data
          const user = mockUsers.find(
            (u) => u.email === email && u.password === password
          );

          if (!user) {
            throw new Error("Email hoặc mật khẩu không đúng");
          }

          // Simulate API delay
          await new Promise((resolve) => setTimeout(resolve, 1000));

          set({
            user: {
              id: user.id,
              email: user.email,
              role: user.role,
              profile: user.profile,
              business: user.business || null,
            },
            isAuthenticated: true,
            loading: false,
          });

          return { success: true };
        } catch (error) {
          set({ loading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      register: async (userData) => {
        set({ loading: true, error: null });

        try {
          // Mock API call - simulate user registration
          await new Promise((resolve) => setTimeout(resolve, 1500));

          // Create new user object
          const newUser = {
            id: `user_${Date.now()}`,
            email: userData.email,
            role: userData.role || "customer",
            profile: {
              firstName: userData.firstName,
              lastName: userData.lastName,
              phone: userData.phone,
              avatar: null,
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              verified: false, // New users need verification
            },
          };

          // In real app, this would be handled by backend
          // For demo, we'll add to mockUsers and return success
          set({
            user: newUser,
            isAuthenticated: false, // Requires verification first
            loading: false,
          });

          return { success: true, user: newUser, requiresVerification: true };
        } catch (error) {
          set({ loading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      socialRegister: async (provider, socialData) => {
        set({ loading: true, error: null });

        try {
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const newUser = {
            id: `${provider}_${Date.now()}`,
            email: socialData.email,
            role: "customer",
            profile: {
              firstName:
                socialData.firstName || socialData.name?.split(" ")[0] || "",
              lastName:
                socialData.lastName ||
                socialData.name?.split(" ").slice(1).join(" ") ||
                "",
              phone: socialData.phone || "",
              avatar: socialData.picture || socialData.avatar,
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              verified: true, // Social accounts are pre-verified
            },
            socialProvider: provider,
          };

          set({
            user: newUser,
            isAuthenticated: true, // Social registration is immediate
            loading: false,
          });

          return { success: true, user: newUser };
        } catch (error) {
          set({ loading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      updateProfile: (profileData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: {
              ...currentUser,
              profile: { ...currentUser.profile, ...profileData },
            },
          });
        }
      },

      // Helper getters
      isAdmin: () => get().user?.role === "admin",
      isStaff: () => get().user?.role === "staff",
      isCustomer: () => get().user?.role === "customer",
    }),
    {
      name: "skaev-auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
