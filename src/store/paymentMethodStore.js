import { create } from "zustand";
import { paymentMethodsAPI } from "../services/api";

const ensureArray = (payload) => {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  return [];
};

const usePaymentMethodStore = create((set, get) => ({
  methods: [],
  loading: false,
  error: null,

  fetchPaymentMethods: async () => {
    set({ loading: true, error: null });
    try {
      const response = await paymentMethodsAPI.getMine();
      const methods = ensureArray(response);
      set({ methods, loading: false });
      return methods;
    } catch (error) {
      set({
        loading: false,
        error: error.message || "Không thể tải phương thức thanh toán",
      });
      throw error;
    }
  },

  createPaymentMethod: async (payload) => {
    set({ loading: true, error: null });
    try {
      const created = await paymentMethodsAPI.create(payload);
      await get().fetchPaymentMethods();
      return created;
    } catch (error) {
      set({
        loading: false,
        error: error.message || "Không thể tạo phương thức thanh toán",
      });
      throw error;
    }
  },

  updatePaymentMethod: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const updated = await paymentMethodsAPI.update(id, payload);
      await get().fetchPaymentMethods();
      return updated;
    } catch (error) {
      set({
        loading: false,
        error: error.message || "Không thể cập nhật phương thức thanh toán",
      });
      throw error;
    }
  },

  deletePaymentMethod: async (id) => {
    set({ loading: true, error: null });
    try {
      await paymentMethodsAPI.remove(id);
      await get().fetchPaymentMethods();
    } catch (error) {
      set({
        loading: false,
        error: error.message || "Không thể xóa phương thức thanh toán",
      });
      throw error;
    }
  },

  setDefaultPaymentMethod: async (id) => {
    set({ loading: true, error: null });
    try {
      const updated = await paymentMethodsAPI.setDefault(id);
      await get().fetchPaymentMethods();
      return updated;
    } catch (error) {
      set({ loading: false, error: error.message || "Không thể đặt mặc định" });
      throw error;
    }
  },

  getDefaultPaymentMethod: async () => {
    try {
      const response = await paymentMethodsAPI.getDefault();
      return response;
    } catch (error) {
      set({ error: error.message || "Không thể tải phương thức mặc định" });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

export default usePaymentMethodStore;
