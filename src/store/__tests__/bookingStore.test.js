import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import useBookingStore from '../bookingStore';
import { bookingsAPI } from '../services/api';

// Mock API
vi.mock('../services/api', () => ({
  bookingsAPI: {
    getAll: vi.fn(),
    create: vi.fn(),
    cancel: vi.fn(),
  },
}));

describe('bookingStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('initializes with empty bookings', () => {
    const { result } = renderHook(() => useBookingStore());

    expect(result.current.bookings).toEqual([]);
    expect(result.current.currentBooking).toBeNull();
    expect(result.current.chargingSession).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('fetches bookings successfully', async () => {
    const mockBookings = [
      {
        bookingId: 1,
        userId: 1,
        stationId: 1,
        stationName: 'Station 1',
        status: 'scheduled',
        createdAt: '2025-11-06T10:00:00Z',
        slotId: 3,
      },
      {
        bookingId: 2,
        userId: 1,
        stationId: 2,
        stationName: 'Station 2',
        status: 'completed',
        createdAt: '2025-11-05T10:00:00Z',
        slotId: 5,
      },
    ];

    bookingsAPI.getAll.mockResolvedValue({ data: mockBookings });

    const { result } = renderHook(() => useBookingStore());

    await act(async () => {
      await result.current.fetchBookings();
    });

    expect(bookingsAPI.getAll).toHaveBeenCalled();
    expect(result.current.bookings).toHaveLength(2);
    expect(result.current.bookings[0].id).toBe(1);
  });

  it('creates booking with API enabled', async () => {
    const mockBookingData = {
      stationId: 1,
      stationName: 'Test Station',
      chargerType: { id: 'dc', name: 'DC Fast', power: '150 kW' },
      connector: { id: 'ccs2', name: 'CCS2' },
      port: { id: 'A01', location: 'Port A01' },
      schedulingType: 'immediate',
      bookingTime: '2025-11-06T12:00:00Z',
    };

    const mockAPIResponse = {
      bookingId: 123,
      stationId: 1,
      status: 'pending',
      createdAt: '2025-11-06T12:00:00Z',
    };

    bookingsAPI.create.mockResolvedValue(mockAPIResponse);

    const { result } = renderHook(() => useBookingStore());

    let createResult;
    await act(async () => {
      createResult = await result.current.createBooking(mockBookingData);
    });

    // Assert API was called
    expect(bookingsAPI.create).toHaveBeenCalledWith(
      expect.objectContaining({
        stationId: 1,
        slotId: expect.any(Number),
        schedulingType: 'immediate',
      })
    );

    // Assert booking added to store
    expect(createResult.success).toBe(true);
    expect(createResult.booking.apiId).toBe(123);
  });

  it('creates scheduled booking with datetime', async () => {
    const scheduledTime = '2025-11-07T14:00:00Z';
    
    const mockBookingData = {
      stationId: 1,
      stationName: 'Test Station',
      schedulingType: 'scheduled',
      scheduledDateTime: scheduledTime,
      chargerType: { id: 'dc', name: 'DC' },
      connector: { id: 'ccs2', name: 'CCS2' },
      port: { id: 'A01' },
    };

    bookingsAPI.create.mockResolvedValue({
      bookingId: 124,
      status: 'scheduled',
      scheduledStartTime: scheduledTime,
    });

    const { result } = renderHook(() => useBookingStore());

    await act(async () => {
      await result.current.createBooking(mockBookingData);
    });

    expect(bookingsAPI.create).toHaveBeenCalledWith(
      expect.objectContaining({
        schedulingType: 'scheduled',
        scheduledStartTime: scheduledTime,
      })
    );
  });

  it('gets current active booking', () => {
    const { result } = renderHook(() => useBookingStore());

    // Set bookings with one active
    act(() => {
      result.current.bookings = [
        { id: 'BOOK1', status: 'scheduled', createdAt: '2025-11-06T10:00:00Z' },
        { id: 'BOOK2', status: 'pending', createdAt: '2025-11-06T12:00:00Z' },
        { id: 'BOOK3', status: 'completed', createdAt: '2025-11-05T10:00:00Z' },
      ];
    });

    const currentBooking = result.current.getCurrentBooking();

    // Should return most recent pending/scheduled booking
    expect(currentBooking).toBeDefined();
    expect(['pending', 'scheduled', 'confirmed']).toContain(currentBooking.status);
  });

  it('gets scheduled bookings only', () => {
    const { result } = renderHook(() => useBookingStore());

    act(() => {
      result.current.bookings = [
        { id: 'BOOK1', status: 'scheduled', scheduledDateTime: '2025-11-07T10:00:00Z' },
        { id: 'BOOK2', status: 'pending', scheduledDateTime: null },
        { id: 'BOOK3', status: 'scheduled', scheduledDateTime: '2025-11-08T10:00:00Z' },
      ];
    });

    const scheduledBookings = result.current.getScheduledBookings();

    expect(scheduledBookings).toHaveLength(2);
    expect(scheduledBookings.every(b => b.status === 'scheduled')).toBe(true);
  });

  it('scans QR code and updates booking', async () => {
    const { result } = renderHook(() => useBookingStore());

    act(() => {
      result.current.bookings = [
        { id: 'BOOK123', status: 'pending', qrScanned: false },
      ];
    });

    await act(async () => {
      await result.current.scanQRCode('BOOK123', {
        stationId: 1,
        portId: 'A01',
        scannedAt: new Date().toISOString(),
      });
    });

    const booking = result.current.bookings.find(b => b.id === 'BOOK123');
    expect(booking.qrScanned).toBe(true);
    expect(booking.status).toBe('confirmed');
  });

  it('starts charging session and creates session object', async () => {
    const { result } = renderHook(() => useBookingStore());

    act(() => {
      result.current.bookings = [
        { id: 'BOOK123', apiId: 123, qrScanned: true, status: 'confirmed' },
      ];
    });

    await act(async () => {
      await result.current.startCharging('BOOK123');
    });

    expect(result.current.chargingSession).toBeDefined();
    expect(result.current.chargingSession.bookingId).toBe('BOOK123');
    expect(result.current.chargingSession.status).toBe('charging');
  });

  it('throws error if trying to start charging without QR scan', async () => {
    const { result } = renderHook(() => useBookingStore());

    act(() => {
      result.current.bookings = [
        { id: 'BOOK123', qrScanned: false },
      ];
    });

    await expect(
      act(async () => {
        await result.current.startCharging('BOOK123');
      })
    ).rejects.toThrow(/qr code/i);
  });

  it('stops charging and completes session', async () => {
    const { result } = renderHook(() => useBookingStore());

    act(() => {
      result.current.chargingSession = {
        sessionId: 'SESSION-456',
        bookingId: 'BOOK123',
        status: 'charging',
        startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
      };
    });

    await act(async () => {
      await result.current.stopCharging('BOOK123');
    });

    expect(result.current.chargingSession.status).toBe('completed');
    expect(result.current.chargingSession.endTime).toBeDefined();
  });

  it('initializes SOC tracking for booking', () => {
    const { result } = renderHook(() => useBookingStore());

    act(() => {
      result.current.initializeSOCTracking('BOOK123', 25, 80);
    });

    const tracking = result.current.socTracking['BOOK123'];
    expect(tracking.currentSOC).toBe(25);
    expect(tracking.targetSOC).toBe(80);
  });

  it('updates charging progress', () => {
    const { result } = renderHook(() => useBookingStore());

    act(() => {
      result.current.socTracking['BOOK123'] = { currentSOC: 25, targetSOC: 80 };
    });

    act(() => {
      result.current.updateChargingProgress('BOOK123', {
        currentSOC: 50,
        energyDelivered: 12.5,
        chargingRate: 25,
      });
    });

    const tracking = result.current.socTracking['BOOK123'];
    expect(tracking.currentSOC).toBe(50);
    expect(tracking.energyDelivered).toBe(12.5);
  });

  it('cancels booking', async () => {
    bookingsAPI.cancel.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useBookingStore());

    act(() => {
      result.current.bookings = [
        { id: 'BOOK123', apiId: 123, status: 'scheduled' },
      ];
    });

    await act(async () => {
      await result.current.cancelBooking('BOOK123', 'Changed plans');
    });

    const booking = result.current.bookings.find(b => b.id === 'BOOK123');
    expect(booking.status).toBe('cancelled');
  });

  it('filters bookings by status', () => {
    const { result } = renderHook(() => useBookingStore());

    act(() => {
      result.current.bookings = [
        { id: '1', status: 'scheduled' },
        { id: '2', status: 'completed' },
        { id: '3', status: 'scheduled' },
        { id: '4', status: 'cancelled' },
      ];
    });

    const scheduled = result.current.bookings.filter(b => b.status === 'scheduled');
    expect(scheduled).toHaveLength(2);
  });
});
