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
    const { initializeWithUserData } = useVehicleStore();

    useEffect(() => {
        if (user && !initialized) {
            console.log('Starting unified data synchronization...');

            // 1. Initialize booking data first (base data)
            if (bookingHistory.length === 0) {
                console.log('Initializing booking data...');
            }

            // 2. Sync all other stores
            syncAllStores();

            // 3. Initialize vehicle data with user profile
            const mockUserData = {
                id: user.id,
                profile: {
                    firstName: user.profile?.firstName || 'John',
                    lastName: user.profile?.lastName || 'Doe',
                    email: user.email,
                    phone: user.profile?.phone || '+84987654321',
                    verified: true},
                vehicle: {
                    make: 'VinFast',
                    model: 'VF e34',
                    year: 2024,
                    batteryCapacity: 42.0,
                    chargingType: ['AC Type 2', 'DC CCS']},
                preferences: {
                    maxDistance: 15,
                    preferredPayment: 'e-wallet',
                    priceRange: [6000, 12000]}
            };

            initializeWithUserData(mockUserData);
            setInitialized(true);

            console.log('Unified data sync completed');
        }
    }, [user, initialized, bookingHistory.length, syncAllStores, initializeWithUserData, setInitialized]);

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
