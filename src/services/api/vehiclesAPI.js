import axiosInstance from "../axiosConfig";

export const vehiclesAPI = {
    getAll: (params) => axiosInstance.get("/vehicles", { params }),

    getById: (id) => axiosInstance.get(`/vehicles/${id}`),

    getUserVehicles: () => axiosInstance.get("/vehicles"),

    create: (vehicleData) => axiosInstance.post("/vehicles", vehicleData),

    update: (id, vehicleData) =>
        axiosInstance.put(`/vehicles/${id}`, vehicleData),

    delete: (id) => axiosInstance.delete(`/vehicles/${id}`),

    setDefault: (id) => axiosInstance.patch(`/vehicles/${id}/set-default`),
};

export default vehiclesAPI;
