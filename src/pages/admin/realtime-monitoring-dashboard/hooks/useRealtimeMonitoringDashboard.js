import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../../../services/axiosConfig";

export const useRealtimeMonitoringDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState(null);
  const [stations, setStations] = useState([]);
  const [realtimeData, setRealtimeData] = useState(null);
  const [powerHistory, setPowerHistory] = useState([]);
  const [error, setError] = useState(null);

  // Fetch stations list
  const fetchStations = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/admin/stations`);

      if (response.data.success) {
        setStations(response.data.data || []);
        if (!selectedStation && response.data.data.length > 0) {
          setSelectedStation(response.data.data[0].stationId);
        }
      }
    } catch (err) {
      console.error("Error fetching stations:", err);
      setError("Không thể tải danh sách trạm");
    }
  }, [selectedStation]);

  // Fetch realtime data for selected station
  const fetchRealtimeData = useCallback(async () => {
    if (!selectedStation) return;

    try {
      const response = await axiosInstance.get(
        `/admin/stations/${selectedStation}/realtime`
      );

      if (response.data.success) {
        const data = response.data.data;
        setRealtimeData(data);

        // Add to power history for chart (keep last 20 points)
        const newPoint = {
          time: new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          power: data.currentPowerUsage || 0,
          sessions: data.activeSessions || 0,
        };

        setPowerHistory((prev) => {
          const updated = [...prev, newPoint];
          return updated.slice(-20); // Keep last 20 points
        });

        setError(null);
      }
    } catch (err) {
      console.error("Error fetching realtime data:", err);
      setError("Không thể tải dữ liệu real-time");
    } finally {
      setLoading(false);
    }
  }, [selectedStation]);

  // Initial load
  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  // Load realtime data when station changes
  useEffect(() => {
    if (selectedStation) {
      setPowerHistory([]); // Reset history when changing station
      fetchRealtimeData();
    }
  }, [selectedStation, fetchRealtimeData]);

  const handleRefresh = () => {
    setLoading(true);
    fetchRealtimeData();
  };

  return {
    loading,
    selectedStation,
    setSelectedStation,
    stations,
    realtimeData,
    powerHistory,
    error,
    setError,
    handleRefresh
  };
};