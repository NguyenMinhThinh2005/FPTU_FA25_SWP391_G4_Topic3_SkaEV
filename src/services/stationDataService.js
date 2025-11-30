/**
 * Station Data Service
 * Centralized business logic for station calculations and data management
 */

class StationDataService {
  /**
   * Calculate comprehensive station performance metrics
   * @param {Array} stations - Array of station objects
   * @param {Array} bookings - Array of booking objects
   * @returns {Array} Enhanced stations with performance metrics
   */
  static calculateStationPerformance(stations, bookings) {
    if (!Array.isArray(stations) || !Array.isArray(bookings)) {
      console.warn("Invalid input data for station performance calculation");
      return [];
    }

    return stations
      .map((station) => {
        try {
          const stationBookings = bookings.filter(
            (b) => b.stationId === station.id
          );
          const revenue = stationBookings.reduce(
            (sum, b) => sum + (b.cost || 0),
            0
          );

          // Calculate ports from poles with validation
          let totalPorts = 0;
          let occupiedPorts = 0;
          let polesCount = 0;

          if (station.charging?.poles && Array.isArray(station.charging.poles)) {
            station.charging.poles.forEach((pole) => {
              if (pole.ports && Array.isArray(pole.ports)) {
                totalPorts += pole.ports.length;
                polesCount++;

                pole.ports.forEach((port) => {
                  if (port.status === "occupied") occupiedPorts += 1;
                });
              }
            });
          }

          const utilization =
            totalPorts > 0
              ? Math.min(100, (occupiedPorts / totalPorts) * 100)
              : 0;

          return {
            ...station,
            bookingsCount: stationBookings.length,
            revenue: Math.max(0, revenue),
            utilization: Math.round(utilization * 100) / 100, // Round to 2 decimal places
            totalPorts,
            occupiedPorts: Math.max(0, occupiedPorts),
            availablePorts: Math.max(0, totalPorts - occupiedPorts),
            polesCount,
            // Performance indicators
            revenuePerPort: totalPorts > 0 ? revenue / totalPorts : 0,
            averageSessionValue:
              stationBookings.length > 0 ? revenue / stationBookings.length : 0,
            lastUpdated: new Date().toISOString(),
          };
        } catch (error) {
          console.error(
            `Error calculating performance for station ${station.id}:`,
            error
          );
          return {
            ...station,
            bookingsCount: 0,
            revenue: 0,
            utilization: 0,
            totalPorts: 0,
            occupiedPorts: 0,
            availablePorts: 0,
            polesCount: 0,
            error: "Calculation failed",
          };
        }
      })
      .sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
  }

