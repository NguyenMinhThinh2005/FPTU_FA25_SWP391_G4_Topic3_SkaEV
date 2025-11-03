import React from "react";
import useBookingStore from "../store/bookingStore";
import useAuthStore from "../store/authStore";

/**
 * Master Data Sync - Đảm bảo tất cả components sử dụng cùng data
 * Load bookings từ database khi user đăng nhập
 */
export const useMasterDataSync = () => {
  const { user } = useAuthStore();
  const { bookingHistory, getBookingStats, loadUserBookings, fetchUserVehicles } = useBookingStore();
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasLoaded, setHasLoaded] = React.useState(false);

  // Load bookings and vehicles from database when user logs in
  React.useEffect(() => {
    const loadData = async () => {
      if (user && !hasLoaded && !isLoading) {
        setIsLoading(true);
        console.log("📥 useMasterDataSync: Loading data from database...");
        
        try {
          // Load both bookings and vehicles in parallel
          await Promise.all([
            loadUserBookings(),
            fetchUserVehicles()
          ]);
          setHasLoaded(true);
          console.log("✅ useMasterDataSync: Data loaded successfully");
        } catch (error) {
          console.error("❌ useMasterDataSync: Failed to load data:", error);
          // Continue with localStorage data
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadData();
  }, [user, hasLoaded, isLoading, loadUserBookings, fetchUserVehicles]);

  // Return unified stats
  const stats = getBookingStats();

  // Add debugging info
  React.useEffect(() => {
    if (bookingHistory.length > 0) {
      console.log("📊 Master Data Sync - Current stats:", {
        total: stats.total,
        completed: stats.completed,
        totalAmount: stats.totalAmount,
        totalEnergyCharged: stats.totalEnergyCharged,
        bookingHistoryLength: bookingHistory.length,
      });
    }
  }, [stats, bookingHistory.length]);

  return {
    bookingHistory,
    stats,
    completedBookings: bookingHistory.filter((b) => b.status === "completed"),
    isDataReady: bookingHistory.length > 0,
    isLoadingFromDB: isLoading,
  };
};
