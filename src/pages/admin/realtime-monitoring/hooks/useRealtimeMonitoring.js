import { useState, useEffect, useCallback } from 'react';
import signalRService from '../../../../services/signalRService';

export const useRealtimeMonitoring = () => {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    // Connect to SignalR
    const initSignalR = async () => {
      try {
        await signalRService.connect();
        setConnected(true);
        setLoading(false);
      } catch (error) {
        console.error('Failed to connect to SignalR:', error);
        setConnected(false);
        setLoading(false);
      }
    };

    initSignalR();

    // Subscribe to events
    const unsubscribeStationStatus = signalRService.onStationStatus((data) => {
      setStations((prev) => {
        const index = prev.findIndex((s) => s.stationID === data.stationID);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = data;
          return updated;
        }
        return [...prev, data];
      });
      setLastUpdate(new Date());
    });

    const unsubscribeSlotStatus = signalRService.onSlotStatus((data) => {
      // Update slot in station
      setStations((prev) => {
        return prev.map((station) => {
          if (station.stationID === data.stationID) {
            // Update slot info if needed
            return { ...station, lastSlotUpdate: data };
          }
          return station;
        });
      });
      setLastUpdate(new Date());
    });

    const unsubscribeAlert = signalRService.onAlert((data) => {
      setAlerts((prev) => [data, ...prev].slice(0, 5)); // Keep last 5 alerts
    });

    // Cleanup on unmount
    return () => {
      unsubscribeStationStatus();
      unsubscribeSlotStatus();
      unsubscribeAlert();
      signalRService.disconnect();
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      // Reconnect if needed
      if (!signalRService.isConnected()) {
        await signalRService.connect();
        setConnected(true);
      }
    } catch (error) {
      console.error('Refresh failed:', error);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const removeAlert = useCallback((index) => {
    setAlerts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return {
    connected,
    loading,
    stations,
    alerts,
    lastUpdate,
    handleRefresh,
    removeAlert
  };
};
