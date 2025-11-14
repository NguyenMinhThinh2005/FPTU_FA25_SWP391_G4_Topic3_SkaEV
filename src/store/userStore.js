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
          // Backend returns: { data: [...], pagination: {...} }
          if (response && response.data) {
            const users = Array.isArray(response.data) ? response.data : [];
            console.log("Users loaded from API:", users.length);
            set({ users, loading: false });
            return { success: true, data: users };
          } else {
            throw new Error("Invalid response format");
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
            fullName: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
            phoneNumber: data.phone || "",
            role: data.role || "customer",
            managedStationId: data.managedStationId ? Number(data.managedStationId) : undefined,
          };
          const response = await usersAPI.create(userData);
          // Backend returns created user directly
          if (response) {
            const newUser = response;
            set((s) => ({ users: [newUser, ...s.users], loading: false }));
            return { success: true, data: newUser };
          } else {
            throw new Error("Cannot create user");
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
          const updateData = {
            email: updates.email,
            fullName: updates.firstName && updates.lastName 
              ? `${updates.firstName} ${updates.lastName}`.trim()
              : undefined,
            phoneNumber: updates.phone,
            role: updates.role,
            managedStationId: updates.managedStationId !== undefined
              ? (updates.managedStationId === null ? null : Number(updates.managedStationId))
              : undefined,
          };
          // Remove undefined fields
          Object.keys(updateData).forEach(key => 
            updateData[key] === undefined && delete updateData[key]
          );
          
          const response = await usersAPI.update(userId, updateData);
          // Backend returns updated user directly
          if (response) {
            const updatedUser = response;
            set((s) => ({ users: s.users.map((u) => u.userId === userId ? updatedUser : u), loading: false }));
            return { success: true, data: updatedUser };
          } else {
            throw new Error("Cannot update user");
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
          await usersAPI.delete(userId);
          // Backend returns 204 No Content on success
          set((s) => ({ users: s.users.filter((u) => u.userId !== userId), loading: false }));
          return { success: true };
        } catch (error) {
          const errorMessage = error.message || "Error deleting user";
          console.error("Delete user error:", errorMessage);
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },

      changeUserRole: async (userId, newRole) => {
        set({ loading: true, error: null });
        try {
          const response = await usersAPI.updateRole(userId, { role: newRole });
          // Backend returns updated user
          if (response) {
            const updatedUser = response;
            set((s) => ({ users: s.users.map((u) => u.userId === userId ? updatedUser : u), loading: false }));
            return { success: true, data: updatedUser };
          } else {
            throw new Error("Cannot change user role");
          }
        } catch (error) {
          const errorMessage = error.message || "Error changing user role";
          console.error("Change role error:", errorMessage);
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },

      getUserById: (userId) => get().users.find((u) => u.userId === userId),
      getUsersByRole: (role) => get().users.filter((u) => u.role === role),
      searchUsers: (query = "") => {
        const q = query.toLowerCase();
        return get().users.filter((u) => {
          const name = (u.fullName || "").toLowerCase();
          return u.email?.toLowerCase().includes(q) || name.includes(q) || (u.phoneNumber || "").includes(query);
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
