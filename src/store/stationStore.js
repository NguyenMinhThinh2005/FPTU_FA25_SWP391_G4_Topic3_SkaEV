import { create } from "zustand";
import { stationsAPI } from "../services/api";
import { calculateDistance } from "../utils/helpers";

// Transform API response to frontend format
const transformStationData = (apiStation, stationPosts = []) => {
  try {
    const stationId = apiStation.stationId ?? apiStation.id;
    const normalizeStatus = (status) => {
      if (!status) return "unknown";
      const value = status.toString().trim().toLowerCase();
      if (["available", "occupied", "maintenance", "offline"].includes(value)) {
        return value;
      }
      return value || "unknown";
    };

    const derivePostsFromSlots = (slotList) => {
      const grouped = new Map();
      slotList.forEach((slot) => {
        const postId = slot.postId ?? slot.chargingPostId;
        if (!postId) return;
        if (!grouped.has(postId)) {
          grouped.set(postId, {
            postId,
            postNumber: slot.postNumber ?? postId,
            postType: slot.postType,
            powerOutput: slot.maxPower,
            status: slot.status,
            slots: [],
          });
        }

        grouped.get(postId).slots.push(slot);
      });

      return Array.from(grouped.values()).map((post) => ({
        ...post,
        totalSlots: post.slots.length,
        availableSlots: post.slots.filter(
          (slot) => normalizeStatus(slot.status) === "available"
        ).length,
      }));
    };

    const posts = (() => {
      if (!Array.isArray(stationPosts) || stationPosts.length === 0) {
        return [];
      }

      const firstItem = stationPosts[0];
      if (firstItem && typeof firstItem === "object" && "slots" in firstItem) {
        return stationPosts;
      }

      if (firstItem && typeof firstItem === "object" && "slotId" in firstItem) {
        return derivePostsFromSlots(stationPosts);
      }

      return [];
    })();

    const poles = posts.map((post) => {
      const slots = Array.isArray(post.slots) ? post.slots : [];

      const ports = slots.map((slot, index) => {
        const slotStatus = normalizeStatus(slot.status);
        return {
          id: `${stationId}-slot${slot.slotId ?? index + 1}`,
          portId: `${stationId}-slot${slot.slotId ?? index + 1}`,
          slotId: slot.slotId ?? slot.slotNumber ?? index + 1,
          portNumber: slot.slotNumber ?? slot.slotId ?? index + 1,
          connectorType: slot.connectorType ?? null,
          maxPower: slot.powerKw ?? slot.maxPower ?? post.powerOutput ?? null,
          status: slotStatus,
          currentRate: null,
        };
      });

      const portsCount = ports.length > 0 ? ports.length : post.totalSlots ?? 0;
      const availablePortCount =
        ports.length > 0
          ? ports.filter((port) => port.status === "available").length
          : post.availableSlots ?? 0;

      const poleType =
        post.postType ??
        (post.powerOutput && post.powerOutput >= 50 ? "DC" : "AC");

      return {
        id: `${stationId}-post${post.postId}`,
        poleId: `${stationId}-post${post.postId}`,
        name: post.postNumber || `Trụ sạc ${post.postId}`,
        poleNumber: post.postNumber ?? post.postId,
        type: poleType,
        power: post.powerOutput ?? null,
        voltage: poleType === "DC" ? 400 : poleType === "AC" ? 220 : null,
        status:
          normalizeStatus(post.status) ||
          (availablePortCount > 0 ? "available" : "occupied"),
        ports,
        totalPorts: portsCount,
        availablePorts: availablePortCount,
      };
    });

    const totalPorts = poles.reduce(
      (sum, pole) => sum + (pole.totalPorts || 0),
      0
    );
    const availablePorts = poles.reduce(
      (sum, pole) => sum + (pole.availablePorts || 0),
      0
    );
    const maxPower = poles.reduce((currentMax, pole) => {
      const polePower = Number(pole.power) || 0;
      return polePower > currentMax ? polePower : currentMax;
    }, 0);

    const connectorTypes = Array.from(
      new Set(
        poles.flatMap((pole) =>
          (pole.ports || [])
            .map((port) => port.connectorType)
            .filter((connector) => connector && typeof connector === "string")
        )
      )
    );

    return {
      id: stationId,
      stationId: stationId,
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
        totalPoles:
          poles.length || apiStation.totalPoles || apiStation.totalPosts || 0,
        totalPorts: totalPorts,
        availablePorts: availablePorts,
        poles: poles,
        maxPower: maxPower,
        connectorTypes,
        pricing: {
          acRate: apiStation.acRate ?? 0,
          dcRate: apiStation.dcRate ?? 0,
          dcFastRate: apiStation.dcFastRate ?? 0,
          parkingFee: apiStation.parkingFee ?? 0,
        },
      },
      stats: {
        total: totalPorts,
        available: availablePorts,
        occupied: totalPorts - availablePorts,
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
        // First pass: transform without slots data
        const stations = await Promise.all(
          rawStations.map(async (station) => {
            try {
              console.log(
                `🔌 Fetching posts for station ${station.stationId}...`
              );
              const postsResponse = await stationsAPI.getAvailablePosts(
                station.stationId
              );
              const postsPayload = postsResponse?.data ?? postsResponse;
              const postsData = Array.isArray(postsPayload) ? postsPayload : [];
              console.log(
                `✅ Loaded ${postsData.length} posts for station ${station.stationId}`
              );
              return transformStationData(station, postsData);
            } catch (postError) {
              console.error(
                `❌ Could not fetch posts for station ${station.stationId}:`,
                postError.message
              );
              return transformStationData(station, []);
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

  fetchNearbyStations: async (userLocation, radius = 20) => {
    set({ loading: true, error: null });
    try {
      const response = await stationsAPI.getNearby(userLocation, radius);

      if (response.success && response.data) {
        const rawNearby = Array.isArray(response.data)
          ? response.data
          : response.data.stations || [];

        const nearby = await Promise.all(
          rawNearby.map(async (station) => {
            try {
              const postsResponse = await stationsAPI.getAvailablePosts(
                station.stationId
              );
              const postsPayload = postsResponse?.data ?? postsResponse;
              const postsData = Array.isArray(postsPayload) ? postsPayload : [];
              return transformStationData(station, postsData);
            } catch (error) {
              console.error(
                `❌ Could not load posts for nearby station ${station.stationId}:`,
                error.message
              );
              return transformStationData(station, []);
            }
          })
        );

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
        console.log(
          `   - Filter connectors: ${JSON.stringify(connectorFilters)}`
        );
        console.log(
          `   - Station connectors: ${JSON.stringify(stationConnectors)}`
        );

        const hasMatchingConnector = connectorFilters.some((filterType) => {
          const match = stationConnectors.includes(filterType);
          console.log(`     Checking ${filterType}: ${match ? "✅" : "❌"}`);
          return match;
        });

        console.log(
          `   - Has matching connector: ${hasMatchingConnector ? "✅" : "❌"}`
        );
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
