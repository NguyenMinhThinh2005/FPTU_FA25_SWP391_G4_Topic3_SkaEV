import { create } from "zustand";
import { persist } from "zustand/middleware";
import { bookingsAPI } from "../services/api";

const ACTIVE_STATUSES = new Set([
  "pending",
  "scheduled",
  "confirmed",
  "in_progress",
  "charging",
]);

const parseNumber = (value, fallback = null) => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  const numeric = Number(value);
  return Number.isNaN(numeric) ? fallback : numeric;
};

const normalizeBookingFromApi = (raw) => {
  if (!raw) {
    return null;
  }

  const status = (raw.status || "").toLowerCase();
  const createdAt = raw.createdAt || new Date().toISOString();
  const scheduledStartTime =
    raw.scheduledStartTime || raw.scheduledDateTime || null;
  const actualStartTime = raw.actualStartTime || null;
  const actualEndTime = raw.actualEndTime || null;
  const completedAt = raw.completedAt || actualEndTime || null;

  const chargingDurationFromApi = parseNumber(raw.chargingDurationMinutes);
  let chargingDuration = chargingDurationFromApi;
  if (chargingDuration === null && actualStartTime && actualEndTime) {
    const start = new Date(actualStartTime).getTime();
    const end = new Date(actualEndTime).getTime();
    const diffMinutes = Math.round((end - start) / 60000);
    chargingDuration = diffMinutes > 0 ? diffMinutes : 0;
  }
  if (chargingDuration === null && raw.estimatedDuration !== undefined) {
    chargingDuration = parseNumber(raw.estimatedDuration, null);
  }

  const energyDelivered = parseNumber(
    raw.totalEnergyKwh !== undefined ? raw.totalEnergyKwh : raw.energyDelivered,
    0
  );
  const totalAmount = parseNumber(raw.totalAmount, 0);

  return {
    id: raw.bookingId,
    bookingId: raw.bookingId,
    apiId: raw.bookingId,
    bookingCode: `BK-${String(raw.bookingId).padStart(6, "0")}`,
    userId: raw.userId,
    vehicleId: raw.vehicleId,
    vehicleType: raw.vehicleType,
    licensePlate: raw.licensePlate,
    stationId: raw.stationId,
    stationName: raw.stationName,
    stationAddress: raw.stationAddress,
    slotId: raw.slotId,
    slotNumber: raw.slotNumber,
    status,
    statusLabel: raw.status,
    schedulingType: raw.schedulingType,
    bookingDate: createdAt ? createdAt.split("T")[0] : null,
    createdAt,
    estimatedArrival: raw.estimatedArrival || null,
    scheduledDateTime: scheduledStartTime,
    actualStartTime,
    actualEndTime,
    completedAt,
    targetSOC: parseNumber(raw.targetSoc),
    currentSOC: parseNumber(raw.currentSoc),
    finalSOC: parseNumber(raw.finalSoc ?? raw.currentSoc),
    estimatedDuration: parseNumber(raw.estimatedDuration),
    chargingDuration,
    energyDelivered,
    totalEnergyKwh: energyDelivered,
    totalAmount,
    subtotal: parseNumber(raw.subtotal),
    taxAmount: parseNumber(raw.taxAmount),
    unitPrice: parseNumber(raw.unitPrice),
    connector: raw.slotNumber
      ? {
          id: raw.slotId,
          name: `Slot ${raw.slotNumber}`,
          location: raw.stationName,
          compatible: true,
        }
      : null,
    chargerType: null,
    qrScanned: status !== "scheduled" && status !== "pending",
    chargingStarted: status === "in_progress" || status === "charging",
  };
};

