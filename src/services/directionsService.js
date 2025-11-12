import axiosInstance from "./axiosConfig";

export async function getDrivingDirections({ origin, destination, mode = "driving" }) {
  if (!origin || !destination) {
    throw new Error("Origin and destination are required to fetch directions.");
  }

  const params = new URLSearchParams({
    originLat: origin.lat,
    originLng: origin.lng,
    destinationLat: destination.lat,
    destinationLng: destination.lng,
    mode,
  });

  const response = await axiosInstance.get(`/maps/directions?${params.toString()}`);
  return response.data;
}
