import useVehicleStore from "../vehicleStore";
import { vehiclesAPI } from "../../services/api";

vi.mock("../../services/api", () => ({
  vehiclesAPI: {
    getUserVehicles: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    setDefault: vi.fn(),
  },
}));

describe("vehicleStore fetch retry handling", () => {
  const resetStore = () => {
    const store = useVehicleStore.getState();
    store.cancelPendingRetry();
    useVehicleStore.setState({
      vehicles: [],
      currentVehicle: null,
      isLoading: false,
      error: null,
      hasLoaded: false,
      pendingRetry: false,
      nextRetryAt: null,
    });
  };

  let consoleErrorMock;

  beforeEach(() => {
    vi.useFakeTimers();
    vehiclesAPI.getUserVehicles.mockReset();
    resetStore();
    consoleErrorMock = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    useVehicleStore.getState().cancelPendingRetry();
    consoleErrorMock.mockRestore();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("retries fetch requests up to the configured limit when the server keeps failing", async () => {
    const serverError = Object.assign(new Error("Server unavailable"), {
      response: { status: 500 },
    });
    vehiclesAPI.getUserVehicles.mockRejectedValue(serverError);

    await expect(useVehicleStore.getState().fetchVehicles()).rejects.toBe(
      serverError
    );

    expect(vehiclesAPI.getUserVehicles).toHaveBeenCalledTimes(1);
    expect(useVehicleStore.getState().pendingRetry).toBe(true);
    expect(useVehicleStore.getState().error).toMatch(/không thể kết nối/i);
    expect(typeof useVehicleStore.getState().nextRetryAt).toBe("number");

    let safeguard = 10;
    while (vi.getTimerCount() > 0 && safeguard > 0) {
      vi.advanceTimersToNextTimer();
      await Promise.resolve();
      await Promise.resolve();
      safeguard -= 1;
    }

    expect(safeguard).toBeGreaterThan(0);

    expect(vehiclesAPI.getUserVehicles).toHaveBeenCalledTimes(5);
    expect(useVehicleStore.getState().pendingRetry).toBe(false);
    expect(useVehicleStore.getState().nextRetryAt).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not schedule retries for client-side failures", async () => {
    const clientError = Object.assign(new Error("Invalid request"), {
      response: { status: 400 },
    });
    vehiclesAPI.getUserVehicles.mockRejectedValue(clientError);

    await expect(useVehicleStore.getState().fetchVehicles()).rejects.toBe(
      clientError
    );

    expect(vehiclesAPI.getUserVehicles).toHaveBeenCalledTimes(1);
    expect(useVehicleStore.getState().pendingRetry).toBe(false);
    expect(useVehicleStore.getState().nextRetryAt).toBeNull();
    expect(useVehicleStore.getState().error).toBe("Invalid request");
    expect(vi.getTimerCount()).toBe(0);
  });
});
