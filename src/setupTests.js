// Setup file for Vitest + React Testing Library
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock navigator.geolocation
global.navigator.geolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
};

// Mock QR Reader camera
global.navigator.mediaDevices = {
  getUserMedia: vi.fn(() => 
    Promise.resolve({
      getTracks: () => [{ stop: vi.fn() }]
    })
  )
};

// Mock useMasterDataSync globally
vi.mock('./hooks/useMasterDataSync', () => ({
  useMasterDataSync: () => ({
    bookingHistory: [],
    stats: {
      total: 0,
      completed: 0,
      totalAmount: 0,
      totalEnergyCharged: 0
    },
    completedBookings: [],
    isDataReady: false
  })
}));
