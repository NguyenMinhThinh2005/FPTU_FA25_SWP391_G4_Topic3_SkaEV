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
  
  // Generate detailed steps for navigation (like Google Maps)
  // More steps for longer distances, varied instructions
  const stepCount = Math.max(5, Math.min(15, Math.round(distanceKm / 1.5))); // 5-15 steps based on distance
  const steps = [];
  
  // Create varied step distances (not all equal)
  const stepDistances = [];
  let remainingDistance = distanceMeters;
  for (let i = 0; i < stepCount - 1; i++) {
    // Vary step distances: some short (0.3-0.8 km), some medium (0.8-2 km), some long (2-4 km)
    const ratio = i / (stepCount - 1);
    let stepDist;
    if (ratio < 0.3) {
      // First steps: shorter
      stepDist = Math.random() * 500 + 300; // 300-800m
    } else if (ratio < 0.7) {
      // Middle steps: medium
      stepDist = Math.random() * 1200 + 800; // 800-2000m
    } else {
      // Later steps: longer
      stepDist = Math.random() * 2000 + 1500; // 1500-3500m
    }
    stepDist = Math.min(stepDist, remainingDistance * 0.4); // Don't exceed 40% of remaining
    stepDistances.push(Math.round(stepDist));
    remainingDistance -= stepDist;
  }
  stepDistances.push(Math.round(remainingDistance)); // Last step gets remaining distance
  
  // Google Maps-like instructions
  const instructionTemplates = [
    { type: "start", texts: ["Bắt đầu đi từ vị trí hiện tại", "Bắt đầu hành trình"] },
    { type: "straight", texts: ["Đi thẳng", "Tiếp tục đi thẳng", "Giữ hướng hiện tại"] },
    { type: "turn", texts: ["Rẽ phải", "Rẽ trái", "Rẽ phải vào đường phía trước", "Rẽ trái vào đường phía trước"] },
    { type: "slight", texts: ["Hơi rẽ phải", "Hơi rẽ trái", "Rẽ nhẹ phải", "Rẽ nhẹ trái"] },
    { type: "sharp", texts: ["Rẽ gắt phải", "Rẽ gắt trái"] },
    { type: "continue", texts: ["Tiếp tục đi thẳng", "Giữ hướng", "Đi thẳng trên đường này"] },
    { type: "merge", texts: ["Nhập vào đường chính", "Nhập làn"] },
    { type: "roundabout", texts: ["Vào vòng xuyến, đi lối thứ nhất", "Vào vòng xuyến, đi lối thứ hai"] },
    { type: "end", texts: ["Đến đích", "Đã đến nơi", "Điểm đến ở bên phải"] }
  ];
  
  for (let i = 0; i < stepCount; i++) {
    const stepDistance = stepDistances[i];
    const stepDuration = Math.round((stepDistance / distanceMeters) * durationSeconds);
    const stepDistanceKm = stepDistance / 1000;
    
    let instructionText;
    if (i === 0) {
      // First step
      instructionText = instructionTemplates[0].texts[Math.floor(Math.random() * instructionTemplates[0].texts.length)];
    } else if (i === stepCount - 1) {
      // Last step
      instructionText = instructionTemplates[8].texts[Math.floor(Math.random() * instructionTemplates[8].texts.length)];
    } else {
      // Middle steps - vary instructions
      const rand = Math.random();
      let template;
      if (rand < 0.3) {
        template = instructionTemplates[1]; // straight
      } else if (rand < 0.5) {
        template = instructionTemplates[2]; // turn
      } else if (rand < 0.65) {
        template = instructionTemplates[3]; // slight turn
      } else if (rand < 0.75) {
        template = instructionTemplates[5]; // continue
      } else if (rand < 0.85) {
        template = instructionTemplates[6]; // merge
      } else {
        template = instructionTemplates[7]; // roundabout
      }
      instructionText = template.texts[Math.floor(Math.random() * template.texts.length)];
    }
    
    steps.push({
      index: i,
      instructionText: instructionText,
      distanceText: stepDistanceKm >= 1 
        ? `${stepDistanceKm.toFixed(1)} km` 
        : `${stepDistance} m`,
      distanceMeters: stepDistance,
      durationText: stepDuration >= 60
        ? `${Math.floor(stepDuration / 60)} phút`
        : `${stepDuration} giây`,
      durationSeconds: stepDuration
    });
  }
  
>>>>>>> ddee1da3e1e17e958be48f8b5197d3ccb54954ea
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
        steps: steps
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
<<<<<<< HEAD

=======
    
    // If backend returns success but no route data, use mock data
    if (response.data.success && (!response.data.route || !response.data.route.polyline || response.data.route.polyline.length === 0)) {
      console.warn("⚠️ Backend API returned success but no route data, using mock route data");
      return generateMockRoute(origin, destination);
    }
    
    // Log steps from backend
    if (response.data.route && response.data.route.leg) {
      const stepCount = response.data.route.leg.steps?.length || 0;
      console.log(`✅ Backend returned route with ${stepCount} steps from Google Maps/OSRM`);
      if (stepCount === 0) {
        console.warn("⚠️ Backend API returned route but no steps. This might indicate API key issue or API not returning steps.");
      }
    }
    
    // Only use mock steps if backend truly has no steps (don't override real Google Maps steps)
    // This ensures we use real Google Maps directions when available
>>>>>>> ddee1da3e1e17e958be48f8b5197d3ccb54954ea
    return response.data;
  } catch (error) {
    console.warn("⚠️ API call failed, using mock route data:", error.message);
    return generateMockRoute(origin, destination);
  }
}
