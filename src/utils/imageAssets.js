// Image assets management for SkaEV
// This file provides a centralized way to manage all image assets

// Default placeholders - using inline SVG to avoid external dependencies
export const PLACEHOLDER_IMAGES = {
  // User avatars (inline SVG data URIs)
  AVATAR_DEFAULT: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%231379FF" width="150" height="150"/%3E%3Ctext fill="white" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="18"%3EUser%3C/text%3E%3C/svg%3E',
  AVATAR_ADMIN: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23EF4444" width="150" height="150"/%3E%3Ctext fill="white" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="18"%3EAdmin%3C/text%3E%3C/svg%3E',
  AVATAR_OWNER: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23F59E0B" width="150" height="150"/%3E%3Ctext fill="white" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="18"%3EOwner%3C/text%3E%3C/svg%3E',
  AVATAR_CUSTOMER: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%2310B981" width="150" height="150"/%3E%3Ctext fill="white" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="16"%3ECustomer%3C/text%3E%3C/svg%3E',

  // Charging stations (inline SVG data URIs)
  STATION_DEFAULT: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect fill="%231379FF" width="400" height="200"/%3E%3Ctext fill="white" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="20"%3ECharging Station%3C/text%3E%3C/svg%3E',
  STATION_GREEN_MALL: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect fill="%2310B981" width="400" height="200"/%3E%3Ctext fill="white" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="18"%3EGreen Mall Hub%3C/text%3E%3C/svg%3E',
  STATION_TECH_PARK: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect fill="%233B82F6" width="400" height="200"/%3E%3Ctext fill="white" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="16"%3ETech Park SuperCharger%3C/text%3E%3C/svg%3E',
  STATION_ECO_PARK: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect fill="%23B5FF3D" width="400" height="200"/%3E%3Ctext fill="%23333333" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="18"%3EEcoPark Station%3C/text%3E%3C/svg%3E',

  // Logos and branding
  LOGO_SKAEV: "/assets/images/skaev-logo.png",
  LOGO_ICON: "/assets/images/skaev-icon.png",

  // Hero and marketing images (inline SVG data URIs)
  HERO_ELECTRIC_CAR: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400"%3E%3Crect fill="%231379FF" width="800" height="400"/%3E%3Ctext fill="white" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="32"%3EElectric Vehicle%3C/text%3E%3C/svg%3E',
  HERO_CHARGING: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400"%3E%3Crect fill="%23B5FF3D" width="800" height="400"/%3E%3Ctext fill="%23333333" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="32"%3EFast Charging%3C/text%3E%3C/svg%3E',

  // Feature illustrations (inline SVG data URIs)
  FEATURE_FAST_CHARGING: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%231379FF" width="300" height="200"/%3E%3Ctext fill="white" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="18"%3EFast Charging%3C/text%3E%3C/svg%3E',
  FEATURE_NETWORK: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%2310B981" width="300" height="200"/%3E%3Ctext fill="white" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="18"%3EWide Network%3C/text%3E%3C/svg%3E',
  FEATURE_GREEN_ENERGY: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23B5FF3D" width="300" height="200"/%3E%3Ctext fill="%23333333" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="18"%3EGreen Energy%3C/text%3E%3C/svg%3E',
  FEATURE_SECURE: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%233B82F6" width="300" height="200"/%3E%3Ctext fill="white" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="18"%3ESecure Payment%3C/text%3E%3C/svg%3E',
};

