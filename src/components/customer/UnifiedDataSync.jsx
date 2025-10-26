import React, { useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import useBookingStore from '../../store/bookingStore';
import useCustomerStore from '../../store/customerStore';
import useVehicleStore from '../../store/vehicleStore';

/**
 * UnifiedDataSync - Đảm bảo tất cả dữ liệu customer đồng bộ
 * Component này chạy trong background để đồng bộ dữ liệu giữa các store
 */
const UnifiedDataSync = ({ children }) => {
    const { user } = useAuthStore();
    const { bookingHistory, getBookingStats } = useBookingStore();
    const { syncAllStores, initialized, setInitialized } = useCustomerStore();
    const { initializeData } = useVehicleStore();

    useEffect(() => {
        if (user && !initialized) {
            console.log('Starting unified data synchronization...');

            // 1. Initialize booking data first (base data)
            if (bookingHistory.length === 0) {
                console.log('Initializing booking data...');
            }

            // 2. Sync all other stores
            syncAllStores();

            // 3. Initialize vehicle data
            initializeData();
            
            setInitialized(true);

            console.log('Unified data sync completed');
        }
    }, [user, initialized, bookingHistory.length, syncAllStores, initializeData, setInitialized]);

    // Debug: Log current stats to verify data sync
    useEffect(() => {
        if (initialized && bookingHistory.length > 0) {
            const stats = getBookingStats();
            console.log('Current booking stats:', {
                total: stats.total,
                completed: stats.completed,
                totalAmount: stats.totalAmount,
                totalEnergy: stats.totalEnergyCharged,
                completionRate: stats.completionRate
            });
        }
    }, [initialized, bookingHistory.length, getBookingStats]);

    return children;
};

export default UnifiedDataSync;
