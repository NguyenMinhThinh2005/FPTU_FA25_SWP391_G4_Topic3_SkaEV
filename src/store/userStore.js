import { create } from "zustand";
import { persist } from "zustand/middleware";
import { usersAPI } from "../services/api";

const useUserStore = create(
  persist(
    (set, get) => ({
      users: [],
      loading: false,
      error: null,

      initializeData: async () => {
        console.log("Initializing users from API...");
        await get().fetchUsers();
      },

      fetchUsers: async () => {
        set({ loading: true, error: null });
        try {
          const response = await usersAPI.getAll();
          if (response.success && response.data) {
            const users = Array.isArray(response.data) ? response.data : response.data.users || [];
            console.log("Users loaded from API:", users.length);
            set({ users, loading: false });
            return { success: true, data: users };
          } else {
            throw new Error(response.message || "Cannot load users");
          }
        } catch (error) {
          const errorMessage = error.message || "Error loading users";
          console.error("Fetch users error:", errorMessage);
          set({ error: errorMessage, loading: false, users: [] });
          return { success: false, error: errorMessage };
        }
      },

      addUser: async (data) => {
        set({ loading: true, error: null });
        try {
          const userData = {
            email: data.email,
            password: data.password || "Temp123!",
            role: data.role || "customer",
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            phone: data.phone || "",
            avatar: data.avatar || "",
            permissions: data.permissions || [],
            business: data.business || null,
          };
          const response = await usersAPI.create(userData);
          if (response.success && response.data) {
            const newUser = response.data;
            set((s) => ({ users: [newUser, ...s.users], loading: false }));
            return { success: true, data: newUser };
          } else {
            throw new Error(response.message || "Cannot create user");
          }
        } catch (error) {
          const errorMessage = error.message || "Error creating user";
          console.error("Add user error:", errorMessage);
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },

      updateUser: async (userId, updates) => {
        set({ loading: true, error: null });
        try {
          const response = await usersAPI.update(userId, updates);
          if (response.success && response.data) {
            const updatedUser = response.data;
            set((s) => ({ users: s.users.map((u) => u.id === userId ? updatedUser : u), loading: false }));
            return { success: true, data: updatedUser };
          } else {
            throw new Error(response.message || "Cannot update user");
          }
        } catch (error) {
          const errorMessage = error.message || "Error updating user";
          console.error("Update user error:", errorMessage);
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },

      deleteUser: async (userId) => {
        set({ loading: true, error: null });
        try {
          const response = await usersAPI.delete(userId);
          if (response.success) {
            set((s) => ({ users: s.users.filter((u) => u.id !== userId), loading: false }));
            return { success: true };
          } else {
            throw new Error(response.message || "Cannot delete user");
          }
        } catch (error) {
          const errorMessage = error.message || "Error deleting user";
          console.error("Delete user error:", errorMessage);
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },

      getUserById: (userId) => get().users.find((u) => u.id === userId),
      getUsersByRole: (role) => get().users.filter((u) => u.role === role),
      searchUsers: (query = "") => {
        const q = query.toLowerCase();
        return get().users.filter((u) => {
          const name = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
          return u.email?.toLowerCase().includes(q) || name.includes(q) || (u.phone || "").includes(query);
        });
      },
      setRole: (userId, role) => get().updateUser(userId, { role }),
      setPermissions: (userId, permissions) => get().updateUser(userId, { permissions }),
      clearError: () => set({ error: null }),
    }),
    { name: "skaev-user-store", partialize: (state) => ({ users: state.users }) }
  )
);

export default useUserStore;
