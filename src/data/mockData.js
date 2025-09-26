// Mock data for SkaEV development environment

// =================================
// USERS & AUTHENTICATION
// =================================

export const mockUsers = [
  // Admin Users
  {
    id: "admin-001",
    email: "admin@skaev.com",
    password: "Admin123!",
    role: "admin",
    profile: {
      firstName: "Sarah",
      lastName: "Johnson",
      avatar: "/assets/avatars/admin-sarah.jpg",
      phone: "+84 901 234 567",
      createdAt: "2024-01-15T08:00:00Z",
      lastLogin: "2024-03-15T14:30:00Z",
      permissions: ["all"],
    },
  },
  {
    id: "admin-002",
    email: "system@skaev.com",
    password: "System123!",
    role: "admin",
    profile: {
      firstName: "Michael",
      lastName: "Chen",
      avatar: "/assets/avatars/admin-michael.jpg",
      phone: "+84 902 345 678",
      createdAt: "2024-01-20T09:15:00Z",
      lastLogin: "2024-03-15T13:45:00Z",
      permissions: ["users", "stations", "reports"],
    },
  },

  // Staff Users
  {
    id: "staff-001",
    email: "staff@skaev.com",
    password: "Staff123!",
    role: "staff",
    profile: {
      firstName: "Nguyen",
      lastName: "Van Minh",
      avatar: "/assets/avatars/staff-minh.jpg",
      phone: "+84 906 789 012",
      employeeId: "ST001",
      department: "Operations",
      position: "Station Technician",
      joinDate: "2024-01-15",
      location: "Hà Nội",
      createdAt: "2024-01-15T08:30:00Z",
      lastLogin: "2024-03-15T12:15:00Z",
      permissions: ["stations", "maintenance"],
    },
  },
  {
    id: "staff-002",
    email: "technician@skaev.com",
    password: "Tech123!",
    role: "staff",
    profile: {
      firstName: "Le",
      lastName: "Thi Lan",
      avatar: "/assets/avatars/staff-lan.jpg",
      phone: "+84 907 890 123",
      employeeId: "ST002",
      department: "Technical Support",
      position: "Senior Technician",
      joinDate: "2024-02-01",
      location: "Hồ Chí Minh",
      createdAt: "2024-02-01T09:00:00Z",
      lastLogin: "2024-03-15T11:30:00Z",
      permissions: ["stations", "maintenance", "support"],
    },
  },

  // Customers
  {
    id: "customer-001",
    email: "john.doe@gmail.com",
    password: "Customer123!",
    role: "customer",
    profile: {
      firstName: "John",
      lastName: "Doe",
      avatar: "/assets/avatars/customer-john.jpg",
      phone: "+84 905 678 901",
      createdAt: "2024-02-15T14:20:00Z",
      lastLogin: "2024-03-15T17:30:00Z",
      verified: true,
    },
    vehicle: {
      make: "Tesla",
      model: "Model 3",
      year: 2023,
      batteryCapacity: 75, // kWh
      chargingType: ["AC Type 2", "DC CCS"],
    },
    preferences: {
      maxDistance: 15, // km
      preferredPayment: "credit-card",
      priceRange: [5000, 15000], // VND per kWh
    },
  },
  {
    id: "customer-002",
    email: "anna.nguyen@outlook.com",
    password: "Customer456!",
    role: "customer",
    profile: {
      firstName: "Anna",
      lastName: "Nguyen",
      avatar: "/assets/avatars/customer-anna.jpg",
      phone: "+84 906 789 012",
      createdAt: "2024-02-20T09:45:00Z",
      lastLogin: "2024-03-15T18:15:00Z",
      verified: true,
    },
    vehicle: {
      make: "VinFast",
      model: "VF 8",
      year: 2024,
      batteryCapacity: 87.7,
      chargingType: ["AC Type 2", "DC CCS"],
    },
    preferences: {
      maxDistance: 20,
      preferredPayment: "e-wallet",
      priceRange: [6000, 12000],
    },
  },
];

// =================================
// CHARGING STATIONS
// =================================

