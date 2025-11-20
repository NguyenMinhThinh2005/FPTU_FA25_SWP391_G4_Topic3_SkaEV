import { useState, useEffect, useMemo, useCallback } from 'react';
import useStationStore from '../store/stationStore';
import StationDataService from '../services/stationDataService';
import adminAPI from '../services/api/adminAPI';
<<<<<<< HEAD
import staffAPI from '../services/api/staffAPI';
=======
import { bookingsAPI } from '../services/api';
>>>>>>> 63845a83230bd2c1c6a721f5e2c2559237204949

/**
 * Custom hook for Admin Dashboard data management
 * Centralizes state logic, error handling, and data loading
 */
export const useAdminDashboard = () => {
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Error states
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  
  // UI states
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [anchorEl, setAnchorEl] = useState(null);
  const [openStationDialog, setOpenStationDialog] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  
  // Data states for API data
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  // Data from stores
  const { stations, loading: stationsLoading, error: stationsError } = useStationStore();
  // Live data from backend
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  // Initialize data loading
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        setError(null);
<<<<<<< HEAD
        
        // Fetch users and bookings from API
        const [usersResponse, bookingsResponse] = await Promise.all([
          adminAPI.getAllUsers().catch(() => ({ data: [] })),
          staffAPI.getBookingsHistory().catch(() => ({ data: [] }))
        ]);
        
        setUsers(usersResponse.data || []);
        setBookings(bookingsResponse.data || []);
        
=======
        // Fetch users and bookings from backend (live DB)
        const [usersResp, bookingsResp] = await Promise.allSettled([
          adminAPI.getUsers({ pageNumber: 1, pageSize: 1000 }),
          bookingsAPI.get({ pageNumber: 1, pageSize: 1000 }),
        ]);

        if (usersResp.status === 'fulfilled') {
          setUsers(usersResp.value.data?.data || usersResp.value.data || []);
        } else {
          console.warn('Failed to load users for admin dashboard:', usersResp.reason?.message || usersResp.reason);
        }

        if (bookingsResp.status === 'fulfilled') {
          setBookings(bookingsResp.value.data?.data || bookingsResp.value.data || []);
        } else {
          console.warn('Failed to load bookings for admin dashboard:', bookingsResp.reason?.message || bookingsResp.reason);
        }

>>>>>>> 63845a83230bd2c1c6a721f5e2c2559237204949
        // Validate station data
        const validationResults = stations.map(station => 
          StationDataService.validateStationData(station)
        );
        
        const errors = validationResults
          .filter(result => !result.isValid)
          .flatMap(result => result.errors);
          
        const warnings = validationResults
          .flatMap(result => result.warnings);
        
        if (errors.length > 0) {
          setValidationErrors(errors);
          console.warn('Station data validation errors:', errors);
        }
        
        if (warnings.length > 0) {
          console.warn('Station data validation warnings:', warnings);
        }
        
      } catch (err) {
        setError({
          message: 'Failed to initialize dashboard data',
          details: err.message,
          timestamp: new Date().toISOString(),
        });
        console.error('Dashboard initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (!stationsLoading) {
      initializeData();
    }
  }, [stations, stationsLoading]);

  // Memoized calculations
  const systemOverview = useMemo(() => {
    try {
      return StationDataService.calculateSystemOverview(
<<<<<<< HEAD
        stations, 
        users, 
=======
        stations,
        users,
>>>>>>> 63845a83230bd2c1c6a721f5e2c2559237204949
        bookings
      );
    } catch (err) {
      console.error('Error calculating system overview:', err);
      return {
        totalStations: 0,
        activeStations: 0,
        totalUsers: 0,
        totalBookings: 0,
        todayBookings: 0,
        totalRevenue: 0,
        activeChargingSessions: 0,
        error: 'Calculation failed',
      };
    }
  }, [stations, users, bookings]);

  const stationPerformance = useMemo(() => {
    try {
      return StationDataService.calculateStationPerformance(stations, bookings);
    } catch (err) {
      console.error('Error calculating station performance:', err);
      return [];
    }
  }, [stations, bookings]);

  const recentActivities = useMemo(() => {
    try {
      return StationDataService.generateRecentActivities(bookings, stations);
    } catch (err) {
      console.error('Error generating recent activities:', err);
      return [];
    }
  }, [stations, bookings]);

  // Event handlers with useCallback for performance
  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      // Refetch all data
      const [usersResponse, bookingsResponse] = await Promise.all([
        adminAPI.getAllUsers().catch(() => ({ data: [] })),
        staffAPI.getBookingsHistory().catch(() => ({ data: [] }))
      ]);
      
      setUsers(usersResponse.data || []);
      setBookings(bookingsResponse.data || []);
      
      console.log('Dashboard data refreshed');
    } catch (err) {
      setError({
        message: 'Failed to refresh data',
        details: err.message,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleStationSelect = useCallback((station, event) => {
    setSelectedStation(station);
    setAnchorEl(event?.currentTarget || null);
  }, []);

  const handleStationAction = useCallback((action, station) => {
    try {
      console.log(`Executing action: ${action} for station:`, station.name);
      
      switch (action) {
        case 'view':
          setSelectedStation(station);
          setOpenStationDialog(true);
          break;
        case 'edit':
          // Navigate to edit page or open edit dialog
          console.log('Edit station:', station.id);
          break;
        case 'maintenance':
          // Schedule maintenance
          console.log('Schedule maintenance for station:', station.id);
          break;
        case 'delete':
          // Show confirmation dialog
          console.log('Delete station:', station.id);
          break;
        default:
          console.warn('Unknown action:', action);
      }
      
      setAnchorEl(null);
    } catch (err) {
      setError({
        message: `Failed to execute action: ${action}`,
        details: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenStationDialog(false);
    setSelectedStation(null);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handlePeriodChange = useCallback((period) => {
    setSelectedPeriod(period);
    // In real app, this would trigger data refetch for the new period
    console.log('Period changed to:', period);
  }, []);

  // Computed states
  const hasError = error || stationsError || validationErrors.length > 0;
  const isDataLoading = isLoading || stationsLoading;

  return {
    // Data
    systemOverview,
    stationPerformance,
    recentActivities,
    
    // Loading states
    isLoading: isDataLoading,
    isRefreshing,
    
    // Error states
    error: error || stationsError,
    validationErrors,
    hasError,
    
    // UI states
    selectedPeriod,
    anchorEl,
    openStationDialog,
    selectedStation,
    
    // Actions
    handleRefresh,
    handleStationSelect,
    handleStationAction,
    handleCloseDialog,
    handleCloseMenu,
    handlePeriodChange,
    
    // Setters for direct UI control
    setSelectedPeriod,
    setAnchorEl,
    setOpenStationDialog,
    setSelectedStation,
  };
};

/**
 * Custom hook for station status management
 */
export const useStationStatus = () => {
  const getStatusConfig = useCallback((status) => {
    const configs = {
      active: { label: "Active", color: "success", icon: "✓" },
      inactive: { label: "Inactive", color: "error", icon: "✗" },
      maintenance: { label: "Maintenance", color: "warning", icon: "⚠" },
      construction: { label: "Construction", color: "info", icon: "🚧" },
    };

    return configs[status] || configs.inactive;
  }, []);

  const getSeverityConfig = useCallback((severity) => {
    const configs = {
      success: { color: "success.main", icon: "✓", priority: 1 },
      warning: { color: "warning.main", icon: "⚠", priority: 2 },
      error: { color: "error.main", icon: "✗", priority: 3 },
      info: { color: "info.main", icon: "ℹ", priority: 1 },
    };

    return configs[severity] || configs.info;
  }, []);

  return {
    getStatusConfig,
    getSeverityConfig,
  };
};

/**
 * Custom hook for dashboard metrics formatting
 */
export const useDashboardFormatters = () => {
  const formatCurrency = useCallback((amount) => {
    try {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount || 0);
    } catch (err) {
      console.error('Currency formatting error:', err);
      return `${amount || 0} VNĐ`;
    }
  }, []);

  const formatDate = useCallback((date) => {
    try {
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(date));
    } catch (err) {
      console.error('Date formatting error:', err);
      return 'Invalid date';
    }
  }, []);

  const formatPercentage = useCallback((value, decimals = 1) => {
    try {
      return `${Number(value || 0).toFixed(decimals)}%`;
    } catch (err) {
      console.error('Percentage formatting error:', err);
      return '0%';
    }
  }, []);

  const formatNumber = useCallback((value, options = {}) => {
    try {
      return new Intl.NumberFormat('vi-VN', options).format(value || 0);
    } catch (err) {
      console.error('Number formatting error:', err);
      return String(value || 0);
    }
  }, []);

  return {
    formatCurrency,
    formatDate,
    formatPercentage,
    formatNumber,
  };
};

export default useAdminDashboard;