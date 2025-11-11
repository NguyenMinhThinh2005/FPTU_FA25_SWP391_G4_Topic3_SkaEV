import { CONNECTOR_TYPES } from "../utils/constants";

const makeSpec = ({
  brand,
  model,
  year,
  batteryCapacity,
  maxChargingSpeed,
  connectorTypes,
  defaultNickname,
  notes,
  category = "car",
}) => ({
  brand,
  model,
  year,
  batteryCapacity,
  maxChargingSpeed,
  connectorTypes,
  defaultNickname,
  notes,
  category,
});

const VEHICLE_CATALOG = [
  {
    brand: "VinFast",
    models: [
      makeSpec({
        brand: "VinFast",
        model: "VF 8",
        year: 2024,
        batteryCapacity: 87.7,
        maxChargingSpeed: 160,
        connectorTypes: [CONNECTOR_TYPES.CCS2, CONNECTOR_TYPES.TYPE2],
        defaultNickname: "VinFast VF 8",
        notes: "Bản Plus pin 87.7 kWh",
        category: "car",
      }),
      makeSpec({
        brand: "VinFast",
        model: "VF 9",
        year: 2024,
        batteryCapacity: 92.0,
        maxChargingSpeed: 160,
        connectorTypes: [CONNECTOR_TYPES.CCS2, CONNECTOR_TYPES.TYPE2],
        defaultNickname: "VinFast VF 9",
        category: "car",
      }),
      makeSpec({
        brand: "VinFast",
        model: "VF 5",
        year: 2024,
        batteryCapacity: 37.23,
        maxChargingSpeed: 70,
        connectorTypes: [CONNECTOR_TYPES.TYPE2],
        defaultNickname: "VinFast VF 5",
        category: "car",
      }),
      makeSpec({
        brand: "VinFast",
        model: "Feliz S",
        year: 2024,
        batteryCapacity: 3.5,
        maxChargingSpeed: 1.0,
        connectorTypes: [CONNECTOR_TYPES.GB_T],
        defaultNickname: "VinFast Feliz S",
        notes: "Xe máy điện – không yêu cầu VIN",
        category: "motorcycle",
      }),
    ],
  },
  {
    brand: "Tesla",
    models: [
      makeSpec({
        brand: "Tesla",
        model: "Model 3",
        year: 2024,
        batteryCapacity: 82,
        maxChargingSpeed: 250,
        connectorTypes: [CONNECTOR_TYPES.CCS2],
        defaultNickname: "Tesla Model 3",
        category: "car",
      }),
      makeSpec({
        brand: "Tesla",
        model: "Model Y",
        year: 2024,
        batteryCapacity: 78,
        maxChargingSpeed: 250,
        connectorTypes: [CONNECTOR_TYPES.CCS2],
        defaultNickname: "Tesla Model Y",
        category: "car",
      }),
    ],
  },
  {
    brand: "Hyundai",
    models: [
      makeSpec({
        brand: "Hyundai",
        model: "IONIQ 5",
        year: 2024,
        batteryCapacity: 77.4,
        maxChargingSpeed: 233,
        connectorTypes: [CONNECTOR_TYPES.CCS2, CONNECTOR_TYPES.TYPE2],
        defaultNickname: "IONIQ 5",
        category: "car",
      }),
      makeSpec({
        brand: "Hyundai",
        model: "Kona Electric",
        year: 2023,
        batteryCapacity: 64,
        maxChargingSpeed: 100,
        connectorTypes: [CONNECTOR_TYPES.CCS2, CONNECTOR_TYPES.TYPE2],
        defaultNickname: "Kona Electric",
        category: "car",
      }),
    ],
  },
  {
    brand: "Nissan",
    models: [
      makeSpec({
        brand: "Nissan",
        model: "Leaf e+",
        year: 2023,
        batteryCapacity: 62,
        maxChargingSpeed: 100,
        connectorTypes: [CONNECTOR_TYPES.CHADEMO, CONNECTOR_TYPES.TYPE2],
        defaultNickname: "Nissan Leaf",
        category: "car",
      }),
    ],
  },
  {
    brand: "Dat Bike",
    models: [
      makeSpec({
        brand: "Dat Bike",
        model: "Weaver++",
        year: 2024,
        batteryCapacity: 5.0,
        maxChargingSpeed: 2.3,
        connectorTypes: [CONNECTOR_TYPES.TYPE2],
        defaultNickname: "Weaver++",
        notes: "Xe máy điện nội địa – VIN không bắt buộc",
        category: "motorcycle",
      }),
    ],
  },
];

export const getSupportedBrands = () =>
  VEHICLE_CATALOG.map((entry) => entry.brand);

export const getModelsByBrand = (brand) => {
  if (!brand) {
    return [];
  }
  const entry = VEHICLE_CATALOG.find(
    (item) => item.brand.toLowerCase() === brand.toLowerCase()
  );
  if (!entry) {
    return [];
  }
  return entry.models.map(({ model, defaultNickname, notes, category }) => ({
    name: model,
    defaultNickname,
    notes,
    category,
  }));
};

export const getModelSpecs = (brand, model) => {
  if (!brand || !model) {
    return null;
  }
  const models = getModelsByBrand(brand);
  const match = models.find(
    (item) => item.name.toLowerCase() === model.toLowerCase()
  );
  if (!match) {
    return null;
  }
  const catalogEntry = VEHICLE_CATALOG.find(
    (entry) => entry.brand.toLowerCase() === brand.toLowerCase()
  );
  const spec = catalogEntry?.models.find(
    (item) => item.model.toLowerCase() === model.toLowerCase()
  );
  return spec ? { ...spec } : null;
};

export const getVehicleCategory = (brand, model) => {
  const spec = getModelSpecs(brand, model);
  if (spec?.category === "motorcycle") {
    return "motorcycle";
  }
  return "car";
};

export default VEHICLE_CATALOG;
