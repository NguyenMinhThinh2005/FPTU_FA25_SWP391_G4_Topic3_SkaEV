import { create } from "zustand";
import { persist } from "zustand/middleware";
import { vehiclesAPI } from "../services/api";

const useVehicleStore = create(
  persist(
    (set, get) => ({
      vehicles: [],
      currentVehicle: null,
      isLoading: false,
      error: null,

      initializeData: async () => {
        const vehicles = get().vehicles;
        if (vehicles.length === 0) {
          await get().fetchVehicles();
        }
      },

      fetchVehicles: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await vehiclesAPI.getUserVehicles();
          if (response.success) {
            set({ 
              vehicles: response.data || [],
              isLoading: false 
            });
            
            if (!get().currentVehicle && response.data?.length > 0) {
              const defaultVehicle = response.data.find(v => v.isDefault) || response.data[0];
              set({ currentVehicle: defaultVehicle });
            }
          }
        } catch (error) {
          set({ 
            error: error.message || "Failed to fetch vehicles",
            isLoading: false 
          });
          console.error("Error fetching vehicles:", error);
        }
      },

      addVehicle: async (vehicleData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await vehiclesAPI.create(vehicleData);
          if (response.success) {
            await get().fetchVehicles();
            set({ isLoading: false });
            return response.data;
          }
        } catch (error) {
          set({ 
            error: error.message || "Failed to add vehicle",
            isLoading: false 
          });
          console.error("Error adding vehicle:", error);
          throw error;
        }
      },

      updateVehicle: async (vehicleId, updates) => {
        set({ isLoading: true, error: null });
        try {
          const response = await vehiclesAPI.update(vehicleId, updates);
          if (response.success) {
            await get().fetchVehicles();
            set({ isLoading: false });
            return response.data;
          }
        } catch (error) {
          set({ 
            error: error.message || "Failed to update vehicle",
            isLoading: false 
          });
          console.error("Error updating vehicle:", error);
          throw error;
        }
      },

      deleteVehicle: async (vehicleId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await vehiclesAPI.delete(vehicleId);
          if (response.success) {
            const currentVehicle = get().currentVehicle;
            if (currentVehicle?.id === vehicleId) {
              set({ currentVehicle: null });
            }
            await get().fetchVehicles();
            set({ isLoading: false });
            return true;
          }
        } catch (error) {
          set({ 
            error: error.message || "Failed to delete vehicle",
            isLoading: false 
          });
          console.error("Error deleting vehicle:", error);
          throw error;
        }
      },

      setDefaultVehicle: async (vehicleId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await vehiclesAPI.setDefault(vehicleId);
          if (response.success) {
            await get().fetchVehicles();
            const vehicle = get().vehicles.find(v => v.id === vehicleId);
            set({ 
              currentVehicle: vehicle,
              isLoading: false 
            });
            return vehicle;
          }
        } catch (error) {
          set({ 
            error: error.message || "Failed to set default vehicle",
            isLoading: false 
          });
          console.error("Error setting default vehicle:", error);
          throw error;
        }
      },

      setCurrentVehicle: (vehicle) => {
        set({ currentVehicle: vehicle });
      },

      getDefaultVehicle: () => {
        const { vehicles } = get();
        return vehicles.find((vehicle) => vehicle.isDefault) || vehicles[0] || null;
      },

      getVehicleById: (vehicleId) => {
        const { vehicles } = get();
        return vehicles.find((vehicle) => vehicle.id === vehicleId);
      },

      getCompatibleConnectorTypes: () => {
        const { vehicles } = get();
        const allConnectors = new Set();
        vehicles.forEach((vehicle) => {
          if (vehicle.connectorTypes && Array.isArray(vehicle.connectorTypes)) {
            vehicle.connectorTypes.forEach((connector) =>
              allConnectors.add(connector)
            );
          }
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
    }),
    {
      name: "vehicle-store",
      partialize: (state) => ({
        vehicles: state.vehicles,
        currentVehicle: state.currentVehicle,
      }),
    }
  )
);

export default useVehicleStore;
