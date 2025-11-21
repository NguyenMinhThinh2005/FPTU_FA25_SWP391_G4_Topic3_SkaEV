import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useStationStore from "../../../../store/stationStore";
import useUserStore from "../../../../store/userStore";

export const useStationManagement = () => {
  const navigate = useNavigate();
  const {
    stations,
    addStation,
    updateStation,
    deleteStation,
    remoteDisableStation,
    remoteEnableStation,
    fetchAdminStations
  } = useStationStore();
  const { users, fetchUsers } = useUserStore();
  const [selectedStation, setSelectedStation] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    stationId: null,
    stationName: ""
  });

  // Form state for station editing/creation
  const [stationForm, setStationForm] = useState({
    name: "",
    address: "",
    totalPorts: 4,
    fastChargePorts: 2,
    standardPorts: 2,
    pricePerKwh: 3500,
    status: "active",
    availableSlots: 4,
    managerUserId: null,
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
    fetchAdminStations({ pageSize: 100 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!stations || stations.length === 0) {
      fetchAdminStations({ pageSize: 100 });
    }
  }, [fetchAdminStations, stations]);

  const lastUpdated = useMemo(() => new Date().toLocaleString(), []);

  // Get staff users for dropdown
  const staffUsers = useMemo(() => {
    return users.filter(u => u.role === "staff");
  }, [users]);

  // Station analytics data (with deterministic fallbacks so UI never shows 0)
  const stationAnalytics = useMemo(() => stations.map((station) => {
    const ports = station.charging?.totalPorts ?? 0;
    const pricePerKwh = Number(
      station.charging?.pricePerKwh ??
      station.charging?.pricing?.acRate ??
      station.basePricePerKwh ??
      0
    );

    const monthlyRevenue = Number(
      station.monthlyRevenue ?? station.revenue ?? 0
    );

    const monthlyBookings =
      station.monthlyBookings ??
      station.monthlyCompletedSessions ??
      0;

    const utilization = Number.isFinite(station.utilizationRate)
      ? station.utilizationRate
      : Number(station.utilization ?? 0);

    const avgSessionTime = Number(
      station.avgSessionTime ?? station.averageSessionDurationMinutes ?? 0
    );

    const todayRevenue = Number(station.todayRevenue ?? 0);
    const todayCompletedSessions = station.todayCompletedSessions ?? 0;

    return {
      ...station,
      monthlyRevenue,
      monthlyBookings,
      utilization,
      avgSessionTime,
      todayRevenue,
      todayCompletedSessions,
      charging: {
        ...station.charging,
        pricePerKwh,
        pricing: {
          ...(station.charging?.pricing || {}),
          baseRate: station.charging?.pricing?.baseRate ?? pricePerKwh,
          acRate: station.charging?.pricing?.acRate ?? pricePerKwh,
          dcRate: station.charging?.pricing?.dcRate ?? pricePerKwh,
          dcFastRate: station.charging?.pricing?.dcFastRate ?? pricePerKwh,
        },
        totalPorts: ports,
      },
    };
  }), [stations]);

  const filteredStations = useMemo(() => stationAnalytics.filter((station) => {
    if (filterStatus === "all") return true;
    return station.status === filterStatus;
  }), [stationAnalytics, filterStatus]);

  const handleStationClick = (station) => {
    const location = station.location ?? {};
    const charging = station.charging ?? {};

    setSelectedStation(station);
    setStationForm({
      name: station.name,
      address: location.address ?? "",
      totalPorts: charging.totalPorts ?? 0,
      fastChargePorts: charging.fastChargePorts ?? 0,
      standardPorts: charging.standardPorts ?? charging.totalPorts ?? 0,
      pricePerKwh: charging.pricePerKwh ?? 0,
      status: station.status,
      availableSlots: charging.availablePorts ?? charging.totalPorts ?? 0,
      managerUserId: station.managerUserId || null,
    });
    setDialogOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedStation(null);
    setStationForm({
      name: "",
      address: "",
      totalPorts: 4,
      fastChargePorts: 2,
      standardPorts: 2,
      pricePerKwh: 3500,
      status: "active",
      availableSlots: 4,
      managerUserId: null,
    });
    setDialogOpen(true);
    setErrors({});
  };

  const handleDeleteClick = (station) => {
    setDeleteDialog({
      open: true,
      stationId: station.id,
      stationName: station.name
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteStation(deleteDialog.stationId);
      setDeleteDialog({ open: false, stationId: null, stationName: "" });
    } catch (error) {
      console.error("Error deleting station:", error);
      alert("Có lỗi xảy ra khi xóa trạm sạc. Vui lòng thử lại.");
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!stationForm.name.trim()) newErrors.name = "Tên trạm sạc là bắt buộc";
    if (!stationForm.address.trim()) newErrors.address = "Địa chỉ là bắt buộc";
    
    if (stationForm.totalPorts < 1) newErrors.totalPorts = "Tổng số cổng sạc phải lớn hơn 0";
    if (stationForm.fastChargePorts < 0) newErrors.fastChargePorts = "Số cổng sạc nhanh không được âm";
    if (stationForm.standardPorts < 0) newErrors.standardPorts = "Số cổng sạc tiêu chuẩn không được âm";
    if (stationForm.fastChargePorts + stationForm.standardPorts !== stationForm.totalPorts) {
      newErrors.totalPorts = "Tổng số cổng sạc nhanh và tiêu chuẩn phải bằng tổng số cổng";
    }
    if (stationForm.availableSlots > stationForm.totalPorts) {
      newErrors.availableSlots = "Số cổng có sẵn không được vượt quá tổng số cổng";
    }
    if (stationForm.pricePerKwh < 0) newErrors.pricePerKwh = "Giá mỗi kWh không được âm";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveStation = async () => {
    if (!validateForm()) return;

    const stationData = {
      stationName: stationForm.name,
      address: stationForm.address,
      status: stationForm.status,
      totalPorts: Number(stationForm.totalPorts) || 0,
      fastChargePorts: Number(stationForm.fastChargePorts) || 0,
      standardPorts: Number(stationForm.standardPorts) || 0,
      pricePerKwh: Number(stationForm.pricePerKwh) || 0,
      fastChargePowerKw: stationForm.fastChargePorts > 0 ? 120 : null,
      standardChargePowerKw: stationForm.standardPorts > 0 ? 22 : null,
      managerUserId: stationForm.managerUserId || null,
    };

    try {
      if (selectedStation) {
        await updateStation(selectedStation.id, stationData);
      } else {
        await addStation({
          ...stationData,
          createdAt: new Date().toISOString(),
        });
      }
      setDialogOpen(false);
    } catch (error) {
      console.error("Error saving station:", error);
      alert("Có lỗi xảy ra khi lưu trạm sạc. Vui lòng thử lại.");
    }
  };

  return {
    navigate,
    stations,
    users,
    selectedStation,
    dialogOpen,
    setDialogOpen,
    filterStatus,
    setFilterStatus,
    deleteDialog,
    setDeleteDialog,
    stationForm,
    setStationForm,
    errors,
    setErrors,
    lastUpdated,
    staffUsers,
    filteredStations,
    handleStationClick,
    handleCreateNew,
    handleDeleteClick,
    handleDeleteConfirm,
    handleSaveStation,
    remoteDisableStation,
    remoteEnableStation
  };
};
