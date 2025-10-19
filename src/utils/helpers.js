// Helper functions for SkaEV application

/**
 * Format currency with Vietnamese Dong
 */
export const formatCurrency = (amount, currency = "VND") => {
  if (typeof amount !== "number") return "₫0";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date with Vietnamese locale
 */
export const formatDate = (date, options = {}) => {
  if (!date) return "";

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return "Ngày không hợp lệ";

  const defaultOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  };

  return dateObj.toLocaleDateString("vi-VN", defaultOptions);
};

/**
 * Format time
 */
export const formatTime = (date, options = {}) => {
  if (!date) return "";

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return "Giờ không hợp lệ";

  const defaultOptions = {
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  };

  return dateObj.toLocaleTimeString("vi-VN", defaultOptions);
};

/**
 * Format datetime
 */
export const formatDateTime = (date) => {
  if (!date) return "";
  return `${formatDate(date)} ${formatTime(date)}`;
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

const toRadians = (degrees) => degrees * (Math.PI / 180);

/**
 * Format distance with appropriate unit
 */
export const formatDistance = (distanceKm) => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
};

/**
 * Calculate charging duration estimate
 */
export const calculateChargingDuration = (
  batteryCapacity,
  currentSoC,
  targetSoC,
  chargingPower
) => {
  const requiredEnergy = (batteryCapacity * (targetSoC - currentSoC)) / 100;
  const chargingEfficiency = 0.85; // Typical charging efficiency
  const durationHours = requiredEnergy / (chargingPower * chargingEfficiency);

  return Math.ceil(durationHours * 60); // Return in minutes
};

/**
 * Calculate charging cost estimate
 */
export const calculateChargingCost = (
  energyKWh,
  pricePerKWh,
  parkingFee = 0,
  duration = 0
) => {
  const energyCost = energyKWh * pricePerKWh;
  const totalParkingFee = parkingFee * Math.ceil(duration / 60); // Parking fee per hour

  return {
    energyCost,
    parkingCost: totalParkingFee,
    total: energyCost + totalParkingFee,
  };
};

/**
 * Get charging status color
 */
export const getStatusColor = (status) => {
  const statusColors = {
    available: "#10B981", // Green
    occupied: "#F59E0B", // Orange
    charging: "#B5FF3D", // Lime
    offline: "#EF4444", // Red
    maintenance: "#6B7280", // Gray
  };

  return statusColors[status] || statusColors["offline"];
};

/**
 * Get power level category
 */
export const getPowerLevel = (power) => {
  if (power <= 22) return "slow";
  if (power <= 99) return "fast";
  return "rapid";
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Vietnamese format)
 */
export const validatePhone = (phone) => {
  const phoneRegex = /^(\+84|0)(3|5|7|8|9)[0-9]{8}$/;
  return phoneRegex.test(phone);
};

/**
 * Generate random ID
 */
export const generateId = (prefix = "") => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}${timestamp}${random}`;
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Deep clone object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map((item) => deepClone(item));
  if (typeof obj === "object") {
    const clonedObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

/**
 * Get user initials for avatar
 */
export const getUserInitials = (firstName, lastName) => {
  const first = firstName?.charAt(0)?.toUpperCase() || "";
  const last = lastName?.charAt(0)?.toUpperCase() || "";
  return first + last;
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Check if device is mobile
 */
export const isMobile = () => {
  return window.innerWidth <= 768;
};

/**
 * Get browser info
 */
export const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  let browserName;

  if (userAgent.includes("Chrome")) browserName = "Chrome";
  else if (userAgent.includes("Firefox")) browserName = "Firefox";
  else if (userAgent.includes("Safari")) browserName = "Safari";
  else if (userAgent.includes("Edge")) browserName = "Edge";
  else browserName = "Không xác định";

  return {
    name: browserName,
    userAgent,
    language: navigator.language,
    platform: navigator.platform,
  };
};
