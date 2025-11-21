/* eslint-disable */
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Alert,
} from "@mui/material";
import {
  MyLocation as MyLocationIcon,
  ElectricCar,
  LocationOn,
  Speed,
  Close as CloseIcon,
  EvStation as EvStationIcon,
  Directions as DirectionsIcon,
} from "@mui/icons-material";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Polyline,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { getDrivingDirections } from "../../services/directionsService";

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const noop = () => {};

// Custom icons for different station statuses
const createStationIcon = (isAvailable) => {
  const color = isAvailable ? "#4caf50" : "#f44336";
  return L.divIcon({
    className: "custom-station-icon",
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM12 10H6V5h6v5zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
        </svg>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

// User location icon
const userIcon = L.divIcon({
  className: "custom-user-icon",
  html: `
    <div style="
      background-color: #2196f3;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 10px rgba(33,150,243,0.6);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  if (
    lat1 == null ||
    lon1 == null ||
    lat2 == null ||
    lon2 == null ||
    Number.isNaN(lat1) ||
    Number.isNaN(lon1) ||
    Number.isNaN(lat2) ||
    Number.isNaN(lon2)
  ) {
    return null;
  }

  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const stripHtmlTags = (value) => {
  if (!value) return "";
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const formatDistanceText = (distance) => {
  if (distance === null || distance === undefined) return "";
  if (typeof distance === "string") return distance;
  if (typeof distance === "number") {
    if (distance >= 1000) {
      const km = distance / 1000;
      return `${km >= 10 ? Math.round(km) : km.toFixed(1)} km`;
    }
    return `${Math.round(distance)} m`;
  }
  if (typeof distance === "object") {
    if (distance.text) return String(distance.text);
    if (typeof distance.value === "number") return formatDistanceText(distance.value);
    if (typeof distance.meters === "number") return formatDistanceText(distance.meters);
  }
  return "";
};

const formatDurationText = (duration) => {
  if (duration === null || duration === undefined) return "";
  if (typeof duration === "string") return duration;
  const toText = (seconds) => {
    if (seconds === null || seconds === undefined) return "";
    const totalMinutes = Math.max(1, Math.round(seconds / 60));
    if (totalMinutes < 60) {
      return `${totalMinutes} phút`;
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (minutes === 0) {
      return `${hours} giờ`;
    }
    return `${hours} giờ ${minutes} phút`;
  };

  if (typeof duration === "number") {
    return toText(duration);
  }
  if (typeof duration === "object") {
    if (duration.text) return String(duration.text);
    if (typeof duration.value === "number") return toText(duration.value);
    if (typeof duration.seconds === "number") return toText(duration.seconds);
    if (typeof duration.duration === "number") return toText(duration.duration);
  }
  return "";
};

const buildRouteSummary = (route) => {
  if (!route) return null;

  const summary = {
    provider: route.provider || "google",
    summary: route.summary || "",
    warnings: Array.isArray(route.warnings) ? route.warnings : [],
    steps: [],
    distanceMeters: null,
    durationSeconds: null,
    distanceText: "",
    durationText: "",
    startAddress: route.startAddress || "",
    endAddress: route.endAddress || "",
  };

  const processedLegs = new Set();

  const applyLegData = (leg) => {
    if (!leg || processedLegs.has(leg)) return;
    processedLegs.add(leg);

    summary.startAddress = summary.startAddress || leg.start_address || leg.startAddress || "";
    summary.endAddress = summary.endAddress || leg.end_address || leg.endAddress || "";
    if (summary.distanceMeters == null && leg.distance) {
      summary.distanceMeters =
        typeof leg.distance.value === "number"
          ? leg.distance.value
          : typeof leg.distance === "number"
          ? leg.distance
          : typeof leg.distance.meters === "number"
          ? leg.distance.meters
          : summary.distanceMeters;
    }
    if (summary.durationSeconds == null && leg.duration) {
      summary.durationSeconds =
        typeof leg.duration.value === "number"
          ? leg.duration.value
          : typeof leg.duration === "number"
          ? leg.duration
          : typeof leg.duration.seconds === "number"
          ? leg.duration.seconds
          : summary.durationSeconds;
    }
    summary.distanceText = summary.distanceText || formatDistanceText(leg.distance);
    summary.durationText = summary.durationText || formatDurationText(leg.duration);

    if (Array.isArray(leg.steps)) {
      const baseIndex = summary.steps.length;
      const legSteps = leg.steps.map((step, index) => {
        const instructionHtml =
          step.html_instructions ||
          step.instructionHtml ||
          step.instruction ||
          step.narrative ||
          step.maneuver ||
          "";
        const instructionText = stripHtmlTags(instructionHtml) || `Bước ${index + 1}`;
        return {
          index: baseIndex + index,
          instructionHtml,
          instructionText,
          distanceText: formatDistanceText(step.distance),
          durationText: formatDurationText(step.duration),
        };
      });
      if (legSteps.length) {
        summary.steps = summary.steps.concat(legSteps);
      }
    }
  };

  const candidateRoutes = [];
  if (route.route) candidateRoutes.push(route.route);
  if (route.data) candidateRoutes.push(route.data);
  if (route.result) candidateRoutes.push(route.result);
  if (Array.isArray(route.routes)) candidateRoutes.push(...route.routes);
  if (Array.isArray(route.data?.routes)) candidateRoutes.push(...route.data.routes);
  candidateRoutes.push(route);

  candidateRoutes.forEach((candidate) => {
    if (!candidate) return;

    summary.provider = summary.provider || candidate.provider || "google";
    summary.summary = summary.summary || candidate.summary || candidate.summaryText || "";
    if (!summary.warnings.length && Array.isArray(candidate.warnings)) {
      summary.warnings = candidate.warnings;
    }

    if (Array.isArray(candidate.legs) && candidate.legs.length > 0) {
      candidate.legs.forEach((leg) => applyLegData(leg));
    }

    summary.distanceText =
      summary.distanceText ||
      formatDistanceText(
        candidate.distance ||
          candidate.distanceMeters ||
          candidate.overview_distance ||
          candidate.total_distance
      );
    summary.durationText =
      summary.durationText ||
      formatDurationText(
        candidate.duration ||
          candidate.durationSeconds ||
          candidate.overview_duration ||
          candidate.total_duration
      );

    if (summary.distanceMeters == null) {
      const candidateDistance =
        (candidate.distance && candidate.distance.value) ??
        candidate.distance ??
        candidate.distanceMeters ??
        candidate.total_distance;
      if (typeof candidateDistance === "number") {
        summary.distanceMeters = candidateDistance;
      }
    }

    if (summary.durationSeconds == null) {
      const candidateDuration =
        (candidate.duration && candidate.duration.value) ??
        candidate.duration ??
        candidate.durationSeconds ??
        candidate.total_duration;
      if (typeof candidateDuration === "number") {
        summary.durationSeconds = candidateDuration;
      }
    }

    if (!summary.steps.length && Array.isArray(candidate.steps)) {
      const baseIndex = summary.steps.length;
      const directSteps = candidate.steps.map((step, index) => {
        const instructionHtml =
          step.html_instructions || step.instructionHtml || step.instruction || "";
        return {
          index: baseIndex + index,
          instructionHtml,
          instructionText: stripHtmlTags(instructionHtml) || `Bước ${index + 1}`,
          distanceText: formatDistanceText(step.distance),
          durationText: formatDurationText(step.duration),
        };
      });
      if (directSteps.length) {
        summary.steps = summary.steps.concat(directSteps);
      }
    }
  });

  summary.distanceText = summary.distanceText || formatDistanceText(route.distance);
  summary.durationText = summary.durationText || formatDurationText(route.duration);

  if (summary.distanceMeters == null) {
    if (route.distance && typeof route.distance.value === "number") {
      summary.distanceMeters = route.distance.value;
    } else if (typeof route.distanceMeters === "number") {
      summary.distanceMeters = route.distanceMeters;
    }
  }

  if (summary.durationSeconds == null) {
    if (route.duration && typeof route.duration.value === "number") {
      summary.durationSeconds = route.duration.value;
    } else if (typeof route.durationSeconds === "number") {
      summary.durationSeconds = route.durationSeconds;
    }
  }

  if (!summary.steps.length && Array.isArray(route.steps)) {
    const baseIndex = summary.steps.length;
    const routeSteps = route.steps.map((step, index) => {
      const instructionHtml =
        step.html_instructions || step.instructionHtml || step.instruction || "";
      return {
        index: baseIndex + index,
        instructionHtml,
        instructionText: stripHtmlTags(instructionHtml) || `Bước ${index + 1}`,
        distanceText: formatDistanceText(step.distance),
        durationText: formatDurationText(step.duration),
      };
    });
    if (routeSteps.length) {
      summary.steps = summary.steps.concat(routeSteps);
    }
  }

  return summary;
};

const buildFallbackSummary = (origin, destination, requestId) => {
  if (!origin || !destination) return null;
  
  // Create a more visible route with intermediate points instead of just 2 points
  const latDiff = destination.lat - origin.lat;
  const lngDiff = destination.lng - origin.lng;
  const waypointCount = Math.max(10, Math.min(30, Math.round(Math.abs(latDiff) * 100 + Math.abs(lngDiff) * 100))); // 10-30 points based on distance
  
  const polyline = [];
  for (let i = 0; i <= waypointCount; i++) {
    const t = i / waypointCount;
    // Add slight curve to make it more visible and realistic
    const curve = Math.sin(t * Math.PI) * 0.002; // Small deviation
    const lat = origin.lat + latDiff * t + curve;
    const lng = origin.lng + lngDiff * t + curve * 0.5;
    polyline.push([lat, lng]);
  }
  
  const distanceMeters = haversineDistance(
    origin.lat,
    origin.lng,
    destination.lat,
    destination.lng
  );
  const distanceKm = distanceMeters / 1000;
  const durationSeconds = distanceMeters
    ? Math.round(((distanceMeters / 1000) / 40) * 3600)
    : null; // assume 40 km/h for fallback estimate

  // Generate detailed steps for fallback route
  const stepCount = Math.max(3, Math.min(8, Math.round(distanceKm / 3))); // 3-8 steps based on distance
  const stepDistance = distanceMeters / stepCount;
  const stepDuration = durationSeconds ? durationSeconds / stepCount : 0;
  
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
  
  const steps = [];
  for (let i = 0; i < stepCount; i++) {
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
    requestId,
    origin,
    destination,
    provider: "fallback",
    usedFallback: true,
    polyline,
    distanceMeters,
    distanceText: formatDistanceText(distanceMeters),
    durationSeconds,
    durationText: formatDurationText(durationSeconds),
    steps: steps,
    warnings: [
      "Không thể tải chỉ đường chi tiết. Đang hiển thị tuyến đường gần đúng.",
    ],
  };
};

const decodePolyline = (encoded) => {
  if (!encoded || typeof encoded !== "string") return [];

  let index = 0;
  const length = encoded.length;
  const coordinates = [];
  let lat = 0;
  let lng = 0;

  while (index < length) {
    let result = 0;
    let shift = 0;
    let byte = null;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < length);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < length);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push([lat / 1e5, lng / 1e5]);
  }

  return coordinates;
};

const coerceNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const isValidLat = (value) => typeof value === "number" && value >= -90 && value <= 90;
const isValidLng = (value) => typeof value === "number" && value >= -180 && value <= 180;

const normalizeLatLngTuple = (lat, lng) => {
  const normalizedLat = coerceNumber(lat);
  const normalizedLng = coerceNumber(lng);

  if (isValidLat(normalizedLat) && isValidLng(normalizedLng)) {
    return [normalizedLat, normalizedLng];
  }

  if (isValidLat(normalizedLng) && isValidLng(normalizedLat)) {
    return [normalizedLng, normalizedLat];
  }

  return null;
};

const parsePointToTuple = (point) => {
  if (!point) return null;

  if (Array.isArray(point) && point.length >= 2) {
    return normalizeLatLngTuple(point[0], point[1]);
  }

  if (typeof point === "object") {
    const tupleByKey = normalizeLatLngTuple(
      point.lat ?? point.latitude ?? point.y ?? point[1],
      point.lng ?? point.lon ?? point.longitude ?? point.x ?? point[0]
    );
    if (tupleByKey) return tupleByKey;

    if (typeof point.latLng === "string") {
      const parts = point.latLng.split(",");
      if (parts.length >= 2) {
        return normalizeLatLngTuple(parts[0], parts[1]);
      }
    }
  }

  if (typeof point === "string") {
    const parts = point.split(",");
    if (parts.length >= 2) {
      return normalizeLatLngTuple(parts[0], parts[1]);
    }
  }

  return null;
};

const extractCoordsFromArray = (points) => {
  if (!Array.isArray(points)) return [];
  const tuples = points
    .map((pt) => parsePointToTuple(pt))
    .filter((tuple) => Array.isArray(tuple) && tuple.length === 2);
  return tuples.length >= 2 ? tuples : [];
};

const mergeCoordinateSegments = (segments) => {
  if (!Array.isArray(segments)) return [];
  const merged = [];
  const epsilon = 1e-6;

  const areSamePoint = (a, b) =>
    a &&
    b &&
    Math.abs(a[0] - b[0]) < epsilon &&
    Math.abs(a[1] - b[1]) < epsilon;

  segments.forEach((segment) => {
    if (!Array.isArray(segment)) return;

    segment.forEach((coord, index) => {
      if (!Array.isArray(coord) || coord.length !== 2) return;
      if (!Number.isFinite(coord[0]) || !Number.isFinite(coord[1])) return;

      if (merged.length) {
        const last = merged[merged.length - 1];
        if (index === 0 && areSamePoint(last, coord)) {
          return;
        }
      }

      merged.push(coord);
    });
  });

  return merged;
};

const collectCoordsFromSteps = (steps) => {
  if (!Array.isArray(steps)) return [];

  const segments = steps
    .map((step) => {
      if (!step) return [];

      if (typeof step.polyline === "string") {
        return decodePolyline(step.polyline);
      }

      if (step.polyline && typeof step.polyline.points === "string") {
        return decodePolyline(step.polyline.points);
      }

      if (Array.isArray(step.polyline)) {
        return extractCoordsFromArray(step.polyline);
      }

      const start = parsePointToTuple(step.start_location || step.startLocation);
      const end = parsePointToTuple(step.end_location || step.endLocation);
      if (start && end) {
        return [start, end];
      }

      return [];
    })
    .filter((segment) => Array.isArray(segment) && segment.length);

  return mergeCoordinateSegments(segments);
};

const extractPolylineFromRoute = (route, origin, destination) => {
  const fallbackResult = { coords: [], usedFallback: true };

  if (!route) {
    const originTuple = parsePointToTuple(origin);
    const destinationTuple = parsePointToTuple(destination);
    if (originTuple && destinationTuple) {
      return { coords: [originTuple, destinationTuple], usedFallback: true };
    }
    return fallbackResult;
  }

  const candidates = [];
  if (route.route) candidates.push(route.route);
  if (route.data) candidates.push(route.data);
  if (route.result) candidates.push(route.result);
  if (Array.isArray(route.routes)) candidates.push(...route.routes);
  if (Array.isArray(route.data?.routes)) candidates.push(...route.data.routes);
  candidates.push(route);

  for (const candidate of candidates) {
    if (!candidate) continue;

    let coords = extractCoordsFromArray(candidate.polyline);

    if (!coords.length && typeof candidate.polyline === "string") {
      coords = decodePolyline(candidate.polyline);
    }

    if (!coords.length && candidate.polyline && typeof candidate.polyline.points === "string") {
      coords = decodePolyline(candidate.polyline.points);
    }

    if (!coords.length && candidate.overview_polyline?.points) {
      coords = decodePolyline(candidate.overview_polyline.points);
    }

    if (!coords.length && candidate.overviewPolyline?.points) {
      coords = decodePolyline(candidate.overviewPolyline.points);
    }

    if (!coords.length && Array.isArray(candidate.path)) {
      coords = extractCoordsFromArray(candidate.path);
    }

    if (!coords.length && Array.isArray(candidate.points)) {
      coords = extractCoordsFromArray(candidate.points);
    }

    if (!coords.length && Array.isArray(candidate.steps)) {
      coords = collectCoordsFromSteps(candidate.steps);
    }

    if (!coords.length && Array.isArray(candidate.legs)) {
      const legSegments = candidate.legs
        .map((leg) => {
          const stepCoords = collectCoordsFromSteps(leg.steps);
          if (stepCoords.length) {
            return stepCoords;
          }

          const start = parsePointToTuple(leg.start_location || leg.startLocation);
          const end = parsePointToTuple(leg.end_location || leg.endLocation);
          const legCoords = [];
          if (start) legCoords.push(start);
          if (end) legCoords.push(end);
          return legCoords.length >= 2 ? legCoords : [];
        })
        .filter((segment) => segment.length >= 2);

      coords = mergeCoordinateSegments(legSegments);
    }

    if (coords.length >= 2) {
      return { coords, usedFallback: false };
    }
  }

  const originTuple = parsePointToTuple(origin);
  const destinationTuple = parsePointToTuple(destination);
  if (originTuple && destinationTuple) {
    return { coords: [originTuple, destinationTuple], usedFallback: true };
  }

  return fallbackResult;
};

// Helper to render operating hours safely
const formatOperatingHours = (oh) => {
  if (!oh) return "";
  if (typeof oh === "string") {
    // Map common shorthand to a friendly Vietnamese label
    if (oh.trim().toLowerCase() === "24/7") return `Hoạt động: Cả ngày`;
    return `Hoạt động: ${oh}`;
  }
  // If it's an object, check fields (support shape variations)
  const openRaw = oh.open || "";
  const closeRaw = oh.close || "";
  const open = String(openRaw).trim().toLowerCase();
  const close = String(closeRaw).trim().toLowerCase();

  // If either side uses the 24/7 shorthand, show friendly label
  if (open === "24/7" || close === "24/7") return `Hoạt động: Cả ngày`;

  if (openRaw && closeRaw) return `Hoạt động: ${openRaw} - ${closeRaw}`;
  if (openRaw) return `Hoạt động: ${openRaw}`;
  if (closeRaw) return `Hoạt động: ${closeRaw}`;
  return "";
};

// Component to fit map bounds
const MapBoundsSetter = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
};

// Component to handle route drawing
const RouteDrawer = ({
  userLocation,
  destination,
  requestId,
  onRouteReady = noop,
  onRouteError = noop,
}) => {
  const [routeCoords, setRouteCoords] = useState([]);
  const [isFallbackRoute, setIsFallbackRoute] = useState(false);

  useEffect(() => {
    console.log(
      "🚗 RouteDrawer: userLocation=",
      userLocation,
      "destination=",
      destination,
      "requestId=",
      requestId
    );

    if (!userLocation || !destination) {
      console.warn("⚠️ RouteDrawer: Missing userLocation or destination");
      setRouteCoords([]);
      setIsFallbackRoute(false);
      onRouteError({
        message: "Thiếu thông tin vị trí để vẽ tuyến đường.",
        requestId,
      });
      return;
    }

    if (
      !userLocation.lat ||
      !userLocation.lng ||
      !destination.lat ||
      !destination.lng
    ) {
      console.warn("⚠️ RouteDrawer: Invalid coordinates", {
        userLocation,
        destination,
      });
      setRouteCoords([]);
      setIsFallbackRoute(false);
      onRouteError({
        message: "Tọa độ không hợp lệ để chỉ đường.",
        requestId,
      });
      return;
    }

    // Always create a fallback route immediately so user sees something on map
    const immediateFallback = buildFallbackSummary(userLocation, destination, requestId);
    if (immediateFallback && immediateFallback.polyline) {
      console.log("📍 RouteDrawer: Setting immediate fallback route with", immediateFallback.polyline.length, "points");
      setRouteCoords(immediateFallback.polyline);
      setIsFallbackRoute(true);
    }

    const fetchRoute = async () => {
      try {
        console.log("🌐 Fetching route from Google Directions API via backend...");
        console.log("Origin:", userLocation);
        console.log("Destination:", destination);
        
        const response = await getDrivingDirections({
          origin: userLocation,
          destination,
        });
        
        console.log("📦 Full Backend response:", JSON.stringify(response, null, 2));
        console.log("📦 Response type:", typeof response);
        console.log("📦 Response keys:", Object.keys(response || {}));
        
        // After interceptor unwrap, response should be DirectionsResponseDto
        // Structure: { success: boolean, route?: DirectionsRouteDto, error?: string }
        const { success, route, error } = response || {};
        
        console.log("Success:", success);
        console.log("Route:", route);
        console.log("Error:", error);
        console.log("Route type:", typeof route);
        console.log("Route keys:", route ? Object.keys(route) : "route is null/undefined");
        console.log("Route.polyline:", route?.polyline);
        console.log("Route.polyline type:", typeof route?.polyline);
        console.log("Route.polyline length:", Array.isArray(route?.polyline) ? route.polyline.length : "not an array");
        
        // Validate response has route data
        if (success && (!route || !route.polyline || !Array.isArray(route.polyline) || route.polyline.length === 0)) {
          console.warn("⚠️ API returned success but route data is missing or empty");
          console.warn("⚠️ Route object:", route);
          // Don't return here, let it fall through to create fallback
        }

        // If API fails but we have fallback route, keep it visible
        if (!success && routeCoords.length === 0) {
          const fallbackSummary = buildFallbackSummary(userLocation, destination, requestId);
          if (fallbackSummary) {
            setRouteCoords(fallbackSummary.polyline);
            setIsFallbackRoute(true);
            onRouteReady(fallbackSummary);
          }
        }

        // Check if backend returned decoded polyline directly
        if (success && route?.polyline && Array.isArray(route.polyline) && route.polyline.length >= 2) {
          console.log("✅ Using decoded polyline from backend, points:", route.polyline.length);
          
          // Convert backend polyline format [{lat, lng}] to Leaflet format [[lat, lng]]
          const coords = route.polyline.map(point => [point.lat, point.lng]);
          
          const summarySource = {
            provider: "google",
            summary: route.leg?.summary || "",
            warnings: route.warnings || [],
            steps: route.leg?.steps || [],
            distanceMeters: route.leg?.distanceMeters || null,
            durationSeconds: route.leg?.durationSeconds || null,
            distanceText: route.leg?.distanceText || "",
            durationText: route.leg?.durationText || "",
            polyline: coords,
            requestId: requestId,
            origin: userLocation,
            destination: destination,
            usedFallback: false,
          };

          setRouteCoords(coords);
          setIsFallbackRoute(false);
          onRouteReady(summarySource);
          return;
        }

        // If success but no route data, create fallback immediately
        if (success && !route) {
          console.warn("⚠️ API returned success but route is undefined, creating fallback route");
          const fallbackSummary = buildFallbackSummary(userLocation, destination, requestId);
          if (fallbackSummary) {
            console.log("📍 Setting fallback route (success but no route data) with", fallbackSummary.polyline.length, "points");
            setRouteCoords(fallbackSummary.polyline);
            setIsFallbackRoute(true);
            onRouteReady(fallbackSummary);
            return;
          }
        }

        // Fallback: try extracting from legacy format
        const { coords, usedFallback } = extractPolylineFromRoute(
          route,
          userLocation,
          destination
        );

        if (success && coords.length >= 2 && !usedFallback) {
          console.log("✅ Using extracted polyline, points:", coords.length);
          const summarySource = buildRouteSummary(route) || {};
          summarySource.polyline = coords;
          summarySource.requestId = requestId;
          summarySource.origin = userLocation;
          summarySource.destination = destination;
          summarySource.usedFallback = false;
          
          // Ensure steps are included if available
          if (route?.leg?.steps && Array.isArray(route.leg.steps)) {
            summarySource.steps = route.leg.steps.map((step, idx) => ({
              index: step.index ?? idx,
              instructionText: step.instructionText || step.instruction || `Bước ${idx + 1}`,
              distanceText: step.distanceText || step.distance || "",
              distanceMeters: step.distanceMeters || 0,
              durationText: step.durationText || step.duration || "",
              durationSeconds: step.durationSeconds || 0
            }));
          }

          if (summarySource.distanceMeters == null && coords.length >= 2) {
            summarySource.distanceMeters = haversineDistance(
              coords[0][0],
              coords[0][1],
              coords[coords.length - 1][0],
              coords[coords.length - 1][1]
            );
            summarySource.distanceText =
              summarySource.distanceText ||
              formatDistanceText(summarySource.distanceMeters);
          }

          if (
            summarySource.durationSeconds == null &&
            summarySource.distanceMeters != null
          ) {
            const estimatedSeconds = Math.round(
              ((summarySource.distanceMeters / 1000) / 40) * 3600
            );
            summarySource.durationSeconds = estimatedSeconds;
            summarySource.durationText =
              summarySource.durationText ||
              formatDurationText(estimatedSeconds);
          }

          setRouteCoords(coords);
          setIsFallbackRoute(false);
          onRouteReady(summarySource);
        } else {
          console.warn(
            "⚠️ Directions API did not return detailed geometry:",
            error || (success ? "NO_GEOMETRY" : "REQUEST_FAILED")
          );
          // Always create fallback route if API fails
          const fallbackSummary = buildFallbackSummary(
            userLocation,
            destination,
            requestId
          );
          if (fallbackSummary) {
            if (success && usedFallback) {
              const warningText =
                "Không tìm thấy lộ trình chi tiết. Đang hiển thị tuyến đường gần đúng.";
              if (!fallbackSummary.warnings.includes(warningText)) {
                fallbackSummary.warnings = [
                  ...fallbackSummary.warnings,
                  warningText,
                ];
              }
            }
            // Ensure route is always displayed
            console.log("📍 Setting fallback route with", fallbackSummary.polyline.length, "points");
            setRouteCoords(fallbackSummary.polyline);
            setIsFallbackRoute(true);
            onRouteReady(fallbackSummary);
          } else {
            // Even if buildFallbackSummary fails, create a simple straight line
            const simpleRoute = [
              [userLocation.lat, userLocation.lng],
              [destination.lat, destination.lng]
            ];
            console.log("📍 Setting simple straight route with", simpleRoute.length, "points");
            setRouteCoords(simpleRoute);
            setIsFallbackRoute(true);
            onRouteError({
              message: error || "Không thể tìm thấy tuyến đường phù hợp. Đang hiển thị tuyến đường gần đúng.",
              requestId,
            });
          }
        }
      } catch (error) {
        console.error("❌ Error fetching Google directions:", error);
        // Always create fallback route on error
        const fallbackSummary = buildFallbackSummary(
          userLocation,
          destination,
          requestId
        );
        if (fallbackSummary) {
          console.log("📍 Setting fallback route on error with", fallbackSummary.polyline.length, "points");
          setRouteCoords(fallbackSummary.polyline);
          setIsFallbackRoute(true);
          onRouteReady(fallbackSummary);
        } else {
          // Even if buildFallbackSummary fails, create a simple straight line
          const simpleRoute = [
            [userLocation.lat, userLocation.lng],
            [destination.lat, destination.lng]
          ];
          console.log("📍 Setting simple straight route on error with", simpleRoute.length, "points");
          setRouteCoords(simpleRoute);
          setIsFallbackRoute(true);
          onRouteError({
            message: error?.message || "Không thể tải chỉ đường. Đang hiển thị tuyến đường gần đúng.",
            requestId,
          });
        }
      }
    };

    fetchRoute();
  }, [
    userLocation?.lat,
    userLocation?.lng,
    destination?.lat,
    destination?.lng,
    requestId,
  ]);

  if (routeCoords.length === 0) {
    console.warn("⚠️ RouteDrawer: routeCoords is empty, cannot render route");
    return null;
  }

  console.log("🎨 Rendering route with", routeCoords.length, "points, isFallback:", isFallbackRoute);

  return (
    <>
      {/* White outline for better visibility */}
      <Polyline
        positions={routeCoords}
        pathOptions={{
          color: isFallbackRoute ? "#ffffff" : "#ffffff",
          weight: isFallbackRoute ? 8 : 10,
          opacity: isFallbackRoute ? 0.9 : 0.9,
          dashArray: isFallbackRoute ? "15 10" : undefined,
          lineJoin: "round",
          lineCap: "round",
        }}
      />
      {/* Main route line */}
      <Polyline
        positions={routeCoords}
        pathOptions={{
          color: isFallbackRoute ? "#3b82f6" : "#1976d2", // Brighter blue for fallback
          weight: isFallbackRoute ? 5 : 6,
          opacity: isFallbackRoute ? 1 : 1,
          lineJoin: "round",
          lineCap: "round",
          dashArray: isFallbackRoute ? "10 8" : undefined,
        }}
      />
    </>
  );
};

// Helper function to get coordinates from station
const getStationCoords = (station) => {
  const toNumber = (v) => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const isValidLat = (v) => typeof v === "number" && v >= -90 && v <= 90;
  const isValidLng = (v) => typeof v === "number" && v >= -180 && v <= 180;

  if (!station) return { lat: null, lng: null };

  // Support multiple shapes: { coordinates: { lat, lng } }, { coordinates: [lng, lat] }, or flat fields
  const rawCoords = station.location?.coordinates;
  let lat = null;
  let lng = null;

  if (Array.isArray(rawCoords) && rawCoords.length >= 2) {
    // GeoJSON style: [lng, lat]
    lng = toNumber(rawCoords[0]);
    lat = toNumber(rawCoords[1]);
  } else if (rawCoords && typeof rawCoords === "object") {
    lat = toNumber(rawCoords.lat ?? rawCoords.latitude ?? station.latitude ?? station.lat);
    lng = toNumber(rawCoords.lng ?? rawCoords.longitude ?? station.longitude ?? station.lng);
  } else {
    lat = toNumber(station.location?.lat ?? station.latitude ?? station.lat);
    lng = toNumber(station.location?.lng ?? station.longitude ?? station.lng);
  }

  // Heuristic: if values look swapped (lat outside range but lng looks like lat), swap them
  if ((!isValidLat(lat) || !isValidLng(lng)) && isValidLat(lng) && isValidLng(lat)) {
    console.warn("🔁 Swapping lat/lng for station (detected swapped values):", { stationId: station.id, lat, lng });
    const tmp = lat;
    lat = lng;
    lng = tmp;
  }

  if (!isValidLat(lat) || !isValidLng(lng)) {
    console.warn("⚠️ Station has invalid coordinates and will be skipped on map:", station.id, { lat, lng });
    return { lat: null, lng: null };
  }

  return { lat, lng };
};

const StationMapLeaflet = ({
  stations,
  onStationSelect,
  userLocation: externalUserLocation = null, // Accept external user location
  showRoute: externalShowRoute = false, // Accept external showRoute flag
  centerOnStation = false, // Accept centerOnStation flag
  onDirectionsReady = noop,
  onDirectionsError = noop,
  routeRequestId = 0,
}) => {
  const [userLocation, setUserLocation] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedFromList, setSelectedFromList] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [pendingFindNearby, setPendingFindNearby] = useState(false);
  const mapRef = useRef(null);
  const [nearbyBounds, setNearbyBounds] = useState(null);
  const [nearbyStations, setNearbyStations] = useState([]);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [findNearbyError, setFindNearbyError] = useState(null);
  const [shouldZoomToUser, setShouldZoomToUser] = useState(false);

  const FitBoundsRunner = ({ bounds }) => {
    const map = useMap();
    useEffect(() => {
      if (!bounds || !map || !shouldZoomToUser) return;
      try {
        if (typeof map.invalidateSize === "function") map.invalidateSize();
        if (typeof map.fitBounds === "function") {
          map.fitBounds(bounds, { padding: [80, 80], animate: true });
        } else if (typeof map.flyToBounds === "function") {
          map.flyToBounds(bounds, { padding: [80, 80], animate: true });
        }
        // briefly show user popup
        setShowUserPopup(true);
        const t = setTimeout(() => {
          setShowUserPopup(false);
          setShouldZoomToUser(false); // Reset flag after zooming
        }, 2500);
        return () => clearTimeout(t);
      } catch (err) {
        console.error("FitBoundsRunner error", err);
      }
    }, [bounds, map, shouldZoomToUser]);
    return null;
  };

  // Find nearby stations and fit bounds to include user + those stations
  const handleFindNearby = (
    options = { maxResults: 5, maxDistanceMeters: 5000 }
  ) => {
    setFindNearbyError(null);
    console.log("🔎 Find nearby clicked", { userLocation, stations });
    if (!userLocation) {
      setFindNearbyError("Không xác định được vị trí của bạn.");
      console.warn("No user location available yet");
      return;
    }
    const validStations = stations
      .map((s) => ({ station: s, coords: getStationCoords(s) }))
      .filter((x) => {
        const valid =
          x.coords &&
          x.coords.lat != null &&
          x.coords.lng != null &&
          !isNaN(x.coords.lat) &&
          !isNaN(x.coords.lng);
        if (!valid) {
          console.warn(
            "Trạm bị loại khỏi nearby do thiếu hoặc sai lat/lng:",
            x.station,
            x.coords
          );
        }
        return valid;
      });

    if (validStations.length === 0) {
      setFindNearbyError("Không có trạm nào có vị trí hợp lệ để tìm gần bạn.");
      console.warn("No valid station coordinates to search nearby");
      return;
    }

    const withDistance = validStations.map((x) => ({
      station: x.station,
      coords: x.coords,
      distance: haversineDistance(
        userLocation.lat,
        userLocation.lng,
        x.coords.lat,
        x.coords.lng
      ),
    }));

    withDistance.sort((a, b) => a.distance - b.distance);

    const nearby = withDistance
      .filter((x) => x.distance <= options.maxDistanceMeters)
      .slice(0, options.maxResults);
    // if none within maxDistance, take top N
    const result = nearby.length
      ? nearby
      : withDistance.slice(0, options.maxResults);
    console.log(
      "Nearby stations selected:",
      result.map((r) => ({
        id: r.station.id,
        distance: Math.round(r.distance),
        coords: r.coords,
      }))
    );
    // Log user location
    console.log("User location:", userLocation);
    // Log all nearby station coords
    result.forEach((r, idx) => {
      console.log(`Nearby[${idx}]:`, r.station.name, r.coords);
    });

    const boundsLatLngs = [
      [userLocation.lat, userLocation.lng],
      ...result.map((r) => [r.coords.lat, r.coords.lng]),
    ];
    // Set nearby stations and bounds; FitBoundsRunner (child) will perform fit when MapContainer is ready
    setNearbyStations(result);
    setNearbyBounds(boundsLatLngs);
    setShouldZoomToUser(true); // Enable zoom to user location
    // Also try immediate mapRef if available
    const map = mapRef.current;
    if (map) {
      try {
        if (typeof map.invalidateSize === "function") map.invalidateSize();
        if (typeof map.fitBounds === "function") {
          console.log(
            "Fitting bounds to include user + nearby stations (immediate)",
            boundsLatLngs
          );
          map.fitBounds(boundsLatLngs, { padding: [80, 80], animate: true });
        }
      } catch (err) {
        console.error("Immediate fitBounds failed", err);
      }
    } else {
      console.log(
        "Map not ready, nearby bounds will be applied when map initializes"
      );
      setPendingFindNearby(true);
    }
  };

  // If user requested find-nearby while map wasn't ready, run when mapReady
  useEffect(() => {
    if (pendingFindNearby && mapReady) {
      console.log("Pending find-nearby now executing because map is ready");
      setPendingFindNearby(false);
      handleFindNearby();
    }
  }, [pendingFindNearby, mapReady]);

  // Debug stations prop
  useEffect(() => {
    console.log("🗺️ StationMapLeaflet received stations:", stations);
    if (stations && stations.length > 0) {
      console.log("📍 First station location:", stations[0].location);
      const coords = getStationCoords(stations[0]);
      console.log("📍 Extracted coords:", coords);
      // Mark map as ready to render once we have stations
      // NOTE: don't set mapReady here - mapReady should reflect the actual Map instance
    }
  }, [stations, mapReady]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
        },
        (error) => {
          console.log("Geolocation error:", error);
        }
      );
    }
  }, []);

  // Handle external user location prop
  useEffect(() => {
    if (externalUserLocation) {
      console.log("🎯 Using external user location:", externalUserLocation);
      setUserLocation(externalUserLocation);
    }
  }, [externalUserLocation]);

  // Handle external showRoute prop and auto-select first station for navigation
  useEffect(() => {
    if (externalShowRoute && stations && stations.length > 0) {
      console.log("🗺️ External showRoute enabled, auto-selecting first station for navigation");
      setSelectedStation(stations[0]);
      setShowRoute(true);
      
      // Center map on station if requested
      if (centerOnStation && mapRef.current) {
        const coords = getStationCoords(stations[0]);
        if (coords.lat && coords.lng) {
          setTimeout(() => {
            try {
              mapRef.current.setView([coords.lat, coords.lng], 15, { animate: true });
            } catch (err) {
              console.error("Error centering on station:", err);
            }
          }, 500);
        }
      }
    }
  }, [externalShowRoute, stations, centerOnStation]);

  // Calculate map center and bounds
  const { center, bounds } = useMemo(() => {
    const allPoints = [...stations];
    if (userLocation) {
      allPoints.push({ location: userLocation });
    }

    if (allPoints.length === 0) {
      return {
        center: [10.7769, 106.7009], // HCM center
        bounds: null,
      };
    }

    // Filter valid coordinates - support both location.coordinates and location direct
    const validLats = allPoints
      .map((s) => s.location?.coordinates?.lat || s.location?.lat || s.lat)
      .filter((lat) => lat != null && !isNaN(lat));
    const validLngs = allPoints
      .map((s) => s.location?.coordinates?.lng || s.location?.lng || s.lng)
      .filter((lng) => lng != null && !isNaN(lng));

    if (validLats.length === 0 || validLngs.length === 0) {
      return {
        center: [10.7769, 106.7009], // HCM center fallback
        bounds: null,
      };
    }

    const centerLat = (Math.max(...validLats) + Math.min(...validLats)) / 2;
    const centerLng = (Math.max(...validLngs) + Math.min(...validLngs)) / 2;

    const result = {
      center: [centerLat, centerLng],
      bounds: [
        [Math.min(...validLats), Math.min(...validLngs)],
        [Math.max(...validLats), Math.max(...validLngs)],
      ],
    };

    console.log("🎯 Map center calculated:", result.center);
    return result;
  }, [stations, userLocation]);

  const handleStationClick = (station) => {
    setSelectedStation(station);
    setSelectedFromList(false);
    setShowRoute(false);
  };

  const handleListSelect = (station) => {
    setSelectedStation(station);
    setSelectedFromList(true);
    // center map on the selected station for visibility
    const coords = getStationCoords(station);
    if (mapRef.current && coords.lat && coords.lng) {
      mapRef.current.setView([coords.lat, coords.lng], 15, { animate: true });
    }
  };

  const handleShowDirection = () => {
    if (selectedStation && userLocation) {
      setShowRoute(true);
    }
  };

  const handleCenterOnUser = () => {
    if (userLocation && mapRef.current) {
      // Clear any selected station or drawn route
      setSelectedStation(null);
      setShowRoute(false);

      try {
        // Prefer setView with a sensible zoom (keep current zoom if already > 13)
        const currentZoom =
          typeof mapRef.current.getZoom === "function"
            ? mapRef.current.getZoom()
            : 13;
        const targetZoom = Math.max(currentZoom, 13);
        mapRef.current.setView(
          [userLocation.lat, userLocation.lng],
          targetZoom,
          { animate: true }
        );
      } catch (err) {
        // Fallback to panTo
        try {
          mapRef.current.panTo([userLocation.lat, userLocation.lng]);
        } catch (e) {
          console.error("Unable to center map on user location:", e);
        }
      }
    }
  };

  // Always use a valid center - fallback to HCM if invalid
  const validCenter = useMemo(() => {
    if (center && Array.isArray(center) && center.length === 2 && 
        !isNaN(center[0]) && !isNaN(center[1]) &&
        center[0] >= -90 && center[0] <= 90 &&
        center[1] >= -180 && center[1] <= 180) {
      return center;
    }
    console.warn("⚠️ Invalid center, using fallback:", center);
    return [10.7769, 106.7009]; // HCM center fallback
  }, [center]);

  return (
    <Box>
      {/* Map Container */}
      <Box
        sx={{
          position: "relative",
          height: 500,
          width: "100%",
          borderRadius: 2,
          overflow: "hidden",
          mb: 3,
        }}
      >
        <MapContainer
          center={validCenter}
          zoom={13}
          style={{ height: "100%", width: "100%", minHeight: "500px" }}
          zoomControl={true}
          scrollWheelZoom={true}
          attributionControl={false}
          whenCreated={(map) => {
            // store map ref and prevent multiple initialization
            console.log("🗺️ Leaflet map instance created with center:", validCenter);
            mapRef.current = map;
            setMapReady(true);
            setTimeout(() => {
              if (typeof map.invalidateSize === "function") {
                map.invalidateSize();
              }
              // Ensure map is visible
              if (typeof map.getContainer === "function") {
                const container = map.getContainer();
                if (container) {
                  container.style.visibility = "visible";
                  container.style.opacity = "1";
                }
              }
            }, 100);
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Set bounds to show all markers */}
          <MapBoundsSetter bounds={bounds} />

          {/* If user requested nearby, use FitBoundsRunner to apply those bounds inside the Map context */}
          {nearbyBounds && <FitBoundsRunner bounds={nearbyBounds} />}

          {/* User location marker */}
          {userLocation && (
            <>
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={userIcon}
              >
                {showUserPopup && (
                  <Popup>
                    <Box sx={{ p: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        📍 Vị trí của bạn
                      </Typography>
                    </Box>
                  </Popup>
                )}
              </Marker>
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={100}
                pathOptions={{
                  color: "#2196f3",
                  fillColor: "#2196f3",
                  fillOpacity: 0.1,
                }}
              />
            </>
          )}

          {/* Station markers */}
          {stations.map((station) => {
            const isAvailable = station.stats?.available > 0;
            const coords = getStationCoords(station);
            // Skip markers for stations with invalid coordinates
            if (coords.lat == null || coords.lng == null) {
              console.warn("Skipping station marker due to invalid coords:", station.id, coords);
              return null;
            }
            return (
              <Marker
                key={station.id}
                position={[coords.lat, coords.lng]}
                icon={createStationIcon(isAvailable)}
                eventHandlers={{
                  click: () => handleStationClick(station),
                }}
              >
                <Popup>
                  <Box sx={{ p: 1, minWidth: 200 }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight="bold"
                      gutterBottom
                    >
                      {station.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mb: 1 }}
                    >
                      📍 {station.location?.address || station.address}
                    </Typography>
                    {station.distanceFromUser !== undefined && (
                      <Typography
                        variant="caption"
                        color="primary.main"
                        display="block"
                        sx={{ mb: 1, fontWeight: "bold" }}
                      >
                        🧭 Cách bạn {station.distanceFromUser.toFixed(1)} km
                      </Typography>
                    )}
                    <Box sx={{ mb: 1 }}>
                      <Chip
                        label={`${station.stats?.available} / ${station.stats?.total} cổng đang trống`}
                        size="small"
                        color={isAvailable ? "success" : "error"}
                        sx={{ borderRadius: "16px", fontWeight: 600 }}
                      />
                      {/* Show operating hours in the popup when available */}
                      {station.operatingHours && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ mt: 1 }}
                        >
                          {formatOperatingHours(station.operatingHours)}
                        </Typography>
                      )}
                    </Box>
                    <Button
                      fullWidth
                      variant="contained"
                      size="small"
                      onClick={() => {
                        handleStationClick(station);
                        if (onStationSelect) {
                          onStationSelect(station);
                        }
                      }}
                    >
                      Chọn trạm này
                    </Button>
                  </Box>
                </Popup>
              </Marker>
            );
          })}

          {/* Highlight nearby stations with a light circle */}
          {nearbyStations.map((n) => (
            <Circle
              key={`near-${n.station.id}`}
              center={[n.coords.lat, n.coords.lng]}
              radius={50}
              pathOptions={{
                color: "#ffa726",
                fillColor: "#ffb74d",
                fillOpacity: 0.4,
              }}
            />
          ))}

          {/* If a station was selected from the list, show a popup at its location */}
          {selectedStation &&
            selectedFromList &&
            (() => {
              const coords = getStationCoords(selectedStation);
              if (!coords.lat || !coords.lng) return null;
              return (
                <Popup
                  position={[coords.lat, coords.lng]}
                  onClose={() => setSelectedStation(null)}
                >
                  <Box sx={{ p: 1, minWidth: 220 }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight="bold"
                      gutterBottom
                    >
                      {selectedStation.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mb: 1 }}
                    >
                      📍{" "}
                      {selectedStation.location?.address ||
                        selectedStation.address}
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      <Chip
                        label={`${selectedStation.stats?.available} / ${selectedStation.stats?.total} cổng đang trống`}
                        size="small"
                        color={
                          selectedStation.stats?.available > 0
                            ? "success"
                            : "error"
                        }
                        sx={{ borderRadius: "16px", fontWeight: 600 }}
                      />
                      {selectedStation.operatingHours && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ mt: 1 }}
                        >
                          {formatOperatingHours(selectedStation.operatingHours)}
                        </Typography>
                      )}
                    </Box>
                    <Button
                      fullWidth
                      variant="contained"
                      size="small"
                      onClick={() => {
                        if (onStationSelect) onStationSelect(selectedStation);
                      }}
                    >
                      Chọn trạm này
                    </Button>
                  </Box>
                </Popup>
              );
            })()}

          {/* Route line */}
          {showRoute &&
            userLocation &&
            selectedStation &&
            (() => {
              const destCoords = getStationCoords(selectedStation);
              return (
                <RouteDrawer
                  userLocation={userLocation}
                  destination={destCoords}
                  requestId={routeRequestId}
                  onRouteReady={onDirectionsReady}
                  onRouteError={onDirectionsError}
                />
              );
            })()}
        </MapContainer>

        {/* Find Nearby Stations button */}
        {userLocation && (
          <Tooltip title="Tìm trạm gần tôi">
            <span>
              <IconButton
                sx={{
                  position: "absolute",
                  top: 80,
                  right: 10,
                  bgcolor: "white",
                  boxShadow: 2,
                  "&:hover": { bgcolor: "grey.100" },
                  zIndex: 1400,
                }}
                onClick={() => handleFindNearby()}
              >
                <EvStationIcon color="primary" />
              </IconButton>
            </span>
          </Tooltip>
        )}
        {findNearbyError && (
          <Alert
            severity="error"
            sx={{
              position: "absolute",
              top: 130,
              right: 10,
              zIndex: 1500,
              minWidth: 260,
            }}
          >
            {findNearbyError}
          </Alert>
        )}

        {/* Legend */}
        <Card
          sx={{
            position: "absolute",
            bottom: 16,
            left: 16,
            p: 2,
            minWidth: 220,
            zIndex: 1300,
            boxShadow: 4,
            bgcolor: "rgba(255,255,255,0.95)",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  bgcolor: "success.main",
                  borderRadius: "50%",
                  border: "2px solid white",
                  boxShadow: 1,
                }}
              />
              <Typography variant="body2" fontWeight="medium">
                Trạm có chỗ trống
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  bgcolor: "error.main",
                  borderRadius: "50%",
                  border: "2px solid white",
                  boxShadow: 1,
                }}
              />
              <Typography variant="body2" fontWeight="medium">
                Trạm đã đầy
              </Typography>
            </Box>
            {userLocation && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    bgcolor: "primary.main",
                    borderRadius: "50%",
                    border: "2px solid white",
                    boxShadow: 1,
                  }}
                />
                <Typography variant="body2" fontWeight="medium">
                  Vị trí của bạn
                </Typography>
              </Box>
            )}
          </Box>
          {/* Hint removed as requested */}
        </Card>

        {/* Selected station card removed — popups now appear at station locations */}
      </Box>

      {/* Station List */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
        📋 Danh sách trạm ({stations.length})
      </Typography>
      <Box>
        {stations.map((station, index) => {
          const isAvailable = station.stats?.available > 0;
          const maxPower = station.charging?.maxPower || 150;
          const pricePerKwh =
            station.id === "station-001"
              ? 8500
              : station.id === "station-002"
              ? 9500
              : station.id === "station-003"
              ? 7500
              : 8500;

          return (
            <Box
              key={station.id}
              onClick={() => handleListSelect(station)}
              sx={{
                borderRadius: 2,
                mb: 1.5,
                border: 1,
                borderColor:
                  selectedStation?.id === station.id
                    ? "primary.main"
                    : "divider",
                p: 2,
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  backgroundColor: "grey.50",
                  borderColor: "primary.light",
                  boxShadow: 1,
                },
              }}
            >
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                {/* Icon xe - căn giữa theo chiều dọc */}
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    bgcolor: "grey.100",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    border: "2px solid",
                    borderColor: "grey.300",
                  }}
                >
                  <ElectricCar sx={{ fontSize: 28, color: "primary.main" }} />
                </Box>

                {/* Thông tin trạm */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {/* Tên trạm và khoảng cách */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 0.5,
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      sx={{ color: "text.primary" }}
                    >
                      {station.name}
                    </Typography>
                    {station.distanceFromUser !== undefined && (
                      <Chip
                        label={`Cách ${station.distanceFromUser.toFixed(1)} km`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.75rem",
                        }}
                      />
                    )}
                  </Box>

                  {/* Địa chỉ */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 0.5,
                      mb: 1,
                    }}
                  >
                    <LocationOn
                      sx={{ fontSize: 16, color: "text.secondary", mt: 0.2 }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ flex: 1 }}
                    >
                      {station.location?.address || station.address}
                    </Typography>
                  </Box>

                  {/* Thông tin chi tiết */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Speed sx={{ fontSize: 16, color: "primary.main" }} />
                      <Typography variant="body2" color="text.secondary">
                        Sạc nhanh lên đến {maxPower} kW
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{ color: "success.main", fontWeight: 600 }}
                    >
                      Từ {pricePerKwh.toLocaleString("vi-VN")} ₫/kWh
                    </Typography>
                  </Box>
                </Box>

                {/* Trạng thái và nút đặt */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 1,
                    ml: "auto",
                  }}
                >
                  <Chip
                    label={`${station.stats?.available}/${station.stats?.total} cổng đang trống`}
                    size="small"
                    color={isAvailable ? "success" : "error"}
                    sx={{
                      borderRadius: "16px",
                      fontWeight: 600,
                    }}
                  />
                  {station.operatingHours && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ textAlign: "right" }}
                    >
                      {formatOperatingHours(station.operatingHours)}
                    </Typography>
                  )}
                  <Button
                    variant="contained"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onStationSelect) {
                        onStationSelect(station);
                      }
                    }}
                    sx={{
                      minWidth: 90,
                      fontWeight: 600,
                    }}
                  >
                    Đặt ngay
                  </Button>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default StationMapLeaflet;
