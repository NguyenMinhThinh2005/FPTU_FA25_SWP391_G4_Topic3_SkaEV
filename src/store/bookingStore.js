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

      // Statistics
      getBookingStats: () => {
        const { bookingHistory } = get();
        const total = bookingHistory.length;
        const completed = bookingHistory.filter(
          (b) => b.status === "completed"
        ).length;
        const cancelled = bookingHistory.filter(
          (b) => b.status === "cancelled"
        ).length;
        const totalEnergyCharged = bookingHistory
          .filter((b) => b.status === "completed" && b.energyDelivered)
          .reduce((sum, b) => sum + (b.energyDelivered || 0), 0);
        const totalAmount = bookingHistory
          .filter((b) => b.status === "completed" && b.totalAmount)
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

        return {
          total,
          completed,
          cancelled,
          completionRate:
            total > 0 ? ((completed / total) * 100).toFixed(1) : 0,
          totalEnergyCharged: totalEnergyCharged.toFixed(2),
          totalAmount: totalAmount.toFixed(0),
          averageSession:
            completed > 0 ? (totalEnergyCharged / completed).toFixed(2) : 0,
        };
      },

      // Mock data for development - Tháng 9/2024 (12 phiên hoàn thành)
      initializeMockData: () => {
        const mockBookings = [
          {
            id: "BOOK1732457890123",
            stationId: "ST001",
            stationName: "Vincom Landmark 81",
            stationAddress: "Vinhomes Central Park, Quận Bình Thạnh, TP.HCM",
            connector: { id: "A01", location: "Khu vực A - Slot 01" },
            status: "completed",
            createdAt: "2024-09-28T10:15:00.000Z",
            completedAt: "2024-09-28T11:00:00.000Z",
            bookingDate: "2024-09-28",
            energyDelivered: 18.0,
            totalAmount: 123426,
            chargingDuration: 45,
          },
          {
            id: "BOOK1732444290456",
            stationId: "ST002",
            stationName: "AEON Mall Tân Phú",
            stationAddress: "30 Bờ Bao Tân Thắng, Tân Phú, TP.HCM",
            connector: { id: "B02", location: "Khu vực B - Slot 02" },
            status: "completed",
            createdAt: "2024-09-26T08:30:00.000Z",
            completedAt: "2024-09-26T09:08:00.000Z",
            bookingDate: "2024-09-26",
            energyDelivered: 15.5,
            totalAmount: 106284,
            chargingDuration: 38,
          },
          {
            id: "BOOK1732431290789",
            stationId: "ST003",
            stationName: "Saigon Centre Q1",
            stationAddress: "65 Lê Lợi, Quận 1, TP.HCM",
            connector: { id: "C03", location: "Khu vực C - Slot 03" },
            status: "completed",
            createdAt: "2024-09-24T15:45:00.000Z",
            completedAt: "2024-09-24T16:53:00.000Z",
            bookingDate: "2024-09-24",
            energyDelivered: 25.0,
            totalAmount: 171425,
            chargingDuration: 68,
          },
          {
            id: "BOOK1732417690234",
            stationId: "ST004",
            stationName: "Diamond Plaza",
            stationAddress: "34 Lê Duẩn, Quận 1, TP.HCM",
            connector: { id: "D04", location: "Khu vực D - Slot 04" },
            status: "completed",
            createdAt: "2024-09-22T11:20:00.000Z",
            completedAt: "2024-09-22T12:15:00.000Z",
            bookingDate: "2024-09-22",
            energyDelivered: 20.2,
            totalAmount: 138511,
            chargingDuration: 55,
          },
          {
            id: "BOOK1732404090567",
            stationId: "ST005",
            stationName: "Bitexco Financial Tower",
            stationAddress: "2 Hải Triều, Quận 1, TP.HCM",
            connector: { id: "E05", location: "Khu vực E - Slot 05" },
            status: "completed",
            createdAt: "2024-09-20T09:15:00.000Z",
            completedAt: "2024-09-20T10:25:00.000Z",
            bookingDate: "2024-09-20",
            energyDelivered: 28.0,
            totalAmount: 191996,
            chargingDuration: 70,
          },
          {
            id: "BOOK1732390490890",
            stationId: "ST006",
            stationName: "Times Square",
            stationAddress: "57-69F Nguyễn Huệ, Quận 1, TP.HCM",
            connector: { id: "F06", location: "Khu vực F - Slot 06" },
            status: "completed",
            createdAt: "2024-09-18T13:40:00.000Z",
            completedAt: "2024-09-18T14:30:00.000Z",
            bookingDate: "2024-09-18",
            energyDelivered: 16.5,
            totalAmount: 113141,
            chargingDuration: 50,
          },
          {
            id: "BOOK1732376890123",
            stationId: "ST007",
            stationName: "Crescent Mall",
            stationAddress: "101 Tôn Dật Tiên, Quận 7, TP.HCM",
            connector: { id: "G07", location: "Khu vực G - Slot 07" },
            status: "completed",
            createdAt: "2024-09-16T16:25:00.000Z",
            completedAt: "2024-09-16T17:18:00.000Z",
            bookingDate: "2024-09-16",
            energyDelivered: 22.0,
            totalAmount: 150854,
            chargingDuration: 53,
          },
          {
            id: "BOOK1732363290456",
            stationId: "ST008",
            stationName: "SC VivoCity",
            stationAddress: "1058 Nguyễn Văn Linh, Quận 7, TP.HCM",
            connector: { id: "H08", location: "Khu vực H - Slot 08" },
            status: "completed",
            createdAt: "2024-09-14T12:10:00.000Z",
            completedAt: "2024-09-14T13:05:00.000Z",
            bookingDate: "2024-09-14",
            energyDelivered: 24.0,
            totalAmount: 164568,
            chargingDuration: 55,
          },
          {
            id: "BOOK1732349690789",
            stationId: "ST009",
            stationName: "Takashimaya",
            stationAddress: "92-94 Nam Kỳ Khởi Nghĩa, Quận 1, TP.HCM",
            connector: { id: "I09", location: "Khu vực I - Slot 09" },
            status: "completed",
            createdAt: "2024-09-12T07:55:00.000Z",
            completedAt: "2024-09-12T08:42:00.000Z",
            bookingDate: "2024-09-12",
            energyDelivered: 20.8,
            totalAmount: 142626,
            chargingDuration: 47,
          },
          {
            id: "BOOK1732336090234",
            stationId: "ST010",
            stationName: "Parkson Saigon Tourist",
            stationAddress: "35B-45 Lê Thánh Tôn, Quận 1, TP.HCM",
            connector: { id: "J10", location: "Khu vực J - Slot 10" },
            status: "completed",
            createdAt: "2024-09-10T14:30:00.000Z",
            completedAt: "2024-09-10T15:28:00.000Z",
            bookingDate: "2024-09-10",
            energyDelivered: 20.0,
            totalAmount: 137140,
            chargingDuration: 58,
          },
          {
            id: "BOOK1732322490567",
            stationId: "ST011",
            stationName: "Lotte Center",
            stationAddress: "54 Liễu Giai, Ba Đình, Hà Nội",
            connector: { id: "K11", location: "Khu vực K - Slot 11" },
            status: "completed",
            createdAt: "2024-09-08T10:45:00.000Z",
            completedAt: "2024-09-08T11:33:00.000Z",
            bookingDate: "2024-09-08",
            energyDelivered: 17.0,
            totalAmount: 116569,
            chargingDuration: 48,
          },
          {
            id: "BOOK1732308890890",
            stationId: "ST012",
            stationName: "Vincom Center Đồng Khởi",
            stationAddress: "72 Lê Thánh Tôn, Quận 1, TP.HCM",
            connector: { id: "L12", location: "Khu vực L - Slot 12" },
            status: "completed",
            createdAt: "2024-09-06T18:15:00.000Z",
            completedAt: "2024-09-06T19:10:00.000Z",
            bookingDate: "2024-09-06",
            energyDelivered: 18.0,
            totalAmount: 123426,
            chargingDuration: 55,
          },
        ];

        // Initialize SOC tracking for mock data
        const mockSOCTracking = {
          BOOK1732457890123: {
            initialSOC: 15,
            currentSOC: 85,
            targetSOC: 80,
            lastUpdated: "2024-11-24T10:15:00.000Z",
            chargingRate: 35.2, // %/hour
            estimatedTimeToTarget: 0,
          },
        };

        set({
          bookingHistory: mockBookings,
          socTracking: mockSOCTracking,
        });
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
