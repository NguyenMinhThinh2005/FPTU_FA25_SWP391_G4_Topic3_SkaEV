import { create } from "zustand";
import { stationsAPI } from "../services/api";
import adminStationAPI from "../services/adminStationAPI";
import { calculateDistance } from "../utils/helpers";

// Transform API response to frontend format
const transformStationData = (apiStation, slotsData = null) => {
  try {
    // API may still provide legacy totals named 'totalPosts' / 'availablePosts'.
    // Map them to frontend-friendly pole/port names and keep backwards fallback.
  let totalPoles = apiStation.totalPoles ?? apiStation.totalPosts ?? 0;
  let availablePoles = apiStation.availablePoles ?? apiStation.availablePosts ?? 0;

    let poles = [];

    // Use real slots data if provided, otherwise leave empty to avoid mock fabrication
    if (slotsData && Array.isArray(slotsData) && slotsData.length > 0) {
      const postMap = new Map();

      slotsData.forEach((slot) => {
        const postId = slot.chargingPostId || slot.postId;
        const slotPower = Number(slot.maxPower ?? slot.powerKw ?? 0);
        const connectorFromDb = slot.connectorType ?? undefined;
        const slotConnector = connectorFromDb ?? (slotPower >= 50 ? "DC" : "AC");
        const isDc = (slotConnector || "").toUpperCase().includes("DC") || slotPower >= 50;
        if (!postMap.has(postId)) {
          postMap.set(postId, {
            id: `${apiStation.stationId}-post${postId}`,
            poleId: `${apiStation.stationId}-post${postId}`,
            name: slot.postNumber ? `Trụ ${slot.postNumber}` : `Trụ sạc ${postId}`,
            poleNumber: slot.postNumber ?? postId,
            type: isDc ? "DC" : "AC",
            power: slotPower,
            voltage: isDc ? 400 : 220,
            status: slot.status || "available",
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
          portNumber: slot.slotNumber ?? slot.slotId,
          connectorType: slotConnector,
          maxPower: slotPower,
          status: (slot.status || "available").toLowerCase() === "available" ? "available" : "occupied",
          currentRate: null,
        });
        post.power = Math.max(post.power, slotPower);
        post.status = slot.status || post.status;
        post.totalPorts += 1;
        if ((slot.status || "").toLowerCase() === "available") {
          post.availablePorts += 1;
        }
      });

      poles = Array.from(postMap.values());
    }

    let totalPorts = poles.reduce((sum, pole) => sum + pole.totalPorts, 0);
    let availablePorts = poles.reduce((sum, pole) => sum + pole.availablePorts, 0);

    if (poles.length === 0) {
      const aggregatedTotalPorts =
        apiStation.totalPorts ??
        apiStation.totalSlots ??
        totalPoles ??
        (apiStation.ports ? apiStation.ports.length : 0) ??
        0;
      const aggregatedAvailablePorts =
        apiStation.availablePorts ??
        apiStation.availableSlots ??
        apiStation.availablePoles ??
        availablePoles ??
        0;

      totalPorts = aggregatedTotalPorts;
      availablePorts = aggregatedAvailablePorts;
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

    const connectorTypes = Array.from(connectorTypesSet);

    const utilizationRate = Number(
      Number.isFinite(apiStation.utilizationRate)
        ? apiStation.utilizationRate
        : apiStation.utilization || 0
    );

    const monthlyRevenue = Number(
      apiStation.monthlyRevenue ??
      apiStation.revenue ??
      apiStation.todayRevenue ??
      0
    );

    const monthlyCompletedSessions =
      apiStation.monthlyCompletedSessions ??
      apiStation.monthlyBookings ??
      apiStation.todayCompletedSessions ??
      0;

    const averageSessionMinutes = Number(
      apiStation.averageSessionDurationMinutes ??
      apiStation.avgSessionTime ??
      0
    );

    const todayRevenue = Number(apiStation.todayRevenue ?? 0);
    const todayCompletedSessions =
      apiStation.todayCompletedSessions ?? apiStation.todaySessionCount ?? 0;

    const basePrice = Number(
      apiStation.basePricePerKwh ??
      apiStation.pricePerKwh ??
      apiStation.basePrice ??
      0
    );

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
    
    // Normalize and expose a few canonical metrics for UI and services
  const occupied = Math.max(0, Math.min(totalPorts - availablePorts, totalPorts));
  const normalizedUtilization = totalPorts > 0 ? (occupied / totalPorts) * 100 : utilizationRate || 0;
  const derivedActiveSessions = Number.isFinite(totalPorts) && Number.isFinite(availablePorts) ? Math.max(0, totalPorts - availablePorts) : 0;

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
        totalPoles: totalPolesCount,
        availablePoles,
        totalPorts,
        availablePorts,
        poles,
        maxPower,
        connectorTypes,
        pricing: {
          baseRate: basePrice > 0 ? basePrice : 0,
          acRate: basePrice > 0 ? basePrice : 0,
          dcRate: basePrice > 0 ? basePrice : 0,
          dcFastRate: basePrice > 0 ? basePrice : 0,
        },
        pricePerKwh: basePrice > 0 ? basePrice : null,
      },
      stats: {
        total: totalPorts,
        available: availablePorts,
        occupied,
      },
      // Pass through backend calculated fields directly
    totalPosts: apiStation.totalPosts || 0,
    availablePosts: apiStation.availablePosts || 0,
    totalSlots: apiStation.totalSlots || 0,
    availableSlots: apiStation.availableSlots || 0,
    occupiedSlots: apiStation.occupiedSlots || 0,
  // Canonical active sessions: prefer explicit realtime value, fall back to derived occupied ports
  activeSessions: apiStation.activeSessions ?? derivedActiveSessions,
    utilizationRate,
    utilization: Math.round((normalizedUtilization + Number.EPSILON) * 100) / 100,
      todayRevenue,
      todayCompletedSessions,
      todaySessionCount: todayCompletedSessions,
      revenue: monthlyRevenue,
      monthlyRevenue,
      monthlyBookings: monthlyCompletedSessions,
      monthlyCompletedSessions,
      avgSessionTime: averageSessionMinutes,
      averageSessionDurationMinutes: averageSessionMinutes,
      currentPowerUsageKw: apiStation.currentPowerUsageKw || 0,
      totalPowerCapacityKw: apiStation.totalPowerCapacityKw || 0,
      amenities: apiStation.amenities || [],
      operatingHours: apiStation.operatingHours || "00:00-24:00",
      imageUrl: apiStation.stationImageUrl,
      basePricePerKwh: basePrice > 0 ? basePrice : null,
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
        // First pass: transform without slots data
        const stations = await Promise.all(
          rawStations.map(async (station) => {
            try {
              // Try to fetch slots for each station
              console.log(`🔌 Fetching slots for station ${station.stationId}...`);
              const slotsResponse = await stationsAPI.getStationSlots(station.stationId);
              const slotsData = slotsResponse.data || slotsResponse.slots || [];
              console.log(`✅ Loaded ${slotsData.length} slots for station ${station.stationId}`);
              return transformStationData(station, slotsData);
            } catch (slotError) {
              console.warn(`⚠️ Could not fetch slots for station ${station.stationId}, using fallback:`, slotError.message);
              return transformStationData(station, null);
            }
          })
        );

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
      set({ error: errorMessage, loading: false, stations: [] });
      return { success: false, error: errorMessage };
    }
  },

  fetchAdminStations: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      console.log("📡 Fetching admin stations from API...");
      const response = await adminStationAPI.getStations(filters);

      if (response?.success && Array.isArray(response.data)) {
        const stations = response.data.map((station) =>
          transformStationData(station, null)
        );

        console.log("✅ Admin stations loaded:", stations.length);
        if (stations.length > 0) {
          console.log("🔍 Admin station sample:", stations[0]);
        }
        set({ stations, loading: false });
        return { success: true, data: stations, pagination: response.pagination };
      }

      console.error("❌ Admin stations response invalid:", response);
      throw new Error(response?.message || "Không thể tải danh sách trạm quản trị");
    } catch (error) {
      const errorMessage = error.message || "Đã xảy ra lỗi khi tải trạm quản trị";
      console.error("❌ Fetch admin stations error:", errorMessage);
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

      // Filter by station status - only active stations
      if (station.status !== "active") {
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
        station.status === "active" && station.charging.availablePorts > 0
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
    try {
      // Call backend admin control to disable whole station
      const resp = await adminStationAPI.controlStation(stationId, 'disable_all', 'Disabled from Admin UI');
      // Expect backend to return { success: true } or similar
      if (resp && (resp.success === true || resp === true)) {
        get().setStationStatus(stationId, 'offline');
        return { success: true };
      }

      const msg = (resp && resp.message) || 'Unknown response from controlStation';
      console.error('❌ Failed to disable station:', stationId, msg);
      return { success: false, error: msg };
    } catch (error) {
      console.error('❌ remoteDisableStation error:', error);
      return { success: false, error: error?.message || String(error) };
    }
  },
  
  remoteEnableStation: async (stationId) => {
    try {
      const resp = await adminStationAPI.controlStation(stationId, 'enable_all', 'Enabled from Admin UI');
      if (resp && (resp.success === true || resp === true)) {
        get().setStationStatus(stationId, 'active');
        return { success: true };
      }

      const msg = (resp && resp.message) || 'Unknown response from controlStation';
      console.error('❌ Failed to enable station:', stationId, msg);
      return { success: false, error: msg };
    } catch (error) {
      console.error('❌ remoteEnableStation error:', error);
      return { success: false, error: error?.message || String(error) };
    }
  },

  // Add new station (Admin only)
  addStation: async (stationData) => {
    set({ loading: true, error: null });
    try {
      const response = await stationsAPI.create(stationData);
      const creationSucceeded = response?.success !== false;
      const createdPayload = response?.data ?? response?.station ?? response;

      if (!creationSucceeded || !createdPayload) {
        throw new Error(response?.message || "Không thể thêm trạm mới");
      }

      const stationId = createdPayload.stationId ?? createdPayload.id;
      if (!stationId) {
        throw new Error("Phản hồi tạo trạm không hợp lệ");
      }

      let normalizedStation = null;
      try {
        const [stationDetail, slotsResponse] = await Promise.all([
          stationsAPI.getById(stationId),
          stationsAPI.getStationSlots(stationId).catch(() => null),
        ]);

        const stationDto = stationDetail?.data ?? stationDetail;
        const slotsData = slotsResponse?.data ?? slotsResponse?.slots ?? [];
        normalizedStation = transformStationData(stationDto, slotsData);
      } catch (refreshError) {
        console.error("⚠️ Không thể tải lại dữ liệu trạm vừa tạo:", refreshError);
        normalizedStation = transformStationData(createdPayload, null);
      }

      set((state) => ({
        stations: [
          ...state.stations.filter((station) => station.stationId !== normalizedStation.stationId),
          normalizedStation,
        ],
        loading: false,
      }));

      return { success: true, station: normalizedStation };
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
      const updateSucceeded = response?.success !== false;

      if (!updateSucceeded) {
        throw new Error(response?.message || "Không thể cập nhật trạm");
      }

      const [stationDetail, slotsResponse] = await Promise.all([
        stationsAPI.getById(stationId),
        stationsAPI.getStationSlots(stationId).catch(() => null),
      ]);

      const stationDto = stationDetail?.data ?? stationDetail;
      const slotsData = slotsResponse?.data ?? slotsResponse?.slots ?? [];
      const normalizedStation = transformStationData(stationDto, slotsData);

      set((state) => ({
        stations: state.stations.map((station) =>
          station.stationId === stationId ? normalizedStation : station
        ),
        loading: false,
      }));

      return { success: true };
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
