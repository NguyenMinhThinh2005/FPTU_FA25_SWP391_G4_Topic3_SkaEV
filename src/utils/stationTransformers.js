// ─── Station Data Transformers ─────────────────────────────────────
// Pure functions extracted from stationStore.js for testability and reuse.

/**
 * Transform API station response to frontend format.
 * Handles legacy field names, slot aggregation, and derived metrics.
 *
 * @param {Object} apiStation - Raw station object from the API
 * @param {Array|null} slotsData - Optional array of slot objects
 * @returns {Object} Normalized station object for the frontend
 */
export const transformStationData = (apiStation, slotsData = null) => {
    try {
        // API may still provide legacy totals named 'totalPosts' / 'availablePosts'.
        // Map them to frontend-friendly pole/port names and keep backwards fallback.
        let totalPoles = apiStation.totalPoles ?? apiStation.totalPosts ?? 0;
        let availablePoles =
            apiStation.availablePoles ?? apiStation.availablePosts ?? 0;

        let poles = [];

        // Use real slots data if provided, otherwise leave empty to avoid mock fabrication
        if (slotsData && Array.isArray(slotsData) && slotsData.length > 0) {
            const postMap = new Map();

            slotsData.forEach((slot) => {
                const postId = slot.chargingPostId || slot.postId;
                const slotPower = Number(slot.maxPower ?? slot.powerKw ?? 0);
                const connectorFromDb = slot.connectorType ?? undefined;
                const slotConnector =
                    connectorFromDb ?? (slotPower >= 50 ? "DC" : "AC");
                const isDc =
                    (slotConnector || "").toUpperCase().includes("DC") || slotPower >= 50;
                if (!postMap.has(postId)) {
                    postMap.set(postId, {
                        id: `${apiStation.stationId}-post${postId}`,
                        poleId: `${apiStation.stationId}-post${postId}`,
                        name: slot.postNumber
                            ? `Trụ ${slot.postNumber}`
                            : `Trụ sạc ${postId}`,
                        poleNumber: slot.postNumber ?? postId,
                        type: isDc ? "DC" : "AC",
                        power: slotPower,
                        voltage: isDc ? 400 : 220,
                        status: slot.status || "available",
                        ports: [],
                        totalPorts: 0,
                        availablePorts: 0,
                    });
                }

                const post = postMap.get(postId);
                post.ports.push({
                    id: `${apiStation.stationId}-slot${slot.slotId}`,
                    portId: `${apiStation.stationId}-slot${slot.slotId}`,
                    slotId: slot.slotId,
                    portNumber: slot.slotNumber ?? slot.slotId,
                    connectorType: slotConnector,
                    maxPower: slotPower,
                    status:
                        (slot.status || "available").toLowerCase() === "available"
                            ? "available"
                            : "occupied",
                    currentRate: null,
                });
                post.power = Math.max(post.power, slotPower);
                post.status = slot.status || post.status;
                post.totalPorts += 1;
                if ((slot.status || "").toLowerCase() === "available") {
                    post.availablePorts += 1;
                }
            });

            poles = Array.from(postMap.values());
        }

        let totalPorts = poles.reduce((sum, pole) => sum + pole.totalPorts, 0);
        let availablePorts = poles.reduce(
            (sum, pole) => sum + pole.availablePorts,
            0
        );

        if (poles.length === 0) {
            const aggregatedTotalPorts =
                apiStation.totalPorts ??
                apiStation.totalSlots ??
                totalPoles ??
                (apiStation.ports ? apiStation.ports.length : 0) ??
                0;
            const aggregatedAvailablePorts =
                apiStation.availablePorts ??
                apiStation.availableSlots ??
                apiStation.availablePoles ??
                availablePoles ??
                0;

            totalPorts = aggregatedTotalPorts;
            availablePorts = aggregatedAvailablePorts;
        }

        if (poles.length > 0) {
            totalPoles = poles.length;
            availablePoles = poles.filter((pole) => pole.availablePorts > 0).length;
        }

        const statusNormalized = (apiStation.status || "").toLowerCase();
        if (statusNormalized !== "active") {
            availablePorts = 0;
            availablePoles = 0;
        }

        availablePorts = Math.max(0, Math.min(availablePorts, totalPorts));

        const totalPolesCount = poles.length > 0 ? poles.length : totalPoles;

        const maxPowerFromPoles =
            poles.length > 0 ? Math.max(...poles.map((p) => p.power), 0) : 0;
        const maxPower =
            maxPowerFromPoles ||
            apiStation.maxPowerKw ||
            apiStation.totalPowerCapacityKw ||
            apiStation.capacityKw ||
            0;

        const connectorTypesSet = new Set();
        poles.forEach((pole) => {
            pole.ports.forEach((port) => {
                if (port.connectorType) {
                    connectorTypesSet.add(port.connectorType);
                }
            });
        });

        const apiConnectorTypes =
            apiStation.connectorTypes ??
            apiStation.supportedConnectors ??
            apiStation.connectors ??
            [];

        if (typeof apiConnectorTypes === "string") {
            apiConnectorTypes
                .split(",")
                .map((c) => c.trim())
                .filter(Boolean)
                .forEach((c) => connectorTypesSet.add(c));
        } else if (Array.isArray(apiConnectorTypes)) {
            apiConnectorTypes
                .filter(Boolean)
                .forEach((c) => connectorTypesSet.add(c));
        }

        const connectorTypes = Array.from(connectorTypesSet);

        const utilizationRate = Number(
            Number.isFinite(apiStation.utilizationRate)
                ? apiStation.utilizationRate
                : apiStation.utilization || 0
        );

        const monthlyRevenue = Number(
            apiStation.monthlyRevenue ??
            apiStation.revenue ??
            apiStation.todayRevenue ??
            0
        );

        const monthlyCompletedSessions =
            apiStation.monthlyCompletedSessions ??
            apiStation.monthlyBookings ??
            apiStation.todayCompletedSessions ??
            0;

        const averageSessionMinutes = Number(
            apiStation.averageSessionDurationMinutes ?? apiStation.avgSessionTime ?? 0
        );

        const todayRevenue = Number(apiStation.todayRevenue ?? 0);
        const todayCompletedSessions =
            apiStation.todayCompletedSessions ?? apiStation.todaySessionCount ?? 0;

        const basePrice = Number(
            apiStation.basePricePerKwh ??
            apiStation.pricePerKwh ??
            apiStation.basePrice ??
            0
        );

        const managerUserId =
            apiStation.managerUserId ??
            apiStation.manager?.userId ??
            apiStation.managerID ??
            apiStation.manager?.id ??
            null;
        const managerName =
            apiStation.managerName ??
            apiStation.manager?.name ??
            apiStation.managerFullName ??
            null;
        const managerEmail =
            apiStation.managerEmail ?? apiStation.manager?.email ?? null;
        const managerPhone =
            apiStation.managerPhoneNumber ??
            apiStation.manager?.phone ??
            apiStation.manager?.phoneNumber ??
            null;

        const manager =
            managerUserId || managerName || managerEmail || managerPhone
                ? {
                    userId: managerUserId ?? null,
                    name: managerName ?? null,
                    email: managerEmail ?? null,
                    phone: managerPhone ?? null,
                }
                : null;

        // Normalize and expose a few canonical metrics for UI and services
        const occupied = Math.max(
            0,
            Math.min(totalPorts - availablePorts, totalPorts)
        );
        const normalizedUtilization =
            totalPorts > 0 ? (occupied / totalPorts) * 100 : utilizationRate || 0;
        const derivedActiveSessions =
            Number.isFinite(totalPorts) && Number.isFinite(availablePorts)
                ? Math.max(0, totalPorts - availablePorts)
                : 0;

        return {
            id: apiStation.stationId,
            stationId: apiStation.stationId,
            name: apiStation.stationName || apiStation.name,
            status: apiStation.status || "active",
            location: {
                address: apiStation.address,
                city: apiStation.city,
                coordinates: {
                    lat: apiStation.latitude,
                    lng: apiStation.longitude,
                },
            },
            charging: {
                totalPoles: totalPolesCount,
                availablePoles,
                totalPorts,
                availablePorts,
                poles,
                maxPower,
                connectorTypes,
                pricing: {
                    baseRate: basePrice > 0 ? basePrice : 0,
                    acRate: basePrice > 0 ? basePrice : 0,
                    dcRate: basePrice > 0 ? basePrice : 0,
                    dcFastRate: basePrice > 0 ? basePrice : 0,
                },
                pricePerKwh: basePrice > 0 ? basePrice : null,
            },
            stats: {
                total: totalPorts,
                available: availablePorts,
                occupied,
            },
            // Pass through backend calculated fields directly
            totalPosts: apiStation.totalPosts || 0,
            availablePosts: apiStation.availablePosts || 0,
            totalSlots: apiStation.totalSlots || 0,
            availableSlots: apiStation.availableSlots || 0,
            occupiedSlots: apiStation.occupiedSlots || 0,
            // Canonical active sessions: prefer explicit realtime value, fall back to derived occupied ports
            activeSessions: apiStation.activeSessions ?? derivedActiveSessions,
            utilizationRate,
            utilization:
                Math.round((normalizedUtilization + Number.EPSILON) * 100) / 100,
            todayRevenue,
            todayCompletedSessions,
            todaySessionCount: todayCompletedSessions,
            revenue: monthlyRevenue,
            monthlyRevenue,
            monthlyBookings: monthlyCompletedSessions,
            monthlyCompletedSessions,
            avgSessionTime: averageSessionMinutes,
            averageSessionDurationMinutes: averageSessionMinutes,
            currentPowerUsageKw: apiStation.currentPowerUsageKw || 0,
            totalPowerCapacityKw: apiStation.totalPowerCapacityKw || 0,
            amenities: apiStation.amenities || [],
            operatingHours: apiStation.operatingHours || "00:00-24:00",
            imageUrl: apiStation.stationImageUrl,
            basePricePerKwh: basePrice > 0 ? basePrice : null,
            ratings: {
                overall: 4.5,
                totalReviews: 0,
            },
            manager,
            managerUserId: manager?.userId ?? null,
            managerName: manager?.name ?? null,
            managerEmail: manager?.email ?? null,
            managerPhoneNumber: manager?.phone ?? null,
            contact: manager
                ? {
                    manager: manager.name,
                    managerId: manager.userId,
                    email: manager.email,
                    phone: manager.phone,
                }
                : null,
        };
    } catch (error) {
        console.error("❌ Transform error for station:", apiStation, error);
        throw error;
    }
};
