// MSW (Mock Service Worker) handlers for API mocking
// Optional: For integration tests that need network-level mocking
// Unit tests should use vi.mock() for faster execution

import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:5000/api';

export const handlers = [
  // Auth - Login
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const { email, password } = await request.json();

    if (email === 'customer@skaev.com' && password === 'password123') {
      return HttpResponse.json({
        userId: 1,
        email: 'customer@skaev.com',
        fullName: 'John Doe',
        role: 'customer',
        token: 'mock-jwt-token-12345',
        refreshToken: 'mock-refresh-token',
        expiresAt: '2025-11-07T10:00:00Z',
      });
    }

    return HttpResponse.json(
      { message: 'Invalid email or password' },
      { status: 401 }
    );
  }),

  // Auth - Register
  http.post(`${API_BASE}/auth/register`, async ({ request }) => {
    const userData = await request.json();

    // Simulate duplicate email check
    if (userData.email === 'existing@example.com') {
      return HttpResponse.json(
        { message: 'Email already registered' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      userId: Date.now(),
      email: userData.email,
      fullName: userData.fullName,
      message: 'Registration successful',
    });
  }),

  // Stations - Get All
  http.get(`${API_BASE}/stations`, () => {
    return HttpResponse.json({
      data: [
        {
          stationId: 1,
          name: 'Trạm sạc FPT Hà Nội',
          address: '8 Tôn Thất Thuyết, Cầu Giấy, Hà Nội',
          status: 'active',
          totalPorts: 5,
          availablePorts: 3,
          maxPowerKw: 150,
        },
      ],
    });
  }),

  // Bookings - Create
  http.post(`${API_BASE}/bookings`, async ({ request }) => {
    const bookingData = await request.json();

    // Simulate conflict (slot already booked)
    if (bookingData.slotId === 999) {
      return HttpResponse.json(
        { message: 'Slot already booked for this time' },
        { status: 409 }
      );
    }

    return HttpResponse.json({
      bookingId: Date.now(),
      stationId: bookingData.stationId,
      status: bookingData.schedulingType === 'scheduled' ? 'scheduled' : 'pending',
      createdAt: new Date().toISOString(),
    });
  }),

  // Bookings - Start Charging
  http.put(`${API_BASE}/bookings/:id/start`, ({ params }) => {
    return HttpResponse.json({
      sessionId: `SESSION-${Date.now()}`,
      bookingId: parseInt(params.id),
      startTime: new Date().toISOString(),
      status: 'charging',
    });
  }),

  // Bookings - Complete Charging
  http.put(`${API_BASE}/bookings/:id/complete`, async ({ request, params }) => {
    const completeData = await request.json();

    return HttpResponse.json({
      sessionId: `SESSION-${params.id}`,
      finalSoc: completeData.finalSoc || 80,
      totalEnergyKwh: completeData.totalEnergyKwh || 25.5,
      totalAmount: 127500,
      status: 'completed',
    });
  }),

  // QR Codes - Validate
  http.post(`${API_BASE}/qrcodes/validate`, async ({ request }) => {
    const { qrCodeData } = await request.json();

    if (qrCodeData.startsWith('SKAEV:STATION:')) {
      const parts = qrCodeData.split(':');
      return HttpResponse.json({
        valid: true,
        stationId: parseInt(parts[2]),
        portId: parts[3],
      });
    }

    return HttpResponse.json(
      { valid: false, message: 'Invalid QR code format' },
      { status: 400 }
    );
  }),

  // Payments - Process
  http.post(`${API_BASE}/payments/:id/process`, async ({ request, params }) => {
    const paymentDetails = await request.json();

    // Simulate payment decline
    if (paymentDetails.amount > 1000000) {
      return HttpResponse.json(
        { message: 'Insufficient funds' },
        { status: 402 }
      );
    }

    return HttpResponse.json({
      paymentId: Date.now(),
      status: 'success',
      invoiceId: parseInt(params.id),
      transactionId: `TXN-${Date.now()}`,
    });
  }),
];