  /**
   * Calculate system overview statistics
   * @param {Array} stations - Array of stations
   * @param {Array} users - Array of users
   * @param {Array} bookings - Array of bookings
   * @returns {Object} System overview metrics
   */
  static calculateSystemOverview(stations, users, bookings) {
    try {
      const totalStations = stations?.length || 0;
      const activeStations =
        stations?.filter((s) => s.status === "active").length || 0;
      const totalUsers = users?.length || 0;
      const totalBookings = bookings?.length || 0;

      const today = new Date().toDateString();
      const todayBookings =
        bookings?.filter((b) => new Date(b.date).toDateString() === today)
          .length || 0;

      const totalRevenue =
        bookings?.reduce((sum, b) => sum + (b.cost || 0), 0) || 0;
      const activeChargingSessions =
        bookings?.filter((b) => b.status === "in_progress").length || 0;

      // Calculate growth rates from historical data
      // TODO: Implement proper growth calculation based on time series data
      const userGrowthRate = 0;
      const revenueGrowthRate = 0;

      return {
        totalStations,
        activeStations,
        totalUsers,
        totalBookings,
        todayBookings,
        totalRevenue: Math.max(0, totalRevenue),
        activeChargingSessions,
        stationUtilizationRate:
          totalStations > 0 ? (activeStations / totalStations) * 100 : 0,
        userGrowthRate,
        revenueGrowthRate,
        averageRevenuePerStation:
          totalStations > 0 ? totalRevenue / totalStations : 0,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error calculating system overview:", error);
      return {
        totalStations: 0,
        activeStations: 0,
        totalUsers: 0,
        totalBookings: 0,
        todayBookings: 0,
        totalRevenue: 0,
        activeChargingSessions: 0,
        stationUtilizationRate: 0,
        userGrowthRate: 0,
        revenueGrowthRate: 0,
        averageRevenuePerStation: 0,
        error: "Calculation failed",
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  /**
   * Generate recent activities based on real data
   * @param {Array} bookings - Recent bookings
   * @param {Array} stations - Station data
   * @returns {Array} Recent activities list
   */
  static generateRecentActivities(bookings, stations) {
    try {
      const activities = [];
      const now = new Date();

      // Sort bookings by date to get most recent
      const recentBookings =
        bookings
          ?.filter((booking) => booking.date)
          ?.sort((a, b) => new Date(b.date) - new Date(a.date))
          ?.slice(0, 10) || [];

      recentBookings.forEach((booking, index) => {
        const station = stations?.find((s) => s.id === booking.stationId);
        const timeDiff = now - new Date(booking.date);
        const minutesAgo = Math.floor(timeDiff / (1000 * 60));

        let timeText;
        if (minutesAgo < 60) {
          timeText = `${minutesAgo} minutes ago`;
        } else if (minutesAgo < 1440) {
          timeText = `${Math.floor(minutesAgo / 60)} hours ago`;
        } else {
          timeText = `${Math.floor(minutesAgo / 1440)} days ago`;
        }

        activities.push({
          id: `booking-${booking.id}-${index}`,
          type: "booking",
          message: `Đặt chỗ mới tại ${station?.name || "Không rõ"} - Trụ ${booking.port?.poleName || booking.chargingPost?.name || "A"}`,
          time: timeText,
          severity:
            booking.status === "completed"
              ? "success"
              : booking.status === "cancelled"
              ? "error"
              : "info",
          stationId: booking.stationId,
          bookingId: booking.id,
        });
      });

      return activities.slice(0, 6);
    } catch (error) {
      console.error("Error generating recent activities:", error);
      return [];
    }
  }

  /**
   * Validate station data structure
   * @param {Object} station - Station object to validate
   * @returns {Object} Validation result
   */
  static validateStationData(station) {
    const errors = [];
    const warnings = [];

    if (!station) {
      errors.push("Station object is null or undefined");
      return { isValid: false, errors, warnings };
    }

    if (!station.id) errors.push("Station ID is required");
    if (!station.name) errors.push("Station name is required");
    if (!station.location?.address) warnings.push("Station address is missing");

    if (station.charging?.poles) {
      if (!Array.isArray(station.charging.poles)) {
        errors.push("poles should be an array");
      } else {
        station.charging.poles.forEach((pole, index) => {
          if (!pole.id) errors.push(`Pole ${index} missing ID`);
          const portsCount = pole.totalPorts || (pole.ports || []).length;
          if (typeof portsCount !== 'number' || portsCount < 0)
            errors.push(`Pole ${index} invalid total ports count`);
          const available = typeof pole.availablePorts === 'number' ? pole.availablePorts : (pole.ports || []).filter(p=>p.status==='available').length;
          if (typeof available !== 'number')
            errors.push(`Pole ${index} invalid availablePorts`);
          if (available > portsCount)
            warnings.push(`Pole ${index} has more available ports than total`);
        });
      }
    } else {
      warnings.push("Station has no poles data");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      station: station,
    };
  }

  /**
   * Filter stations by status
   * @param {Array} stations - Array of stations
   * @param {string} status - Status to filter by
   * @returns {Array} Filtered stations
   */
  static filterStationsByStatus(stations, status) {
    if (!Array.isArray(stations)) return [];
    if (!status) return stations;

    return stations.filter((station) => station.status === status);
  }

  /**
   * Get station utilization level
   * @param {number} utilization - Utilization percentage
   * @returns {Object} Utilization level info
   */
  static getUtilizationLevel(utilization) {
    if (utilization >= 90) {
      return { level: "critical", color: "error", label: "Critical" };
    } else if (utilization >= 75) {
      return { level: "high", color: "warning", label: "High" };
    } else if (utilization >= 50) {
      return { level: "medium", color: "info", label: "Medium" };
    } else {
      return { level: "low", color: "success", label: "Low" };
    }
  }
}

export default StationDataService;
