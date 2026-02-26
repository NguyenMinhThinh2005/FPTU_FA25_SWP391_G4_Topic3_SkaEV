import axiosInstance from "../axiosConfig";

export const invoicesAPI = {
    getMyInvoices: (params) =>
        axiosInstance.get("/invoices/my-invoices", { params }),

    getById: (id) => axiosInstance.get(`/invoices/${id}`),

    getByBooking: (bookingId) =>
        axiosInstance.get(`/invoices/booking/${bookingId}`),

    download: (id) =>
        axiosInstance.get(`/invoices/${id}/download`, {
            responseType: "blob",
            headers: { Accept: "application/pdf" },
        }),

    getPaymentHistory: (id) =>
        axiosInstance.get(`/invoices/${id}/payment-history`),
};

export default invoicesAPI;
