import { useState, useEffect, useMemo, useCallback } from 'react';
import useStationStore from '../store/stationStore';
import useBookingStore from '../store/bookingStore';
import { mockData } from '../data/mockData';
import StationDataService from '../services/stationDataService';

/**
 * Custom hook for Staff Dashboard data management
 * Provides staff-specific functionality and data filtering
 */
export const useStaffDashboard = () => {
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Error states
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  
  // Staff-specific states
  const [currentShift, setCurrentShift] = useState('day');
  const [selectedStation, setSelectedStation] = useState(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // Data from stores
  const { stations, loading: stationsLoading, error: stationsError } = useStationStore();
  const { bookings, loading: bookingsLoading, error: bookingsError } = useBookingStore();
  
  // Simulate current staff member (in real app, get from auth context)
  const currentStaff = useMemo(() => ({
    id: 'staff001',
    name: 'Nguyễn Văn A',
    role: 'station_operator',
    assignedStations: [1, 2, 3], // Station IDs this staff member manages
    shift: currentShift,
  }), [currentShift]);

  // Initialize data and set up real-time updates
  useEffect(() => {
    const initializeStaffData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Simulate initialization delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Validate assigned station data
        const assignedStations = stations.filter(station => 
          currentStaff.assignedStations.includes(station.id)
        );
        
        const validationResults = assignedStations.map(station => 
          StationDataService.validateStationData(station)
        );
        
        const errors = validationResults
          .filter(result => !result.isValid)
          .flatMap(result => result.errors);
        
        if (errors.length > 0) {
          setValidationErrors(errors);
          console.warn('Staff station data validation errors:', errors);
        }
        
        // Set default selected station to first assigned station
        if (assignedStations.length > 0 && !selectedStation) {
          setSelectedStation(assignedStations[0]);
        }
        
        // Generate initial notifications
        generateStaffNotifications(assignedStations);
        
      } catch (err) {
        setError({
          message: 'Failed to initialize staff dashboard',
          details: err.message,
          timestamp: new Date().toISOString(),
        });
        console.error('Staff dashboard initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (!stationsLoading && !bookingsLoading) {
      initializeStaffData();
    }
  }, [stations, bookings, stationsLoading, bookingsLoading, currentStaff.assignedStations, selectedStation]);

  // Generate staff-specific notifications
  const generateStaffNotifications = useCallback((assignedStations) => {
    const newNotifications = [];
    
    assignedStations.forEach(station => {
      // Check for low battery charging posts
      station.chargingPosts?.forEach(post => {
        if (post.batteryLevel && post.batteryLevel < 20) {
          newNotifications.push({
            id: `low-battery-${post.id}`,
            type: 'warning',
            message: `Charging post ${post.name} has low battery (${post.batteryLevel}%)`,
            stationId: station.id,
            timestamp: new Date().toISOString(),
            priority: 'high',
          });
        }
      });
      
      // Check for maintenance alerts
      if (station.status === 'maintenance') {
        newNotifications.push({
          id: `maintenance-${station.id}`,
          type: 'info',
          message: `Station ${station.name} is under maintenance`,
          stationId: station.id,
          timestamp: new Date().toISOString(),
          priority: 'medium',
        });
      }
      
      // Check for high utilization
      const utilization = StationDataService.calculateStationUtilization(station);
      if (utilization > 80) {
        newNotifications.push({
          id: `high-util-${station.id}`,
          type: 'info',
          message: `Station ${station.name} has high utilization (${utilization.toFixed(1)}%)`,
          stationId: station.id,
          timestamp: new Date().toISOString(),
          priority: 'low',
        });
      }
    });
    
    setNotifications(newNotifications);
  }, []);

  // Get stations assigned to current staff
  const assignedStations = useMemo(() => {
    try {
      return StationDataService.filterStationsByIds(stations, currentStaff.assignedStations);
    } catch (err) {
      console.error('Error filtering assigned stations:', err);
      return [];
    }
  }, [stations, currentStaff.assignedStations]);

  // Calculate staff-specific metrics
  const staffMetrics = useMemo(() => {
    try {
      const assignedBookings = bookings.filter(booking => 
        currentStaff.assignedStations.includes(booking.stationId)
      );
      
      return {
        assignedStations: assignedStations.length,
        activeStations: assignedStations.filter(s => s.status === 'active').length,
        todayBookings: assignedBookings.filter(booking => {
          const bookingDate = new Date(booking.startTime);
          const today = new Date();
          return bookingDate.toDateString() === today.toDateString();
        }).length,
        activeCharging: assignedStations.reduce((total, station) => {
          return total + (station.chargingPosts?.filter(post => 
            post.status === 'charging'
          ).length || 0);
        }, 0),
        pendingMaintenance: assignedStations.filter(s => s.status === 'maintenance').length,
        totalRevenue: assignedBookings.reduce((total, booking) => total + booking.totalCost, 0),
      };
    } catch (err) {
      console.error('Error calculating staff metrics:', err);
      return {
        assignedStations: 0,
        activeStations: 0,
        todayBookings: 0,
        activeCharging: 0,
        pendingMaintenance: 0,
        totalRevenue: 0,
      };
    }
  }, [assignedStations, bookings, currentStaff.assignedStations]);

  // Get current station details
  const currentStationDetails = useMemo(() => {
    if (!selectedStation) return null;
    
    try {
      return {
        ...selectedStation,
        performance: StationDataService.calculateSingleStationPerformance(selectedStation, bookings),
        utilization: StationDataService.calculateStationUtilization(selectedStation),
        recentBookings: bookings
          .filter(booking => booking.stationId === selectedStation.id)
          .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
          .slice(0, 10),
      };
    } catch (err) {
      console.error('Error calculating station details:', err);
      return selectedStation;
    }
  }, [selectedStation, bookings]);

  // Event handlers
  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Regenerate notifications after refresh
      generateStaffNotifications(assignedStations);
      
      console.log('Staff dashboard refreshed');
    } catch (err) {
      setError({
        message: 'Failed to refresh staff data',
        details: err.message,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [assignedStations, generateStaffNotifications]);

  const handleStationSelect = useCallback((station) => {
    setSelectedStation(station);
    console.log('Staff selected station:', station.name);
  }, []);

  const handleShiftChange = useCallback((shift) => {
    setCurrentShift(shift);
    console.log('Shift changed to:', shift);
  }, []);

  const handleMaintenanceToggle = useCallback(() => {
    setMaintenanceMode(prev => !prev);
    console.log('Maintenance mode toggled:', !maintenanceMode);
  }, [maintenanceMode]);

  const handleNotificationDismiss = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  }, []);

  const handleEmergencyStop = useCallback((stationId, postId) => {
    try {
      console.log(`Emergency stop triggered for station ${stationId}, post ${postId}`);
      
      // In real app, this would send emergency stop command to hardware
      const notification = {
        id: `emergency-${Date.now()}`,
        type: 'error',
        message: `Emergency stop activated for charging post ${postId}`,
        stationId,
        timestamp: new Date().toISOString(),
        priority: 'critical',
      };
      
      setNotifications(prev => [notification, ...prev]);
      
    } catch (err) {
      setError({
        message: 'Failed to execute emergency stop',
        details: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  // Computed states
  const hasError = error || stationsError || bookingsError || validationErrors.length > 0;
  const isDataLoading = isLoading || stationsLoading || bookingsLoading;
  const hasActiveAlerts = notifications.filter(n => n.priority === 'high' || n.priority === 'critical').length > 0;

  return {
    // Staff-specific data
    currentStaff,
    assignedStations,
    staffMetrics,
    currentStationDetails,
    notifications,
    
    // Loading states
    isLoading: isDataLoading,
    isRefreshing,
    
    // Error states
    error: error || stationsError || bookingsError,
    validationErrors,
    hasError,
    
    // UI states
    currentShift,
    selectedStation,
    maintenanceMode,
    hasActiveAlerts,
    
    // Actions
    handleRefresh,
    handleStationSelect,
    handleShiftChange,
    handleMaintenanceToggle,
    handleNotificationDismiss,
    handleEmergencyStop,
    
    // Setters for direct control
    setSelectedStation,
    setCurrentShift,
    setMaintenanceMode,
  };
};

/**
 * Custom hook for staff shift management
 */
export const useShiftManagement = () => {
  const [shiftHistory, setShiftHistory] = useState([]);
  const [currentShiftStart, setCurrentShiftStart] = useState(null);
  
  const startShift = useCallback((shiftType) => {
    const shiftRecord = {
      id: Date.now(),
      type: shiftType,
      startTime: new Date().toISOString(),
      endTime: null,
      activities: [],
    };
    
    setCurrentShiftStart(shiftRecord);
    console.log('Shift started:', shiftRecord);
  }, []);

  const endShift = useCallback(() => {
    if (currentShiftStart) {
      const completedShift = {
        ...currentShiftStart,
        endTime: new Date().toISOString(),
      };
      
      setShiftHistory(prev => [completedShift, ...prev]);
      setCurrentShiftStart(null);
      
      console.log('Shift ended:', completedShift);
      return completedShift;
    }
  }, [currentShiftStart]);

  const addShiftActivity = useCallback((activity) => {
    if (currentShiftStart) {
      setCurrentShiftStart(prev => ({
        ...prev,
        activities: [...prev.activities, {
          ...activity,
          timestamp: new Date().toISOString(),
        }],
      }));
    }
  }, [currentShiftStart]);

  return {
    shiftHistory,
    currentShiftStart,
    isOnShift: !!currentShiftStart,
    startShift,
    endShift,
    addShiftActivity,
  };
};

export default useStaffDashboard;