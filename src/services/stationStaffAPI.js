import axios from 'axios';

const API_URL = 'http://localhost:5000/api/StationStaff';

const stationStaffAPI = {
  // Get all staff users available for assignment
  getAvailableStaff: async () => {
    try {
      const response = await axios.get(`${API_URL}/available-staff`);
      return response.data;
    } catch (error) {
      console.error('Error fetching available staff:', error);
      throw error;
    }
  },

  // Get staff assigned to a specific station
  getStationStaff: async (stationId) => {
    try {
      const response = await axios.get(`${API_URL}/station/${stationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching station staff:', error);
      throw error;
    }
  },

  // Assign staff to station
  assignStaff: async (staffUserId, stationId) => {
    try {
      const response = await axios.post(`${API_URL}/assign`, {
        staffUserId,
        stationId
      });
      return response.data;
    } catch (error) {
      console.error('Error assigning staff:', error);
      throw error;
    }
  },

  // Unassign staff from station
  unassignStaff: async (assignmentId) => {
    try {
      const response = await axios.delete(`${API_URL}/unassign/${assignmentId}`);
      return response.data;
    } catch (error) {
      console.error('Error unassigning staff:', error);
      throw error;
    }
  }
};

export default stationStaffAPI;
