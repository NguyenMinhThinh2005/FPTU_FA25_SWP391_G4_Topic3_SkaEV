// Mock API services for development environment
import { mockData } from "./mockData.js";

// Simulate network delay
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// =================================
// AUTHENTICATION API MOCK
// =================================

export const authAPI = {
  async login(credentials) {
    await delay(500);

    const user = mockData.users.find(
      (u) =>
        u.email === credentials.email && u.password === credentials.password
    );

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Generate mock JWT token
    const token = `mock.jwt.token.${user.id}.${Date.now()}`;

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          profile: user.profile,
          ...(user.business && { business: user.business }),
          ...(user.vehicle && { vehicle: user.vehicle }),
          ...(user.preferences && { preferences: user.preferences }),
        },
        token,
        expiresIn: 86400, // 24 hours
      },
    };
  },

  async register(userData) {
    await delay(600);

    // Check if email already exists
    const existingUser = mockData.users.find((u) => u.email === userData.email);
    if (existingUser) {
      throw new Error("Email already registered");
    }

    // Create new user
    const newUser = {
      id: `${userData.role}-${Date.now()}`,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      profile: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        avatar: "/assets/avatars/default.jpg",
        createdAt: new Date().toISOString(),
        verified: false,
      },
    };

    // Add to mock database
    mockData.users.push(newUser);

    return {
      success: true,
      message: "Registration successful! Please verify your email.",
      data: { userId: newUser.id },
    };
  },

  async forgotPassword(email) {
    await delay(400);

    const user = mockData.users.find((u) => u.email === email);
    if (!user) {
      throw new Error("Email not found");
    }

    return {
      success: true,
      message: "Password reset email sent successfully",
    };
  },

  async validateToken(token) {
    await delay(200);

    if (!token || !token.startsWith("mock.jwt.token")) {
      throw new Error("Invalid token");
    }

    const userId = token.split(".")[3];
    const user = mockData.users.find((u) => u.id === userId);

    if (!user) {
      throw new Error("User not found");
    }

    return {
      success: true,
      data: { user },
    };
  },
};

// =================================
// STATIONS API MOCK
// =================================

export const stationsAPI = {
  async getAll(filters = {}) {
    await delay(400);

    let stations = [...mockData.stations];

    // Apply filters
    if (filters.ownerId) {
      stations = stations.filter((s) => s.ownerId === filters.ownerId);
    }

    if (filters.status) {
      stations = stations.filter((s) => s.status === filters.status);
    }

    if (filters.type) {
      stations = stations.filter((s) => s.type === filters.type);
    }

    return {
      success: true,
      data: stations,
      pagination: {
        total: stations.length,
        page: 1,
        limit: 50,
      },
    };
  },

  async getById(stationId) {
    await delay(300);

    const station = mockData.stations.find((s) => s.id === stationId);
    if (!station) {
      throw new Error("Station not found");
    }

    return {
      success: true,
      data: station,
    };
  },

  async getNearby(coordinates, radius = 10) {
    await delay(500);

    // Simple distance calculation (mock)
    const stations = mockData.stations.filter((station) => {
      const distance =
        Math.abs(station.location.coordinates.lat - coordinates.lat) +
        Math.abs(station.location.coordinates.lng - coordinates.lng);
      return distance <= radius * 0.01; // Rough conversion
    });

    return {
      success: true,
      data: stations.map((station) => ({
        ...station,
        distance: Math.random() * radius, // Mock distance
      })),
    };
  },

  async create(stationData) {
    await delay(600);

    const newStation = {
      id: `station-${Date.now()}`,
      ...stationData,
      status: "pending",
      ratings: {
        overall: 0,
        cleanliness: 0,
        availability: 0,
        speed: 0,
        totalReviews: 0,
      },
      createdAt: new Date().toISOString(),
    };

    mockData.stations.push(newStation);

    return {
      success: true,
      data: newStation,
      message: "Station created successfully",
    };
  },

  async update(stationId, updateData) {
    await delay(400);

    const stationIndex = mockData.stations.findIndex((s) => s.id === stationId);
    if (stationIndex === -1) {
      throw new Error("Station not found");
    }

    mockData.stations[stationIndex] = {
      ...mockData.stations[stationIndex],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: mockData.stations[stationIndex],
      message: "Station updated successfully",
    };
  },
};

