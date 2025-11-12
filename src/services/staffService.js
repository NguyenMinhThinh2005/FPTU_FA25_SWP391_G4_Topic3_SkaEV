/**
 * Staff Service - High-level service for Staff Dashboard and Operations
 * Wraps staffAPI and provides aggregated data for staff views
 */
import staffAPI from './api/staffAPI';
import { stationsAPI } from './api';

const staffService = {
  /**
   * Get dashboard data for staff (aggregated)
   * Returns all necessary data for staff dashboard in one call
   */
  getDashboardData: async () => {
    try {
      const [stations, myIssues, activeSessions] = await Promise.all([
        stationsAPI.getAllStations(),
        staffAPI.getMyIssues(),
        staffAPI.getActiveSessions().catch(() => ({ data: [] })), // Fallback if endpoint doesn't exist
      ]);

      // Calculate daily statistics from stations and sessions
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Mock daily stats for now - TODO: Get from backend API
      const dailyStats = {
        revenue: 0,
        completedSessions: 0,
        energyConsumed: 0,
      };

      // Filter active issues/alerts
      const alerts = (myIssues.data || [])
        .filter(issue => issue.status !== 'closed' && issue.status !== 'resolved')
        .map(issue => ({
          id: issue.issueId,
          type: issue.priority === 'high' ? 'error' : issue.priority === 'medium' ? 'warning' : 'info',
          message: issue.title,
          description: issue.description,
          timestamp: new Date(issue.createdAt),
          stationId: issue.stationId,
        }));

      return {
        stations: stations.data || stations,
        issues: myIssues.data || [],
        activeSessions: activeSessions.data || [],
        dailyStats,
        alerts,
      };
    } catch (error) {
      console.error('Error fetching staff dashboard data:', error);
      throw error;
    }
  },

  /**
   * Get assigned stations for current staff
   */
  getAssignedStations: async () => {
    try {
      // TODO: Add endpoint to get staff-assigned stations
      // For now, return all stations
      const response = await stationsAPI.getAllStations();
      return response.data || response;
    } catch (error) {
      console.error('Error fetching assigned stations:', error);
      throw error;
    }
  },

  /**
   * Get station details with real-time status
   */
  getStationWithLiveData: async (stationId) => {
    try {
      const [station, slots, issues] = await Promise.all([
        staffAPI.getStationDetails(stationId),
        staffAPI.getStationSlots(stationId),
        staffAPI.getAllIssues({ stationId, status: 'open' }),
      ]);

      // Calculate connector/port statistics
      const slotData = slots.data || [];
      const connectors = {
        total: slotData.length,
        available: slotData.filter(s => s.status === 'available').length,
        charging: slotData.filter(s => s.status === 'occupied').length,
        faulted: slotData.filter(s => s.status === 'faulted').length,
      };

      return {
        ...station,
        slots: slotData,
        connectors,
        issues: issues.data || [],
      };
    } catch (error) {
      console.error(`Error fetching station ${stationId} live data:`, error);
      throw error;
    }
  },

  /**
   * Report new issue for a station
   */
  reportIssue: async (issueData) => {
    try {
      return await staffAPI.createIssue(issueData);
    } catch (error) {
      console.error('Error reporting issue:', error);
      throw error;
    }
  },

  /**
   * Update issue status (resolve, close, etc.)
   */
  updateIssueStatus: async (issueId, status, resolution = null) => {
    try {
      return await staffAPI.updateIssueStatus(issueId, status, resolution);
    } catch (error) {
      console.error(`Error updating issue ${issueId} status:`, error);
      throw error;
    }
  },

  /**
   * Get all issues with filters
   */
  getIssues: async (filters = {}) => {
    try {
      const response = await staffAPI.getAllIssues(filters);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching issues:', error);
      throw error;
    }
  },

  /**
   * Get maintenance schedule
   */
  getMaintenanceSchedule: async (stationId = null) => {
    try {
      return await staffAPI.getMaintenanceSchedule(stationId);
    } catch (error) {
      console.error('Error fetching maintenance schedule:', error);
      throw error;
    }
  },

  /**
   * Get active charging sessions for monitoring
   */
  getActiveChargingSessions: async () => {
    try {
      const response = await staffAPI.getActiveSessions();
      return response.data || response;
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      return []; // Return empty array on error
    }
  },

  /**
   * Start a charging session (if allowed)
   */
  startChargingSession: async (bookingId, initialSoc = 20) => {
    try {
      return await staffAPI.startCharging(bookingId, initialSoc);
    } catch (error) {
      console.error(`Error starting charging session ${bookingId}:`, error);
      throw error;
    }
  },

  /**
   * Complete a charging session
   */
  completeChargingSession: async (bookingId, sessionData) => {
    try {
      return await staffAPI.completeCharging(bookingId, sessionData);
    } catch (error) {
      console.error(`Error completing charging session ${bookingId}:`, error);
      throw error;
    }
  },

  /**
   * Process payment at counter
   */
  processCounterPayment: async (bookingId, paymentMethod = 'cash') => {
    try {
      return await staffAPI.processPayment(bookingId, {
        method: paymentMethod,
      });
    } catch (error) {
      console.error(`Error processing payment for booking ${bookingId}:`, error);
      throw error;
    }
  },

  /**
   * Get bookings history
   */
  getBookingsHistory: async (filters = {}) => {
    try {
      const response = await staffAPI.getBookingsHistory(filters);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching bookings history:', error);
      throw error;
    }
  },

  /**
   * Broadcast alert to other staff/admin
   */
  broadcastAlert: async (alertData) => {
    try {
      return await staffAPI.broadcastAlert(alertData);
    } catch (error) {
      console.error('Error broadcasting alert:', error);
      throw error;
    }
  },
};

export default staffService;
