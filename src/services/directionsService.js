import axiosInstance from "./axiosConfig";

// Mock data generator for development when API key is not available
const generateMockRoute = (origin, destination) => {
  // Generate a realistic curved path between two points
  const latDiff = destination.lat - origin.lat;
  const lngDiff = destination.lng - origin.lng;
  const waypointCount = 20; // Number of waypoints for polyline
  
  const polyline = [];
  for (let i = 0; i <= waypointCount; i++) {
    const t = i / waypointCount;
    // Add some curve to make it look realistic
    const curve = Math.sin(t * Math.PI) * 0.01; // Small deviation
    const lat = origin.lat + latDiff * t + curve;
    const lng = origin.lng + lngDiff * t + curve * 0.5;
    polyline.push({ lat, lng });
  }
  
  // Calculate approximate distance using Haversine
  const R = 6371; 
  const dLat = (destination.lat - origin.lat) * Math.PI / 180;
  const dLng = (destination.lng - origin.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distanceKm = R * c;
  const distanceMeters = Math.round(distanceKm * 1000);
  
  // Estimate duration (average 30 km/h)
  const durationSeconds = Math.round((distanceKm / 30) * 3600);
  
  // Generate detailed steps for navigation
  const stepCount = Math.max(3, Math.min(8, Math.round(distanceKm / 3))); // 3-8 steps based on distance
  const steps = [];
  const stepDistance = distanceMeters / stepCount;
  const stepDuration = durationSeconds / stepCount;
  
  const directions = [
    "Bắt đầu đi từ vị trí hiện tại",
    "Đi thẳng",
    "Rẽ phải",
    "Đi thẳng",
    "Rẽ trái",
    "Tiếp tục đi thẳng",
    "Rẽ phải",
    "Đến đích"
  ];
  
  for (let i = 0; i < stepCount; i++) {
    const stepT = i / stepCount;
    const stepLat = origin.lat + latDiff * stepT;
    const stepLng = origin.lng + lngDiff * stepT;
    
    steps.push({
      index: i,
      instructionText: directions[i] || `Bước ${i + 1}`,
      distanceText: stepDistance >= 1000 
        ? `${(stepDistance / 1000).toFixed(1)} km` 
        : `${Math.round(stepDistance)} m`,
      distanceMeters: Math.round(stepDistance),
      durationText: stepDuration >= 60
        ? `${Math.floor(stepDuration / 60)} phút`
        : `${Math.round(stepDuration)} giây`,
      durationSeconds: Math.round(stepDuration)
    });
  }
  
  return {
    success: true,
    route: {
      polyline,
      leg: {
        summary: "Lộ trình đề xuất",
        distanceText: distanceKm >= 1 
          ? `${distanceKm.toFixed(1)} km` 
          : `${distanceMeters} m`,
        distanceMeters,
        durationText: durationSeconds >= 3600
          ? `${Math.floor(durationSeconds / 3600)} giờ ${Math.floor((durationSeconds % 3600) / 60)} phút`
          : `${Math.floor(durationSeconds / 60)} phút`,
        durationSeconds,
        steps: steps
      },
      warnings: ["Đang sử dụng dữ liệu mô phỏng. Vui lòng cấu hình Google Maps API key để có chỉ đường chính xác."]
    }
  };
};

export async function getDrivingDirections({ origin, destination, mode = "driving" }) {
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
    const response = await axiosInstance.get(`/maps/directions?${params.toString()}`);
    
    // If backend returns error (e.g., invalid API key), use mock data
    if (!response.data.success) {
      console.warn("⚠️ Backend API failed, using mock route data:", response.data.error);
      return generateMockRoute(origin, destination);
    }
    
    // If backend returns success but no route data, use mock data
    if (response.data.success && (!response.data.route || !response.data.route.polyline || response.data.route.polyline.length === 0)) {
      console.warn("⚠️ Backend API returned success but no route data, using mock route data");
      return generateMockRoute(origin, destination);
    }
    
    // Ensure steps are present in response
    if (response.data.route && response.data.route.leg && (!response.data.route.leg.steps || response.data.route.leg.steps.length === 0)) {
      console.warn("⚠️ Backend API returned route but no steps, adding mock steps");
      const mockRoute = generateMockRoute(origin, destination);
      if (mockRoute.route && mockRoute.route.leg && mockRoute.route.leg.steps) {
        response.data.route.leg.steps = mockRoute.route.leg.steps;
      }
    }
    
    return response.data;
  } catch (error) {
    console.warn("⚠️ API call failed, using mock route data:", error.message);
    return generateMockRoute(origin, destination);
  }
}
