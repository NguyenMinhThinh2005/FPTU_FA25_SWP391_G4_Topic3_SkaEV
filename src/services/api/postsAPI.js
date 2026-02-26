import axiosInstance from "../axiosConfig";

export const postsAPI = {
    getAll: (params) => axiosInstance.get("/posts", { params }),

    getById: (id) => axiosInstance.get(`/posts/${id}`),

    getByStation: (stationId) =>
        axiosInstance.get(`/stations/${stationId}/posts`),

    create: (postData) => axiosInstance.post("/posts", postData),

    update: (id, postData) => axiosInstance.put(`/posts/${id}`, postData),

    delete: (id) => axiosInstance.delete(`/posts/${id}`),
};

export default postsAPI;
