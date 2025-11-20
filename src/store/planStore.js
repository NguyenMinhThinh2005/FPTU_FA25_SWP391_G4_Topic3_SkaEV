import { create } from 'zustand';
import { plansAPI } from '../services/api';

const usePlanStore = create((set, get) => ({
  plans: [],
  selectedPlan: null,
  isLoading: false,
  error: null,
  filters: {
    planType: null
  },

  // Fetch all plans
  fetchPlans: async () => {
    set({ isLoading: true, error: null });
    try {
      const { planType } = get().filters;
      const params = {};
      if (planType) params.planType = planType;

      const response = await plansAPI.getAll(params);
      // Backend returns { success: true, data: [] }
      set({ plans: response.data || [], isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching plans:', error);
    }
  },

  // Fetch plan by ID
  fetchPlanById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await plansAPI.getById(id);
      set({ selectedPlan: response.data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching plan:', error);
    }
  },

  // Create new plan
  createPlan: async (planData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await plansAPI.create(planData);
      await get().fetchPlans(); // Refresh list
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error creating plan:', error);
      throw error;
    }
  },

  // Update plan
  updatePlan: async (id, planData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await plansAPI.update(id, planData);
      await get().fetchPlans(); // Refresh list
      set({ selectedPlan: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error updating plan:', error);
      throw error;
    }
  },

  // Delete plan
  deletePlan: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await plansAPI.delete(id);
      await get().fetchPlans(); // Refresh list
      set({ isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error deleting plan:', error);
      throw error;
    }
  },

  // Toggle plan status
  togglePlanStatus: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await plansAPI.toggleStatus(id);
      await get().fetchPlans(); // Refresh list
      set({ isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error toggling plan status:', error);
      throw error;
    }
  },

  // Set filters
  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
    get().fetchPlans();
  },

  // Clear filters
  clearFilters: () => {
    set({ filters: { planType: null } });
    get().fetchPlans();
  },

  // Clear selected plan
  clearSelectedPlan: () => {
    set({ selectedPlan: null });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  }
}));

export default usePlanStore;
