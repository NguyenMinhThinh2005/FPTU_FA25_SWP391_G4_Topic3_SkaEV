import axiosInstance from "../axiosConfig";

export const paymentsAPI = {
    getAll: (params) => axiosInstance.get("/payments", { params }),

    getById: (id) => axiosInstance.get(`/payments/${id}`),

    create: (paymentData) => axiosInstance.post("/payments", paymentData),

    process: (id, paymentDetails) =>
        axiosInstance.post(`/payments/${id}/process`, paymentDetails),

    refund: (id, refundData) =>
        axiosInstance.post(`/payments/${id}/refund`, refundData),
};

export const paymentMethodsAPI = {
    getMine: () => axiosInstance.get("/paymentmethods"),

    getById: (id) => axiosInstance.get(`/paymentmethods/${id}`),

    create: (payload) => axiosInstance.post("/paymentmethods", payload),

    update: (id, payload) =>
        axiosInstance.put(`/paymentmethods/${id}`, payload),

    remove: (id) => axiosInstance.delete(`/paymentmethods/${id}`),

    setDefault: (id) =>
        axiosInstance.patch(`/paymentmethods/${id}/set-default`),

    getDefault: () => axiosInstance.get("/paymentmethods/default"),
};

export const mockPaymentAPI = {
    processPayment: (paymentData) =>
        axiosInstance.post("/mock-payment/process", paymentData),
};

export const vnpayAPI = {
    createPaymentUrl: (paymentData) =>
        axiosInstance.post("/vnpay/create-payment-url", paymentData),
};

export default paymentsAPI;
