import { create } from "zustand";import { create } from "zustand";

import { persist } from "zustand/middleware";import { persist } from "zustand/middleware";

import { vehiclesAPI } from "../services/api";import { CONNECTOR_TYPES } from "../utils/constants";

import { CONNECTOR_TYPES } from "../utils/constants";

const useVehicleStore = create(

const useVehicleStore = create(    persist(

  persist(        (set, get) => ({

    (set, get) => ({            // State

      // State            vehicles: [

      vehicles: [],                {

      currentVehicle: null,                    id: "1",

      loading: false,                    nickname: "Xe chính",

      error: null,                    make: "VinFast",

                    model: "VF8",

      // Initialize data from API                    year: "2024",

      initializeData: async () => {                    batteryCapacity: "87.7",

        console.log("🚀 Initializing vehicles from API...");                    maxChargingSpeed: "150",

        await get().fetchVehicles();                    connectorTypes: [CONNECTOR_TYPES.CCS2], // Standardized to array

      },                    licensePlate: "30A-123.45",

                    color: "Xanh",

      // Fetch user's vehicles from API                    isDefault: true,

      fetchVehicles: async () => {                },

        set({ loading: true, error: null });                {

        try {                    id: "2",

          const response = await vehiclesAPI.getUserVehicles();                    nickname: "Xe gia đình",

                              make: "Tesla",

          if (response.success && response.data) {                    model: "Model 3",

            const vehicles = Array.isArray(response.data)                     year: "2023",

              ? response.data                     batteryCapacity: "75",

              : response.data.vehicles || [];                    maxChargingSpeed: "250",

                                connectorTypes: [CONNECTOR_TYPES.CCS2, CONNECTOR_TYPES.TYPE2],

            console.log("✅ Vehicles loaded from API:", vehicles.length);                    licensePlate: "29B-678.90",

                                color: "Trắng",

            // Set default vehicle as current if none selected                    isDefault: false,

            const defaultVehicle = vehicles.find(v => v.isDefault) || vehicles[0];                },

                        ],

            set({             currentVehicle: null,

              vehicles,             loading: false,

              currentVehicle: get().currentVehicle || defaultVehicle,            error: null,

              loading: false 

            });            // Actions

            return { success: true, data: vehicles };            addVehicle: (vehicleData) => {

          } else {                const newVehicle = {

            throw new Error(response.message || "Không thể tải danh sách vehicles");                    ...vehicleData,

          }                    id: `vehicle_${Date.now()}`,

        } catch (error) {                    connectorTypes: Array.isArray(vehicleData.connectorTypes)

          const errorMessage = error.message || "Đã xảy ra lỗi khi tải vehicles";                        ? vehicleData.connectorTypes

          console.error("❌ Fetch vehicles error:", errorMessage);                        : [vehicleData.connectorTypes].filter(Boolean),

          set({ error: errorMessage, loading: false, vehicles: [] });                };

          return { success: false, error: errorMessage };

        }                set((state) => ({

      },                    vehicles: [...state.vehicles, newVehicle]

                }));

      // Add new vehicle via API

      addVehicle: async (vehicleData) => {                return newVehicle;

        set({ loading: true, error: null });            },

        try {

          const data = {            updateVehicle: (vehicleId, updates) => {

            ...vehicleData,                set((state) => ({

            connectorTypes: Array.isArray(vehicleData.connectorTypes)                    vehicles: state.vehicles.map((vehicle) =>

              ? vehicleData.connectorTypes                        vehicle.id === vehicleId

              : [vehicleData.connectorTypes].filter(Boolean),                            ? {

          };                                ...vehicle,

                                ...updates,

          const response = await vehiclesAPI.create(data);                                connectorTypes: Array.isArray(updates.connectorTypes)

                                              ? updates.connectorTypes

          if (response.success && response.data) {                                    : updates.connectorTypes

            const newVehicle = response.data;                                        ? [updates.connectorTypes]

            set((s) => ({                                         : vehicle.connectorTypes,

              vehicles: [...s.vehicles, newVehicle],                             }

              loading: false                             : vehicle

            }));                    ),

            return { success: true, data: newVehicle };                }));

          } else {            },

            throw new Error(response.message || "Không thể tạo vehicle");

          }            deleteVehicle: (vehicleId) => {

        } catch (error) {                set((state) => ({

          const errorMessage = error.message || "Đã xảy ra lỗi khi tạo vehicle";                    vehicles: state.vehicles.filter((vehicle) => vehicle.id !== vehicleId),

          console.error("❌ Add vehicle error:", errorMessage);                    currentVehicle: state.currentVehicle?.id === vehicleId ? null : state.currentVehicle,

          set({ error: errorMessage, loading: false });                }));

          return { success: false, error: errorMessage };            },

        }

      },            setDefaultVehicle: (vehicleId) => {

                set((state) => ({

      // Update vehicle via API                    vehicles: state.vehicles.map((vehicle) => ({

      updateVehicle: async (vehicleId, updates) => {                        ...vehicle,

        set({ loading: true, error: null });                        isDefault: vehicle.id === vehicleId,

        try {                    })),

          const data = {                    currentVehicle: state.vehicles.find((v) => v.id === vehicleId) || state.currentVehicle,

            ...updates,                }));

            connectorTypes: updates.connectorTypes            },

              ? Array.isArray(updates.connectorTypes)

                ? updates.connectorTypes            setCurrentVehicle: (vehicleId) => {

                : [updates.connectorTypes]                const vehicle = get().vehicles.find((v) => v.id === vehicleId);

              : undefined,                set({ currentVehicle: vehicle });

          };            },



          const response = await vehiclesAPI.update(vehicleId, data);            // Getters

                      getDefaultVehicle: () => {

          if (response.success && response.data) {                const { vehicles } = get();

            const updatedVehicle = response.data;                return vehicles.find((vehicle) => vehicle.isDefault) || vehicles[0] || null;

            set((s) => ({            },

              vehicles: s.vehicles.map((v) => v.id === vehicleId ? updatedVehicle : v),

              currentVehicle: s.currentVehicle?.id === vehicleId ? updatedVehicle : s.currentVehicle,            getVehicleById: (vehicleId) => {

              loading: false,                const { vehicles } = get();

            }));                return vehicles.find((vehicle) => vehicle.id === vehicleId);

            return { success: true, data: updatedVehicle };            },

          } else {

            throw new Error(response.message || "Không thể cập nhật vehicle");            getCompatibleConnectorTypes: () => {

          }                const { vehicles } = get();

        } catch (error) {                const allConnectors = new Set();

          const errorMessage = error.message || "Đã xảy ra lỗi khi cập nhật vehicle";

          console.error("❌ Update vehicle error:", errorMessage);                vehicles.forEach((vehicle) => {

          set({ error: errorMessage, loading: false });                    if (vehicle.connectorTypes) {

          return { success: false, error: errorMessage };                        vehicle.connectorTypes.forEach((type) => allConnectors.add(type));

        }                    }

      },                });



      // Delete vehicle via API                return Array.from(allConnectors);

      deleteVehicle: async (vehicleId) => {            },

        set({ loading: true, error: null });

        try {            getCurrentVehicleConnectors: () => {

          const response = await vehiclesAPI.delete(vehicleId);                const currentVehicle = get().currentVehicle || get().getDefaultVehicle();

                          return currentVehicle?.connectorTypes || [];

          if (response.success) {            },

            set((s) => ({

              vehicles: s.vehicles.filter((v) => v.id !== vehicleId),            // Utility methods

              currentVehicle: s.currentVehicle?.id === vehicleId ? null : s.currentVehicle,            isConnectorCompatible: (connectorType, vehicleId = null) => {

              loading: false,                const vehicle = vehicleId

            }));                    ? get().getVehicleById(vehicleId)

            return { success: true };                    : get().currentVehicle || get().getDefaultVehicle();

          } else {

            throw new Error(response.message || "Không thể xóa vehicle");                if (!vehicle || !vehicle.connectorTypes) return false;

          }                return vehicle.connectorTypes.includes(connectorType);

        } catch (error) {            },

          const errorMessage = error.message || "Đã xảy ra lỗi khi xóa vehicle";

          console.error("❌ Delete vehicle error:", errorMessage);            // Sync with user profile

          set({ error: errorMessage, loading: false });            syncWithUserProfile: (userVehicleData) => {

          return { success: false, error: errorMessage };                if (!userVehicleData) return;

        }

      },                // Convert user profile vehicle data to store format

                const syncedVehicle = {

      // Set default vehicle via API                    id: "user_profile_vehicle",

      setDefaultVehicle: async (vehicleId) => {                    nickname: "Xe từ hồ sơ",

        set({ loading: true, error: null });                    make: userVehicleData.make,

        try {                    model: userVehicleData.model,

          const response = await vehiclesAPI.setDefault(vehicleId);                    year: userVehicleData.year,

                              batteryCapacity: userVehicleData.batteryCapacity?.toString(),

          if (response.success) {                    maxChargingSpeed: "150", // Default

            set((s) => ({                    connectorTypes: Array.isArray(userVehicleData.chargingType)

              vehicles: s.vehicles.map((v) => ({                        ? userVehicleData.chargingType.map(type => {

                ...v,                            // Convert formats: "AC Type 2" -> "Type 2", "DC CCS" -> "CCS2"

                isDefault: v.id === vehicleId,                            if (type.includes("Type 2")) return CONNECTOR_TYPES.TYPE2;

              })),                            if (type.includes("CCS")) return CONNECTOR_TYPES.CCS2;

              currentVehicle: s.vehicles.find((v) => v.id === vehicleId) || s.currentVehicle,                            if (type.includes("CHAdeMO")) return CONNECTOR_TYPES.CHADEMO;

              loading: false,                            return type;

            }));                        })

            return { success: true };                        : [CONNECTOR_TYPES.TYPE2], // Default fallback

          } else {                    licensePlate: "",

            throw new Error(response.message || "Không thể đặt xe mặc định");                    color: "",

          }                    isDefault: true,

        } catch (error) {                };

          const errorMessage = error.message || "Đã xảy ra lỗi khi đặt xe mặc định";

          console.error("❌ Set default vehicle error:", errorMessage);                // Check if profile vehicle already exists

          set({ error: errorMessage, loading: false });                const existingVehicle = get().vehicles.find(v => v.id === "user_profile_vehicle");

          return { success: false, error: errorMessage };

        }                if (existingVehicle) {

      },                    get().updateVehicle("user_profile_vehicle", syncedVehicle);

                } else {

      // Local state setters                    set((state) => ({

      setCurrentVehicle: (vehicleId) => {                        vehicles: [syncedVehicle, ...state.vehicles.map(v => ({ ...v, isDefault: false }))],

        const vehicle = get().vehicles.find((v) => v.id === vehicleId);                    }));

        set({ currentVehicle: vehicle });                }

      },            },



      // Getters            // Initialize

      getDefaultVehicle: () => {            initializeWithUserData: (userData) => {

        const { vehicles } = get();                if (userData?.vehicle) {

        return vehicles.find((vehicle) => vehicle.isDefault) || vehicles[0] || null;                    get().syncWithUserProfile(userData.vehicle);

      },                }



      getVehicleById: (vehicleId) => {                // Set default vehicle as current if none selected

        const { vehicles } = get();                if (!get().currentVehicle) {

        return vehicles.find((vehicle) => vehicle.id === vehicleId);                    const defaultVehicle = get().getDefaultVehicle();

      },                    if (defaultVehicle) {

                        set({ currentVehicle: defaultVehicle });

      getCompatibleConnectorTypes: () => {                    }

        const { vehicles } = get();                }

        const allConnectors = new Set();            },

        vehicles.forEach((vehicle) => {

          if (vehicle.connectorTypes) {            setLoading: (loading) => set({ loading }),

            vehicle.connectorTypes.forEach((type) => allConnectors.add(type));            setError: (error) => set({ error }),

          }            clearError: () => set({ error: null }),

        });        }),

        return Array.from(allConnectors);        {

      },            name: "skaev-vehicle-storage",

            partialize: (state) => ({

      getCurrentVehicleConnectors: () => {                vehicles: state.vehicles,

        const currentVehicle = get().currentVehicle || get().getDefaultVehicle();                currentVehicle: state.currentVehicle,

        return currentVehicle?.connectorTypes || [];            }),

      },        }

    )

      // Utility methods);

      isConnectorCompatible: (connectorType, vehicleId = null) => {

        const vehicle = vehicleIdexport default useVehicleStore;
          ? get().getVehicleById(vehicleId)
          : get().currentVehicle || get().getDefaultVehicle();
        if (!vehicle || !vehicle.connectorTypes) return false;
        return vehicle.connectorTypes.includes(connectorType);
      },

      // Initialize with user data (for backward compatibility)
      initializeWithUserData: async (userData) => {
        // Fetch vehicles from API instead of using local data
        await get().fetchVehicles();
        
        // Set default vehicle as current if none selected
        if (!get().currentVehicle) {
          const defaultVehicle = get().getDefaultVehicle();
          if (defaultVehicle) {
            set({ currentVehicle: defaultVehicle });
          }
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "skaev-vehicle-storage",
      partialize: (state) => ({
        vehicles: state.vehicles,
        currentVehicle: state.currentVehicle,
      }),
    }
  )
);

export default useVehicleStore;
