import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mockUsers } from "../data/mockData";

const useUserStore = create(
  persist(
    (set, get) => ({
      users: mockUsers,
      loading: false,
      error: null,

      fetchUsers: async () => {
        set({ loading: true, error: null });
        await new Promise((r) => setTimeout(r, 300));
        set({ users: get().users, loading: false });
      },

      addUser: (data) => {
        const newUser = {
          id: `user-${Date.now()}`,
          email: data.email,
          password: data.password || "Temp123!",
          role: data.role || "customer",
          profile: {
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            phone: data.phone || "",
            avatar: data.avatar || "",
            createdAt: new Date().toISOString(),
            lastLogin: null,
            permissions: data.permissions || [],
          },
          business: data.business || null,
        };
        set((s) => ({ users: [newUser, ...s.users] }));
        return newUser;
      },

      updateUser: (userId, updates) => {
        set((s) => ({
          users: s.users.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  email: updates.email ?? u.email,
                  role: updates.role ?? u.role,
                  business: updates.business !== undefined ? updates.business : u.business,
                  profile: {
                    ...u.profile,
                    firstName: updates.firstName ?? u.profile?.firstName,
                    lastName: updates.lastName ?? u.profile?.lastName,
                    phone: updates.phone ?? u.profile?.phone,
                    avatar: updates.avatar ?? u.profile?.avatar,
                    permissions: updates.permissions ?? u.profile?.permissions,
                  },
                }
              : u
          ),
        }));
      },

      deleteUser: (userId) => {
        set((s) => ({ users: s.users.filter((u) => u.id !== userId) }));
      },

      setRole: (userId, role) => get().updateUser(userId, { role }),
      setPermissions: (userId, permissions) => get().updateUser(userId, { permissions }),

      getUsersByRole: (role) => get().users.filter((u) => u.role === role),
      searchUsers: (q = "") => {
        const query = q.toLowerCase();
        return get().users.filter((u) => {
          const name = `${u.profile?.firstName || ""} ${u.profile?.lastName || ""}`.toLowerCase();
          return (
            u.email.toLowerCase().includes(query) ||
            name.includes(query) ||
            (u.profile?.phone || "").includes(q)
          );
        });
      },
    }),
    { name: "skaev-user-store", partialize: (s) => ({ users: s.users }) }
  )
);

export default useUserStore;
 