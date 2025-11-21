import axiosInstance from "./axiosConfig";

// Mock data generator for development when API key is not available
const generateMockRoute = (origin, destination) => {
  // Generate a realistic curved path between two points
  const latDiff = destination.lat - origin.lat;
  const lngDiff = destination.lng - origin.lng;
  const steps = 15; // Number of waypoints

  const polyline = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Add some curve to make it look realistic
    const curve = Math.sin(t * Math.PI) * 0.01; // Small deviation
    const lat = origin.lat + latDiff * t + curve;
    const lng = origin.lng + lngDiff * t + curve * 0.5;
    polyline.push({ lat, lng });
  }

  // Calculate approximate distance using Haversine
  const R = 6371; // Earth's radius in km
  const dLat = ((destination.lat - origin.lat) * Math.PI) / 180;
  const dLng = ((destination.lng - origin.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((origin.lat * Math.PI) / 180) *
      Math.cos((destination.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;
  const distanceMeters = Math.round(distanceKm * 1000);

  // Estimate duration (assuming average 30 km/h in city)
  const durationSeconds = Math.round((distanceKm / 30) * 3600);

  return {
    success: true,
    route: {
      polyline,
      leg: {
        summary: "Lộ trình đề xuất",
        distanceText:
          distanceKm >= 1
            ? `${distanceKm.toFixed(1)} km`
            : `${distanceMeters} m`,
        distanceMeters,
        durationText:
          durationSeconds >= 3600
            ? `${Math.floor(durationSeconds / 3600)} giờ ${Math.floor(
                (durationSeconds % 3600) / 60
              )} phút`
            : `${Math.floor(durationSeconds / 60)} phút`,
        durationSeconds,
      },
      warnings: [
        "Đang sử dụng dữ liệu mô phỏng. Vui lòng cấu hình Google Maps API key để có chỉ đường chính xác.",
      ],
    },
  };
};

export async function getDrivingDirections({
  origin,
  destination,
  mode = "driving",
}) {
  if (!origin || !destination) {
    throw new Error("Origin and destination are required to fetch directions.");
  }

  const params = new URLSearchParams({
    originLat: origin.lat,
    originLng: origin.lng,
    destinationLat: destination.lat,
    destinationLng: destination.lng,
    mode,
  });

  try {
    console.log(
      "🌐 Calling backend directions API:",
      `/maps/directions?${params.toString()}`
    );
    const response = await axiosInstance.get(
      `/maps/directions?${params.toString()}`
    );

    console.log("📦 Backend response received:", response.data);
    console.log("✅ Success:", response.data.success);
    console.log(
      "📍 Route polyline points:",
      response.data.route?.polyline?.length
    );

    // If backend returns error (e.g., invalid API key), use mock data
    if (!response.data.success) {
      console.warn(
        "⚠️ Backend API failed, using mock route data:",
        response.data.error
      );
      return generateMockRoute(origin, destination);
    }

    return response.data;
  } catch (error) {
    console.warn("⚠️ API call failed, using mock route data:", error.message);
    return generateMockRoute(origin, destination);
  }
}
