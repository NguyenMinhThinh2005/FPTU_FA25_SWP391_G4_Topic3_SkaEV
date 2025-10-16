import { create } from "zustand";import { create } from "zustand";

import { persist } from "zustand/middleware";import { persist } from "zustand/middleware";

import { usersAPI } from "../services/api";import { usersAPI } from "../services/api";



const useUserStore = create(const useUserStore = create(

  persist(  persist(

    (set, get) => ({    (set, get) => ({

      // State      users: [],

      users: [],      loading: false,

      loading: false,      error: null,

      error: null,

      // Initialize data from API

      // Initialize data from API      initializeData: async () => {

      initializeData: async () => {        console.log("🚀 Initializing users from API...");

        console.log("🚀 Initializing users from API...");        await get().fetchUsers();

        await get().fetchUsers();      },

      },

      // Fetch all users from API

      // Fetch all users from API      fetchUsers: async () => {

      fetchUsers: async () => {        set({ loading: true, error: null });

        set({ loading: true, error: null });        try {

        try {          const response = await usersAPI.getAll();

          const response = await usersAPI.getAll();          

                    if (response.success && response.data) {

          if (response.success && response.data) {            const users = Array.isArray(response.data) 

            const users = Array.isArray(response.data)               ? response.data 

              ? response.data               : response.data.users || [];

              : response.data.users || [];            

                        console.log("✅ Users loaded from API:", users.length);

            console.log("✅ Users loaded from API:", users.length);            set({ users, loading: false });

            set({ users, loading: false });            return { success: true, data: users };

            return { success: true, data: users };          } else {

          } else {            throw new Error(response.message || "Không thể tải danh sách users");

            throw new Error(response.message || "Không thể tải danh sách users");          }

          }        } catch (error) {

        } catch (error) {          const errorMessage = error.message || "Đã xảy ra lỗi khi tải users";

          const errorMessage = error.message || "Đã xảy ra lỗi khi tải users";          console.error("❌ Fetch users error:", errorMessage);

          console.error("❌ Fetch users error:", errorMessage);          set({ error: errorMessage, loading: false, users: [] });

          set({ error: errorMessage, loading: false, users: [] });          return { success: false, error: errorMessage };

          return { success: false, error: errorMessage };        }

        }      },

      },

      // Add new user via API

      // Add new user via API      addUser: async (data) => {

      addUser: async (data) => {        set({ loading: true, error: null });

        set({ loading: true, error: null });        try {

        try {          const userData = {

          const userData = {            email: data.email,

            email: data.email,            password: data.password || "Temp123!",

            password: data.password || "Temp123!",            role: data.role || "customer",

            role: data.role || "customer",            firstName: data.firstName || "",

            firstName: data.firstName || "",            lastName: data.lastName || "",

            lastName: data.lastName || "",            phone: data.phone || "",

            phone: data.phone || "",            avatar: data.avatar || "",

            avatar: data.avatar || "",            permissions: data.permissions || [],

            permissions: data.permissions || [],            business: data.business || null,

            business: data.business || null,          };

          };

          const response = await usersAPI.create(userData);

          const response = await usersAPI.create(userData);          

                    if (response.success && response.data) {

          if (response.success && response.data) {            const newUser = response.data;

            const newUser = response.data;            set((s) => ({ 

            set((s) => ({               users: [newUser, ...s.users], 

              users: [newUser, ...s.users],               loading: false 

              loading: false             }));

            }));            return { success: true, data: newUser };

            return { success: true, data: newUser };          } else {

          } else {            throw new Error(response.message || "Không thể tạo user");

            throw new Error(response.message || "Không thể tạo user");          }

          }        } catch (error) {

        } catch (error) {          const errorMessage = error.message || "Đã xảy ra lỗi khi tạo user";

          const errorMessage = error.message || "Đã xảy ra lỗi khi tạo user";          console.error("❌ Add user error:", errorMessage);

          console.error("❌ Add user error:", errorMessage);          set({ error: errorMessage, loading: false });

          set({ error: errorMessage, loading: false });          return { success: false, error: errorMessage };

          return { success: false, error: errorMessage };        }

        }      },

      },

      // Update user via API

      // Update user via API      updateUser: async (userId, updates) => {

      updateUser: async (userId, updates) => {        set({ loading: true, error: null });

        set({ loading: true, error: null });        try {

        try {          const response = await usersAPI.update(userId, updates);

          const response = await usersAPI.update(userId, updates);          

                    if (response.success && response.data) {

          if (response.success && response.data) {            const updatedUser = response.data;

            const updatedUser = response.data;            set((s) => ({

            set((s) => ({              users: s.users.map((u) => u.id === userId ? updatedUser : u),

              users: s.users.map((u) => u.id === userId ? updatedUser : u),                    phone: updates.phone ?? u.profile?.phone,

              loading: false,                    avatar: updates.avatar ?? u.profile?.avatar,

            }));                    permissions: updates.permissions ?? u.profile?.permissions,

            return { success: true, data: updatedUser };                  },

          } else {                }

            throw new Error(response.message || "Không thể cập nhật user");              : u

          }          ),

        } catch (error) {        }));

          const errorMessage = error.message || "Đã xảy ra lỗi khi cập nhật user";      },

          console.error("❌ Update user error:", errorMessage);

          set({ error: errorMessage, loading: false });      deleteUser: (userId) => {

          return { success: false, error: errorMessage };        set((s) => ({ users: s.users.filter((u) => u.id !== userId) }));

        }      },

      },

      setRole: (userId, role) => get().updateUser(userId, { role }),

      // Delete user via API      setPermissions: (userId, permissions) => get().updateUser(userId, { permissions }),

      deleteUser: async (userId) => {

        set({ loading: true, error: null });      getUsersByRole: (role) => get().users.filter((u) => u.role === role),

        try {      searchUsers: (q = "") => {

          const response = await usersAPI.delete(userId);        const query = q.toLowerCase();

                  return get().users.filter((u) => {

          if (response.success) {          const name = `${u.profile?.firstName || ""} ${u.profile?.lastName || ""}`.toLowerCase();

            set((s) => ({          return (

              users: s.users.filter((u) => u.id !== userId),            u.email.toLowerCase().includes(query) ||

              loading: false,            name.includes(query) ||

            }));            (u.profile?.phone || "").includes(q)

            return { success: true };          );

          } else {        });

            throw new Error(response.message || "Không thể xóa user");      },

          }    }),

        } catch (error) {    { name: "skaev-user-store", partialize: (s) => ({ users: s.users }) }

          const errorMessage = error.message || "Đã xảy ra lỗi khi xóa user";  )

          console.error("❌ Delete user error:", errorMessage););

          set({ error: errorMessage, loading: false });

          return { success: false, error: errorMessage };export default useUserStore;

        } 
      },

      // Helper functions
      getUserById: (userId) => {
        return get().users.find((u) => u.id === userId);
      },

      getUsersByRole: (role) => {
        return get().users.filter((u) => u.role === role);
      },

      searchUsers: (query = "") => {
        const q = query.toLowerCase();
        return get().users.filter((u) => {
          const name = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
          return (
            u.email?.toLowerCase().includes(q) ||
            name.includes(q) ||
            (u.phone || "").includes(query)
          );
        });
      },

      setRole: (userId, role) => get().updateUser(userId, { role }),
      
      setPermissions: (userId, permissions) => get().updateUser(userId, { permissions }),

      clearError: () => set({ error: null }),
    }),
    {
      name: "skaev-user-store",
      partialize: (state) => ({ users: state.users }),
    }
  )
);

export default useUserStore;
