import axiosInstance from '../axiosConfig';

/**
 * Staff API - Calls StaffIssuesController and MonitoringController
 * Requires Staff/Admin role authorization
 */
const staffAPI = {
  // ==================== DASHBOARD OVERVIEW ====================

  /**
   * Load station overview for the authenticated staff member
   */
  getDashboardOverview: async () => {
    const response = await axiosInstance.get('/api/staff/dashboard');
    return response.data;
  },

  // ==================== ISSUES MANAGEMENT ====================
  
  /**
   * Get all issues with optional filters
   * @param {Object} params - { stationId?, status?, priority?, assignedTo? }
   */
  getAllIssues: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.stationId) queryParams.append('stationId', params.stationId);
    if (params.status) queryParams.append('status', params.status);
    if (params.priority) queryParams.append('priority', params.priority);
    if (params.assignedTo) queryParams.append('assignedTo', params.assignedTo);
    
    const response = await axiosInstance.get(`/api/StaffIssues?${queryParams}`);
    return response.data?.data ?? [];
  },

  /**
   * Get issues assigned to current staff member
   */
  getMyIssues: async () => {
    const response = await axiosInstance.get('/api/StaffIssues/my-issues');
    return response.data?.data ?? [];
  },

  /**
   * Get single issue details
   */
  getIssueById: async (issueId) => {
    const response = await axiosInstance.get(`/api/StaffIssues/${issueId}`);
    return response.data;
  },

  /**
   * Create new issue report
   * @param {Object} issueData - { stationId, title, description, priority, category }
   */
  createIssue: async (issueData) => {
    const response = await axiosInstance.post('/api/StaffIssues', issueData);
    return response.data;
  },

  /**
   * Update issue details
   */
  updateIssue: async (issueId, updateData) => {
    const response = await axiosInstance.put(`/api/StaffIssues/${issueId}`, updateData);
    return response.data;
  },

  /**
   * Assign issue to staff member (admin only)
   */
  assignIssue: async (issueId, staffId) => {
    const response = await axiosInstance.patch(`/api/StaffIssues/${issueId}/assign`, { assignedToUserId: staffId });
    return response.data;
  },

  /**
   * Update issue status
   * @param {string} status - 'reported' | 'in_progress' | 'resolved' | 'closed'
   */
  updateIssueStatus: async (issueId, status, resolution = null) => {
    const response = await axiosInstance.patch(`/api/StaffIssues/${issueId}/status`, { status, resolution });
    return response.data;
  },

  /**
   * Add comment to issue
   */
  addComment: async (issueId, comment) => {
    const response = await axiosInstance.post(`/api/StaffIssues/${issueId}/comments`, {
      comment
    });
    return response.data;
  },

  /**
   * Upload attachment to issue
   */
  uploadAttachment: async (issueId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axiosInstance.post(
      `/api/StaffIssues/${issueId}/attachments`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    return response.data;
  },

  /**
   * Delete issue (admin only)
   */
  deleteIssue: async (issueId) => {
    const response = await axiosInstance.delete(`/api/StaffIssues/${issueId}`);
    return response.data;
  },

  /**
   * Get issue statistics
   */
  getIssueStatistics: async (stationId = null) => {
    const params = stationId ? `?stationId=${stationId}` : '';
    const response = await axiosInstance.get(`/api/StaffIssues/statistics${params}`);
    return response.data;
  },

  /**
   * Get maintenance schedule
   */
  getMaintenanceSchedule: async (stationId = null, daysAhead = 30) => {
    const params = new URLSearchParams();
    if (stationId) params.append('stationId', stationId);
    params.append('daysAhead', daysAhead);
    
    const response = await axiosInstance.get(`/api/StaffIssues/maintenance-schedule?${params}`);
    return response.data;
  },

  // ==================== STATION MONITORING ====================

  /**
   * Get all stations status for monitoring
   */
  getStationsStatus: async () => {
    const response = await axiosInstance.get('/api/stations');
    return response.data?.data ?? [];
  },

  /**
   * Get single station detailed status
   */
  getStationDetails: async (stationId) => {
    const response = await axiosInstance.get(`/api/stations/${stationId}`);
    return response.data;
  },

  /**
   * Get charging slots for a station
   */
  getStationSlots: async (stationId) => {
    const response = await axiosInstance.get(`/api/stations/${stationId}/slots`);
    return response.data?.data ?? [];
  },

  /**
   * Broadcast station status update (triggers SignalR)
   */
  broadcastStationStatus: async (stationId) => {
    const response = await axiosInstance.post(`/api/monitoring/station/${stationId}/broadcast`);
    return response.data;
  },

  /**
   * Broadcast slot status update (triggers SignalR)
   */
  broadcastSlotStatus: async (slotId) => {
    const response = await axiosInstance.post(`/api/monitoring/slot/${slotId}/broadcast`);
    return response.data;
  },

  /**
   * Broadcast alert (triggers SignalR)
   */
  broadcastAlert: async (alertData) => {
    const response = await axiosInstance.post('/api/monitoring/alert', alertData);
    return response.data;
  },

  // ==================== CHARGING SESSIONS ====================

  /**
   * Get all active charging sessions
   */
  getActiveSessions: async () => {
    const response = await axiosInstance.get('/api/bookings/active');
    return response.data;
  },

  /**
   * Get booking/session details
   */
  getBookingDetails: async (bookingId) => {
    const response = await axiosInstance.get(`/api/bookings/${bookingId}`);
    return response.data;
  },

  /**
   * Start charging session (Staff/Admin)
   */
  startCharging: async (bookingId, initialSoc = 20) => {
    const response = await axiosInstance.put(`/api/bookings/${bookingId}/start`, {
      initialSoc
    });
    return response.data;
  },

  /**
   * Complete charging session (Staff/Admin)
   */
  completeCharging: async (bookingId, sessionData) => {
    const response = await axiosInstance.put(`/api/bookings/${bookingId}/complete`, {
      finalSoc: sessionData.finalSoc,
      totalEnergyKwh: sessionData.totalEnergyKwh,
      unitPrice: sessionData.unitPrice || 3500
    });
    return response.data;
  },

  /**
   * Get bookings history with filters
   */
  getBookingsHistory: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.stationId) queryParams.append('stationId', params.stationId);
    if (params.status) queryParams.append('status', params.status);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    
    const response = await axiosInstance.get(`/api/bookings?${queryParams}`);
    return response.data;
  },

  // ==================== PAYMENT PROCESSING ====================

  /**
   * Process payment at counter (Staff)
   */
  processPayment: async (bookingId, paymentData) => {
    // Update booking with payment info
    const response = await axiosInstance.put(`/api/bookings/${bookingId}`, {
      paymentStatus: 'paid',
      paymentMethod: paymentData.method,
      paidAt: new Date().toISOString()
    });
    return response.data;
  },

  /**
   * Get invoice for booking
   */
  getInvoice: async (bookingId) => {
    const response = await axiosInstance.get(`/api/invoices/booking/${bookingId}`);
    return response.data;
  },
};

export default staffAPI;