// =================================
// BOOKINGS API MOCK
// =================================

export const bookingsAPI = {
  async getAll(filters = {}) {
    await delay(350);

    let bookings = [...mockData.bookings];

    if (filters.customerId) {
      bookings = bookings.filter((b) => b.customerId === filters.customerId);
    }

    if (filters.stationId) {
      bookings = bookings.filter((b) => b.stationId === filters.stationId);
    }

    if (filters.status) {
      bookings = bookings.filter((b) => b.status === filters.status);
    }

    // Enrich with station data
    const enrichedBookings = bookings.map((booking) => ({
      ...booking,
      station: mockData.stations.find((s) => s.id === booking.stationId),
    }));

    return {
      success: true,
      data: enrichedBookings,
    };
  },

  async create(bookingData) {
    await delay(500);

    // Check station availability
    const station = mockData.stations.find(
      (s) => s.id === bookingData.stationId
    );
    if (!station || station.charging.availablePorts === 0) {
      throw new Error("No available charging ports");
    }

    const newBooking = {
      id: `booking-${Date.now()}`,
      ...bookingData,
      status: "scheduled",
      createdAt: new Date().toISOString(),
    };

    mockData.bookings.push(newBooking);

    // Update station availability
    station.charging.availablePorts -= 1;

    return {
      success: true,
      data: newBooking,
      message: "Booking created successfully",
    };
  },

  async cancel(bookingId) {
    await delay(300);

    const bookingIndex = mockData.bookings.findIndex((b) => b.id === bookingId);
    if (bookingIndex === -1) {
      throw new Error("Booking not found");
    }

    const booking = mockData.bookings[bookingIndex];
    if (booking.status === "active") {
      throw new Error("Cannot cancel active charging session");
    }

    booking.status = "cancelled";
    booking.cancelledAt = new Date().toISOString();

    return {
      success: true,
      message: "Booking cancelled successfully",
    };
  },
};

// =================================
// USERS API MOCK
// =================================

export const usersAPI = {
  async getAll(filters = {}) {
    await delay(400);

    let users = [...mockData.users];

    if (filters.role) {
      users = users.filter((u) => u.role === filters.role);
    }

    if (filters.verified !== undefined) {
      users = users.filter((u) => u.profile.verified === filters.verified);
    }

    // Remove sensitive data
    const safeUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.profile,
      ...(user.business && { business: user.business }),
    }));

    return {
      success: true,
      data: safeUsers,
    };
  },

  async getById(userId) {
    await delay(250);

    const user = mockData.users.find((u) => u.id === userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Remove password
    const { password, ...safeUser } = user;
    return {
      success: true,
      data: safeUser,
    };
  },

  async update(userId, updateData) {
    await delay(350);

    const userIndex = mockData.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      throw new Error("User not found");
    }

    mockData.users[userIndex] = {
      ...mockData.users[userIndex],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    const { password, ...safeUser } = mockData.users[userIndex];
    return {
      success: true,
      data: safeUser,
      message: "Profile updated successfully",
    };
  },
};

// =================================
// ANALYTICS API MOCK
// =================================

export const analyticsAPI = {
  async getSystemOverview() {
    await delay(600);

    return {
      success: true,
      data: mockData.analytics.systemOverview,
    };
  },

  async getRevenue(period = "monthly") {
    await delay(500);

    return {
      success: true,
      data: mockData.analytics.revenueData,
    };
  },

  async getStationUsage(ownerId = null) {
    await delay(450);

    let usage = mockData.analytics.stationUsage;

    if (ownerId) {
      const ownerStations = mockData.stations
        .filter((s) => s.ownerId === ownerId)
        .map((s) => s.id);

      usage = usage.filter((u) => ownerStations.includes(u.stationId));
    }

    return {
      success: true,
      data: usage,
    };
  },
};

// =================================
// EXPORT ALL API SERVICES
// =================================

export const mockAPI = {
  auth: authAPI,
  stations: stationsAPI,
  bookings: bookingsAPI,
  users: usersAPI,
  analytics: analyticsAPI,
};

export default mockAPI;
