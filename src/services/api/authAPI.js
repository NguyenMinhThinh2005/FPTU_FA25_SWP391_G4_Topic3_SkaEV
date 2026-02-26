import axiosInstance from "../axiosConfig";

export const authAPI = {
    login: async (credentials) => {
        const response = await axiosInstance.post("/auth/login", credentials);
        if (response.token) {
            sessionStorage.setItem("token", response.token);
            sessionStorage.setItem("refreshToken", response.refreshToken || "");
        }
        return response;
    },

    register: (userData) => axiosInstance.post("/auth/register", userData),

    logout: () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("refreshToken");
        return axiosInstance.post("/auth/logout");
    },

    refreshToken: (refreshToken) =>
        axiosInstance.post("/auth/refresh", { refreshToken }),

    getProfile: () => axiosInstance.get("/auth/profile"),

    updateProfile: (profileData) =>
        axiosInstance.put("/UserProfiles/me", profileData),

    getStatistics: () => axiosInstance.get("/UserProfiles/me/statistics"),
};

export default authAPI;
