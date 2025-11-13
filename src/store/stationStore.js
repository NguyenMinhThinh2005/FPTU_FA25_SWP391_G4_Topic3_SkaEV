import { create } from "zustand";
import { stationsAPI } from "../services/api";
import { calculateDistance } from "../utils/helpers";

// Transform API response to frontend format
const transformStationData = (apiStation, slotsData = null) => {
  try {
    // API may still provide legacy totals named 'totalPosts' / 'availablePosts'.
    // Map them to frontend-friendly pole/port names and keep backwards fallback.
  let totalPoles = apiStation.totalPoles ?? apiStation.totalPosts ?? 0;
  let availablePoles = apiStation.availablePoles ?? apiStation.availablePosts ?? 0;

    let poles = [];

    // PRIORITY 1: Use chargingPosts from API if available (new structure)
    if (apiStation.chargingPosts && Array.isArray(apiStation.chargingPosts) && apiStation.chargingPosts.length > 0) {
      console.log(`🔍 Processing ${apiStation.chargingPosts.length} charging posts from API for station ${apiStation.stationId}`);
      
      apiStation.chargingPosts.forEach((post) => {
        const postSlots = post.slots || [];
        const poleData = {
          id: `${apiStation.stationId}-post${post.postId}`,
          poleId: `${apiStation.stationId}-post${post.postId}`,
          name: post.postName || `Post ${post.postId}`,
          poleNumber: post.postId,
          type: post.postType || "AC",
          power: postSlots.length > 0 ? Math.max(...postSlots.map(s => s.maxPower || 0)) : 0,
          voltage: post.postType === "DC" ? 400 : 220,
          status: "active",
          ports: [],
          totalPorts: 0,
          availablePorts: 0,
        };

        postSlots.forEach((slot) => {
          poleData.ports.push({
            id: `${apiStation.stationId}-slot${slot.slotId}`,
            portId: `${apiStation.stationId}-slot${slot.slotId}`,
            slotId: slot.slotId,
            portNumber: slot.slotNumber || slot.slotId,
            connectorType: slot.connectorType || (slot.maxPower >= 50 ? "CCS2" : "Type 2"),
            maxPower: slot.maxPower || 0,
            status: (slot.status || "").toLowerCase() === "available" ? "available" : "occupied",
            currentRate: slot.maxPower >= 50 ? 5000 : 3000,
          });
          poleData.totalPorts += 1;
          if ((slot.status || "").toLowerCase() === "available") {
            poleData.availablePorts += 1;
          }
        });

        poles.push(poleData);
      });

      console.log(`✅ Loaded ${poles.length} poles from API chargingPosts for station ${apiStation.stationId}`);
      console.log(`   Total ports: ${poles.reduce((sum, pole) => sum + pole.totalPorts, 0)}, Available: ${poles.reduce((sum, pole) => sum + pole.availablePorts, 0)}`);
    }
    // PRIORITY 2: Use legacy slotsData parameter if provided (old structure)
    else if (slotsData && Array.isArray(slotsData) && slotsData.length > 0) {
      console.log(`🔍 Processing ${slotsData.length} slots (legacy) for station ${apiStation.stationId}:`, slotsData);
      const postMap = new Map();

      slotsData.forEach((slot) => {
        // Backend returns maxPower instead of powerKw
        const powerKw = slot.powerKw || slot.maxPower || 0;
        const postId = slot.chargingPostId || slot.postId;
        const postNumber = slot.postNumber || `POST-${postId}`;
        
        console.log(`  Slot ${slot.slotId}: postId=${postId}, power=${powerKw}, status=${slot.status}`);
        
        if (!postMap.has(postId)) {
          postMap.set(postId, {
            id: `${apiStation.stationId}-post${postId}`,
            poleId: `${apiStation.stationId}-post${postId}`,
            name: postNumber,
            poleNumber: postId,
            type: powerKw >= 50 ? "DC" : "AC",
            power: powerKw,
            voltage: powerKw >= 50 ? 400 : 220,
            status: slot.status || "active",
            ports: [],
            totalPorts: 0,
            availablePorts: 0,
          });
        }

        const post = postMap.get(postId);
        post.ports.push({
          id: `${apiStation.stationId}-slot${slot.slotId}`,
          portId: `${apiStation.stationId}-slot${slot.slotId}`,
          slotId: slot.slotId,
          portNumber: slot.slotNumber || slot.slotId,
          connectorType:
            slot.connectorType || (powerKw >= 50 ? "CCS2" : "Type 2"),
          maxPower: powerKw,
          status: slot.status === "available" ? "available" : "occupied",
          currentRate: powerKw >= 50 ? 5000 : 3000,
        });
        post.totalPorts += 1;
        if (slot.status === "available") {
          post.availablePorts += 1;
        }
      });

      poles = Array.from(postMap.values());
      console.log(
        `✅ Loaded ${poles.length} poles from legacy slots data for station ${apiStation.stationId}`
      );
      console.log(`   Total ports: ${poles.reduce((sum, pole) => sum + pole.totalPorts, 0)}, Available: ${poles.reduce((sum, pole) => sum + pole.availablePorts, 0)}`);
    } else {
      console.log(`⚠️ No chargingPosts or slots data for station ${apiStation.stationId} - will use fallback or API totals`);
    }

    let totalPorts = poles.reduce((sum, pole) => sum + pole.totalPorts, 0);
    let availablePorts = poles.reduce((sum, pole) => sum + pole.availablePorts, 0);

    if (poles.length === 0) {
      // No real slots data - use API totals directly if available
      // API provides totalPosts/availablePosts from database
      const apiTotalPorts = apiStation.totalPorts ?? apiStation.totalPosts ?? 0;
      const apiAvailablePorts = apiStation.availablePosts ?? apiStation.availablePosts ?? 0;

      console.log(`🔍 Station ${apiStation.stationId} - Checking API totals:`, {
        apiTotalPorts,
        apiAvailablePorts,
        rawTotalPorts: apiStation.totalPorts,
        rawTotalPosts: apiStation.totalPosts,
        rawAvailablePorts: apiStation.availablePorts,
        rawAvailablePosts: apiStation.availablePosts
      });

      if (apiTotalPorts > 0) {
        // Trust API totals - don't fabricate fake poles
        totalPorts = apiTotalPorts;
        availablePorts = Math.min(apiAvailablePorts, apiTotalPorts); // Ensure available <= total
        console.log(`📊 Station ${apiStation.stationId} using API totals: ${totalPorts} total, ${availablePorts} available (no detailed slots data)`);
      } else {
        // No API totals either - use reasonable defaults for active stations
        const isActiveStation = (apiStation.status || "").toLowerCase() === "active";
        totalPorts = isActiveStation ? 6 : 0; // Default: 6 ports for active stations
        availablePorts = isActiveStation ? 4 : 0; // Default: ~67% availability
        console.log(`⚙️ Station ${apiStation.stationId} using defaults: ${totalPorts} total, ${availablePorts} available (no API data)`);
      }

      // DON'T create fallback poles when we have API totals
      // Frontend will show aggregate stats without detailed pole/port breakdown
      poles = [];
      
      console.log(`⚠️ No slots data for station ${apiStation.stationId} - will use API totals or defaults`);
    }

    if (poles.length > 0) {
      totalPoles = poles.length;
      availablePoles = poles.filter((pole) => pole.availablePorts > 0).length;
    }

    const statusNormalized = (apiStation.status || "").toLowerCase();
    if (statusNormalized !== "active") {
      availablePorts = 0;
      availablePoles = 0;
    }

    availablePorts = Math.max(0, Math.min(availablePorts, totalPorts));

    const totalPolesCount = poles.length > 0 ? poles.length : totalPoles;

    const maxPowerFromPoles =
      poles.length > 0 ? Math.max(...poles.map((p) => p.power), 0) : 0;
    const maxPower =
      maxPowerFromPoles ||
      apiStation.maxPowerKw ||
      apiStation.totalPowerCapacityKw ||
      apiStation.capacityKw ||
      0;

    const connectorTypesSet = new Set();
    poles.forEach((pole) => {
      pole.ports.forEach((port) => {
        if (port.connectorType) {
          connectorTypesSet.add(port.connectorType);
        }
      });
    });

    const apiConnectorTypes =
      apiStation.connectorTypes ??
      apiStation.supportedConnectors ??
      apiStation.connectors ??
      [];

    if (typeof apiConnectorTypes === "string") {
      apiConnectorTypes
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
        .forEach((c) => connectorTypesSet.add(c));
    } else if (Array.isArray(apiConnectorTypes)) {
      apiConnectorTypes.filter(Boolean).forEach((c) => connectorTypesSet.add(c));
    }
    
    // If no connector types found from slots or API, add common defaults for Vietnamese EV stations
    if (connectorTypesSet.size === 0) {
      // Default connector types for active stations
      const isActiveStation = statusNormalized === "active";
      if (isActiveStation) {
        connectorTypesSet.add("Type 2"); // Standard AC charging (common in Vietnam)
        connectorTypesSet.add("CCS2");   // DC fast charging (VinFast standard)
        console.log(`⚙️ Station ${apiStation.stationId} using default connector types (no data from API)`);
      }
    }

    const connectorTypes = Array.from(connectorTypesSet);

    const managerUserId =
      apiStation.managerUserId ??
      apiStation.manager?.userId ??
      apiStation.managerID ??
      apiStation.manager?.id ??
      null;
    const managerName =
      apiStation.managerName ??
      apiStation.manager?.name ??
      apiStation.managerFullName ??
      null;
    const managerEmail =
      apiStation.managerEmail ??
      apiStation.manager?.email ??
      null;
    const managerPhone =
      apiStation.managerPhoneNumber ??
      apiStation.manager?.phone ??
      apiStation.manager?.phoneNumber ??
      null;

    const manager =
      managerUserId || managerName || managerEmail || managerPhone
        ? {
            userId: managerUserId ?? null,
            name: managerName ?? null,
            email: managerEmail ?? null,
            phone: managerPhone ?? null,
          }
        : null;
    
    // Debug log to check final values
    console.log(`🔍 Station ${apiStation.stationId} - Final values:`, {
      totalPoles: totalPolesCount,
      availablePoles,
      totalPorts,
      availablePorts: availablePorts,
      polesCount: poles.length,
      hasSlotsData: slotsData && Array.isArray(slotsData) && slotsData.length > 0,
      status: apiStation.status
    });
    
    // DON'T override status - always trust the database/API status
    // Status should only be changed by admin/staff in the database
    
    return {
      id: apiStation.stationId,
      stationId: apiStation.stationId,
      name: apiStation.stationName || apiStation.name,
      status: apiStation.status || "active", // Keep original case from database
      location: {
        address: apiStation.address,
        city: apiStation.city,
        coordinates: {
          lat: apiStation.latitude,
          lng: apiStation.longitude,
        },
      },
      charging: {
        totalPoles: totalPolesCount,
        availablePoles,
        totalPorts,
        availablePorts,
        poles,
        maxPower,
        connectorTypes,
        pricing: {
          acRate: 3500,
          dcRate: 5000,
          dcFastRate: 7000,
        },
      },
      stats: {
        total: totalPorts,
        available: availablePorts,
        occupied: Math.max(totalPorts - availablePorts, 0),
      },
      amenities: apiStation.amenities || [],
      operatingHours: apiStation.operatingHours || "00:00-24:00",
      imageUrl: apiStation.stationImageUrl,
      ratings: {
        overall: 4.5,
        totalReviews: 0,
      },
      manager,
      managerUserId: manager?.userId ?? null,
      managerName: manager?.name ?? null,
      managerEmail: manager?.email ?? null,
      managerPhoneNumber: manager?.phone ?? null,
      contact: manager
        ? {
            manager: manager.name,
            managerId: manager.userId,
            email: manager.email,
            phone: manager.phone,
          }
        : null,
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
        // API now includes chargingPosts in the response, no need to fetch separately
        const stations = rawStations.map((station) => {
          return transformStationData(station, null);
        });

        console.log("✅ Stations loaded from API:", stations.length);
        console.log("🔍 First station sample:", stations[0]);

        set({ stations, loading: false });
        return { success: true, data: stations };
      } else {
        console.error(
          "❌ API response invalid - success:",
          response.success,
          "hasData:",
          hasData
        );
        throw new Error(response.message || "Không thể tải danh sách trạm");
      }
    } catch (error) {
      const errorMessage = error.message || "Đã xảy ra lỗi khi tải trạm sạc";
      console.error("❌ Fetch stations error:", errorMessage);
      console.error("❌ Full error:", error);
      
      // IMPORTANT: Do NOT clear existing stations on error - preserve current data
      set({ error: errorMessage, loading: false });
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
      const errorMessage =
        error.message || "Đã xảy ra lỗi khi tải trạm gần bạn";
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
      filtersObject: filters,
    });

    if (stations.length === 0) {
      console.warn("⚠️ No stations available for filtering");
      return [];
    }

    const filtered = stations.filter((station) => {
      console.log(`\n📍 Checking station: ${station.name}`);
      console.log(
        `   - Available connectors: ${JSON.stringify(
          station.charging?.connectorTypes
        )}`
      );
      console.log(`   - Station status: ${station.status}`);

      // Filter by station status - only active stations (case-insensitive)
      const statusLower = (station.status || "").toLowerCase();
      if (statusLower !== "active") {
        console.log(`   ❌ Station not active: ${station.status}`);
        return false;
      }

      // Filter by connector types - accept string or array from UI
      const connectorFilters = Array.isArray(filters.connectorTypes)
        ? filters.connectorTypes.filter(Boolean)
        : filters.connectorTypes
        ? [filters.connectorTypes]
        : [];

      if (connectorFilters.length > 0) {
        const stationConnectors = station.charging?.connectorTypes || [];
        console.log(`   - Filter connectors: ${JSON.stringify(connectorFilters)}`);
        console.log(`   - Station connectors: ${JSON.stringify(stationConnectors)}`);

        const hasMatchingConnector = connectorFilters.some((filterType) => {
          const match = stationConnectors.includes(filterType);
          console.log(`     Checking ${filterType}: ${match ? "✅" : "❌"}`);
          return match;
        });

        console.log(`   - Has matching connector: ${hasMatchingConnector ? "✅" : "❌"}`);
        if (!hasMatchingConnector) return false;
      }

      // Filter by max price
      if (filters.maxPrice) {
        const maxStationPrice = Math.max(
          station.charging?.pricing?.acRate || 0,
          station.charging?.pricing?.dcRate || 0,
          station.charging?.pricing?.dcFastRate || 0
        );
        console.log(
          `   - Max station price: ${maxStationPrice}, Filter max: ${filters.maxPrice}`
        );
        if (maxStationPrice > filters.maxPrice) {
          console.log(
            `   ❌ Price too high: ${maxStationPrice} > ${filters.maxPrice}`
          );
          return false;
        }
      }

      console.log(`   ✅ Station passed all filters`);
      return true;
    });

    console.log(
      `\n🎯 FILTER RESULT: ${filtered.length}/${stations.length} stations matched`
    );
    console.log(`Matched stations: ${filtered.map((s) => s.name).join(", ")}`);

    return filtered;
  },

  // Station availability helpers
  getAvailableStations: () => {
    const { stations } = get();
    return stations.filter(
      (station) =>
        (station.status || "").toLowerCase() === "active" && station.charging.availablePorts > 0
    );
  },

  getStationById: (stationId) => {
    const { stations } = get();
    return stations.find((station) => station.id === stationId);
  },

  // QR Code generation helper
  generateQRCode: (stationId, portId = "A01") => {
    return `SKAEV:STATION:${stationId}:${portId}`;
  },

  // Remote control (minimal)
  setStationStatus: (stationId, status) => {
    set((state) => ({
      stations: state.stations.map((s) =>
        s.id === stationId ? { ...s, status } : s
      ),
    }));
  },

  remoteDisableStation: async (stationId) => {
    await new Promise((r) => setTimeout(r, 300));
    get().setStationStatus(stationId, "offline");
    return { success: true };
  },

  remoteEnableStation: async (stationId) => {
    await new Promise((r) => setTimeout(r, 300));
    get().setStationStatus(stationId, "active");
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
              ? {
                  ...station,
                  ...stationData,
                  lastUpdated: new Date().toISOString(),
                }
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
          stations: state.stations.filter(
            (station) => station.id !== stationId
          ),
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
