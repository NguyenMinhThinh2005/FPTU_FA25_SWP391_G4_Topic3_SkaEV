/* eslint-disable */
/**
 * ChargingFlow Component - Refactored Flow
 * 
 * CHANGES (Nov 2025):
 * 1. Step 0 - Select Station: 
 *    - REMOVED: Map view for station selection
 *    - ADDED: List/Grid view with station cards showing all details
 *    - Each card shows: name, address, distance, availability, slots, price, operating hours
 * 
 * 2. Step 1 - Navigation (NEW):
 *    - ADDED: Map with directions to booked station
 *    - Shows route from user location to selected station
 *    - Used for navigation only, not for station selection
 * 
 * 3. Date/Time Restrictions:
 *    - Only TODAY bookings allowed (Vietnam timezone UTC+7)
 *    - Future date selection removed in ChargingDateTimePicker component
 *    - Backend validation in BookingService.cs rejects non-today bookings
 * 
 * Flow Steps:
 * 0. Select Station (List/Grid) 
 * 1. Navigation Map (after booking)
 * 2. QR Scan
 * 3. Connect Vehicle
 * 4. Charging
 * 5. Complete
 */
import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  Avatar,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Checkbox,
  Skeleton,
  IconButton,
} from "@mui/material";
import {
  QrCodeScanner,
  ElectricCar,
  BatteryChargingFull,
  CheckCircle,
  LocationOn,
  Speed,
  Search,
  Directions,
  AccessTime,
  Refresh,
  RefreshOutlined,
} from "@mui/icons-material";
import useBookingStore from "../../store/bookingStore";
import useStationStore from "../../store/stationStore";
import { formatCurrency, calculateDistance } from "../../utils/helpers";
import StationMapLeaflet from "../../components/customer/StationMapLeaflet";
import notificationService from "../../services/notificationService";
import { qrCodesAPI, chargingAPI, stationsAPI } from "../../services/api";

// Helper function to normalize Vietnamese text for search
const normalize = (text) => {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d");
};

// Helper to render operating hours safely (matches StationMapLeaflet)
const formatOperatingHours = (oh) => {
  if (!oh) return "";
  if (typeof oh === "string") {
    if (oh.trim().toLowerCase() === "24/7") return `Hoạt động: Cả ngày`;
    return `Hoạt động: ${oh}`;
  }
  const openRaw = oh.open || "";
  const closeRaw = oh.close || "";
  const open = String(openRaw).trim().toLowerCase();
  const close = String(closeRaw).trim().toLowerCase();
  if (open === "24/7" || close === "24/7") return `Hoạt động: Cả ngày`;
  if (openRaw && closeRaw) return `Hoạt động: ${openRaw} - ${closeRaw}`;
  if (openRaw) return `Hoạt động: ${openRaw}`;
  if (closeRaw) return `Hoạt động: ${closeRaw}`;
  return "";
};

