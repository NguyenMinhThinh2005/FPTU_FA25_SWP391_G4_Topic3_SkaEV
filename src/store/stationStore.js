import { create } from "zustand";
import { mockStations } from "../data/mockData";
import { calculateDistance } from "../utils/helpers";

const useStationStore = create((set, get) => ({
  // State
  stations: [],
  selectedStation: null,
  nearbyStations: [],
  loading: false,
  error: null,
  filters: {
    maxDistance: 20, // km
    connectorTypes: [],
    maxPrice: null,
  },

  // Initialize mock data on store creation
  initializeData: () => {
    console.log("Initializing stations:", mockStations.length);
    console.log("Sample station connectors:", mockStations[0]?.charging?.connectorTypes);
    set({ stations: mockStations });
  },

  // Actions
  setStations: (stations) => set({ stations }),

  setSelectedStation: (station) => set({ selectedStation: station }),

  setNearbyStations: (stations) => set({ nearbyStations: stations }),

  updateFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  clearFilters: () =>
    set({
      filters: {
        maxDistance: 20,
        connectorTypes: [],
        maxPrice: null,
      },
    }),

  // Mock API calls
  fetchStations: async () => {
    set({ loading: true, error: null });
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      set({ stations: mockStations, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchNearbyStations: async (userLocation, radius = 20) => {
    set({ loading: true, error: null });
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Calculate distance for each station
      const stationsWithDistance = mockStations.map((station) => {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          station.location.coordinates.lat,
          station.location.coordinates.lng
        );
        return { ...station, distance };
      });

      // Filter by radius and sort by distance
      const nearby = stationsWithDistance
        .filter((station) => station.distance <= radius)
        .sort((a, b) => a.distance - b.distance);

      set({
        nearbyStations: nearby,
        stations: mockStations, // Ensure stations are also set
        loading: false
      });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  getFilteredStations: () => {
    const { stations, filters } = get();

    console.log("Filtering stations:", {
      totalStations: stations.length,
      selectedConnectorTypes: filters.connectorTypes
    });

    return stations.filter((station) => {
      // Filter by connector types
      if (filters.connectorTypes.length > 0) {
        console.log("Station connectors:", station.name, station.charging.connectorTypes);
        const hasMatchingConnector = filters.connectorTypes.some((type) =>
          station.charging.connectorTypes.includes(type)
        );
        console.log("Has matching connector:", hasMatchingConnector);
        if (!hasMatchingConnector) return false;
      }

      // Filter by max price
      if (filters.maxPrice) {
        const maxStationPrice = Math.max(
          station.charging.pricing.acRate || 0,
          station.charging.pricing.dcRate || 0
        );
        if (maxStationPrice > filters.maxPrice) return false;
      }

      return true;
    });
  },

  // Station availability helpers
  getAvailableStations: () => {
    const { stations } = get();
    return stations.filter(
      (station) =>
        station.status === "active" && station.charging.availablePorts > 0
    );
  },

  getStationById: (stationId) => {
    const { stations } = get();
    return stations.find((station) => station.id === stationId);
  },

  // QR Code generation helper
  generateQRCode: (stationId, portId = 'A01') => {
    return `SKAEV:STATION:${stationId}:${portId}`;
  },

  // Mock QR codes for demo
  getMockQRCodes: () => {
    return {
      'station-001': 'SKAEV:STATION:station-001:A01',
      'station-002': 'SKAEV:STATION:station-002:B02',
      'station-003': 'SKAEV:STATION:station-003:C01',
    };
  },
}));

export default useStationStore;
