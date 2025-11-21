import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../../../services/axiosConfig";

export const useUserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [chargingHistory, setChargingHistory] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    type: "system_alert",
    title: "",
    message: "",
  });

  const fetchVehicles = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/admin/AdminUsers/${userId}/vehicles`);
      const payload = response?.data?.data ?? response?.data;

      const normalized = Array.isArray(payload)
        ? payload.map((vehicle) => ({
            vehicleId: vehicle.vehicleId,
            brand: vehicle.brand || vehicle.vehicleMake || vehicle.vehicleType || "N/A",
            model: vehicle.model || vehicle.vehicleModel || "",
            vehicleType: vehicle.vehicleType || vehicle.vehicleName || "",
            licensePlate: vehicle.licensePlate || "",
            batteryCapacity: vehicle.batteryCapacity ?? null,
            connectorType: vehicle.connectorType || vehicle.chargingPortType || "",
            status: vehicle.status || (vehicle.isDefault ? "active" : "inactive"),
            isDefault: vehicle.isDefault ?? vehicle.isPrimary ?? false,
            createdAt: vehicle.createdAt,
          }))
        : [];

      setVehicles(normalized);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      setVehicles([]);
    }
  }, [userId]);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/admin/AdminUsers/${userId}/statistics`);
      const payload = response?.data?.data ?? response?.data;

      if (!payload) {
        setStatistics(null);
        return;
      }

      const totalSessions = payload.totalChargingSessions ?? payload.totalSessions ?? 0;
      const completedSessions = payload.completedSessions ?? 0;
      const totalEnergy = Number(payload.totalEnergyConsumedKwh ?? payload.totalEnergyKwh ?? 0);
      const totalSpent = Number(payload.totalSpent ?? payload.totalSpentVnd ?? 0);

      setStatistics({
        totalSessions,
        completedSessions,
        cancelledSessions: payload.cancelledSessions ?? 0,
        totalEnergyKwh: totalEnergy,
        totalSpentVnd: totalSpent,
        averageDurationMinutes: Number(payload.averageSessionDurationMinutes ?? payload.averageDurationMinutes ?? 0),
        averageEnergyPerSessionKwh:
          completedSessions > 0 ? totalEnergy / completedSessions : Number(payload.averageEnergyPerSessionKwh ?? 0),
        averageSpendingPerSessionVnd:
          completedSessions > 0 ? totalSpent / completedSessions : Number(payload.averageSpendingPerSessionVnd ?? 0),
        preferredPaymentMethod: payload.preferredPaymentMethod || "N/A",
        mostUsedStationName: payload.mostUsedStation ?? payload.mostUsedStationName ?? "",
        mostUsedStationAddress: payload.mostUsedStationAddress ?? "",
        totalVehicles: payload.totalVehicles ?? payload.vehicleCount ?? 0,
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
      setStatistics(null);
    }
  }, [userId]);

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/admin/AdminUsers/${userId}`);
      const userData = response?.data?.success ? response.data.data : response?.data;

      if (userData && userData.userId) {
        setUser(userData);

        if (userData.role === "customer") {
          await Promise.all([fetchVehicles(), fetchStatistics()]);
          setChargingHistory([]);
          setPaymentHistory([]);
        } else {
          setVehicles([]);
          setChargingHistory([]);
          setPaymentHistory([]);
          setStatistics(null);
        }
      } else {
        setUser(null);
        setVehicles([]);
        setChargingHistory([]);
        setPaymentHistory([]);
        setStatistics(null);
      }
    } catch (error) {
      console.error("Error fetching user detail:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [userId, fetchVehicles, fetchStatistics]);

  const fetchChargingHistory = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/admin/AdminUsers/${userId}/charging-history?pageNumber=1&pageSize=20`);

      const payload = response?.data?.data ?? response?.data;
      const sessions = Array.isArray(payload?.sessions)
        ? payload.sessions
        : Array.isArray(payload)
        ? payload
        : [];

      const normalized = sessions.map((session) => {
        const bookingId = session.bookingId ?? session.bookingID; // support legacy casing
        const totalAmount = Number(session.totalAmount ?? session.totalAmountVnd ?? 0);
        const energy = Number(session.energyConsumedKwh ?? session.energyConsumed ?? 0);

        return {
          bookingId,
          bookingCode: session.bookingCode || (bookingId ? `BK${String(bookingId).padStart(6, "0")}` : "-"),
          stationName: session.stationName || "-",
          stationAddress: session.stationAddress || "",
          postNumber: session.postNumber || "",
          slotNumber: session.slotNumber || "",
          status: session.status || "unknown",
          energyConsumedKwh: energy,
          totalAmountVnd: totalAmount,
          startTime: session.startTime,
          endTime: session.endTime,
          durationMinutes: session.durationMinutes,
          paymentStatus: session.paymentStatus || "pending",
        };
      });

      setChargingHistory(normalized);
    } catch (error) {
      console.error("Error fetching charging history:", error);
      setChargingHistory([]);
    }
  }, [userId]);

  const fetchPaymentHistory = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/admin/AdminUsers/${userId}/payment-history?pageNumber=1&pageSize=20`);

      const payload = response?.data?.data ?? response?.data;
      const payments = Array.isArray(payload?.payments)
        ? payload.payments
        : Array.isArray(payload)
        ? payload
        : [];

      const normalized = payments.map((payment) => ({
        paymentId: payment.paymentId ?? payment.invoiceId,
        invoiceId: payment.invoiceId,
        transactionId: payment.transactionId || "",
        paymentMethod: payment.paymentMethod || "unknown",
        amount: Number(payment.amount ?? 0),
        status: payment.status || payment.paymentStatus || "pending",
        paidDate: payment.paymentDate || payment.paidDate,
        stationName: payment.stationName,
      }));

      setPaymentHistory(normalized);
    } catch (error) {
      console.error("Error fetching payment history:", error);
      setPaymentHistory([]);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    setCurrentTab(0);
  }, [userId, user?.role]);

  useEffect(() => {
    if (user?.role !== "customer") return;

    if (currentTab === 0 && chargingHistory.length === 0) fetchChargingHistory();
    if (currentTab === 1 && paymentHistory.length === 0) fetchPaymentHistory();
    if (currentTab === 2 && !statistics) fetchStatistics();
  }, [
    currentTab,
    user?.role,
    chargingHistory.length,
    paymentHistory.length,
    statistics,
    fetchChargingHistory,
    fetchPaymentHistory,
    fetchStatistics,
  ]);

  const handleSendNotification = async () => {
    try {
      const response = await axiosInstance.post(`/admin/AdminUsers/notifications`, {
        userIds: [parseInt(userId)],
        type: notificationForm.type,
        title: notificationForm.title,
        message: notificationForm.message,
      });

      if (response.data.success) {
        setNotificationDialogOpen(false);
        setNotificationForm({ type: "system_alert", title: "", message: "" });
        alert("Gửi thông báo thành công!");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      alert("Lỗi gửi thông báo!");
    }
  };

  return {
    userId,
    navigate,
    loading,
    user,
    currentTab,
    setCurrentTab,
    chargingHistory,
    paymentHistory,
    statistics,
    vehicles,
    notificationDialogOpen,
    setNotificationDialogOpen,
    notificationForm,
    setNotificationForm,
    handleSendNotification
  };
};
