/* eslint-disable */
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
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
const RouteDrawer = ({ userLocation, destination }) => {
  const [routeCoords, setRouteCoords] = useState([]);

  useEffect(() => {
    console.log("🚗 RouteDrawer: userLocation=", userLocation, "destination=", destination);
    
    if (!userLocation || !destination) {
      console.warn("⚠️ RouteDrawer: Missing userLocation or destination");
      setRouteCoords([]);
      return;
    }

    if (!userLocation.lat || !userLocation.lng || !destination.lat || !destination.lng) {
      console.warn("⚠️ RouteDrawer: Invalid coordinates", { userLocation, destination });
      setRouteCoords([]);
      return;
    }

    const fetchRoute = async () => {
      try {
        console.log("🌐 Fetching route from Google Directions API via backend...");
        const { success, route, error } = await getDrivingDirections({
          origin: userLocation,
          destination,
        });

        if (success && route?.polyline?.length) {
          // Defensive: verify ordering of decoded points. Google should return {lat, lng}.
          // But if something upstream swapped them, detect and correct here.
          const rawPoints = route.polyline;
          const sample = rawPoints[0];
          console.log("✅ Google route fetched - sample point:", sample);

          let coords = [];

          // Heuristic checks: lat must be in [-90,90], lng in [-180,180]. If sample looks like it's reversed, swap.
          const looksLikeLatLng = (p) => {
            if (!p) return false;
            const { lat, lng } = p;
            return (
              typeof lat === "number" && typeof lng === "number" &&
              Math.abs(lat) <= 90 && Math.abs(lng) <= 180
            );
          };

          const looksLikeLngLat = (p) => {
            if (!p) return false;
            const { lat, lng } = p;
            // If 'lat' is outside [-90,90] but 'lng' looks like a latitude, assume swapped
            return (
              (typeof lat === "number" && Math.abs(lat) > 90) &&
              (typeof lng === "number" && Math.abs(lng) <= 90)
            );
          };

          if (looksLikeLatLng(sample)) {
            coords = rawPoints.map((point) => [point.lat, point.lng]);
            console.log("ℹ️ Polyline appears to be lat/lng order. Using [lat,lng].");
          } else if (looksLikeLngLat(sample)) {
            coords = rawPoints.map((point) => [point.lng, point.lat]);
            console.warn("⚠️ Detected polyline likely in [lng,lat] order — swapping to [lat,lng].");
          } else {
            // Fallback: try lat/lng first, but log warning so we can inspect the values
            coords = rawPoints.map((point) => [point.lat, point.lng]);
            console.warn("⚠️ Unable to confidently determine polyline order; using [lat,lng] fallback.", sample);
          }

          // Log head/tail for quick verification in browser console
          if (coords.length > 0) {
            console.log("🔹 Route first coord:", coords[0], "last:", coords[coords.length - 1]);
          }

          console.log("✅ Google route fetched successfully, coords count:", coords.length);
          setRouteCoords(coords);
        } else {
          console.warn("⚠️ Directions API did not return a route:", error);
          setRouteCoords([
            [userLocation.lat, userLocation.lng],
            [destination.lat, destination.lng],
          ]);
        }
      } catch (error) {
        console.error("❌ Error fetching Google directions:", error);
        setRouteCoords([
          [userLocation.lat, userLocation.lng],
          [destination.lat, destination.lng],
        ]);
      }
    };

    fetchRoute();
  }, [userLocation, destination]);

  if (routeCoords.length === 0) return null;

  return (
    <>
      {/* Outer border for better visibility */}
      <Polyline
        positions={routeCoords}
        pathOptions={{
          color: "#ffffff",
          weight: 10,
          opacity: 0.8,
        }}
      />
      {/* Main route line */}
      <Polyline
        positions={routeCoords}
        pathOptions={{
          color: "#1976d2",  // Darker blue for better contrast
          weight: 6,
          opacity: 1,
          lineJoin: "round",
          lineCap: "round",
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
  userLocation: externalUserLocation = null,  // Accept external user location
  showRoute: externalShowRoute = false,        // Accept external showRoute flag
  centerOnStation = false                       // Accept centerOnStation flag
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

  // Haversine formula to compute distance in meters between two lat/lng points
  const haversineDistance = (lat1, lon1, lat2, lon2) => {
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

  // Don't render if center is invalid
  if (!center || center.some((c) => isNaN(c))) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="body1" color="text.secondary">
          Đang tải bản đồ...
        </Typography>
      </Box>
    );
  }

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
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
          scrollWheelZoom={true}
          attributionControl={false}
          whenCreated={(map) => {
            // store map ref and prevent multiple initialization
            console.log("🗺️ Leaflet map instance created");
            mapRef.current = map;
            setMapReady(true);
            setTimeout(() => {
              if (typeof map.invalidateSize === "function")
                map.invalidateSize();
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
