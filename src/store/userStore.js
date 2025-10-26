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
          // Backend returns { data: [...], pagination: {...} }
          const response = await usersAPI.getAll();
          const users = Array.isArray(response.data) ? response.data : [];
          console.log("Users loaded from API:", users.length);
          set({ users, loading: false });
          return { success: true, data: users };
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || "Error loading users";
          console.error("Fetch users error:", errorMessage);
          set({ error: errorMessage, loading: false, users: [] });
          return { success: false, error: errorMessage };
        }
      },

      addUser: async (data) => {
        set({ loading: true, error: null });
        try {
          // Backend expects: { email, password, fullName, phoneNumber, role }
          const newUser = await usersAPI.create(data);
          set((s) => ({ users: [newUser, ...s.users], loading: false }));
          return { success: true, data: newUser };
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || "Error creating user";
          console.error("Add user error:", errorMessage);
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },

      updateUser: async (userId, updates) => {
        set({ loading: true, error: null });
        try {
          // Backend returns 200 OK with the updated user object directly
          const updatedUser = await usersAPI.update(userId, updates);
          set((s) => ({ 
            users: s.users.map((u) => u.userId === userId ? updatedUser : u), 
            loading: false 
          }));
          return { success: true, data: updatedUser };
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || "Error updating user";
          console.error("Update user error:", errorMessage);
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },

      deleteUser: async (userId) => {
        set({ loading: true, error: null });
        try {
          // Backend returns 204 No Content on successful deletion
          await usersAPI.delete(userId);
          set((s) => ({ users: s.users.filter((u) => u.userId !== userId), loading: false }));
          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || "Error deleting user";
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
