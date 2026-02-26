import axiosInstance from "../axiosConfig";

export const qrCodesAPI = {
    generate: (generateData) =>
        axiosInstance.post("/qrcodes/generate", generateData),

    getById: (id) => axiosInstance.get(`/qrcodes/${id}`),

    getMyQRCodes: () => axiosInstance.get("/qrcodes/my-qrcodes"),

    validate: (qrCodeData) =>
        axiosInstance.post("/qrcodes/validate", { qrCodeData }),

    use: (id, useData) => axiosInstance.post(`/qrcodes/${id}/use`, useData),

    cancel: (id) => axiosInstance.delete(`/qrcodes/${id}`),

    getImage: (id) =>
        axiosInstance.get(`/qrcodes/${id}/image`, { responseType: "blob" }),
};

export default qrCodesAPI;
