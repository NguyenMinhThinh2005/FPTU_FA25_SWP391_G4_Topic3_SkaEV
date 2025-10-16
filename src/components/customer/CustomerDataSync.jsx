import React, { useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import useBookingStore from '../../store/bookingStore';
import useVehicleStore from '../../store/vehicleStore';
import useCustomerStore from '../../store/customerStore';

/**
 * CustomerDataSync - Component tá»± Ä‘á»™ng Ä‘á»“ng bá»™ dá»¯ liá»‡u customer
 * Wrap component nÃ y xung quanh cÃ¡c trang customer Ä‘á»ƒ Ä‘áº£m báº£o dá»¯ liá»‡u Ä‘á»“ng bá»™
 */
const CustomerDataSync = ({ children }) => {
    const { user } = useAuthStore();
    const { bookingHistory} = useBookingStore();
    const { vehicles, initializeWithUserData } = useVehicleStore();
    const { initialized, syncAllStores } = useCustomerStore();

    useEffect(() => {
        const initializeCustomerData = async () => {
            // Helper function to get mock data (inside useEffect to avoid dependency)
            ,
                        vehicle: {
                            make: "Tesla",
                            model: "Model 3",
                            year: 2023,
                            batteryCapacity: 75,
                            chargingType: ["AC Type 2", "DC CCS"]},
                        preferences: {
                            maxDistance: 15,
                            preferredPayment: "credit-card",
                            priceRange: [5000, 15000]}},
                    {
                        id: "customer-002",
                        email: "anna.nguyen@outlook.com",
                        role: "customer",
                        profile: {
                            firstName: "Anna",
                            lastName: "Nguyen",
                            phone: "+84 906 789 012",
                            verified: true},
                        vehicle: {
                            make: "VinFast",
                            model: "VF 8",
                            year: 2024,
                            batteryCapacity: 87.7,
                            chargingType: ["AC Type 2", "DC CCS"]},
                        preferences: {
                            maxDistance: 20,
                            preferredPayment: "e-wallet",
                            priceRange: [6000, 12000]}},
                ];

                // Try to find by ID first, then fallback to first customer
                return mockUsers.find(u => u.id === userId) ||
                    mockUsers.find(u => u.email === user?.email) ||
                    mockUsers.find(u => u.role === 'customer');
            };

            // Chá»‰ khá»Ÿi táº¡o náº¿u user Ä‘Ã£ login vÃ  chÆ°a initialized
            if (user && !initialized) {
                console.log('ðŸ”„ Initializing customer data sync...');

                // 1. Initialize booking data if empty
                if (bookingHistory.length === 0) {
                    console.log('ðŸ“Š Initializing booking data...');
                                    }

                // 2. Initialize vehicle data with user profile
                if (vehicles.length === 0 && user.id) {
                    console.log('ðŸš— Initializing vehicle data...');
                                        if (userData) {
                        initializeWithUserData(userData);
                    }
                }

                // 3. Mark as initialized
                await syncAllStores();
                console.log('âœ… Customer data sync completed');
            }
        };

        initializeCustomerData();
    }, [user, initialized, bookingHistory.length, vehicles.length, initializeWithUserData, syncAllStores]);

    // Helper function removed - moved inside useEffect

    // Return children without any UI changes
    return children;
};

export default CustomerDataSync;
