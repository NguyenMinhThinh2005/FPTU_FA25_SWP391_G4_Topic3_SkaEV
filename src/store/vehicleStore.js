import { create } from "zustand";
import { vehiclesAPI } from "../services/api";
import { getVehicleCategory } from "../data/vehicleCatalog";

const ESTIMATED_EFFICIENCY_KM_PER_KWH = 5.2;
const MAX_FETCH_RETRIES = 4;
const FETCH_RETRY_BASE_DELAY = 1200;

const toNumberOrUndefined = (value) => {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toTrimmedOrUndefined = (value) => {
  if (value === null || value === undefined) {
    return undefined;
  }
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const ensureConnectorArray = (connectors) => {
  if (!connectors) {
    return [];
  }
  if (Array.isArray(connectors)) {
    return connectors.filter(Boolean).map((item) => String(item).trim());
  }
  return [connectors].filter(Boolean).map((item) => String(item).trim());
};

const buildVehicleName = (nickname, make, model) => {
  if (nickname && nickname.trim().length > 0) {
    return nickname.trim();
  }
  const composed = [make, model]
    .map((part) => (part ? String(part).trim() : ""))
    .filter(Boolean)
    .join(" ");
  return composed || "Xe của tôi";
};

const normalizeVehicle = (vehicle) => {
  if (!vehicle) {
    return null;
  }

  const make = vehicle.vehicleMake || vehicle.make || "";
  const model = vehicle.vehicleModel || vehicle.model || "";
  const connectorTypes = ensureConnectorArray(
    vehicle.connectorTypes || vehicle.connector_types
  );
  const batteryCapacity =
    vehicle.batteryCapacity !== undefined && vehicle.batteryCapacity !== null
      ? Number(vehicle.batteryCapacity)
      : null;

  const estimatedRange = batteryCapacity
    ? Math.round(batteryCapacity * ESTIMATED_EFFICIENCY_KM_PER_KWH)
    : null;

  const vehicleType =
    vehicle.vehicleType ||
    vehicle.vehicle_type ||
    getVehicleCategory(make, model) ||
    "car";

  const nicknameSource = vehicle.vehicleName || vehicle.nickname || "";

  return {
    id: vehicle.vehicleId ?? vehicle.id ?? null,
    vehicleId: vehicle.vehicleId ?? vehicle.id ?? null,
    userId: vehicle.userId ?? vehicle.user_id ?? null,
    nickname: nicknameSource,
    displayName: buildVehicleName(nicknameSource, make, model),
    make,
    model,
    year:
      vehicle.vehicleYear !== undefined && vehicle.vehicleYear !== null
        ? Number(vehicle.vehicleYear)
        : null,
    licensePlate: vehicle.licensePlate || "",
    color: vehicle.color || "",
    batteryCapacity,
    maxChargingSpeed:
      vehicle.maxChargingSpeed !== undefined &&
      vehicle.maxChargingSpeed !== null
        ? Number(vehicle.maxChargingSpeed)
        : null,
    connectorTypes,
    connectorType:
      vehicle.connectorType ||
      vehicle.chargingPortType ||
      connectorTypes[0] ||
      null,
    isDefault: Boolean(vehicle.isDefault ?? vehicle.isPrimary ?? false),
    createdAt: vehicle.createdAt || null,
    updatedAt: vehicle.updatedAt || null,
    estimatedRange,
    estimatedEfficiency: batteryCapacity
      ? Number(ESTIMATED_EFFICIENCY_KM_PER_KWH.toFixed(1))
      : null,
    vehicleType,
  };
};

const mapFormToPayload = (formData) => {
  const connectorTypes = ensureConnectorArray(
    formData.connectorTypes || formData.connectorType
  );
  const makeRaw = formData.make || formData.vehicleMake;
  const modelRaw = formData.model || formData.vehicleModel;
  const vehicleMake = toTrimmedOrUndefined(makeRaw);
  const vehicleModel = toTrimmedOrUndefined(modelRaw);
  const vehicleType = getVehicleCategory(makeRaw, modelRaw);
  const payload = {
    vehicleName: buildVehicleName(
      formData.nickname || formData.vehicleName,
      makeRaw,
      modelRaw
    ),
    licensePlate: toTrimmedOrUndefined(formData.licensePlate),
    vehicleMake,
    vehicleModel,
    vehicleYear: toNumberOrUndefined(formData.year || formData.vehicleYear),
    batteryCapacity: toNumberOrUndefined(
      formData.batteryCapacity ?? formData.battery_capacity
    ),
    maxChargingSpeed: toNumberOrUndefined(
      formData.maxChargingSpeed ?? formData.max_charging_speed
    ),
    connectorTypes,
    connectorType: connectorTypes[0] || null,
    color: toTrimmedOrUndefined(formData.color),
    isDefault: Boolean(formData.isDefault),
    vehicleType,
  };

  // Remove undefined/null optional fields to keep payload clean
  Object.keys(payload).forEach((key) => {
    if (
      payload[key] === undefined ||
      payload[key] === null ||
      (Array.isArray(payload[key]) && payload[key].length === 0)
    ) {
      delete payload[key];
    }
  });

  return payload;
};

const useVehicleStore = create((set, get) => {
  let fetchRetryTimer = null;
  let fetchRetryAttempt = 0;

  const clearFetchRetry = () => {
    if (fetchRetryTimer) {
      clearTimeout(fetchRetryTimer);
      fetchRetryTimer = null;
    }
    fetchRetryAttempt = 0;
    set({ pendingRetry: false, nextRetryAt: null });
  };

  const scheduleFetchRetry = () => {
    if (fetchRetryAttempt >= MAX_FETCH_RETRIES) {
      clearFetchRetry();
      return;
    }

    const delay = Math.min(
      FETCH_RETRY_BASE_DELAY * 2 ** fetchRetryAttempt,
      10000
    );
    const retryAt = Date.now() + delay;
    fetchRetryAttempt += 1;

    set({ pendingRetry: true, nextRetryAt: retryAt });

    fetchRetryTimer = setTimeout(() => {
      fetchRetryTimer = null;
      get()
        .fetchVehicles({
          retry: fetchRetryAttempt < MAX_FETCH_RETRIES,
          suppressLoadState: true,
        })
        .catch(() => {
          // errors are handled inside fetchVehicles
        });
    }, delay);
  };

  return {
    vehicles: [],
    currentVehicle: null,
    isLoading: false,
    error: null,
    hasLoaded: false,
    pendingRetry: false,
    nextRetryAt: null,

    initializeData: async () => {
      if (!get().hasLoaded) {
        await get().fetchVehicles();
      }
    },

    fetchVehicles: async (options = {}) => {
      const { retry = true, suppressLoadState = false } = options;

      if (suppressLoadState) {
        set({
          error: null,
          pendingRetry: false,
          nextRetryAt: null,
          isLoading: true,
        });
      } else {
        clearFetchRetry();
        set({ isLoading: true, error: null });
      }

      try {
        const response = await vehiclesAPI.getUserVehicles();
        const rawList = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : [];
        const normalized = rawList.map(normalizeVehicle).filter(Boolean);

        const defaultVehicle =
          normalized.find((vehicle) => vehicle.isDefault) ||
          normalized[0] ||
          null;

        set({
          vehicles: normalized,
          currentVehicle: defaultVehicle,
          isLoading: false,
          hasLoaded: true,
          error: null,
        });

        clearFetchRetry();

        return normalized;
      } catch (error) {
        console.error("Error fetching vehicles:", error);
        const status = error?.response?.status;
        const isServerIssue = !status || status >= 500;
        const message = isServerIssue
          ? "Không thể kết nối máy chủ xe. Đang thử lại..."
          : error?.message || "Không thể tải danh sách xe";

        set({
          error: message,
          isLoading: false,
        });

        if (retry && isServerIssue) {
          scheduleFetchRetry();
        } else {
          clearFetchRetry();
        }

        throw error;
      }
    },

    addVehicle: async (vehicleData) => {
      set({ isLoading: true, error: null });
      try {
        const payload = mapFormToPayload(vehicleData);
        const response = await vehiclesAPI.create(payload);
        const createdVehicle = normalizeVehicle(response?.data || response);

        await get().fetchVehicles();
        set({ isLoading: false });

        return createdVehicle;
      } catch (error) {
        console.error("Error adding vehicle:", error);
        set({
          error: error.message || "Failed to add vehicle",
          isLoading: false,
        });
        throw error;
      }
    },

    updateVehicle: async (vehicleId, updates) => {
      set({ isLoading: true, error: null });
      try {
        const payload = mapFormToPayload(updates);
        const response = await vehiclesAPI.update(vehicleId, payload);
        const updatedVehicle = normalizeVehicle(response?.data || response);

        await get().fetchVehicles();
        set({ isLoading: false });

        return updatedVehicle;
      } catch (error) {
        console.error("Error updating vehicle:", error);
        set({
          error: error.message || "Failed to update vehicle",
          isLoading: false,
        });
        throw error;
      }
    },

    deleteVehicle: async (vehicleId) => {
      set({ isLoading: true, error: null });
      try {
        await vehiclesAPI.delete(vehicleId);

        set((state) => {
          const remaining = state.vehicles.filter(
            (vehicle) =>
              vehicle.id !== vehicleId && vehicle.vehicleId !== vehicleId
          );
          const fallback =
            remaining.find((vehicle) => vehicle.isDefault) ||
            remaining[0] ||
            null;
          return {
            vehicles: remaining,
            currentVehicle: fallback,
            isLoading: false,
          };
        });

        return true;
      } catch (error) {
        console.error("Error deleting vehicle:", error);
        set({
          error: error.message || "Failed to delete vehicle",
          isLoading: false,
        });
        throw error;
      }
    },

    setDefaultVehicle: async (vehicleId) => {
      set({ isLoading: true, error: null });
      try {
        const response = await vehiclesAPI.setDefault(vehicleId);
        const updatedVehicle = normalizeVehicle(response?.data || response);

        set((state) => {
          const updatedList = state.vehicles.map((vehicle) =>
            vehicle.id === vehicleId || vehicle.vehicleId === vehicleId
              ? { ...vehicle, isDefault: true }
              : { ...vehicle, isDefault: false }
          );
          const normalizedList = updatedVehicle
            ? updatedList.map((vehicle) =>
                vehicle.id === updatedVehicle.id
                  ? { ...updatedVehicle }
                  : vehicle
              )
            : updatedList;

          return {
            vehicles: normalizedList,
            currentVehicle:
              normalizedList.find((vehicle) => vehicle.isDefault) || null,
            isLoading: false,
          };
        });

        return updatedVehicle;
      } catch (error) {
        console.error("Error setting default vehicle:", error);
        set({
          error: error.message || "Failed to set default vehicle",
          isLoading: false,
        });
        throw error;
      }
    },

    setCurrentVehicle: (vehicle) => {
      set({ currentVehicle: vehicle });
    },

    getDefaultVehicle: () => {
      const { vehicles } = get();
      return (
        vehicles.find((vehicle) => vehicle.isDefault) || vehicles[0] || null
      );
    },

    getVehicleById: (vehicleId) => {
      const { vehicles } = get();
      return vehicles.find(
        (vehicle) =>
          vehicle.id === vehicleId ||
          vehicle.vehicleId === vehicleId ||
          vehicle.vehicleId === Number(vehicleId)
      );
    },

    getCurrentVehicleConnectors: () => {
      const { currentVehicle, vehicles } = get();
      const activeVehicle =
        currentVehicle ||
        vehicles.find((vehicle) => vehicle.isDefault) ||
        vehicles[0];

      if (!activeVehicle) {
        return [];
      }

      return ensureConnectorArray(
        activeVehicle.connectorTypes || activeVehicle.connectorType
      );
    },

    getCompatibleConnectorTypes: () => {
      const { vehicles } = get();
      const allConnectors = new Set();
      vehicles.forEach((vehicle) => {
        ensureConnectorArray(vehicle.connectorTypes).forEach((connector) =>
          allConnectors.add(connector)
        );
      });
      return Array.from(allConnectors);
    },

    isConnectorCompatible: (connectorType) => {
      const compatibleTypes = get().getCompatibleConnectorTypes();
      return compatibleTypes.includes(connectorType);
    },

    clearError: () => {
      set({ error: null });
    },

    cancelPendingRetry: () => {
      clearFetchRetry();
    },
  };
});

export default useVehicleStore;