export const mockStations = [
  {
    id: "station-001",
    ownerId: "system",
    name: "Green Mall Charging Hub",
    type: "public",
    status: "active",
    location: {
      address: "123 Nguyen Hue Street, District 1, Ho Chi Minh City",
      coordinates: { lat: 10.7769, lng: 106.7009 },
      landmarks: ["Nguyen Hue Walking Street", "Saigon Centre"],
    },

    operatingHours: {
      open: "06:00",
      close: "22:00",
      timezone: "Asia/Ho_Chi_Minh",
    },
    charging: {
      connectorTypes: ["AC Type 2", "DC CCS", "CHAdeMO"],
      totalPorts: 8,
      availablePorts: 3,
      maxPower: 150, // kW
      pricing: {
        acRate: 8500, // VND per kWh
        dcRate: 12000,
        parkingFee: 5000, // per hour
      },
    },
    ratings: {
      overall: 4.6,
      cleanliness: 4.8,
      availability: 4.2,
      speed: 4.7,
      totalReviews: 156,
    },
    images: [
      "/assets/stations/green-mall-1.jpg",
      "/assets/stations/green-mall-2.jpg",
    ],
  },
  {
    id: "station-002",
    ownerId: "system",
    name: "Tech Park SuperCharger",
    type: "semi-private",
    status: "active",
    location: {
      address: "456 Le Thanh Ton Street, District 1, Ho Chi Minh City",
      coordinates: { lat: 10.7837, lng: 106.6956 },
      landmarks: ["Bitexco Financial Tower", "Nguyen Hue Boulevard"],
    },

    operatingHours: {
      open: "05:30",
      close: "23:30",
      timezone: "Asia/Ho_Chi_Minh",
    },
    charging: {
      connectorTypes: ["DC CCS", "CHAdeMO"],
      totalPorts: 6,
      availablePorts: 6,
      maxPower: 250,
      pricing: {
        dcRate: 15000,
        parkingFee: 0,
      },
    },
    ratings: {
      overall: 4.9,
      cleanliness: 4.9,
      availability: 4.8,
      speed: 5.0,
      totalReviews: 89,
    },
    images: [
      "/assets/stations/tech-park-1.jpg",
      "/assets/stations/tech-park-2.jpg",
    ],
  },
  {
    id: "station-003",
    ownerId: "system",
    name: "EcoPark Charging Station",
    type: "public",
    status: "active",
    location: {
      address: "789 Vo Van Tan Street, District 3, Ho Chi Minh City",
      coordinates: { lat: 10.7892, lng: 106.6844 },
      landmarks: ["Tao Dan Park", "War Remnants Museum"],
    },

    operatingHours: {
      open: "24/7",
      timezone: "Asia/Ho_Chi_Minh",
    },
    charging: {
      connectorTypes: ["AC Type 2", "DC CCS"],
      totalPorts: 4,
      availablePorts: 1,
      maxPower: 100,
      pricing: {
        acRate: 7500,
        dcRate: 11000,
        parkingFee: 3000,
      },
    },
    ratings: {
      overall: 4.3,
      cleanliness: 4.5,
      availability: 3.8,
      speed: 4.2,
      totalReviews: 73,
    },
    images: ["/assets/stations/ecopark-1.jpg"],
  },
];

// =================================
// CHARGING SESSIONS & BOOKINGS
// =================================

export const mockBookings = [
  {
    id: "booking-001",
    customerId: "customer-001",
    stationId: "station-001",
    status: "completed",
    scheduledTime: "2024-03-15T08:30:00Z",
    actualStartTime: "2024-03-15T08:35:00Z",
    endTime: "2024-03-15T09:45:00Z",
    duration: 70, // minutes
    energyDelivered: 45.6, // kWh
    cost: {
      energyCost: 547200, // VND
      parkingCost: 10000,
      total: 557200,
    },
    payment: {
      method: "credit-card",
      transactionId: "txn-001",
      status: "paid",
    },
    rating: {
      overall: 5,
      comment: "Fast charging, clean facility!",
    },
  },
  {
    id: "booking-002",
    customerId: "customer-002",
    stationId: "station-002",
    status: "active",
    scheduledTime: "2024-03-15T16:00:00Z",
    actualStartTime: "2024-03-15T16:02:00Z",
    estimatedEndTime: "2024-03-15T17:15:00Z",
    currentEnergyDelivered: 28.3,
    estimatedCost: 424500,
  },
  {
    id: "booking-003",
    customerId: "customer-001",
    stationId: "station-003",
    status: "scheduled",
    scheduledTime: "2024-03-16T14:00:00Z",
    estimatedDuration: 60,
    estimatedCost: 350000,
  },
];

// =================================
// ANALYTICS & REPORTS DATA
// =================================

export const mockAnalytics = {
  systemOverview: {
    totalStations: 3,
    totalUsers: 4,
    activeCustomers: 2,
    totalRevenue: 2140000,
    monthlyGrowth: 15.2,
    averageSessionTime: 68,
    peakHours: ["08:00-09:00", "17:00-19:00"],
  },

  revenueData: [
    { month: "Jan 2024", revenue: 890000, sessions: 145 },
    { month: "Feb 2024", revenue: 1250000, sessions: 198 },
    { month: "Mar 2024", revenue: 1560000, sessions: 234 },
  ],

  stationUsage: [
    { stationId: "station-001", utilization: 78, revenue: 890000 },
    { stationId: "station-002", utilization: 85, revenue: 1250000 },
    { stationId: "station-003", utilization: 62, revenue: 560000 },
  ],

  customerBehavior: {
    averageSessionsPerMonth: 3.2,
    preferredChargingTimes: {
      morning: 35,
      afternoon: 25,
      evening: 40,
    },
    paymentMethods: {
      creditCard: 60,
      eWallet: 35,
      cash: 5,
    },
  },
};

// =================================
// PAYMENT METHODS
// =================================

export const mockPaymentMethods = [
  {
    id: "payment-001",
    customerId: "customer-001",
    type: "credit-card",
    provider: "visa",
    lastFour: "4567",
    expiryMonth: 12,
    expiryYear: 2026,
    isDefault: true,
    nickname: "Personal Visa",
  },
  {
    id: "payment-002",
    customerId: "customer-002",
    type: "e-wallet",
    provider: "momo",
    identifier: "+84906789012",
    isDefault: true,
    nickname: "MoMo Wallet",
  },
];

// =================================
// EXPORT ALL MOCK DATA
// =================================

export const mockData = {
  users: mockUsers,
  stations: mockStations,
  bookings: mockBookings,
  analytics: mockAnalytics,
  paymentMethods: mockPaymentMethods,
};

export default mockData;
