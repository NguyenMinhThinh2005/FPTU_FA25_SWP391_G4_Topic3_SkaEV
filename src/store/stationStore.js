import { create } from "zustand";
import { stationsAPI } from "../services/api";
import { calculateDistance } from "../utils/helpers";

// Minimal, robust transform used by the frontend. Keeps fields defensive and
// avoids complex derivations so the store stays resilient to varied API shapes.
const transformStationData = (apiStation = {}, stationPosts = []) => {
  const stationId = apiStation.stationId ?? apiStation.id ?? apiStation._id ?? null;

  const totalPorts =
    apiStation.totalPorts ?? apiStation.totalPosts ?? apiStation.ports?.length ?? 0;
  const availablePorts = apiStation.availablePorts ?? apiStation.availablePosts ?? 0;

  const totalPoles = apiStation.totalPoles ?? apiStation.totalPosts ?? 0;
  const availablePoles = apiStation.availablePoles ?? apiStation.availablePosts ?? 0;

  const connectorTypes =
    Array.isArray(apiStation.connectorTypes) && apiStation.connectorTypes.length > 0
      ? apiStation.connectorTypes
      : typeof apiStation.connectorTypes === "string"
      ? apiStation.connectorTypes.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  return {
    id: stationId,
    stationId,
    name: apiStation.stationName ?? apiStation.name ?? `Trạm ${stationId}`,
    status: (apiStation.status || "active").toLowerCase(),
    location: {
      address: apiStation.address ?? null,
      city: apiStation.city ?? null,
      coordinates: {
        lat: apiStation.latitude ?? apiStation.lat ?? null,
        lng: apiStation.longitude ?? apiStation.lng ?? null,
      },
    },
    charging: {
      totalPoles,
      availablePoles,
      totalPorts,
      availablePorts,
      poles: stationPosts || [],
      maxPower: apiStation.maxPowerKw ?? apiStation.capacityKw ?? 0,
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
      occupied: Math.max(totalPorts - availablePorts, 0),
    },
    imageUrl: apiStation.stationImageUrl ?? apiStation.imageUrl ?? null,
    amenities: apiStation.amenities ?? [],
    managerUserId: apiStation.managerUserId ?? apiStation.manager?.userId ?? null,
    managerName: apiStation.managerName ?? apiStation.manager?.name ?? null,
  };
};

const useStationStore = create((set, get) => ({
  stations: [],
  selectedStation: null,
  nearbyStations: [],
  loading: false,
  error: null,

  setStations: (stations) => set({ stations }),

  getStationById: (stationId) => get().stations.find((s) => s.id === stationId || s.stationId === stationId),

  fetchStations: async () => {
    set({ loading: true, error: null });
    try {
      const response = await stationsAPI.getAll();
      const raw = response?.data ?? response ?? [];
      if (!Array.isArray(raw)) throw new Error("Invalid stations payload");

      const stations = await Promise.all(
        raw.map(async (st) => {
          try {
            const postsResp = await stationsAPI.getAvailablePosts(st.stationId ?? st.id);
            const posts = postsResp?.data ?? postsResp ?? [];
            return transformStationData(st, posts);
          } catch (e) {
            return transformStationData(st, []);
          }
        })
      );

      set({ stations, loading: false });
      return { success: true, data: stations };
    } catch (error) {
      set({ error: error?.message ?? "Fetch stations failed", loading: false, stations: [] });
      return { success: false, error: error?.message ?? "Fetch stations failed" };
    }
  },

  fetchNearbyStations: async (userLocation, radius = 20) => {
    set({ loading: true, error: null });
    try {
      const response = await stationsAPI.getNearby(userLocation, radius);
      const rawNearby = response?.data ?? response ?? [];
      const nearby = Array.isArray(rawNearby) ? rawNearby.map((s) => transformStationData(s, [])) : [];

      // calculate distance if coordinates present
      const nearbyWithDistance = nearby.map((station) => {
        if (!station.distance && station.location?.coordinates?.lat && userLocation?.lat) {
          station.distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            station.location.coordinates.lat,
            station.location.coordinates.lng
          );
        }
        return station;
      });

      nearbyWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      set({ nearbyStations: nearbyWithDistance, loading: false });
      return { success: true, data: nearbyWithDistance };
    } catch (error) {
      set({ error: error?.message ?? "Fetch nearby failed", loading: false });
      return { success: false, error: error?.message ?? "Fetch nearby failed" };
    }
  },
}));

export default useStationStore;
