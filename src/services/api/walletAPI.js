import axiosInstance from "../axiosConfig";
import axios from "axios";

export const walletAPI = {
    getBalance: () => axiosInstance.get("/wallet/balance"),

    getTransactions: () => axiosInstance.get("/wallet/transactions"),

    topup: (amount) => axiosInstance.post("/wallet/topup", { amount }),

    payInvoice: (bookingId) =>
        axiosInstance.post("/wallet/pay-invoice", { bookingId }),
};

export const healthAPI = {
    check: () => axios.get("http://localhost:5000/health"),
};

export default walletAPI;
