import { create } from "zustand";
import { mockStations } from "../data/mockData";
import { calculateDistance } from "../utils/helpers";

const useStationStore = create((set, get) => ({
  // State
  stations: mockStations, // Initialize with data immediately
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
    console.log("🚀 Initializing stations:", mockStations.length);
    console.log("📊 All station connector types:");
    mockStations.forEach((station, index) => {
      console.log(`  ${index + 1}. ${station.name}: ${JSON.stringify(station.charging?.connectorTypes)}`);
    });
    set({ stations: mockStations, loading: false, error: null });
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

    console.log("🔍 FILTERING DEBUG:", {
      totalStations: stations.length,
      selectedConnectorTypes: filters.connectorTypes,
      filtersObject: filters
    });

    if (stations.length === 0) {
      console.warn("⚠️ No stations available for filtering");
      return [];
    }

    const filtered = stations.filter((station) => {
      console.log(`\n📍 Checking station: ${station.name}`);
      console.log(`   - Available connectors: ${JSON.stringify(station.charging?.connectorTypes)}`);
      console.log(`   - Station status: ${station.status}`);

      // Filter by station status - only active stations
      if (station.status !== "active") {
        console.log(`   ❌ Station not active: ${station.status}`);
        return false;
      }

      // Filter by connector types
      if (filters.connectorTypes && filters.connectorTypes.length > 0) {
        const stationConnectors = station.charging?.connectorTypes || [];
        console.log(`   - Filter connectors: ${JSON.stringify(filters.connectorTypes)}`);
        console.log(`   - Station connectors: ${JSON.stringify(stationConnectors)}`);

        const hasMatchingConnector = filters.connectorTypes.some((filterType) => {
          const match = stationConnectors.includes(filterType);
          console.log(`     Checking ${filterType}: ${match ? '✅' : '❌'}`);
          return match;
        });

        console.log(`   - Has matching connector: ${hasMatchingConnector ? '✅' : '❌'}`);
        if (!hasMatchingConnector) return false;
      }

      // Filter by max price
      if (filters.maxPrice) {
        const maxStationPrice = Math.max(
          station.charging?.pricing?.acRate || 0,
          station.charging?.pricing?.dcRate || 0,
          station.charging?.pricing?.dcFastRate || 0
        );
        console.log(`   - Max station price: ${maxStationPrice}, Filter max: ${filters.maxPrice}`);
        if (maxStationPrice > filters.maxPrice) {
          console.log(`   ❌ Price too high: ${maxStationPrice} > ${filters.maxPrice}`);
          return false;
        }
      }

      console.log(`   ✅ Station passed all filters`);
      return true;
    });

    console.log(`\n🎯 FILTER RESULT: ${filtered.length}/${stations.length} stations matched`);
    console.log(`Matched stations: ${filtered.map(s => s.name).join(', ')}`);

    return filtered;
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

  // Remote control (minimal)
  setStationStatus: (stationId, status) => {
    set((state) => ({
      stations: state.stations.map((s) => (s.id === stationId ? { ...s, status } : s)),
    }));
  },

  remoteDisableStation: async (stationId) => {
    await new Promise((r) => setTimeout(r, 300));
    get().setStationStatus(stationId, 'offline');
    return { success: true };
  },

  remoteEnableStation: async (stationId) => {
    await new Promise((r) => setTimeout(r, 300));
    get().setStationStatus(stationId, 'active');
    return { success: true };
  },
}));

export default useStationStore;
