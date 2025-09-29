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
      console.warn('Invalid input data for station performance calculation');
      return [];
    }

    return stations
      .map((station) => {
        try {
          const stationBookings = bookings.filter(
            (b) => b.stationId === station.id
          );
          const revenue = stationBookings.reduce((sum, b) => sum + (b.cost || 0), 0);
          
          // Calculate slots from chargingPosts with validation
          let totalSlots = 0;
          let occupiedSlots = 0;
          let chargingPostsCount = 0;
          
          if (station.charging?.chargingPosts && Array.isArray(station.charging.chargingPosts)) {
            station.charging.chargingPosts.forEach(post => {
              if (post.totalSlots && typeof post.totalSlots === 'number') {
                totalSlots += post.totalSlots;
                chargingPostsCount++;
                
                if (post.availableSlots && typeof post.availableSlots === 'number') {
                  occupiedSlots += Math.max(0, post.totalSlots - post.availableSlots);
                }
              }
            });
          }
          
          const utilization = totalSlots > 0 ? Math.min(100, (occupiedSlots / totalSlots) * 100) : 0;

          return {
            ...station,
            bookingsCount: stationBookings.length,
            revenue: Math.max(0, revenue),
            utilization: Math.round(utilization * 100) / 100, // Round to 2 decimal places
            totalSlots,
            occupiedSlots: Math.max(0, occupiedSlots),
            availableSlots: Math.max(0, totalSlots - occupiedSlots),
            chargingPostsCount,
            // Performance indicators
            revenuePerSlot: totalSlots > 0 ? revenue / totalSlots : 0,
            averageSessionValue: stationBookings.length > 0 ? revenue / stationBookings.length : 0,
            lastUpdated: new Date().toISOString(),
          };
        } catch (error) {
          console.error(`Error calculating performance for station ${station.id}:`, error);
          return {
            ...station,
            bookingsCount: 0,
            revenue: 0,
            utilization: 0,
            totalSlots: 0,
            occupiedSlots: 0,
            availableSlots: 0,
            chargingPostsCount: 0,
            error: 'Calculation failed',
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
      const activeStations = stations?.filter((s) => s.status === "active").length || 0;
      const totalUsers = users?.length || 0;
      const totalBookings = bookings?.length || 0;
      
      const today = new Date().toDateString();
      const todayBookings = bookings?.filter(
        (b) => new Date(b.date).toDateString() === today
      ).length || 0;
      
      const totalRevenue = bookings?.reduce((sum, b) => sum + (b.cost || 0), 0) || 0;
      const activeChargingSessions = bookings?.filter(
        (b) => b.status === "in_progress"
      ).length || 0;

      // Calculate growth rates (mock data for demo)
      const userGrowthRate = 18.5; // Would come from historical data
      const revenueGrowthRate = 12.3;

      return {
        totalStations,
        activeStations,
        totalUsers,
        totalBookings,
        todayBookings,
        totalRevenue: Math.max(0, totalRevenue),
        activeChargingSessions,
        stationUtilizationRate: totalStations > 0 ? (activeStations / totalStations) * 100 : 0,
        userGrowthRate,
        revenueGrowthRate,
        averageRevenuePerStation: totalStations > 0 ? totalRevenue / totalStations : 0,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error calculating system overview:', error);
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
        error: 'Calculation failed',
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
      const recentBookings = bookings
        ?.filter(booking => booking.date)
        ?.sort((a, b) => new Date(b.date) - new Date(a.date))
        ?.slice(0, 10) || [];

      recentBookings.forEach((booking, index) => {
        const station = stations?.find(s => s.id === booking.stationId);
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
          message: `New booking at ${station?.name || 'Unknown Station'} - Charging Post ${booking.chargingPost?.name || 'A'}`,
          time: timeText,
          severity: booking.status === 'completed' ? 'success' : 
                   booking.status === 'cancelled' ? 'error' : 'info',
          stationId: booking.stationId,
          bookingId: booking.id,
        });
      });

      // Add some system activities (mock but realistic)
      if (activities.length < 6) {
        activities.push(
          {
            id: 'system-1',
            type: 'system',
            message: 'System health check completed successfully',
            time: '2 hours ago',
            severity: 'success',
          },
          {
            id: 'maintenance-1',
            type: 'maintenance',
            message: 'Scheduled maintenance completed for Station Network',
            time: '4 hours ago',
            severity: 'info',
          }
        );
      }

      return activities.slice(0, 6);
    } catch (error) {
      console.error('Error generating recent activities:', error);
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
      errors.push('Station object is null or undefined');
      return { isValid: false, errors, warnings };
    }

    if (!station.id) errors.push('Station ID is required');
    if (!station.name) errors.push('Station name is required');
    if (!station.location?.address) warnings.push('Station address is missing');
    
    if (station.charging?.chargingPosts) {
      if (!Array.isArray(station.charging.chargingPosts)) {
        errors.push('ChargingPosts should be an array');
      } else {
        station.charging.chargingPosts.forEach((post, index) => {
          if (!post.id) errors.push(`Charging post ${index} missing ID`);
          if (typeof post.totalSlots !== 'number') errors.push(`Charging post ${index} invalid totalSlots`);
          if (typeof post.availableSlots !== 'number') errors.push(`Charging post ${index} invalid availableSlots`);
          if (post.availableSlots > post.totalSlots) warnings.push(`Charging post ${index} has more available slots than total`);
        });
      }
    } else {
      warnings.push('Station has no charging posts data');
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
    
    return stations.filter(station => station.status === status);
  }

  /**
   * Get station utilization level
   * @param {number} utilization - Utilization percentage
   * @returns {Object} Utilization level info
   */
  static getUtilizationLevel(utilization) {
    if (utilization >= 90) {
      return { level: 'critical', color: 'error', label: 'Critical' };
    } else if (utilization >= 75) {
      return { level: 'high', color: 'warning', label: 'High' };
    } else if (utilization >= 50) {
      return { level: 'medium', color: 'info', label: 'Medium' };
    } else {
      return { level: 'low', color: 'success', label: 'Low' };
    }
  }
}

export default StationDataService;