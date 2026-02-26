// ─── Booking Helper Utilities ──────────────────────────────────────
// Pure functions extracted from bookingStore.js for testability and reuse.

/**
 * Normalize a timestamp value to ISO string.
 * @param {string|Date|null} value
 * @returns {string|null} ISO string or null
 */
export const normalizeTimestamp = (value) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

/**
 * Calculate duration in minutes between two ISO timestamps.
 * @param {string|null} startIso
 * @param {string|null} endIso
 * @returns {number|null}
 */
export const calculateDurationMinutes = (startIso, endIso) => {
    if (!startIso || !endIso) return null;
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
    return Math.round((end - start) / 60000);
};

/**
 * Add minutes to an ISO timestamp.
 * @param {string|null} isoString
 * @param {number|null} minutes
 * @returns {string|null} New ISO string or null
 */
export const addMinutes = (isoString, minutes) => {
    if (!isoString || minutes == null) return null;
    const base = new Date(isoString);
    if (Number.isNaN(base.getTime())) return null;
    const end = new Date(base.getTime() + minutes * 60000);
    return end.toISOString();
};

/**
 * Map an API booking response to the store's internal format.
 * @param {Object} apiBooking - Raw booking from the API
 * @returns {Object} Normalized booking for the store
 */
export const mapApiBookingToStore = (apiBooking) => {
    const createdAt = normalizeTimestamp(apiBooking.createdAt);
    const scheduledStart = normalizeTimestamp(apiBooking.scheduledStartTime);
    const estimatedArrival = normalizeTimestamp(apiBooking.estimatedArrival);
    const actualStart = normalizeTimestamp(apiBooking.actualStartTime);
    const actualEnd = normalizeTimestamp(apiBooking.actualEndTime);
    const chargingDuration = calculateDurationMinutes(actualStart, actualEnd);
    const estimatedDuration = apiBooking.estimatedDuration ?? null;
    const durationMinutes = chargingDuration ?? estimatedDuration ?? null;
    const effectiveStart =
        actualStart || scheduledStart || estimatedArrival || createdAt;
    const projectedEnd =
        effectiveStart && (estimatedDuration ?? durationMinutes) != null
            ? addMinutes(effectiveStart, estimatedDuration ?? durationMinutes)
            : null;
    const estimatedEndTime = actualEnd || projectedEnd;
    const baseCost = Number(
        apiBooking.totalAmount ??
        apiBooking.totalCost ??
        apiBooking.finalAmount ??
        0
    );
    const deliveredEnergy = Number(
        apiBooking.energyDelivered ??
        apiBooking.energyKwh ??
        apiBooking.totalEnergy ??
        0
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