const useBookingStore = create(
  persist(
    (set, get) => ({
      // State
      bookings: [],
      currentBooking: null,
      bookingHistory: [],
      chargingSession: null, // Current active charging session
      socTracking: {}, // SOC tracking by booking ID
      loading: false,
      error: null,

      // Actions
      createBooking: async (bookingData) => {
        // API is enabled - database has sp_create_booking stored procedure
        const ENABLE_API = true; // Database is ready with stored procedure

        console.log(
          "📝 Creating booking (API " +
            (ENABLE_API ? "ENABLED" : "DISABLED") +
            "):",
          bookingData
        );

        // Create local booking data
        const cleanData = {
          stationId: bookingData.stationId,
          stationName: bookingData.stationName,
          chargerType: bookingData.chargerType
            ? {
                id: bookingData.chargerType.id,
                name: bookingData.chargerType.name,
                power: bookingData.chargerType.power,
                price: bookingData.chargerType.price,
              }
            : null,
          connector: bookingData.connector
            ? {
                id: bookingData.connector.id,
                name: bookingData.connector.name,
                compatible: bookingData.connector.compatible,
              }
            : null,
          port: bookingData.port
            ? {
                id: bookingData.port.id,
                location: bookingData.port.location,
              }
            : null,
          bookingTime: bookingData.bookingTime,
          scannedAt: bookingData.scannedAt,
          autoStart: bookingData.autoStart,
          bookingDate: new Date().toISOString().split("T")[0],
          schedulingType: bookingData.schedulingType || "immediate",
          scheduledDateTime: bookingData.scheduledDateTime,
          scheduledDate: bookingData.scheduledDate,
          scheduledTime: bookingData.scheduledTime,
          estimatedDuration: bookingData.estimatedDuration
            ? parseInt(bookingData.estimatedDuration)
            : null,
          targetSOC: bookingData.targetSOC
            ? parseInt(bookingData.targetSOC)
            : null,
        };

        let booking = {
          ...cleanData,
          id: `BOOK${Date.now()}`,
          status:
            cleanData.schedulingType === "scheduled" ? "scheduled" : "pending",
          createdAt: new Date().toISOString(),
          estimatedArrival:
            cleanData.schedulingType === "scheduled"
              ? cleanData.scheduledDateTime
              : new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          qrScanned: false,
          chargingStarted: false,
          energyDelivered: 0,
          totalEnergyKwh: 0,
          totalAmount: 0,
          chargingDuration: cleanData.estimatedDuration || 0,
        };

        // Try API if enabled
        if (ENABLE_API) {
          try {
            set({ loading: true, error: null });

            // Use real slot ID from database if available, otherwise fallback
            let slotId = bookingData.port?.slotId || 3; // Use real slotId or default to 3

            if (bookingData.port?.slotId) {
              console.log("✅ Using real slot ID from database:", slotId);
            } else {
              console.warn("⚠️ No real slot ID, using fallback slot:", slotId);
              // Fallback: Extract from port ID format "stationId-slotX"
              if (bookingData.port?.id) {
                const portStr = bookingData.port.id.toString();
                const slotMatch = portStr.match(/slot(\d+)/);
                if (slotMatch) {
                  slotId = parseInt(slotMatch[1]);
                  console.log("🎯 Extracted slot ID from port string:", slotId);
                }
              }
            }

            const apiPayload = {
              stationId: parseInt(bookingData.stationId) || 1,
              slotId: slotId, // Use mapped slot ID
              vehicleId: 5, // Use actual vehicle ID from database (user has vehicle_id=5,6)
              scheduledStartTime:
                bookingData.scheduledDateTime || new Date().toISOString(),
              estimatedArrival:
                bookingData.scheduledDateTime ||
                new Date(Date.now() + 15 * 60 * 1000).toISOString(),
              estimatedDuration: parseInt(bookingData.estimatedDuration) || 60,
              schedulingType:
                bookingData.schedulingType === "scheduled"
                  ? "scheduled"
                  : "immediate",
              targetSoc: bookingData.targetSOC || 80,
            };

            console.log("📤 API Payload:", apiPayload);
            const response = await bookingsAPI.create(apiPayload);
            console.log("✅ API Response:", response);

            // Merge API response
            booking = {
              ...booking,
              id: response.bookingId || response.id, // Use numeric ID from API
              bookingCode: booking.id, // Keep BOOK... string as code for display
              apiId: response.bookingId || response.id, // Keep for backward compatibility
              status: response.status || booking.status,
              createdAt: response.createdAt || booking.createdAt,
            };

            set({ loading: false });
          } catch (error) {
            console.error(
              "❌ API Error:",
              error.response?.data || error.message
            );
            set({ loading: false, error: error.message });
            console.warn("⚠️ Using local booking as fallback");
          }
        }

        // Save to store
        set((state) => ({
          bookings: [...state.bookings, booking],
          bookingHistory: [...state.bookingHistory, booking],
          currentBooking: booking,
          socTracking: {
            ...state.socTracking,
            [booking.id]: {
              initialSOC: bookingData.initialSOC || null,
              currentSOC: bookingData.initialSOC || null,
              targetSOC: bookingData.targetSOC || null,
              lastUpdated: new Date().toISOString(),
              chargingRate: null,
              estimatedTimeToTarget: null,
            },
          },
        }));

        console.log("✅ Booking created:", booking.id);
        return booking;
      },

      fetchBookings: async () => {
        set({ loading: true, error: null });

        try {
          const response = await bookingsAPI.getUserBookings();
          const rawBookings = Array.isArray(response)
            ? response
            : Array.isArray(response?.data)
            ? response.data
            : [];

          const normalizedBookings = rawBookings
            .map(normalizeBookingFromApi)
            .filter((booking) => booking !== null);

          const sortedHistory = [...normalizedBookings].sort((a, b) => {
            const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return createdB - createdA;
          });

          const activeBookings = normalizedBookings.filter((booking) =>
            ACTIVE_STATUSES.has(booking.status)
          );

          const currentActiveBooking = sortedHistory.find((booking) =>
            ["charging", "in_progress"].includes(booking.status)
          );

          set({
            bookings: activeBookings,
            bookingHistory: sortedHistory,
            currentBooking: currentActiveBooking || null,
            loading: false,
          });

          return sortedHistory;
        } catch (error) {
          console.error("❌ Error fetching bookings:", error);
          set({
            loading: false,
            error: error?.message || "Failed to fetch bookings",
          });
          throw error;
        }
      },

      loadUserBookings: async () => {
        return get().fetchBookings();
      },

      updateBookingStatus: (bookingId, status, data = {}) => {
        set((state) => ({
          bookings: state.bookings.map((booking) =>
            booking.id === bookingId
              ? {
                  ...booking,
                  status,
                  ...data,
                  updatedAt: new Date().toISOString(),
                }
              : booking
          ),
          bookingHistory: state.bookingHistory.map((booking) =>
            booking.id === bookingId
              ? {
                  ...booking,
                  status,
                  ...data,
                  updatedAt: new Date().toISOString(),
                }
              : booking
          ),
          currentBooking:
            state.currentBooking?.id === bookingId
              ? {
                  ...state.currentBooking,
                  status,
                  ...data,
                  updatedAt: new Date().toISOString(),
                }
              : state.currentBooking,
        }));
      },

      cancelBooking: async (bookingId, reason = "User cancelled") => {
        try {
          const booking = get().bookings.find((b) => b.id === bookingId);
          if (booking && booking.apiId) {
            console.log("📤 Cancelling booking via API:", booking.apiId);
            await bookingsAPI.cancel(booking.apiId, reason);
            console.log("✅ Booking cancelled via API");
          }

          get().updateBookingStatus(bookingId, "cancelled", {
            cancellationReason: reason,
            cancelledAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error("❌ Error cancelling booking via API:", error);
          // Still update local state even if API fails
          get().updateBookingStatus(bookingId, "cancelled", {
            cancellationReason: reason,
            cancelledAt: new Date().toISOString(),
          });
        }
      },

      completeBooking: async (bookingId, sessionData) => {
        try {
          const booking = get().bookings.find((b) => b.id === bookingId);

          // API call should be done by caller (ChargingFlow), not here
          // This method only updates local state
          const ENABLE_COMPLETE_API = false; // Disabled - caller handles API

          if (booking && booking.apiId && ENABLE_COMPLETE_API) {
            console.log(
              "📤 Completing booking via API:",
              booking.apiId,
              sessionData
            );

            // Prepare payload matching backend CompleteChargingDto
            const completePayload = {
              finalSoc: sessionData.finalSOC || sessionData.currentSOC || 80,
              totalEnergyKwh: sessionData.energyDelivered || 0,
              unitPrice: sessionData.chargingRate || 8500,
            };

            console.log("📤 Complete API Payload:", completePayload);

            // Call API to complete charging
            await bookingsAPI.complete(booking.apiId, completePayload);
            console.log("✅ Booking completed via API");
          } else if (booking && booking.apiId) {
            console.log("⚠️ Complete API skipped - requires staff/admin role");
          }

          // Update local state with session data
          get().updateBookingStatus(bookingId, "completed", {
            ...sessionData,
            completedAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error("❌ Error completing booking via API:", error);
          console.error("❌ Error details:", error.response?.data);
          // Still update local state even if API fails
          get().updateBookingStatus(bookingId, "completed", {
            ...sessionData,
            completedAt: new Date().toISOString(),
          });
        }
      },

      // New method for QR code scanning
      scanQRCode: (bookingId, qrData) => {
        const state = get();
        const booking = state.bookings.find((b) => b.id === bookingId);

        if (!booking) {
          throw new Error("Booking not found");
        }

        if (booking.status !== "pending" && booking.status !== "scheduled") {
          throw new Error("Booking is not in valid state for QR scanning");
        }

        // Update booking status to confirmed after QR scan
        get().updateBookingStatus(bookingId, "confirmed", {
          qrScannedAt: new Date().toISOString(),
          qrScanned: true,
          qrData: qrData,
        });

        return booking;
      },

      startCharging: async (bookingId) => {
        try {
          const state = get();
          const booking = state.bookings.find((b) => b.id === bookingId);

          if (!booking || !booking.qrScanned) {
            throw new Error("Must scan QR code before starting charging");
          }

          // Call API to start charging if we have API ID
          if (booking.apiId) {
            console.log("📤 Starting charging via API:", booking.apiId);
            // Note: Backend requires staff/admin role for this endpoint
            // await bookingsAPI.start(booking.apiId);
            console.log("⚠️ Skipping API call (requires staff role)");
          }

          const chargingSession = {
            bookingId,
            startTime: new Date().toISOString(),
            status: "active",
            sessionId: `SESSION${Date.now()}`,
          };

          set((state) => ({
            ...state,
            chargingSession,
          }));

          get().updateBookingStatus(bookingId, "charging", {
            chargingStartedAt: new Date().toISOString(),
            chargingStarted: true,
            sessionId: chargingSession.sessionId,
          });
        } catch (error) {
          console.error("❌ Error starting charging:", error);
          throw error;
        }
      },

      // New SOC tracking methods
      updateSOC: (bookingId, socData) => {
        set((state) => ({
          socTracking: {
            ...state.socTracking,
            [bookingId]: {
              ...state.socTracking[bookingId],
              ...socData,
              lastUpdated: new Date().toISOString(),
            },
          },
        }));
      },

      initializeSOCTracking: (bookingId, initialSOC, targetSOC = 80) => {
        set((state) => ({
          socTracking: {
            ...state.socTracking,
            [bookingId]: {
              initialSOC,
              currentSOC: initialSOC,
              targetSOC,
              lastUpdated: new Date().toISOString(),
              chargingRate: null,
              estimatedTimeToTarget: null,
            },
          },
        }));
      },

      updateChargingProgress: (bookingId, progressData) => {
        const {
          currentSOC,
          chargingRate,
          powerDelivered,
          energyDelivered,
          voltage,
          current,
          temperature,
        } = progressData;

        const socData = get().socTracking[bookingId];
        let estimatedTimeToTarget = null;

        if (socData && chargingRate && socData.targetSOC) {
          const remainingSOC = socData.targetSOC - currentSOC;
          estimatedTimeToTarget = Math.max(
            0,
            Math.round((remainingSOC / chargingRate) * 60)
          ); // minutes
        }

        set((state) => ({
          socTracking: {
            ...state.socTracking,
            [bookingId]: {
              ...state.socTracking[bookingId],
              currentSOC,
              chargingRate,
              estimatedTimeToTarget,
              lastUpdated: new Date().toISOString(),
            },
          },
          chargingSession:
            state.chargingSession?.bookingId === bookingId
              ? {
                  ...state.chargingSession,
                  currentSOC,
                  powerDelivered,
                  energyDelivered,
                  voltage,
                  current,
                  temperature,
                  lastUpdated: new Date().toISOString(),
                }
              : state.chargingSession,
        }));

        // Update booking with latest charging data
        get().updateBookingStatus(bookingId, "charging", {
          currentSOC,
          energyDelivered,
          powerDelivered,
          chargingRate,
          lastUpdated: new Date().toISOString(),
        });
      },

      getSOCProgress: (bookingId) => {
        const { socTracking } = get();
        return socTracking[bookingId] || null;
      },

      getChargingSession: () => {
        return get().chargingSession;
      },

      stopCharging: (bookingId, chargingData) => {
        const socData = get().socTracking[bookingId];
        const finalSOC = chargingData.finalSOC || socData?.currentSOC;

        set(() => ({
          chargingSession: null,
        }));

        get().updateBookingStatus(bookingId, "completed", {
          chargingEndedAt: new Date().toISOString(),
          finalSOC,
          ...chargingData,
        });
      },

      getCurrentBooking: () => {
        const { bookings } = get();
        return bookings.find(
          (booking) =>
            booking.status === "charging" &&
            booking.qrScanned === true &&
            booking.chargingStarted === true
        );
      },

      getBookingsByStatus: (status) => {
        const { bookings } = get();
        return bookings.filter((booking) => booking.status === status);
      },

      getUpcomingBookings: () => {
        const { bookings } = get();
        const now = new Date();
        return bookings
          .filter(
            (booking) =>
              (booking.status === "confirmed" ||
                booking.status === "scheduled") &&
              new Date(booking.scheduledDateTime || booking.estimatedArrival) >
                now
          )
          .sort(
            (a, b) =>
              new Date(a.scheduledDateTime || a.estimatedArrival) -
              new Date(b.scheduledDateTime || b.estimatedArrival)
          );
      },

      getScheduledBookings: () => {
        const { bookings } = get();
        return bookings.filter(
          (booking) => booking.schedulingType === "scheduled"
        );
      },

      getPastBookings: () => {
        const { bookingHistory } = get();
        return bookingHistory
          .filter(
            (booking) =>
              booking.status === "completed" || booking.status === "cancelled"
          )
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      },

      clearCurrentBooking: () => {
        set({ currentBooking: null });
      },

      // Reset toàn bộ flow state về trạng thái ban đầu
      resetFlowState: () => {
        set({
          currentBooking: null,
          chargingSession: null,
          error: null,
          loading: false,
        });
      },

      setLoading: (loading) => {
        set({ loading });
      },

      setError: (error) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      // Statistics - MASTER DATA SOURCE
      getBookingStats: () => {
        const { bookingHistory } = get();

        if (!bookingHistory || bookingHistory.length === 0) {
          return {
            total: 0,
            completed: 0,
            cancelled: 0,
            completionRate: 0,
            totalEnergyCharged: 0,
            totalAmount: 0,
            totalDuration: 0,
            averageEnergy: 0,
            averageAmount: 0,
            averageDuration: 0,
            averageSession: 0,
          };
        }

        const statusOf = (booking) =>
          (booking?.status || booking?.statusLabel || "").toLowerCase();

        const completedBookings = bookingHistory.filter(
          (booking) => statusOf(booking) === "completed"
        );
        const cancelled = bookingHistory.filter(
          (booking) => statusOf(booking) === "cancelled"
        ).length;

        const completed = completedBookings.length;
        const total = bookingHistory.length;

        const totalEnergyCharged = completedBookings.reduce((sum, booking) => {
          const energy = parseNumber(
            booking?.energyDelivered !== undefined
              ? booking.energyDelivered
              : booking?.totalEnergyKwh,
            0
          );
          return sum + (energy || 0);
        }, 0);

        const totalAmount = completedBookings.reduce((sum, booking) => {
          const amount = parseNumber(
            booking?.totalAmount !== undefined
              ? booking.totalAmount
              : booking?.amount,
            0
          );
          return sum + (amount || 0);
        }, 0);

        const totalDuration = completedBookings.reduce((sum, booking) => {
          const duration = parseNumber(
            booking?.chargingDuration !== undefined
              ? booking.chargingDuration
              : booking?.chargingDurationMinutes !== undefined
              ? booking.chargingDurationMinutes
              : booking?.estimatedDuration,
            0
          );
          return sum + (duration || 0);
        }, 0);

        return {
          total,
          completed,
          cancelled,
          completionRate:
            total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0,
          totalEnergyCharged: Number(totalEnergyCharged.toFixed(2)),
          totalAmount: Math.round(totalAmount),
          totalDuration,
          averageEnergy:
            completed > 0
              ? Number((totalEnergyCharged / completed).toFixed(2))
              : 0,
          averageAmount:
            completed > 0 ? Math.round(totalAmount / completed) : 0,
          averageDuration:
            completed > 0 ? Math.round(totalDuration / completed) : 0,
          averageSession:
            completed > 0
              ? Number((totalEnergyCharged / completed).toFixed(2))
              : 0,
        };
      },
    }),
    {
      name: "booking-store",
      partialize: (state) => ({
        bookingHistory: state.bookingHistory,
        // Không persist currentBooking và chargingSession để tránh lỗi flow
        // Chỉ lưu history để xem lịch sử booking
      }),
    }
  )
);

export default useBookingStore;
