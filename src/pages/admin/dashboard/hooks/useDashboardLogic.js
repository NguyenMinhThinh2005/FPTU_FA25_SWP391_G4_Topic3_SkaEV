import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../../../store/authStore";
import useStationStore from "../../../../store/stationStore";
import useAdminDashboard from '../../../../hooks/useAdminDashboard';

export const useDashboardLogic = () => {
  const navigate = useNavigate();
  useAuthStore();
  const { stations, fetchAdminStations, fetchStations } = useStationStore();
  const [openStationDialog, setOpenStationDialog] = useState(false);

  // New states for driver-like flow
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStationForDetail, setSelectedStationForDetail] = useState(null);
  const [actionDialog, setActionDialog] = useState({
    open: false,
    type: "",
    station: null,
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Real-time stats from API (use hook-provided performance when available)
  const [stationPerformance, setStationPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const { recentActivities, stationPerformance: dashboardStationPerformance, isLoading: dashboardLoading, error: dashboardError } = useAdminDashboard();

  // Fetch stations on component mount
  useEffect(() => {
    console.log("🔄 Admin Dashboard mounted - fetching admin stations...");
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // For admin area, use admin-specific stations endpoint to keep data consistent
        if (typeof fetchAdminStations === 'function') {
          await fetchAdminStations();
        } else {
          await fetchStations();
        }
        setLoading(false);
        console.log("✅ Stations loaded successfully");
      } catch (error) {
        console.error("❌ Error loading stations:", error);
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, [fetchAdminStations, fetchStations]);

  // Tính toán hiệu suất trạm từ dữ liệu trạm
  useEffect(() => {
    // Prefer the station performance computed in the dashboard hook (ensures consistent metrics)
    if (Array.isArray(dashboardStationPerformance) && dashboardStationPerformance.length > 0) {
      setStationPerformance(dashboardStationPerformance);
      return;
    }

    // Fallback: build minimal performance info from stations if hook data is missing
    if (stations.length > 0) {
      const performance = stations.map((station) => {
        const totalPosts = station.totalPosts || station.charging?.totalPosts || 0;
        const totalSlots = totalPosts * 2;
        const activeSessions = station.activeSessions || station.charging?.activeSessions || 0;
        const availableSlots = Math.max(0, totalSlots - activeSessions);
        const utilization = station.utilizationRate !== undefined
          ? station.utilizationRate
          : (totalSlots > 0 ? (activeSessions / totalSlots) * 100 : 0);
        const revenue = station.todayRevenue || station.revenue || 0;

        return {
          ...station,
          bookingsCount: activeSessions,
          revenue,
          utilization,
          totalSlots,
          availableSlots,
          occupiedSlots: activeSessions,
          chargingPostsCount: totalPosts,
        };
      });

      setStationPerformance(performance);
    }
  }, [stations, dashboardStationPerformance]);

  // Lọc trạm dựa trên tìm kiếm và trạng thái
  const filteredStations = stationPerformance.filter((station) => {
    const matchesSearch =
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.location.address
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    
    // So sánh trạng thái không phân biệt chữ hoa chữ thường
    const stationStatus = (station.status || '').toLowerCase();
    const filterStatus = (statusFilter || '').toLowerCase();
    const matchesStatus =
      filterStatus === "all" || stationStatus === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Xử lý hành động trạm
  const handleStationAction = (action, station) => {
    console.log(`${action} station:`, station.name);
    if (action === "view") {
      setSelectedStationForDetail(station);
    } else if (
      action === "edit" ||
      action === "maintenance" ||
      action === "delete"
    ) {
      setActionDialog({ open: true, type: action, station });
    }
  };

  const handleActionComplete = (actionType, stationName) => {
    setSuccessMessage(
      `${actionType} đã hoàn thành thành công cho ${stationName}!`
    );
    setShowSuccess(true);
    setActionDialog({ open: false, type: "", station: null });
  };

  return {
    navigate,
    openStationDialog,
    setOpenStationDialog,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedStationForDetail,
    setSelectedStationForDetail,
    actionDialog,
    setActionDialog,
    successMessage,
    setSuccessMessage,
    showSuccess,
    setShowSuccess,
    stationPerformance,
    loading,
    dashboardLoading,
    dashboardError,
    filteredStations,
    handleStationAction,
    handleActionComplete,
    recentActivities
  };
};
