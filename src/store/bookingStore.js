import { create } from "zustand";
import { persist } from "zustand/middleware";

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
      createBooking: (bookingData) => {
        // Clean data to avoid circular references
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
          slot: bookingData.slot
            ? {
                id: bookingData.slot.id,
                location: bookingData.slot.location,
              }
            : null,
          bookingTime: bookingData.bookingTime,
          scannedAt: bookingData.scannedAt,
          autoStart: bookingData.autoStart,
          bookingDate: new Date().toISOString().split("T")[0], // Add booking date
          // Scheduling information
          schedulingType: bookingData.schedulingType || "immediate",
          scheduledDateTime: bookingData.scheduledDateTime,
          scheduledDate: bookingData.scheduledDate,
          scheduledTime: bookingData.scheduledTime,
        };

        const booking = {
          ...cleanData,
          id: `BOOK${Date.now()}`,
          status:
            cleanData.schedulingType === "scheduled" ? "scheduled" : "pending", // pending = waiting for QR scan
          createdAt: new Date().toISOString(),
          estimatedArrival:
            cleanData.schedulingType === "scheduled"
              ? cleanData.scheduledDateTime
              : new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes from now for immediate
          qrScanned: false, // Add QR scan tracking
          chargingStarted: false, // Add charging start tracking
        };

        // Initialize SOC tracking for this booking
        set((state) => ({
          bookings: [...state.bookings, booking],
          bookingHistory: [...state.bookingHistory, booking],
          currentBooking: booking,
          socTracking: {
            ...state.socTracking,
            [booking.id]: {
              initialSOC: null,
              currentSOC: null,
              targetSOC: null,
              lastUpdated: null,
              chargingRate: null,
              estimatedTimeToTarget: null,
            },
          },
        }));

        return booking;
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

      cancelBooking: (bookingId, reason = "User cancelled") => {
        const booking = get().bookings.find((b) => b.id === bookingId);
        if (booking) {
          get().updateBookingStatus(bookingId, "cancelled", {
            cancellationReason: reason,
            cancelledAt: new Date().toISOString(),
          });
        }
      },

      completeBooking: (bookingId, sessionData) => {
        get().updateBookingStatus(bookingId, "completed", {
          ...sessionData,
          completedAt: new Date().toISOString(),
        });
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

      startCharging: (bookingId) => {
        const state = get();
        const booking = state.bookings.find((b) => b.id === bookingId);

        if (!booking || !booking.qrScanned) {
          throw new Error("Must scan QR code before starting charging");
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
        const total = bookingHistory.length;
        const completedBookings = bookingHistory.filter(
          (b) => b.status === "completed"
        );
        const completed = completedBookings.length;
        const cancelled = bookingHistory.filter(
          (b) => b.status === "cancelled"
        ).length;

        // Calculate totals from actual booking data
        const totalEnergyCharged = completedBookings.reduce(
          (sum, b) => sum + (b.energyDelivered || 0),
          0
        );
        const totalAmount = completedBookings.reduce(
          (sum, b) => sum + (b.totalAmount || 0),
          0
        );
        const totalDuration = completedBookings.reduce(
          (sum, b) => sum + (b.chargingDuration || 0),
          0
        );

        // Debug log
        console.log("📊 bookingStore.getBookingStats() - Calculation:", {
          completedBookings: completed,
          totalEnergyCharged,
          totalAmount,
          totalDuration,
        });

        return {
          total,
          completed,
          cancelled,
          completionRate:
            total > 0 ? ((completed / total) * 100).toFixed(1) : 0,
          // Return exact values, no minimum manipulation
          totalEnergyCharged: totalEnergyCharged.toFixed(2), // "245.00"
          totalAmount: totalAmount.toFixed(0), // "1679966"
          totalDuration: totalDuration, // 642
          // Averages
          averageEnergy:
            completed > 0 ? (totalEnergyCharged / completed).toFixed(2) : "0", // "20.42"
          averageAmount:
            completed > 0 ? Math.round(totalAmount / completed) : 0, // 139997
          averageDuration:
            completed > 0 ? Math.round(totalDuration / completed) : 0, // 54
          // Keep for backward compatibility
          averageSession:
            completed > 0 ? (totalEnergyCharged / completed).toFixed(2) : "0",
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