// Image paths for actual assets (when you have real images)
export const IMAGE_PATHS = {
  // User avatars directory
  avatars: {
    admin: {
      sarah: "/assets/avatars/admin-sarah.jpg",
      michael: "/assets/avatars/admin-michael.jpg",
    },
    owner: {
      david: "/assets/avatars/owner-david.jpg",
      linda: "/assets/avatars/owner-linda.jpg",
    },
    customer: {
      vanan: "/assets/avatars/customer-vanan.jpg",
      anna: "/assets/avatars/customer-anna.jpg",
    },
  },

  // Station images directory
  stations: {
    greenMall: {
      main: "/assets/stations/green-mall-1.jpg",
      secondary: "/assets/stations/green-mall-2.jpg",
    },
    techPark: {
      main: "/assets/stations/tech-park-1.jpg",
      secondary: "/assets/stations/tech-park-2.jpg",
    },
    ecoPark: {
      main: "/assets/stations/ecopark-1.jpg",
    },
  },

  // Brand assets
  brand: {
    logo: "/assets/images/skaev-logo.png",
    logoWhite: "/assets/images/skaev-logo-white.png",
    icon: "/assets/images/skaev-icon.png",
    favicon: "/assets/images/favicon.ico",
  },

  // Marketing and hero images
  hero: {
    electricCar: "/assets/images/hero-electric-car.jpg",
    chargingStation: "/assets/images/hero-charging-station.jpg",
    cityView: "/assets/images/hero-city-view.jpg",
  },

  // Feature and illustration images
  features: {
    fastCharging: "/assets/images/feature-fast-charging.svg",
    network: "/assets/images/feature-network.svg",
    greenEnergy: "/assets/images/feature-green-energy.svg",
    security: "/assets/images/feature-security.svg",
  },
};

// Helper function to get image with fallback
export const getImageWithFallback = (imagePath, fallbackKey) => {
  // In a real app, you might want to check if the image exists
  // For now, we'll use placeholders as fallbacks
  return (
    imagePath ||
    PLACEHOLDER_IMAGES[fallbackKey] ||
    PLACEHOLDER_IMAGES.STATION_DEFAULT
  );
};

// Helper function to get user avatar
export const getUserAvatar = (user) => {
  if (!user) return PLACEHOLDER_IMAGES.AVATAR_DEFAULT;

  // If user has custom avatar, use it
  if (user.profile?.avatar && !user.profile.avatar.includes("placeholder")) {
    return user.profile.avatar;
  }

  // Otherwise use role-based placeholder
  switch (user.role) {
    case "admin":
      return PLACEHOLDER_IMAGES.AVATAR_ADMIN;
    case "owner":
      return PLACEHOLDER_IMAGES.AVATAR_OWNER;
    case "customer":
      return PLACEHOLDER_IMAGES.AVATAR_CUSTOMER;
    default:
      return PLACEHOLDER_IMAGES.AVATAR_DEFAULT;
  }
};

// Helper function to get station image
export const getStationImage = (station, imageIndex = 0) => {
  if (!station) return PLACEHOLDER_IMAGES.STATION_DEFAULT;

  // If station has images array, use it
  if (station.images && station.images[imageIndex]) {
    const imagePath = station.images[imageIndex];
    // If it's not a placeholder URL, return the actual path
    if (!imagePath.includes("placeholder")) {
      return imagePath;
    }
  }

  // Use station-specific placeholder based on ID
  switch (station.id) {
    case "station-001":
      return PLACEHOLDER_IMAGES.STATION_GREEN_MALL;
    case "station-002":
      return PLACEHOLDER_IMAGES.STATION_TECH_PARK;
    case "station-003":
      return PLACEHOLDER_IMAGES.STATION_ECO_PARK;
    default:
      return PLACEHOLDER_IMAGES.STATION_DEFAULT;
  }
};

// Image optimization helpers
export const getOptimizedImageUrl = (url, width, height) => {
  // In a real app, you might use a service like Cloudinary or ImageKit with quality param
  // For now, just return the original URL with width/height (quality unused in mock)
  console.log(`Optimizing image: ${url} to ${width}x${height}`);
  return url;
};

// Generate responsive image srcSet
export const generateSrcSet = (baseUrl, sizes = [400, 800, 1200]) => {
  return sizes
    .map((size) => `${getOptimizedImageUrl(baseUrl, size)} ${size}w`)
    .join(", ");
};

export default {
  PLACEHOLDER_IMAGES,
  IMAGE_PATHS,
  getImageWithFallback,
  getUserAvatar,
  getStationImage,
  getOptimizedImageUrl,
  generateSrcSet,
};