// Helper function to format time
const formatTime = (minutes) => {
  if (minutes < 60) {
    return `${minutes} phút`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} giờ`;
  }
  return `${hours} giờ ${remainingMinutes} phút`;
};

const stripHtml = (value) => {
  if (!value) return "";
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const formatDistanceFromMeters = (meters) => {
  if (meters == null || Number.isNaN(meters)) return "";
  if (meters >= 1000) {
    const km = meters / 1000;
    return `${km >= 10 ? Math.round(km) : km.toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
};

const formatDurationFromSeconds = (seconds) => {
  if (seconds == null || Number.isNaN(seconds)) return "";
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

const extractStationCoordinates = (station) => {
  if (!station || !station.location) return null;

  const raw = station.location.coordinates;
  let lat = null;
  let lng = null;

  const toNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  if (Array.isArray(raw) && raw.length >= 2) {
    lng = toNumber(raw[0]);
    lat = toNumber(raw[1]);
  } else if (raw && typeof raw === "object") {
    lat = toNumber(raw.lat ?? raw.latitude);
    lng = toNumber(raw.lng ?? raw.longitude);
  } else {
    lat = toNumber(station.location.lat ?? station.lat ?? station.latitude);
    lng = toNumber(station.location.lng ?? station.lng ?? station.longitude);
  }

  if (
    (lat == null || lat < -90 || lat > 90) &&
    lng != null &&
    lng >= -90 &&
    lng <= 90
  ) {
    const temp = lat;
    lat = lng;
    lng = temp;
  }

  if (
    lat == null ||
    lng == null ||
    Number.isNaN(lat) ||
    Number.isNaN(lng)
  ) {
    return null;
  }

  return { lat, lng };
};
import { getStationImage } from "../../utils/imageAssets";
import { CONNECTOR_TYPES } from "../../utils/constants";
import BookingModal from "../../components/customer/BookingModal";
import RatingModal from "../../components/customer/RatingModal";
import QRCodeScannerComponent from "../../components/ui/QRCodeScanner/QRCodeScanner";

const ChargingFlow = () => {
  // Các bước của flow booking sạc xe
  const flowSteps = [
    "Chọn trạm",
    "Chỉ đường",
    "Quét QR",
    "Kết nối",
    "Đang sạc",
    "Hoàn thành",
  ];
  const { currentBooking, chargingSession, resetFlowState, completeBooking } =
    useBookingStore();
  const bookingStore = useBookingStore;
  const { stations, initializeData, filters, updateFilters, loading } =
    useStationStore();

  // Lưu flowStep vào sessionStorage để giữ trạng thái khi chuyển tab
  const getInitialFlowStep = () => {
    const saved = sessionStorage.getItem("chargingFlowStep");
    return saved !== null ? Number(saved) : 0;
  };
  const [flowStep, setFlowStepState] = useState(getInitialFlowStep());

  // Custom setter để lưu vào sessionStorage
  const setFlowStep = (step) => {
    setFlowStepState(step);
    sessionStorage.setItem("chargingFlowStep", step);
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("distance"); // distance, price, availability
  const [filterAvailable, setFilterAvailable] = useState(false);
  const [filterMaxDistance, setFilterMaxDistance] = useState(50); // km
  const [selectedStation, setSelectedStation] = useState(null);
  const [persistedStationId, setPersistedStationId] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      return sessionStorage.getItem("chargingSelectedStationId");
    } catch (error) {
      console.warn("Không thể đọc chargingSelectedStationId từ sessionStorage", error);
      return null;
    }
  });
  const [directionsData, setDirectionsData] = useState({
    loading: false,
    info: null,
    error: null,
  });
  const [navigationRequestId, setNavigationRequestId] = useState(0);
  // viewMode removed - always use list/grid view in step 0, map only for navigation in step 1
  const [userLocation, setUserLocation] = useState({
    lat: 10.8231, // Default to Ho Chi Minh City (HCMC)
    lng: 106.6297,
  });

  // State to store stations with real-time stats from API
  const [stationsWithStats, setStationsWithStats] = useState([]);

  // Sync stations from store - they already have correct stats from transformStationData
  useEffect(() => {
    if (!stations || stations.length === 0) return;
    
    console.log("📊 Syncing stations from store (already have correct stats):", stations.length);
    // Stations from store already have stats calculated in transformStationData
    // No need to re-fetch - just use them directly
    setStationsWithStats(stations);
  }, [stations]);

  // Khôi phục currentBooking, chargingSession, flowStep từ sessionStorage khi mount (KHÔNG reset flowStep về 0 tự động)
  useEffect(() => {
    // Khi mount, khôi phục currentBooking và chargingSession nếu chưa có
    const savedBooking = sessionStorage.getItem("chargingCurrentBooking");
    if (!currentBooking && savedBooking) {
      try {
        const bookingObj = JSON.parse(savedBooking);
        if (bookingObj && bookingObj.id) {
          bookingStore.setState({ currentBooking: bookingObj });
        }
      } catch (e) {
        console.error("Lỗi parse currentBooking từ sessionStorage", e);
      }
    }
    const savedSession = sessionStorage.getItem("chargingSession");
    if (!chargingSession && savedSession) {
      try {
        const sessionObj = JSON.parse(savedSession);
        if (sessionObj && sessionObj.bookingId) {
          bookingStore.setState({ chargingSession: sessionObj });
        }
      } catch (e) {
        console.error("Lỗi parse chargingSession từ sessionStorage", e);
      }
    }
    // Luôn ưu tiên lấy flowStep từ sessionStorage nếu có
    const saved = sessionStorage.getItem("chargingFlowStep");
    if (saved !== null) {
      setFlowStepState(Number(saved));
    }
    // KHÔNG reset flowStep về 0 tự động nữa!
  }, []);
  // Lưu chargingSession vào sessionStorage mỗi khi thay đổi
  useEffect(() => {
    if (chargingSession) {
      sessionStorage.setItem(
        "chargingSession",
        JSON.stringify(chargingSession)
      );
    } else {
      sessionStorage.removeItem("chargingSession");
    }
  }, [chargingSession]);
  // Lưu currentBooking vào sessionStorage mỗi khi thay đổi
  useEffect(() => {
    if (currentBooking) {
      sessionStorage.setItem(
        "chargingCurrentBooking",
        JSON.stringify(currentBooking)
      );
    } else {
      sessionStorage.removeItem("chargingCurrentBooking");
    }
  }, [currentBooking]);

  // Debug searchQuery changes
  useEffect(() => {
    console.log("🔎 SearchQuery changed to:", searchQuery);
  }, [searchQuery]);

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [qrScanOpen, setQrScanOpen] = useState(false);
  // Persisted state for flow >= 2
  const getPersisted = (key, fallback) => {
    const saved = sessionStorage.getItem(key);
    if (!saved) return fallback;
    try {
      return JSON.parse(saved);
    } catch {
      return fallback;
    }
  };
  const [scanResult, setScanResultState] = useState(() =>
    getPersisted("chargingScanResult", "")
  );
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [completedSession, setCompletedSession] = useState(null);
  const [currentBookingData, setCurrentBookingDataState] = useState(() =>
    getPersisted("chargingCurrentBookingData", null)
  );
  const [chargingStartTime, setChargingStartTimeState] = useState(() =>
    getPersisted("chargingChargingStartTime", null)
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [sessionData, setSessionDataState] = useState(() =>
    getPersisted("chargingSessionData", {
      energyDelivered: 0,
      startSOC: 25,
      currentSOC: 25,
      targetSOC: 80,
      startTime: null,
      estimatedDuration: 0,
      currentCost: 0,
      chargingRate: 8500,
      stationId: "ST-001",
      stationName: "Trạm sạc FPT Hà Nội",
      connectorType: "CCS2",
      maxPower: 150,
    })
  );

  // Custom setters to persist
  const setCurrentBookingData = (data) => {
    setCurrentBookingDataState(data);
    if (data)
      sessionStorage.setItem(
        "chargingCurrentBookingData",
        JSON.stringify(data)
      );
    else sessionStorage.removeItem("chargingCurrentBookingData");
  };
  const setChargingStartTime = (val) => {
    setChargingStartTimeState(val);
    if (val)
      sessionStorage.setItem("chargingChargingStartTime", JSON.stringify(val));
    else sessionStorage.removeItem("chargingChargingStartTime");
  };
  const setScanResult = (val) => {
    setScanResultState(val);
    if (val) sessionStorage.setItem("chargingScanResult", JSON.stringify(val));
    else sessionStorage.removeItem("chargingScanResult");
  };
  const setSessionData = (val) => {
    setSessionDataState(val);
    if (val) sessionStorage.setItem("chargingSessionData", JSON.stringify(val));
    else sessionStorage.removeItem("chargingSessionData");
  };

  useEffect(() => {
    if (selectedStation) return;
    if (!stationsWithStats || stationsWithStats.length === 0) return;

    const sourceId =
      currentBooking?.stationId ||
      currentBookingData?.stationId ||
      persistedStationId;

    if (!sourceId) return;

    const matchedStation = stationsWithStats.find(
      (station) => station.id === sourceId
    );

    if (matchedStation) {
      setSelectedStation(matchedStation);
      if (matchedStation.id !== persistedStationId) {
        setPersistedStationId(matchedStation.id);
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem(
              "chargingSelectedStationId",
              matchedStation.id
            );
          } catch (error) {
            console.warn("Không thể lưu chargingSelectedStationId", error);
          }
        }
      }
    }
  }, [
    selectedStation,
    stationsWithStats,
    currentBooking,
    currentBookingData,
    persistedStationId,
  ]);

  // Khôi phục state khi flowStep >= 2
  useEffect(() => {
    const saved = sessionStorage.getItem("chargingFlowStep");
    const step = saved !== null ? Number(saved) : 0;
    if (step >= 2) {
      setCurrentBookingData(getPersisted("chargingCurrentBookingData", null));
      setScanResult(getPersisted("chargingScanResult", ""));
      setChargingStartTime(getPersisted("chargingChargingStartTime", null));
      setSessionData(
        getPersisted("chargingSessionData", {
          energyDelivered: 0,
          startSOC: 25,
          currentSOC: 25,
          targetSOC: 80,
          startTime: null,
          estimatedDuration: 0,
          currentCost: 0,
          chargingRate: 8500,
          stationId: "ST-001",
          stationName: "Trạm sạc FPT Hà Nội",
          connectorType: "CCS2",
          maxPower: 150,
        })
      );
    }
  }, []);
  // Filter and search stations (useMemo) - Use stationsWithStats instead of stations
  const filteredStations = React.useMemo(() => {
    try {
      // Use stationsWithStats if available, otherwise fallback to stations
      let stationList =
        stationsWithStats.length > 0 ? [...stationsWithStats] : [];

      const query = normalize(searchQuery.trim());
      if (query) {
        stationList = stationList.filter((station) => {
          if (!station) return false;
          // Normalize and search in station name
          const matchesName =
            station.name && normalize(station.name).includes(query);
          // Search in city
          const matchesCity =
            station.location &&
            station.location.city &&
            normalize(station.location.city).includes(query);
          // Search in address
          const matchesAddress =
            station.location &&
            station.location.address &&
            normalize(station.location.address).includes(query);
          // Search in landmarks
          const matchesLandmarks =
            station.location &&
            station.location.landmarks &&
            Array.isArray(station.location.landmarks) &&
            station.location.landmarks.some(
              (landmark) => landmark && normalize(landmark).includes(query)
            );
          const isMatch =
            matchesName || matchesCity || matchesAddress || matchesLandmarks;
          if (isMatch) {
            console.log("✅ Text match:", station.name);
          }
          return isMatch;
        });
        console.log("🔤 After text search:", stationList.length, "stations");
      }

      // Apply connector type filter if selected (independent from text search)
      const connectorFilters = Array.isArray(filters.connectorTypes)
        ? filters.connectorTypes.filter(Boolean)
        : filters.connectorTypes
        ? [filters.connectorTypes]
        : [];
      if (connectorFilters.length > 0) {
        console.log("🔌 Applying connector filters:", connectorFilters);
        stationList = stationList.filter((station) => {
          if (!station || !station.charging) {
            console.log("❌ Station missing charging data:", station?.name);
            return false;
          }
          // Check connectorTypes array first
          const stationConnectors = station.charging.connectorTypes || [];
          const hasMatchingConnector = connectorFilters.some((filterType) =>
            stationConnectors.includes(filterType)
          );
          if (hasMatchingConnector) {
            console.log(
              "✅ Connector match in array:",
              station.name,
              stationConnectors
            );
            return true;
          }
          return false;
        });
        console.log(
          "🔌 After connector filter:",
          stationList.length,
          "stations"
        );
      }

      // Calculate distance from user location (stats already included from API)
      stationList = stationList.map((station) => {
        let updatedStation = { ...station };

        // Calculate distance from user location
        if (userLocation && station.location?.coordinates) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            station.location.coordinates.lat,
            station.location.coordinates.lng
          );
          updatedStation.distanceFromUser = distance;
        }

        return updatedStation;
      });

      // Apply availability filter
      if (filterAvailable) {
        stationList = stationList.filter((station) => {
          const available = station.stats?.available || 0;
          return available > 0;
        });
        console.log("🟢 After availability filter:", stationList.length, "stations");
      }

      // Apply distance filter
      if (filterMaxDistance < 50) {
        stationList = stationList.filter((station) => {
          return station.distanceFromUser !== undefined && station.distanceFromUser <= filterMaxDistance;
        });
        console.log(`📏 After distance filter (${filterMaxDistance}km):`, stationList.length, "stations");
      }

      // Sort stations based on selected criteria
      stationList.sort((a, b) => {
        if (sortBy === 'distance') {
          if (a.distanceFromUser !== undefined && b.distanceFromUser !== undefined) {
            return a.distanceFromUser - b.distanceFromUser;
          }
        } else if (sortBy === 'price') {
          const priceA = a.charging?.pricing?.acRate || a.pricing?.unitPrice || 0;
          const priceB = b.charging?.pricing?.acRate || b.pricing?.unitPrice || 0;
          return priceA - priceB;
        } else if (sortBy === 'availability') {
          const availA = a.stats?.available || 0;
          const availB = b.stats?.available || 0;
          return availB - availA; // Descending (most available first)
        }
        return 0;
      });

      console.log(
        `� Stations sorted by ${sortBy}:`,
        stationList.map(
          (s) => `${s.name} (${s.distanceFromUser?.toFixed(1)}km, ${s.stats?.available || 0} available)`
        )
      );

      return stationList;
    } catch (error) {
      console.error("❌ Error filtering stations:", error);
      return [];
    }
  }, [searchQuery, filters.connectorTypes, stationsWithStats, userLocation, sortBy, filterAvailable, filterMaxDistance]);

  const selectedStationCoords = React.useMemo(
    () => extractStationCoordinates(selectedStation),
    [selectedStation]
  );

  const navigationSummary = directionsData.info;
  const navigationWarnings = navigationSummary?.warnings || [];

  useEffect(() => {
    console.log("🚀 ChargingFlow mounted - initializing data");
    initializeData();
  }, [initializeData]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log("📍 User location updated:", newLocation);
          setUserLocation(newLocation);
        },
        (error) => {
          console.warn(
            "⚠️ Location access denied, using default location:",
            error
          );
          // Keep default location (HCMC)
        }
      );
    } else {
      console.warn("⚠️ Geolocation not supported, using default location");
    }
  }, []);

  useEffect(() => {
    if (flowStep === 1 && selectedStation?.id) {
      setDirectionsData((prev) => ({
        loading: true,
        error: null,
        info:
          prev.info && prev.info.stationId === selectedStation.id
            ? prev.info
            : null,
      }));
      setNavigationRequestId((prev) => prev + 1);
    }
  }, [flowStep, selectedStation?.id, userLocation?.lat, userLocation?.lng]);

  // Reset flow step to 0 if no active booking or charging session
  // Đã loại bỏ auto-reset flowStep về 0 khi mất currentBooking/changingSession để giữ đúng trạng thái flow khi quay lại

  // Debug log when stations change
  useEffect(() => {
    console.log(
      "📍 Stations updated in ChargingFlow:",
      stations?.length,
      "stations"
    );
    if (stations && stations.length > 0) {
      console.log("   First station:", stations[0]?.name);
    }
  }, [stations]);

  // Check if we have an active booking to determine flow step
  useEffect(() => {
    console.log(
      "📊 Flow useEffect - currentBooking:",
      currentBooking,
      "chargingSession:",
      chargingSession,
      "currentStep:",
      flowStep
    );
    // Don't auto-advance - user must manually proceed through steps
    // This prevents auto-jumping to QR scan on page load with persisted booking
  }, [currentBooking, chargingSession, flowStep]);

  const handleStationSelect = (station) => {
    // CRITICAL: Validate station is available before allowing selection
    if (!station) {
      console.warn("⚠️ Cannot select null/undefined station");
      return;
    }
    
    const isActive = (station.status || "").toLowerCase() === "active";
    const hasAvailableSlots = station.stats?.available > 0;
    const isAvailable = isActive && hasAvailableSlots;
    
    if (!isAvailable) {
      console.warn(`⚠️ Cannot select unavailable station: ${station.name}`, {
        status: station.status,
        isActive,
        hasAvailableSlots,
        availableSlots: station.stats?.available,
        totalSlots: station.stats?.total
      });
      alert(`Không thể chọn trạm này.\n${!isActive ? 'Trạm đang bảo trì.' : 'Trạm đã hết chỗ.'}`);
      return;
    }
    
    console.log(`✅ Selected station: ${station.name} (${station.stats?.available}/${station.stats?.total} slots available)`);
    console.log('🔍 Station object:', {
      id: station.id,
      name: station.name,
      stats: station.stats,
      charging: {
        availablePorts: station.charging?.availablePorts,
        totalPorts: station.charging?.totalPorts,
        connectorTypes: station.charging?.connectorTypes,
        poles: station.charging?.poles?.length || 0
      }
    });
    
    setSelectedStation(station);
    setPersistedStationId(station?.id || null);
    if (typeof window !== "undefined") {
      try {
        if (station?.id) {
          sessionStorage.setItem("chargingSelectedStationId", station.id);
        } else {
          sessionStorage.removeItem("chargingSelectedStationId");
        }
      } catch (error) {
        console.warn("Không thể lưu chargingSelectedStationId", error);
      }
    }
    setBookingModalOpen(true);
  };

  const handleRetryDirections = React.useCallback(() => {
    if (!selectedStation?.id) return;
    setDirectionsData((prev) => ({
      loading: true,
      error: null,
      info:
        prev.info && prev.info.stationId === selectedStation.id
          ? prev.info
          : null,
    }));
    setNavigationRequestId((prev) => prev + 1);
  }, [selectedStation?.id]);

  const handleOpenGoogleMaps = React.useCallback(() => {
    if (!selectedStationCoords) return;
    const destinationParam = `${selectedStationCoords.lat},${selectedStationCoords.lng}`;
    const hasOrigin =
      userLocation &&
      typeof userLocation.lat === "number" &&
      typeof userLocation.lng === "number";
    const originParam = hasOrigin
      ? `${userLocation.lat},${userLocation.lng}`
      : "";
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      destinationParam
    )}${
      originParam ? `&origin=${encodeURIComponent(originParam)}` : ""
    }&travelmode=driving`;
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, [selectedStationCoords, userLocation]);

  const handleDirectionsReady = React.useCallback(
    (info) => {
      if (!info) return;
      if (
        info.requestId != null &&
        info.requestId !== navigationRequestId
      ) {
        return;
      }

      const normalizedSteps = Array.isArray(info.steps)
        ? info.steps.map((step, index) => {
            const instructionHtml =
              step.instructionHtml ||
              step.instruction ||
              step.instructionText ||
              "";
            const instructionText =
              step.instructionText ||
              stripHtml(instructionHtml) ||
              `Bước ${index + 1}`;
            return {
              ...step,
              index: step.index ?? index,
              instructionHtml,
              instructionText,
              distanceText:
                step.distanceText ||
                formatDistanceFromMeters(step.distanceMeters),
              durationText:
                step.durationText ||
                formatDurationFromSeconds(step.durationSeconds),
            };
          })
        : [];

      const normalizedInfo = {
        ...info,
        stationId: selectedStation?.id || info.stationId || null,
        distanceText:
          info.distanceText ||
          formatDistanceFromMeters(info.distanceMeters),
        durationText:
          info.durationText ||
          formatDurationFromSeconds(info.durationSeconds),
        steps: normalizedSteps,
        warnings: Array.isArray(info.warnings) ? info.warnings : [],
      };

      setDirectionsData({
        loading: false,
        error: null,
        info: normalizedInfo,
      });
    },
    [navigationRequestId, selectedStation?.id]
  );

  const handleDirectionsError = React.useCallback(
    (errorInfo) => {
      const requestId =
        typeof errorInfo === "object" && errorInfo !== null
          ? errorInfo.requestId
          : undefined;
      if (requestId != null && requestId !== navigationRequestId) {
        return;
      }

      const message =
        typeof errorInfo === "string"
          ? errorInfo
          : errorInfo?.message || "Không thể tải chỉ đường.";

      setDirectionsData((prev) => ({
        loading: false,
        info:
          prev.info && prev.info.stationId === selectedStation?.id
            ? prev.info
            : null,
        error: message,
      }));
    },
    [navigationRequestId, selectedStation?.id]
  );

  const handleBookingComplete = (booking) => {
    console.log("🎯 Booking completed:", booking);
    setCurrentBookingData(booking);
    setBookingModalOpen(false);
    setFlowStep(1); // Move to navigation/direction map step

    // Initialize session data based on booking
    const energyNeeded = (sessionData.targetSOC - sessionData.startSOC) * 0.6; // 60kWh battery
    const estimatedDuration = Math.round((energyNeeded / 45) * 60); // 45kW average rate

    setSessionData((prev) => ({
      ...prev,
      startTime: booking?.scheduledDateTime || new Date(),
      estimatedDuration,
      chargingRate: selectedStation?.charging?.pricing?.acRate || 8500,
      stationId: selectedStation?.id || "ST-001",
      stationName: selectedStation?.name || "Trạm sạc FPT",
      maxPower: selectedStation?.charging?.fastCharging?.maxPower || 150,
    }));
  };

  const handleRefreshStations = async () => {
    console.log("🔄 Refreshing stations from API...");
    try {
      // Simply re-initialize data from API - this will fetch fresh data with proper transform
      await initializeData();
      console.log("✅ Stations refreshed successfully");
    } catch (error) {
      console.error("❌ Error refreshing stations:", error);
    }
  };

  const handleQRScan = async (result) => {
    console.log("📱 QR Scan triggered with result:", result);

    try {
      // For customer demo, skip API validation (API requires Staff role)
      // In production, Staff would scan and validate
      console.log(
        "⚠️ Customer mode - skipping API validation (requires Staff role)"
      );
      console.log("✅ QR code accepted in demo mode:", result);

      // Update booking with QR scan info
      if (currentBooking) {
        bookingStore.setState({
          currentBooking: {
            ...currentBooking,
            qrScanned: true,
            scannedAt: new Date().toISOString(),
          },
        });
      }

      setScanResult(result);
      setFlowStep(3); // Move to connect step
      setQrScanOpen(false);

      notificationService.success("Quét mã QR thành công!");
      console.log("✅ QR Scanned successfully, moving to step 3");
    } catch (error) {
      console.error("❌ Error scanning QR code:", error);
      console.warn("⚠️ Continuing with demo mode anyway");

      // Continue with demo mode even if there's an error
      setScanResult(result);
      setFlowStep(3);
      setQrScanOpen(false);
    }
  };

  const handleStartCharging = async () => {
    if (!currentBooking || !scanResult) {
      console.error("❌ Missing booking data or QR scan result");
      alert("Thiếu thông tin booking hoặc mã QR");
      return;
    }

    try {
      console.log(
        "🔌 Starting charging session for booking:",
        currentBooking.id,
        currentBooking
      );

      // Try to call API to start charging session (may fail with 403 if not Staff)
      // Use numeric ID from API response, not the BOOK... string
      const bookingId = currentBooking.id;

      try {
        const response = await chargingAPI.startCharging(bookingId);
        console.log("✅ Charging session started via API:", response);

        // Create charging session from API response
        const newChargingSession = {
          sessionId: response.sessionId || `SESSION-${Date.now()}`,
          bookingId: bookingId,
          startTime: new Date(),
          stationId: currentBooking.stationId,
          stationName: currentBooking.stationName,
          chargerType: currentBooking.chargerType,
          status: "active",
        };

        bookingStore.setState({ chargingSession: newChargingSession });
      } catch (apiError) {
        // If API fails (403 or other), continue with demo mode
        console.warn(
          "⚠️ API call failed (may require Staff role), continuing with demo mode:",
          apiError.message
        );

        // Create demo charging session
        const demoSession = {
          sessionId: `DEMO-SESSION-${Date.now()}`,
          bookingId: bookingId,
          startTime: new Date(),
          stationId: currentBooking.stationId,
          stationName: currentBooking.stationName,
          chargerType: currentBooking.chargerType,
          status: "active-demo",
        };

        bookingStore.setState({ chargingSession: demoSession });
        console.log("📊 Demo charging session created:", demoSession);
      }

      const now = new Date();
      setChargingStartTime(now);
      setFlowStep(4); // Move to charging step

      // Update booking status
      bookingStore.setState({
        currentBooking: {
          ...currentBooking,
          chargingStarted: true,
          status: "in-progress",
        },
      });

      // Initialize session data
      setSessionData((prev) => ({
        ...prev,
        startTime: now,
        currentSOC: 25, // Starting battery level
        energyDelivered: 0,
        currentCost: 0,
      }));

      // Notify charging started
      notificationService.notifyChargingStarted({
        stationName: currentBooking.stationName || "Trạm sạc",
        currentSOC: 25,
      });

      console.log("⚡ Charging started successfully");
    } catch (error) {
      console.error("❌ Error starting charging:", error);
      alert(error.message || "Lỗi khi bắt đầu sạc");
    }
  };

  // Use sessionData for consistent state management
  const currentSOC = sessionData.currentSOC;
  const targetSOC = sessionData.targetSOC;

  // Calculate total cost including parking fee
  const calculateTotalCost = React.useCallback(() => {
    const energyCost = completedSession?.totalAmount || sessionData.currentCost;
    const chargingDuration = chargingStartTime
      ? Math.round((new Date() - chargingStartTime) / (1000 * 60))
      : Math.round(sessionData.energyDelivered * 3); // 3 minutes per kWh estimate
    const parkingFee = Math.max(0, chargingDuration * 500); // 500 VND per minute
    return energyCost + parkingFee;
  }, [completedSession, sessionData, chargingStartTime]);

  // Simulate realistic charging progress
  React.useEffect(() => {
    if (flowStep === 4 && chargingStartTime) {
      const interval = setInterval(() => {
        setSessionData((prev) => {
          const timeElapsed = (new Date() - chargingStartTime) / (1000 * 60); // minutes
          const newSOC = Math.min(
            prev.targetSOC,
            prev.startSOC + timeElapsed * 0.5
          ); // 0.5% per minute
          const newEnergyDelivered = Math.max(
            0,
            (newSOC - prev.startSOC) * 0.6
          ); // 60kWh battery
          const newCost = Math.round(newEnergyDelivered * prev.chargingRate);

          // Auto complete when reaching target
          if (newSOC >= prev.targetSOC && flowStep === 4) {
            setTimeout(() => setFlowStep(5), 2000);
          }

          return {
            ...prev,
            currentSOC: Math.round(newSOC),
            energyDelivered: Math.round(newEnergyDelivered * 10) / 10,
            currentCost: Math.round(newCost),
          };
        });
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, [flowStep, chargingStartTime]);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: "bold" }}>
        Sạc xe điện
      </Typography>{" "}
      {/* Flow Progress */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={flowStep} alternativeLabel>
            {flowSteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>
      {/* Step 0: Select Station - LIST/GRID VIEW (Map removed) */}
      {flowStep === 0 && (
        <Grid container spacing={3}>
          {/* Search and Filters */}
          <Grid item xs={12}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                {/* Search Input - Full Width */}
                <TextField
                  fullWidth
                  placeholder="Tìm kiếm theo tên trạm, địa chỉ, khu vực..."
                  value={searchQuery}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    console.log("⌨️ TextField onChange:", newValue);
                    setSearchQuery(newValue);
                  }}
                  InputProps={{
                    startAdornment: (
                      <Search
                        sx={{ mr: 1, color: "text.secondary", fontSize: 24 }}
                      />
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                      backgroundColor: "grey.50",
                      fontSize: "1rem",
                      "&:hover": {
                        backgroundColor: "white",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      },
                      "&.Mui-focused": {
                        backgroundColor: "white",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                      },
                    },
                    "& .MuiOutlinedInput-input": {
                      padding: "16px 14px",
                    },
                  }}
                />

                {/* Filters and Sorting Row */}
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Sắp xếp</InputLabel>
                      <Select
                        value={sortBy}
                        label="Sắp xếp"
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <MenuItem value="distance">Khoảng cách</MenuItem>
                        <MenuItem value="price">Giá thấp nhất</MenuItem>
                        <MenuItem value="availability">Còn nhiều chỗ</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Khoảng cách tối đa</InputLabel>
                      <Select
                        value={filterMaxDistance}
                        label="Khoảng cách tối đa"
                        onChange={(e) => setFilterMaxDistance(e.target.value)}
                      >
                        <MenuItem value={5}>Trong 5km</MenuItem>
                        <MenuItem value={10}>Trong 10km</MenuItem>
                        <MenuItem value={20}>Trong 20km</MenuItem>
                        <MenuItem value={50}>Tất cả</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        height: '100%',
                        pl: 1,
                      }}
                    >
                      <Checkbox
                        checked={filterAvailable}
                        onChange={(e) => setFilterAvailable(e.target.checked)}
                      />
                      <Typography variant="body2">
                        Chỉ trạm còn chỗ
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => {
                        setSortBy('distance');
                        setFilterMaxDistance(50);
                        setFilterAvailable(false);
                        setSearchQuery('');
                      }}
                      sx={{ height: '40px' }}
                    >
                      Xóa bộ lọc
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Stations List/Grid View - MAP REMOVED */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: "bold",
                      color: "black",
                    }}
                  >
                    📍 Danh sách trạm sạc ({loading ? '...' : filteredStations.length} trạm)
                  </Typography>
                  <IconButton
                    onClick={handleRefreshStations}
                    disabled={loading}
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                      '&:disabled': { bgcolor: 'grey.300' },
                    }}
                  >
                    <RefreshOutlined />
                  </IconButton>
                </Box>

                {loading ? (
                  <Grid container spacing={2}>
                    {[1, 2, 3, 4, 5, 6].map((index) => (
                      <Grid item xs={12} md={6} key={`skeleton-${index}`}>
                        <Card
                          sx={{
                            borderRadius: 3,
                            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                          }}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                              <Skeleton variant="circular" width={60} height={60} />
                              <Box sx={{ flex: 1 }}>
                                <Skeleton variant="text" width="70%" height={28} />
                                <Skeleton variant="text" width="40%" height={20} />
                              </Box>
                            </Box>
                            <Skeleton variant="text" width="90%" />
                            <Skeleton variant="text" width="60%" />
                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                              <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
                              <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
                              <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
                            </Box>
                            <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 2, mt: 2 }} />
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : filteredStations.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      Không tìm thấy trạm sạc phù hợp
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {filteredStations.map((station, index) => {
                      // Station is available only if:
                      // 1. Status is "active" (case-insensitive, to match DB values like "Active")
                      // 2. Has available slots (stats.available > 0)
                      const isActive = (station.status || "").toLowerCase() === "active";
                      const hasAvailableSlots = station.stats?.available > 0;
                      const isAvailable = isActive && hasAvailableSlots;
                      
                      const distance = station.distanceFromUser?.toFixed(1) || "N/A";
                      const pricing = station.charging?.pricing?.acRate || 
                                     station.charging?.pricing?.dcRate || 0;

                      return (
                        <Grid item xs={12} md={6} key={station.id}>
                          <Card
                            sx={{
                              height: "100%",
                              cursor: isAvailable ? "pointer" : "not-allowed",
                              transition: "all 0.3s",
                              border: "2px solid",
                              borderColor: isAvailable ? "divider" : "grey.300",
                              opacity: isAvailable ? 1 : 0.6,
                              "&:hover": isAvailable ? {
                                borderColor: "primary.main",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                transform: "translateY(-4px)",
                              } : {},
                            }}
                            onClick={() => isAvailable && handleStationSelect(station)}
                          >
                            <CardContent>
                              {/* Station Header */}
                              <Box sx={{ display: "flex", alignItems: "start", mb: 2 }}>
                                {/* Station Number Badge */}
                                <Box
                                  sx={{
                                    minWidth: 40,
                                    height: 40,
                                    borderRadius: "50%",
                                    backgroundColor: "primary.main",
                                    color: "white",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: "bold",
                                    fontSize: "1.1rem",
                                    mr: 2,
                                    flexShrink: 0,
                                  }}
                                >
                                  {index + 1}
                                </Box>

                                {/* Station Avatar */}
                                <Avatar
                                  src={getStationImage(station)}
                                  sx={{ width: 60, height: 60, mr: 2 }}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src =
                                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="60"%3E%3Crect fill="%231379FF" width="60" height="60"/%3E%3Ctext fill="white" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="12"%3EStation%3C/text%3E%3C/svg%3E';
                                  }}
                                >
                                  <ElectricCar />
                                </Avatar>

                                {/* Station Info */}
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
                                    {station.name}
                                  </Typography>
                                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                                    <Chip
                                      label={`${distance} km`}
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                    />
                                    <Chip
                                      label={isAvailable ? "Còn chỗ" : "Đầy"}
                                      size="small"
                                      color={isAvailable ? "success" : "error"}
                                    />
                                  </Box>
                                </Box>
                              </Box>

                              {/* Station Details */}
                              <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
                                  <LocationOn sx={{ fontSize: 18, color: "text.secondary" }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {station.location?.address}
                                  </Typography>
                                </Box>

                                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <Speed sx={{ fontSize: 18, color: "primary.main" }} />
                                    <Typography variant="body2">
                                      Tối đa {station.charging?.maxPower || 0}kW
                                    </Typography>
                                  </Box>

                                  <Typography variant="body2" color="text.secondary">
                                    ⚡ {station.stats?.available || 0}/{station.stats?.total || 0} cổng trống
                                  </Typography>
                                </Box>

                                {station.operatingHours && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    🕐 {formatOperatingHours(station.operatingHours)}
                                  </Typography>
                                )}

                                {pricing > 0 && (
                                  <Typography variant="body2" color="success.main" sx={{ mt: 0.5, fontWeight: "bold" }}>
                                    💰 Từ {formatCurrency(pricing)}/kWh
                                  </Typography>
                                )}
                              </Box>

                              {/* Action Button */}
                              <Button
                                fullWidth
                                variant="contained"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isAvailable) {
                                    handleStationSelect(station);
                                  }
                                }}
                                disabled={!isAvailable}
                                sx={{
                                  bgcolor: isAvailable ? 'primary.main' : 'grey.400',
                                  '&:hover': {
                                    bgcolor: isAvailable ? 'primary.dark' : 'grey.400',
                                  },
                                }}
                              >
                                {isAvailable 
                                  ? "Chọn trạm này" 
                                  : !isActive 
                                    ? "Đang bảo trì" 
                                    : "Hết chỗ"}
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Step 1: Navigation/Direction Map - Show route to booked station */}
      {flowStep === 1 && selectedStation && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold", mb: 2 }}>
                  ✅ Đặt lịch thành công!
                </Typography>
                <Alert severity="success" sx={{ mb: 3 }}>
                  Bạn đã đặt trạm <strong>{selectedStation.name}</strong> thành công. 
                  Hãy di chuyển đến trạm và quét QR để bắt đầu sạc.
                </Alert>

                {/* Station Info Summary */}
                <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                        <Avatar
                          src={getStationImage(selectedStation)}
                          sx={{ width: 60, height: 60, mr: 2 }}
                        >
                          <ElectricCar />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {selectedStation.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedStation.location?.address}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Chip
                          icon={<LocationOn />}
                          label={`${selectedStation.distanceFromUser?.toFixed(1) || "N/A"} km`}
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          icon={<Speed />}
                          label={`${selectedStation.charging?.maxPower || 0}kW`}
                          color="primary"
                          variant="outlined"
                        />
                        {selectedStation.operatingHours && (
                          <Chip
                            label={formatOperatingHours(selectedStation.operatingHours)}
                            color="default"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Card>

                {/* Map with directions */}
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: "bold", mb: 2 }}
                >
                  🗺️ Chỉ đường đến trạm
                </Typography>
                <Grid container spacing={2} sx={{ mb: 1 }}>
                  <Grid item xs={12} md={8}>
                    <Box
                      sx={{
                        height: 500,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        overflow: "hidden",
                      }}
                    >
                      <StationMapLeaflet
                        stations={[selectedStation]}
                        onStationSelect={() => {}}
                        userLocation={userLocation}
                        showRoute={true}
                        centerOnStation={true}
                        onDirectionsReady={handleDirectionsReady}
                        onDirectionsError={handleDirectionsError}
                        routeRequestId={navigationRequestId}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper
                      variant="outlined"
                      sx={{
                        height: "100%",
                        p: 2.5,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="bold">
                        Lộ trình đề xuất
                      </Typography>

                      {directionsData.loading && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <CircularProgress size={20} />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            Đang tải chỉ đường...
                          </Typography>
                        </Box>
                      )}

                      {directionsData.error && (
                        <Alert severity="warning">{directionsData.error}</Alert>
                      )}

                      {navigationSummary && (
                        <>
                          <Box
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 1,
                            }}
                          >
                            {navigationSummary.distanceText && (
                              <Chip
                                icon={<Directions fontSize="small" />}
                                label={`Quãng đường: ${navigationSummary.distanceText}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            )}
                            {navigationSummary.durationText && (
                              <Chip
                                icon={<AccessTime fontSize="small" />}
                                label={`Thời gian: ${navigationSummary.durationText}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            )}
                          </Box>

                          {navigationWarnings.map((warning, index) => (
                            <Alert
                              key={`nav-warning-${index}`}
                              severity={
                                navigationSummary.provider === "fallback" ||
                                navigationSummary.usedFallback
                                  ? "warning"
                                  : "info"
                              }
                              sx={{ mb: 1 }}
                            >
                              {warning}
                            </Alert>
                          ))}

                          {navigationSummary.steps &&
                          navigationSummary.steps.length > 0 ? (
                            <List
                              dense
                              sx={{
                                flex: 1,
                                maxHeight: "400px",
                                overflowY: "auto",
                                pr: 1,
                                // Custom scrollbar styling
                                "&::-webkit-scrollbar": {
                                  width: "8px",
                                },
                                "&::-webkit-scrollbar-track": {
                                  backgroundColor: "rgba(0,0,0,0.05)",
                                  borderRadius: "4px",
                                },
                                "&::-webkit-scrollbar-thumb": {
                                  backgroundColor: "rgba(0,0,0,0.2)",
                                  borderRadius: "4px",
                                  "&:hover": {
                                    backgroundColor: "rgba(0,0,0,0.3)",
                                  },
                                },
                              }}
                            >
                              {navigationSummary.steps.map((step, idx) => (
                                <ListItem
                                  key={`direction-step-${
                                    step.index ?? idx
                                  }`}
                                  alignItems="flex-start"
                                  sx={{ py: 1 }}
                                >
                                  <ListItemIcon sx={{ minWidth: 36 }}>
                                    <Avatar
                                      sx={{
                                        width: 28,
                                        height: 28,
                                        fontSize: "0.75rem",
                                        backgroundColor: "primary.main",
                                        color: "white",
                                      }}
                                    >
                                      {(step.index ?? 0) + 1}
                                    </Avatar>
                                  </ListItemIcon>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography
                                      variant="body2"
                                      fontWeight="medium"
                                    >
                                      {step.instructionText}
                                    </Typography>
                                    {(step.distanceText || step.durationText) && (
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {[
                                          step.distanceText,
                                          step.durationText,
                                        ]
                                          .filter(Boolean)
                                          .join(" • ")}
                                      </Typography>
                                    )}
                                  </Box>
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              Không có hướng dẫn chi tiết. Nhấn “Mở Google Maps”
                              để xem đường đi trực tiếp.
                            </Typography>
                          )}
                        </>
                      )}

                      {!directionsData.loading &&
                        !navigationSummary &&
                        !directionsData.error && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            Chúng tôi sẽ hiển thị chỉ đường ngay khi có dữ liệu.
                          </Typography>
                        )}

                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: { xs: "column", sm: "row" },
                          gap: 1,
                          mt: "auto",
                        }}
                      >
                        <Button
                          variant="contained"
                          startIcon={<Directions />}
                          onClick={handleOpenGoogleMaps}
                          disabled={!selectedStationCoords}
                          fullWidth
                        >
                          Mở Google Maps
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Refresh />}
                          onClick={handleRetryDirections}
                          disabled={directionsData.loading || !selectedStation?.id}
                          fullWidth
                        >
                          Làm mới
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Action Buttons */}
                <Box sx={{ display: "flex", gap: 2, mt: 3, justifyContent: "center" }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setFlowStep(0);
                      setSelectedStation(null);
                      setPersistedStationId(null);
                      setDirectionsData({
                        loading: false,
                        info: null,
                        error: null,
                      });
                      if (typeof window !== "undefined") {
                        try {
                          sessionStorage.removeItem(
                            "chargingSelectedStationId"
                          );
                        } catch (error) {
                          console.warn(
                            "Không thể xóa chargingSelectedStationId",
                            error
                          );
                        }
                      }
                    }}
                  >
                    Chọn trạm khác
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => setFlowStep(2)}
                    startIcon={<QrCodeScanner />}
                  >
                    Tôi đã đến trạm - Quét QR
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Step 2: QR Scan */}
      {flowStep === 2 && (
        <Grid item xs={12}>
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <QrCodeScanner
              sx={{ fontSize: 80, color: "primary.main", mb: 2 }}
            />
            <Typography variant="h5" gutterBottom>
              Quét mã QR trên trụ sạc
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Bạn đã đặt lịch thành công! Hãy đến trạm và quét QR để bắt đầu
              sạc.
            </Alert>
            <Button
              variant="contained"
              size="large"
              startIcon={<QrCodeScanner />}
              onClick={() => setQrScanOpen(true)}
            >
              Quét QR trên trụ sạc
            </Button>
          </Paper>
        </Grid>
      )}
      {/* Step 3: Connect Vehicle */}
      {flowStep === 3 && (
        <Grid item xs={12}>
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <ElectricCar sx={{ fontSize: 80, color: "success.main", mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Kết nối xe điện với trụ sạc
            </Typography>
            <Alert severity="success" sx={{ mb: 3 }}>
              QR Code đã quét:{" "}
              <strong>{scanResult || "SKAEV:STATION:ST001:A01"}</strong>
            </Alert>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Cắm dây sạc vào cổng sạc của xe và đảm bảo kết nối chắc chắn
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<BatteryChargingFull />}
              onClick={handleStartCharging}
            >
              Bắt đầu sạc
            </Button>
          </Paper>
        </Grid>
      )}
      {/* Step 4: Charging - EV Dashboard */}
      {flowStep === 4 && (
        <Grid item xs={12}>
          <Box
            sx={{
              background:
                "linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 75%, #475569 100%)",
              borderRadius: 3,
              p: 0,
              color: "white",
              position: "relative",
              overflow: "hidden",
              minHeight: "600px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Top Status Bar */}
            <Box
              sx={{
                background: "rgba(0,0,0,0.3)",
                px: 4,
                py: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                🔋 Đang sạc -{" "}
                {selectedStation?.name || "Green Mall Charging Hub"}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Connector: {scanResult?.split(":").pop() || "A01"}
              </Typography>
            </Box>

            {/* Main Dashboard */}
            <Box sx={{ flex: 1, p: { xs: 2, md: 4 } }}>
              <Grid container spacing={3} sx={{ height: "100%" }}>
                {/* Left: Battery Display */}
                <Grid item xs={12} md={5}>
                  <Box
                    sx={{
                      textAlign: "center",
                      background:
                        "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)",
                      border: "2px solid rgba(16, 185, 129, 0.3)",
                      borderRadius: 3,
                      p: 4,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Background glow effect */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: "-50%",
                        left: "-50%",
                        width: "200%",
                        height: "200%",
                        background:
                          "radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)",
                        animation: "rotate 10s linear infinite",
                        "@keyframes rotate": {
                          "0%": { transform: "rotate(0deg)" },
                          "100%": { transform: "rotate(360deg)" },
                        },
                      }}
                    />

                    <Box sx={{ position: "relative", zIndex: 1 }}>
                      <Typography
                        variant="overline"
                        sx={{ opacity: 0.7, fontSize: "0.875rem", mb: 2 }}
                      >
                        Mức pin hiện tại
                      </Typography>

                      <Typography
                        variant="h1"
                        sx={{
                          fontSize: { xs: "5rem", md: "6rem" },
                          fontWeight: "bold",
                          background:
                            "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                          backgroundClip: "text",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          mb: 3,
                          lineHeight: 1,
                        }}
                      >
                        {currentSOC}%
                      </Typography>

                      {/* Progress Bar */}
                      <Box sx={{ mb: 3, px: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={currentSOC}
                          sx={{
                            height: 16,
                            borderRadius: 8,
                            backgroundColor: "rgba(255,255,255,0.1)",
                            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)",
                            "& .MuiLinearProgress-bar": {
                              background:
                                "linear-gradient(90deg, #10b981 0%, #34d399 100%)",
                              borderRadius: 8,
                              boxShadow: "0 0 10px rgba(16, 185, 129, 0.5)",
                            },
                          }}
                        />
                      </Box>

                      {/* Time to full */}
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 1,
                          background: "rgba(245, 158, 11, 0.15)",
                          border: "1px solid rgba(245, 158, 11, 0.3)",
                          borderRadius: 2,
                          px: 3,
                          py: 1.5,
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{ color: "#f59e0b", fontWeight: 600 }}
                        >
                          ⏱️{" "}
                          {formatTime(
                            chargingStartTime
                              ? Math.max(
                                  0,
                                  Math.round((targetSOC - currentSOC) * 1.2)
                                )
                              : sessionData.estimatedDuration || 66
                          )}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          còn lại đầy
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                {/* Right: Stats Cards */}
                <Grid item xs={12} md={7}>
                  <Grid container spacing={2} sx={{ height: "100%" }}>
                    {/* Power */}
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          background:
                            "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.05) 100%)",
                          border: "2px solid rgba(59, 130, 246, 0.3)",
                          borderRadius: 2.5,
                          p: 3,
                          textAlign: "center",
                          height: "100%",
                          minHeight: 140,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: "0 8px 24px rgba(59, 130, 246, 0.3)",
                            border: "2px solid rgba(59, 130, 246, 0.5)",
                          },
                        }}
                      >
                        <Typography
                          variant="h2"
                          sx={{
                            color: "#3b82f6",
                            fontWeight: "bold",
                            mb: 1,
                            textShadow: "0 0 20px rgba(59, 130, 246, 0.3)",
                          }}
                        >
                          {chargingStartTime
                            ? currentSOC < 50
                              ? "150"
                              : currentSOC < 80
                              ? "75"
                              : "22"
                            : "0"}
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ opacity: 0.9, mb: 1, fontWeight: 600 }}
                        >
                          kW
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            opacity: 0.7,
                            textTransform: "uppercase",
                            letterSpacing: 1,
                          }}
                        >
                          Công suất sạc
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Temperature */}
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          background:
                            "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.05) 100%)",
                          border: "2px solid rgba(239, 68, 68, 0.3)",
                          borderRadius: 2.5,
                          p: 3,
                          textAlign: "center",
                          height: "100%",
                          minHeight: 140,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: "0 8px 24px rgba(239, 68, 68, 0.3)",
                            border: "2px solid rgba(239, 68, 68, 0.5)",
                          },
                        }}
                      >
                        <Typography
                          variant="h2"
                          sx={{
                            color: "#ef4444",
                            fontWeight: "bold",
                            mb: 1,
                            textShadow: "0 0 20px rgba(239, 68, 68, 0.3)",
                          }}
                        >
                          {chargingStartTime
                            ? currentSOC < 50
                              ? "32"
                              : currentSOC < 80
                              ? "38"
                              : "42"
                            : "25"}
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ opacity: 0.9, mb: 1, fontWeight: 600 }}
                        >
                          °C
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            opacity: 0.7,
                            textTransform: "uppercase",
                            letterSpacing: 1,
                          }}
                        >
                          Nhiệt độ
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Range */}
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          background:
                            "linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(22, 163, 74, 0.05) 100%)",
                          border: "2px solid rgba(34, 197, 94, 0.3)",
                          borderRadius: 2.5,
                          p: 3,
                          textAlign: "center",
                          height: "100%",
                          minHeight: 140,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: "0 8px 24px rgba(34, 197, 94, 0.3)",
                            border: "2px solid rgba(34, 197, 94, 0.5)",
                          },
                        }}
                      >
                        <Typography
                          variant="h2"
                          sx={{
                            color: "#22c55e",
                            fontWeight: "bold",
                            mb: 1,
                            textShadow: "0 0 20px rgba(34, 197, 94, 0.3)",
                          }}
                        >
                          {Math.round(currentSOC * 4.5)}
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ opacity: 0.9, mb: 1, fontWeight: 600 }}
                        >
                          km
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            opacity: 0.7,
                            textTransform: "uppercase",
                            letterSpacing: 1,
                          }}
                        >
                          Quãng đường dự kiến
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Cost */}
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          background:
                            "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.05) 100%)",
                          border: "2px solid rgba(139, 92, 246, 0.3)",
                          borderRadius: 2.5,
                          p: 3,
                          textAlign: "center",
                          height: "100%",
                          minHeight: 140,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: "0 8px 24px rgba(139, 92, 246, 0.3)",
                            border: "2px solid rgba(139, 92, 246, 0.5)",
                          },
                        }}
                      >
                        <Typography
                          variant="h2"
                          sx={{
                            color: "#8b5cf6",
                            fontWeight: "bold",
                            mb: 1,
                            textShadow: "0 0 20px rgba(139, 92, 246, 0.3)",
                          }}
                        >
                          {Math.round(sessionData.currentCost / 1000)}K
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ opacity: 0.9, mb: 1, fontWeight: 600 }}
                        >
                          VND
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            opacity: 0.7,
                            textTransform: "uppercase",
                            letterSpacing: 1,
                          }}
                        >
                          Chi phí hiện tại
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Box>

            {/* Charging Animation Section */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: 0.5, // Reduced from 2 to 0.5
                background: "rgba(255,255,255,0.02)",
                borderTop: "1px solid rgba(255,255,255,0.05)",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5, // Reduced from 1 to 0.5
                  textAlign: "center",
                }}
              >
                {/* Large horizontal battery icon */}
                <Box
                  sx={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BatteryChargingFull
                    sx={{
                      fontSize: "16rem", // Increased from 8rem to 16rem (2x larger)
                      color: "#10b981",
                      transform: "rotate(90deg)", // Rotate to make it horizontal
                      animation: "chargingPulse 2.5s infinite",
                      filter: "drop-shadow(0 0 20px rgba(16, 185, 129, 0.3))",
                      "@keyframes chargingPulse": {
                        "0%": {
                          opacity: 1,
                          transform: "rotate(90deg) scale(1)",
                          filter:
                            "drop-shadow(0 0 20px rgba(16, 185, 129, 0.3))",
                        },
                        "50%": {
                          opacity: 0.8,
                          transform: "rotate(90deg) scale(1.05)",
                          filter:
                            "drop-shadow(0 0 30px rgba(16, 185, 129, 0.6))",
                        },
                        "100%": {
                          opacity: 1,
                          transform: "rotate(90deg) scale(1)",
                          filter:
                            "drop-shadow(0 0 20px rgba(16, 185, 129, 0.3))",
                        },
                      },
                    }}
                  />
                </Box>

                {/* Charging status text */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: "#10b981",
                      animation: "blink 1.5s infinite",
                      "@keyframes blink": {
                        "0%, 50%": { opacity: 1 },
                        "51%, 100%": { opacity: 0.3 },
                      },
                    }}
                  />
                  <Typography
                    variant="h6"
                    sx={{
                      color: "#10b981",
                      fontWeight: "medium",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Đang sạc xe điện
                  </Typography>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: "#10b981",
                      animation: "blink 1.5s infinite 0.75s", // Offset animation
                      "@keyframes blink": {
                        "0%, 50%": { opacity: 1 },
                        "51%, 100%": { opacity: 0.3 },
                      },
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Bottom Controls */}
            <Box
              sx={{
                background: "rgba(0,0,0,0.3)",
                px: 4,
                py: 3,
                display: "flex",
                justifyContent: "center",
                borderTop: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Button
                variant="contained"
                size="large"
                sx={{
                  background:
                    "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 50%, #ea2027 100%)",
                  px: 6,
                  py: 2,
                  borderRadius: "50px",
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  textTransform: "none",
                  minWidth: "200px",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow:
                    "0 8px 32px rgba(234, 32, 39, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: "-100%",
                    width: "100%",
                    height: "100%",
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                    transition: "left 0.6s",
                  },
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #ee5a24 0%, #ea2027 50%, #c23616 100%)",
                    transform: "translateY(-2px) scale(1.02)",
                    boxShadow:
                      "0 12px 40px rgba(234, 32, 39, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2)",
                    "&::before": {
                      left: "100%",
                    },
                  },
                  "&:active": {
                    transform: "translateY(0) scale(0.98)",
                  },
                }}
                onClick={async () => {
                  if (!chargingStartTime) {
                    console.error("No charging session to stop");
                    return;
                  }

                  const sessionEndData = {
                    energyDelivered: sessionData.energyDelivered,
                    chargingDuration: Math.round(
                      (new Date() - chargingStartTime) / (1000 * 60)
                    ),
                    totalAmount: sessionData.currentCost,
                    finalSOC: currentSOC,
                    completedAt: new Date().toISOString(),
                    stationName: selectedStation?.name,
                    connectorId: scanResult?.split(":").pop() || "A01",
                    bookingId: currentBookingData?.id,
                  };
                  setCompletedSession(sessionEndData);

                  // 🚀 Call API to complete charging session
                  // Use numeric ID from API response, not the BOOK... string
                  const bookingId =
                    currentBooking?.id || currentBookingData?.id;
                  if (bookingId) {
                    try {
                      console.log(
                        "📤 Calling completeCharging API with booking ID:",
                        bookingId
                      );
                      console.log("� Session data:", {
                        finalSoc: currentSOC,
                        totalEnergyKwh: sessionData.energyDelivered,
                        unitPrice:
                          selectedStation?.chargers?.[0]?.powerKw || 3500,
                      });

                      const response = await chargingAPI.completeCharging(
                        bookingId,
                        {
                          finalSoc: currentSOC,
                          totalEnergyKwh: sessionData.energyDelivered,
                          unitPrice:
                            selectedStation?.chargers?.[0]?.powerKw || 3500,
                        }
                      );

                      console.log(
                        "✅ Charging session completed via API:",
                        response
                      );

                      // Update charging session status
                      if (chargingSession) {
                        bookingStore.setState({
                          chargingSession: {
                            ...chargingSession,
                            status: "completed",
                            endTime: new Date(),
                            totalEnergy: sessionData.energyDelivered,
                            totalCost: sessionData.currentCost,
                          },
                        });
                      }
                    } catch (error) {
                      console.error(
                        "❌ Error completing charging via API:",
                        error
                      );
                      // Continue with local completion even if API fails
                      console.warn(
                        "⚠️ Continuing with local session completion"
                      );
                    }

                    // Also call bookingStore completeBooking for local state
                    completeBooking(bookingId, sessionEndData);
                  }

                  // Notify charging completed
                  notificationService.notifyChargingCompleted({
                    energyDelivered: sessionData.energyDelivered,
                    finalSOC: currentSOC,
                  });

                  setFlowStep(5); // Move to payment step
                  console.log("🏁 Charging session completed:", sessionEndData);
                }}
              >
                Dừng sạc
              </Button>
            </Box>
          </Box>
        </Grid>
      )}
      {/* Step 5: Payment */}
      {flowStep === 5 && (
        <Grid item xs={12}>
          <Paper sx={{ p: 4 }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ textAlign: "center", mb: 3 }}
            >
              💳 Thanh toán phiên sạc
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Chi tiết phiên sạc
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">Trạm sạc:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {selectedStation?.name || "Green Mall Charging Hub"}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">Connector:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {scanResult?.split(":").pop() || "A01"}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">Năng lượng:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {completedSession?.energyDelivered ||
                          sessionData.energyDelivered.toFixed(1)}{" "}
                        kWh
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">Thời gian sạc:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatTime(
                          completedSession?.chargingDuration ||
                            (chargingStartTime
                              ? Math.round(
                                  (new Date() - chargingStartTime) / (1000 * 60)
                                )
                              : Math.round(sessionData.energyDelivered * 3))
                        )}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">Giá sạc:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(sessionData.chargingRate)}/kWh
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">
                        Chi phí năng lượng:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(
                          completedSession?.totalAmount ||
                            sessionData.currentCost
                        )}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 2,
                      }}
                    >
                      <Typography variant="body2">Phí đỗ xe:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(
                          (chargingStartTime
                            ? Math.round(
                                (new Date() - chargingStartTime) / (1000 * 60)
                              )
                            : Math.round(sessionData.energyDelivered * 3)) * 500
                        )}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        pt: 2,
                        borderTop: 1,
                        borderColor: "divider",
                      }}
                    >
                      <Typography variant="h6">Tổng cộng:</Typography>
                      <Typography
                        variant="h6"
                        color="primary.main"
                        fontWeight="bold"
                      >
                        {formatCurrency(calculateTotalCost())}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Phương thức thanh toán
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Chọn phương thức thanh toán của bạn
                    </Typography>

                    {/* Payment Methods */}
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      <Button
                        variant={
                          selectedPaymentMethod === "credit-card"
                            ? "contained"
                            : "outlined"
                        }
                        fullWidth
                        onClick={() => setSelectedPaymentMethod("credit-card")}
                        sx={{
                          justifyContent: "flex-start",
                          p: 2,
                          borderWidth: 2,
                          "&:hover": { borderWidth: 2 },
                        }}
                      >
                        💳 Thẻ tín dụng **** 4567
                      </Button>
                      <Button
                        variant={
                          selectedPaymentMethod === "momo"
                            ? "contained"
                            : "outlined"
                        }
                        fullWidth
                        onClick={() => setSelectedPaymentMethod("momo")}
                        sx={{
                          justifyContent: "flex-start",
                          p: 2,
                          borderWidth: 2,
                          "&:hover": { borderWidth: 2 },
                        }}
                      >
                        📱 MoMo Wallet
                      </Button>
                      <Button
                        variant={
                          selectedPaymentMethod === "bank-transfer"
                            ? "contained"
                            : "outlined"
                        }
                        fullWidth
                        onClick={() =>
                          setSelectedPaymentMethod("bank-transfer")
                        }
                        sx={{
                          justifyContent: "flex-start",
                          p: 2,
                          borderWidth: 2,
                          "&:hover": { borderWidth: 2 },
                        }}
                      >
                        🏦 Chuyển khoản ngân hàng
                      </Button>
                    </Box>

                    {!selectedPaymentMethod && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Vui lòng chọn phương thức thanh toán
                      </Alert>
                    )}

                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      disabled={!selectedPaymentMethod}
                      sx={{
                        mt: 3,
                        opacity: !selectedPaymentMethod ? 0.5 : 1,
                      }}
                      onClick={() => {
                        if (selectedPaymentMethod) {
                          // Trigger payment success notification
                          const totalAmount = calculateTotalCost();
                          const invoiceNumber = `INV-${Date.now()}`;

                          notificationService.notifyPaymentSuccess({
                            amount: totalAmount,
                            invoiceNumber: invoiceNumber,
                          });

                          setFlowStep(6);
                        }
                      }}
                    >
                      {selectedPaymentMethod
                        ? `Thanh toán ${formatCurrency(calculateTotalCost())}`
                        : "Chọn phương thức thanh toán"}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      )}
      {/* Step 6: Complete with Rating */}
      {flowStep === 6 && (
        <Grid item xs={12}>
          <Box
            sx={{
              background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
              borderRadius: 4,
              p: 0,
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            }}
          >
            {/* Header Section */}
            <Box
              sx={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "white",
                p: 4,
                textAlign: "center",
                position: "relative",
              }}
            >
              <CheckCircle
                sx={{
                  fontSize: 100,
                  mb: 2,
                  filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
                }}
              />
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Sạc hoàn thành!
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Cảm ơn bạn đã sử dụng dịch vụ SkaEV
              </Typography>
            </Box>

            {/* Stats Section */}
            <Box sx={{ p: 4 }}>
              <Typography
                variant="h5"
                color="primary.main"
                fontWeight="bold"
                sx={{ mb: 3, textAlign: "center" }}
              >
                📊 Tóm tắt phiên sạc
              </Typography>

              <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Energy */}
                <Grid item xs={12} sm={4}>
                  <Box
                    sx={{
                      background:
                        "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "white",
                      p: 3,
                      borderRadius: 3,
                      textAlign: "center",
                      boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
                      height: 140,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                      {completedSession?.energyDelivered ||
                        sessionData.energyDelivered.toFixed(1)}
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                      kWh đã sạc
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                      Năng lượng nạp vào xe
                    </Typography>
                  </Box>
                </Grid>

                {/* Duration */}
                <Grid item xs={12} sm={4}>
                  <Box
                    sx={{
                      background:
                        "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                      color: "white",
                      p: 3,
                      borderRadius: 3,
                      textAlign: "center",
                      boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
                      height: 140,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                      {formatTime(
                        completedSession?.chargingDuration ||
                          (chargingStartTime
                            ? Math.round(
                                (new Date() - chargingStartTime) / (1000 * 60)
                              )
                            : 0)
                      )}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                      Thời gian sạc
                    </Typography>
                  </Box>
                </Grid>

                {/* Battery Level */}
                <Grid item xs={12} sm={4}>
                  <Box
                    sx={{
                      background:
                        "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      color: "white",
                      p: 3,
                      borderRadius: 3,
                      textAlign: "center",
                      boxShadow: "0 4px 15px rgba(245, 158, 11, 0.3)",
                      height: 140,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                      {currentSOC}%
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                      mức pin hiện tại
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                      Từ {sessionData.startSOC}% → {currentSOC}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Cost Summary */}
              <Box
                sx={{
                  background:
                    "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
                  border: "1px solid #cbd5e1",
                  borderRadius: 3,
                  p: 3,
                  mb: 4,
                }}
              >
                <Typography
                  variant="h6"
                  color="primary.main"
                  fontWeight="bold"
                  gutterBottom
                >
                  Chi phí sạc
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Năng lượng:{" "}
                      {completedSession?.energyDelivered ||
                        sessionData.energyDelivered.toFixed(1)}{" "}
                      kWh × ₫
                      {(sessionData.chargingRate || 8500).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sx={{ textAlign: "right" }}>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(
                        completedSession?.totalAmount || sessionData.currentCost
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Phí đỗ xe:{" "}
                      {chargingStartTime
                        ? Math.round(
                            (new Date() - chargingStartTime) / (1000 * 60)
                          )
                        : Math.round(sessionData.energyDelivered * 3)}{" "}
                      phút
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sx={{ textAlign: "right" }}>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(
                        (chargingStartTime
                          ? Math.round(
                              (new Date() - chargingStartTime) / (1000 * 60)
                            )
                          : Math.round(sessionData.energyDelivered * 3)) * 500
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        borderTop: 1,
                        borderColor: "divider",
                        pt: 2,
                        mt: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="h6" fontWeight="bold">
                          Tổng cộng:
                        </Typography>
                        <Typography
                          variant="h5"
                          color="primary.main"
                          fontWeight="bold"
                        >
                          {formatCurrency(calculateTotalCost())}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Action Buttons */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: "25px",
                    borderColor: "#10b981",
                    color: "#10b981",
                    "&:hover": {
                      borderColor: "#059669",
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                    },
                  }}
                  onClick={() => setRatingModalOpen(true)}
                >
                  Đánh giá trải nghiệm
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: "25px",
                    background:
                      "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    },
                  }}
                  onClick={() => {
                    // Reset all flow state including booking and session
                    resetFlowState();
                    setFlowStep(0);
                    setSelectedStation(null);
                    setPersistedStationId(null);
                    setDirectionsData({
                      loading: false,
                      info: null,
                      error: null,
                    });
                    if (typeof window !== "undefined") {
                      try {
                        sessionStorage.removeItem(
                          "chargingSelectedStationId"
                        );
                      } catch (error) {
                        console.warn(
                          "Không thể xóa chargingSelectedStationId",
                          error
                        );
                      }
                    }
                    setScanResult("");
                    setCompletedSession(null);
                    setCurrentBookingData(null);
                    setChargingStartTime(null);
                    setSelectedPaymentMethod(null);
                    // Reset session data to initial state
                    setSessionData({
                      energyDelivered: 0,
                      startSOC: 25,
                      currentSOC: 25,
                      targetSOC: 80,
                      startTime: null,
                      estimatedDuration: 0,
                      currentCost: 0,
                      chargingRate: 8500,
                      stationId: "ST-001",
                      stationName: "Trạm sạc FPT Hà Nội",
                      connectorType: "CCS2",
                      maxPower: 150,
                    });
                  }}
                >
                  Kết thúc
                </Button>
              </Box>
            </Box>
          </Box>
        </Grid>
      )}
      {/* Booking Modal */}
      <BookingModal
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        station={selectedStation}
        onSuccess={handleBookingComplete}
      />
      {/* QR Scanner Dialog */}
      <Dialog
        open={qrScanOpen}
        onClose={() => setQrScanOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Quét mã QR trên trụ sạc</DialogTitle>
        <DialogContent>
          {qrScanOpen && (
            <QRCodeScannerComponent
              onScanSuccess={(result) => {
                handleQRScan(result);
              }}
              onClose={() => setQrScanOpen(false)}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrScanOpen(false)}>Đóng</Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleQRScan("SKAEV:STATION:ST001:A01")}
          >
            Demo: Quét thành công
          </Button>
        </DialogActions>
      </Dialog>
      {/* Rating Modal */}
      <RatingModal
        open={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        station={selectedStation}
        completedSession={completedSession}
        onRatingComplete={() => {
          setRatingModalOpen(false);
          // Reset flow after rating
          setTimeout(() => {
            setFlowStep(0);
            setSelectedStation(null);
            setPersistedStationId(null);
            setDirectionsData({
              loading: false,
              info: null,
              error: null,
            });
            if (typeof window !== "undefined") {
              try {
                sessionStorage.removeItem("chargingSelectedStationId");
              } catch (error) {
                console.warn(
                  "Không thể xóa chargingSelectedStationId",
                  error
                );
              }
            }
            setScanResult("");
            setCompletedSession(null);
          }, 1000);
        }}
      />
    </Container>
  );
};

export default ChargingFlow;
