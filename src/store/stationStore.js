import { create } from "zustand";
import { stationsAPI } from "../services/api";
import { calculateDistance } from "../utils/helpers";

// Transform API response to frontend format
const transformStationData = (apiStation) => {
  try {
    const totalPosts = apiStation.totalPosts || 0;
    const availablePosts = apiStation.availablePosts || 0;
    
    // Generate mock charging posts and slots (since API doesn't provide detailed structure)
    const chargingPosts = [];
    for (let i = 1; i <= totalPosts; i++) {
      const slotsPerPost = 2; // Each post has 2 slots
      const slots = [];
      
      for (let j = 1; j <= slotsPerPost; j++) {
        slots.push({
          slotId: `${apiStation.stationId}-post${i}-slot${j}`,
          slotNumber: j,
          connectorType: j === 1 ? "CCS2" : "CHAdeMO",
          maxPower: j === 1 ? 150 : 100,
          status: i <= availablePosts ? "available" : "occupied",
          currentRate: j === 1 ? 3500 : 5000,
        });
      }
      
      chargingPosts.push({
        postId: `${apiStation.stationId}-post${i}`,
        postNumber: i,
        status: i <= availablePosts ? "available" : "occupied",
        slots: slots,
      });
    }
    
    return {
      id: apiStation.stationId,
      stationId: apiStation.stationId,
      name: apiStation.stationName || apiStation.name,
      status: apiStation.status || "active",
      location: {
        address: apiStation.address,
        city: apiStation.city,
        coordinates: {
          lat: apiStation.latitude,
          lng: apiStation.longitude,
        },
      },
      charging: {
        totalPorts: totalPosts,
        availablePorts: availablePosts,
        chargingPosts: chargingPosts, // Add detailed structure
        maxPower: 150,
        connectorTypes: ["CCS2", "CHAdeMO"],
        pricing: {
          acRate: 3500,
          dcRate: 5000,
          dcFastRate: 7000,
        },
      },
      amenities: apiStation.amenities || [],
      operatingHours: apiStation.operatingHours || "00:00-24:00",
      imageUrl: apiStation.stationImageUrl,
      ratings: {
        overall: 4.5,
        totalReviews: 0,
      },
    };
  } catch (error) {
    console.error("❌ Transform error for station:", apiStation, error);
    throw error;
  }
};

const useStationStore = create((set, get) => ({
  // State
  stations: [], // Will be fetched from API
  selectedStation: null,
  nearbyStations: [],
  loading: false,
  error: null,
  filters: {
    maxDistance: 20, // km
    connectorTypes: [],
    maxPrice: null,
  },

  // Initialize data from API
  initializeData: async () => {
    console.log("🚀 Initializing stations from API...");
    await get().fetchStations();
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

  // Real API calls
  fetchStations: async () => {
    set({ loading: true, error: null });
    try {
      console.log("📡 Fetching stations from API...");
      const response = await stationsAPI.getAll();
      console.log("📥 API Response:", response);

      // API returns {data: Array, count: Number} or {success: true, data: Array}
      const hasData = response.data && Array.isArray(response.data);
      const isSuccess = response.success !== false; // If success field exists, check it; otherwise assume success
      
      if (hasData && isSuccess) {
        const rawStations = response.data;

        console.log("📊 Raw stations from API:", rawStations.length);
        
        // Transform API data to frontend format
        const stations = rawStations.map(transformStationData);

        console.log("✅ Stations loaded from API:", stations.length);
        console.log("🔍 First station sample:", stations[0]);
        
        set({ stations, loading: false });
        return { success: true, data: stations };
      } else {
        console.error("❌ API response invalid - success:", response.success, "hasData:", hasData);
        throw new Error(response.message || "Không thể tải danh sách trạm");
      }
    } catch (error) {
      const errorMessage = error.message || "Đã xảy ra lỗi khi tải trạm sạc";
      console.error("❌ Fetch stations error:", errorMessage);
      console.error("❌ Full error:", error);
      set({ error: errorMessage, loading: false, stations: [] });
      return { success: false, error: errorMessage };
    }
  },

  fetchNearbyStations: async (userLocation, radius = 20) => {
    set({ loading: true, error: null });
    try {
      const response = await stationsAPI.getNearby(userLocation, radius);

      if (response.success && response.data) {
        const rawNearby = Array.isArray(response.data)
          ? response.data
          : response.data.stations || [];

        // Transform API data to frontend format
        const nearby = rawNearby.map(transformStationData);

        // If API doesn't provide distance, calculate it locally
        const nearbyWithDistance = nearby.map((station) => {
          if (!station.distance) {
            station.distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              station.location.coordinates.lat,
              station.location.coordinates.lng
            );
          }
          return station;
        });

        // Sort by distance
        nearbyWithDistance.sort((a, b) => a.distance - b.distance);

        console.log("✅ Nearby stations loaded:", nearbyWithDistance.length);
        set({ nearbyStations: nearbyWithDistance, loading: false });
        return { success: true, data: nearbyWithDistance };
      } else {
        throw new Error(response.message || "Không thể tải trạm gần bạn");
      }
    } catch (error) {
      const errorMessage = error.message || "Đã xảy ra lỗi khi tải trạm gần bạn";
      console.error("❌ Fetch nearby stations error:", errorMessage);
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
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

  // Add new station (Admin only)
  addStation: async (stationData) => {
    set({ loading: true, error: null });
    try {
      const response = await stationsAPI.create(stationData);

      if (response.success && response.data) {
        const newStation = response.data;

        set((state) => ({
          stations: [...state.stations, newStation],
          loading: false,
        }));

        console.log("✅ New station added:", newStation.name);
        return { success: true, station: newStation };
      } else {
        throw new Error(response.message || "Không thể thêm trạm mới");
      }
    } catch (error) {
      const errorMessage = error.message || "Đã xảy ra lỗi khi thêm trạm";
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Update existing station (Admin/Staff)
  updateStation: async (stationId, stationData) => {
    set({ loading: true, error: null });
    try {
      const response = await stationsAPI.update(stationId, stationData);

      if (response.success) {
        set((state) => ({
          stations: state.stations.map((station) =>
            station.id === stationId
              ? { ...station, ...stationData, lastUpdated: new Date().toISOString() }
              : station
          ),
          loading: false,
        }));

        console.log("✅ Station updated successfully:", stationId);
        return { success: true };
      } else {
        throw new Error(response.message || "Không thể cập nhật trạm");
      }
    } catch (error) {
      const errorMessage = error.message || "Đã xảy ra lỗi khi cập nhật trạm";
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Delete station (Admin only)
  deleteStation: async (stationId) => {
    set({ loading: true, error: null });
    try {
      const response = await stationsAPI.delete(stationId);

      if (response.success) {
        set((state) => ({
          stations: state.stations.filter((station) => station.id !== stationId),
          loading: false,
        }));

        console.log("✅ Station deleted:", stationId);
        return { success: true };
      } else {
        throw new Error(response.message || "Không thể xóa trạm");
      }
    } catch (error) {
      const errorMessage = error.message || "Đã xảy ra lỗi khi xóa trạm";
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },
}));

export default useStationStore;
