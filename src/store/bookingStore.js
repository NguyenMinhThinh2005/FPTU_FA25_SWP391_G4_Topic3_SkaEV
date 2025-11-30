import { create } from "zustand";
import { persist } from "zustand/middleware";
import { bookingsAPI } from "../services/api";

const normalizeTimestamp = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const calculateDurationMinutes = (startIso, endIso) => {
  if (!startIso || !endIso) return null;
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return Math.round((end - start) / 60000);
};

const addMinutes = (isoString, minutes) => {
  if (!isoString || minutes == null) return null;
  const base = new Date(isoString);
  if (Number.isNaN(base.getTime())) return null;
  const end = new Date(base.getTime() + minutes * 60000);
  return end.toISOString();
};

const mapApiBookingToStore = (apiBooking) => {
  const createdAt = normalizeTimestamp(apiBooking.createdAt);
  const scheduledStart = normalizeTimestamp(apiBooking.scheduledStartTime);
  const estimatedArrival = normalizeTimestamp(apiBooking.estimatedArrival);
  const actualStart = normalizeTimestamp(apiBooking.actualStartTime);
  const actualEnd = normalizeTimestamp(apiBooking.actualEndTime);
  const chargingDuration = calculateDurationMinutes(actualStart, actualEnd);
  const estimatedDuration = apiBooking.estimatedDuration ?? null;
  const durationMinutes = chargingDuration ?? estimatedDuration ?? null;
  const effectiveStart = actualStart || scheduledStart || estimatedArrival || createdAt;
  const projectedEnd =
    effectiveStart && (estimatedDuration ?? durationMinutes) != null
      ? addMinutes(effectiveStart, estimatedDuration ?? durationMinutes)
      : null;
  const estimatedEndTime = actualEnd || projectedEnd;
  const baseCost = Number(
    apiBooking.totalAmount ?? apiBooking.totalCost ?? apiBooking.finalAmount ?? 0
  );
  const deliveredEnergy = Number(
    apiBooking.energyDelivered ?? apiBooking.energyKwh ?? apiBooking.totalEnergy ?? 0
  );

  return {
    id: apiBooking.bookingId,
    bookingId: apiBooking.bookingId,
    apiId: apiBooking.bookingId,
    userId: apiBooking.userId,
    customerName: apiBooking.customerName,
    stationId: apiBooking.stationId,
    stationName: apiBooking.stationName,
    stationAddress: apiBooking.stationAddress,
    slotId: apiBooking.slotId,
    slotNumber: apiBooking.slotNumber,
    schedulingType: (apiBooking.schedulingType || "immediate").toLowerCase(),
    status: (apiBooking.status || "pending").toLowerCase(),
    statusRaw: apiBooking.status,
    bookingCode: `BK-${apiBooking.bookingId}`,
    bookingTime: createdAt,
    createdAt,
    bookingDate: createdAt,
    scheduledDateTime: scheduledStart,
    scheduledTime: scheduledStart,
    scheduledDate: scheduledStart ? scheduledStart.split("T")[0] : null,
    estimatedArrival,
    estimatedDuration,
    duration: durationMinutes,
    durationMinutes,
    sessionDurationMinutes: durationMinutes,
    actualStartTime: actualStart,
    actualEndTime: actualEnd,
    startTime: effectiveStart,
    endTime: actualEnd || estimatedEndTime,
    estimatedEndTime,
    chargingStarted: Boolean(actualStart),
    chargingEndedAt: actualEnd,
    chargingDuration,
    vehicleId: apiBooking.vehicleId,
    vehicleType: apiBooking.vehicleType,
    licensePlate: apiBooking.licensePlate,
  portNumber: apiBooking.slotNumber,
    slotName: apiBooking.slotNumber,
    targetSOC: apiBooking.targetSoc ?? null,
    currentSOC: apiBooking.currentSoc ?? null,
  cost: baseCost,
  totalAmount: baseCost,
    chargingRate: null,
  energyDelivered: deliveredEnergy,
    powerDelivered: null,
    qrScanned: false,
    chargingStartedAt: actualStart,
    notes: null,
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
      fetchBookings: async (params = {}) => {
        set({ loading: true, error: null });
        try {
          const response = await bookingsAPI.getAll({ limit: 200, offset: 0, ...params });
          const apiBookings = Array.isArray(response?.data) ? response.data : [];
          const transformed = apiBookings.map(mapApiBookingToStore);

          // Sort by creation date desc
          transformed.sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bTime - aTime;
          });

          set({
            bookings: transformed,
            bookingHistory: transformed,
            loading: false,
          });

          return { success: true, data: transformed };
        } catch (error) {
          const errorMessage = error.message || "Error fetching bookings";
          console.error("Fetch bookings error:", errorMessage, error);
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },

      createBooking: async (bookingData) => {
        console.log("📝 Creating booking via API:", bookingData);

        // Create local booking data structure for optimistic update or fallback display
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
        };

        let booking = {
          ...cleanData,
          id: `BOOK${Date.now()}`, // Temporary ID until API response
          status:
            cleanData.schedulingType === "scheduled" ? "scheduled" : "pending",
          createdAt: new Date().toISOString(),
          estimatedArrival:
            cleanData.schedulingType === "scheduled"
              ? cleanData.scheduledDateTime
              : new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          qrScanned: false,
          chargingStarted: false,
        };

        try {
          set({ loading: true, error: null });

          // Use real slot ID from database if available, otherwise fallback
          let slotId = bookingData.port?.slotId || 3; // Use real slotId or default to 3
          
          if (bookingData.port?.slotId) {
            console.log('✅ Using real slot ID from database:', slotId);
          } else {
            console.warn('⚠️ No real slot ID, using fallback slot:', slotId);
            // Fallback: Extract from port ID format "stationId-slotX"
            if (bookingData.port?.id) {
              const portStr = bookingData.port.id.toString();
              const slotMatch = portStr.match(/slot(\d+)/);
              if (slotMatch) {
                slotId = parseInt(slotMatch[1]);
                console.log('🎯 Extracted slot ID from port string:', slotId);
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
          throw error; // Re-throw to prevent fallback to mock
        }

        // Save to store
        set((state) => ({
          bookings: [booking, ...state.bookings],
          bookingHistory: [booking, ...state.bookingHistory],
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

          if (booking && booking.apiId) {
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
          } else {
            console.warn("⚠️ Cannot complete booking via API: Missing booking or API ID");
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
            try {
              await bookingsAPI.start(booking.apiId);
              console.log("✅ Charging started via API");
            } catch (apiError) {
              console.error("⚠️ API Start Charging failed:", apiError.message);
              // Continue with local simulation if API fails (e.g. permission issues)
              // This is allowed per "SoC charging" exception
            }
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
