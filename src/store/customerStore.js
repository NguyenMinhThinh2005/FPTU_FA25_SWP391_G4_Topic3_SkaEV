import { create } from "zustand";
import { persist } from "zustand/middleware";

// Unified Customer Data Store - Tổng hợp và đồng bộ tất cả dữ liệu customer
const useCustomerStore = create(
    persist(
        (set, get) => ({
            // State
            initialized: false,
            lastSync: null,

            // Data synchronization methods
            syncAllStores: async () => {
                try {
                    set({ loading: true });

                    // Get user data from auth store
                    const authStore = await import('./authStore');
                    const bookingStore = await import('./bookingStore');
                    const vehicleStore = await import('./vehicleStore');

                    const user = authStore.default.getState().user;

                    if (user) {
                        // Initialize booking data
                        if (bookingStore.default.getState().bookingHistory.length === 0) {
                            bookingStore.default.getState().fetchBookings();
                        }

                        // Initialize vehicle data
                        if (vehicleStore.default.getState().vehicles.length === 0) {
                            vehicleStore.default.getState().fetchVehicles();
                        }
                    }

                    set({
                        initialized: true,
                        lastSync: new Date().toISOString(),
                        loading: false
                    });

                    return { success: true };
                } catch (error) {
                    set({ loading: false, error: error.message });
                    return { success: false, error: error.message };
                }
            },

            // Unified data getters - Note: These should be called from components with proper stores
            getCustomerSummary: (authState, bookingState, vehicleState) => {
                const user = authState?.user;
                const bookingStats = bookingState?.getBookingStats ? bookingState.getBookingStats() : {};
                const vehicles = vehicleState?.vehicles || [];

                return {
                    user: {
                        id: user?.id,
                        name: user?.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'Customer',
                        email: user?.email,
                        phone: user?.profile?.phone,
                        verified: user?.profile?.verified,
                    },
                    stats: {
                        totalBookings: parseInt(bookingStats.total) || 0,
                        completedBookings: parseInt(bookingStats.completed) || 0,
                        totalEnergy: parseFloat(bookingStats.totalEnergyCharged) || 0,
                        totalAmount: parseFloat(bookingStats.totalAmount) || 0,
                        completionRate: parseFloat(bookingStats.completionRate) || 0,
                    },
                    vehicles: {
                        total: vehicles.length,
                        default: vehicles.find(v => v.isDefault) || vehicles[0],
                        list: vehicles,
                    },
                    lastSync: get().lastSync,
                };
            },

            // Utility methods
            formatCurrency: (amount) => {
                return new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                }).format(amount || 0);
            },

            formatDate: (dateString) => {
                return new Date(dateString).toLocaleDateString('vi-VN');
            },

            formatDateTime: (dateString) => {
                return new Date(dateString).toLocaleString('vi-VN');
            },

            // State management
            loading: false,
            error: null,
            setLoading: (loading) => set({ loading }),
            setError: (error) => set({ error }),
            clearError: () => set({ error: null }),
            setInitialized: (initialized) => set({ initialized }),

            // Force re-sync
            forceSync: () => {
                set({ initialized: false });
                return get().syncAllStores();
            },
        }),
        {
            name: "customer-unified-store",
            partialize: (state) => ({
                initialized: state.initialized,
                lastSync: state.lastSync,
            }),
        }
    )
);

export default useCustomerStore;
