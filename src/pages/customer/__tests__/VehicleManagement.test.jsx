import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

const storeState = {
  vehicles: [],
  addVehicle: vi.fn(),
  updateVehicle: vi.fn(),
  deleteVehicle: vi.fn(),
  setDefaultVehicle: vi.fn(),
  fetchVehicles: vi.fn(),
  initializeData: vi.fn(),
  isLoading: false,
  error: null,
  clearError: vi.fn(),
  cancelPendingRetry: vi.fn(),
  hasLoaded: true,
};

const vehicleStoreMock = vi.fn(() => storeState);
vehicleStoreMock.__setState = (overrides) => {
  Object.assign(storeState, overrides);
};
vehicleStoreMock.__reset = () => {
  Object.assign(storeState, {
    vehicles: [],
    addVehicle: vi.fn(),
    updateVehicle: vi.fn(),
    deleteVehicle: vi.fn(),
    setDefaultVehicle: vi.fn(),
    fetchVehicles: vi.fn(),
    initializeData: vi.fn(),
    isLoading: false,
    error: null,
    clearError: vi.fn(),
    cancelPendingRetry: vi.fn(),
    hasLoaded: true,
  });
};
vehicleStoreMock.__getState = () => storeState;

vi.mock("../../../store/vehicleStore", () => ({
  __esModule: true,
  default: vehicleStoreMock,
}));

vi.mock("../../../store/authStore", () => ({
  __esModule: true,
  default: vi.fn(() => ({ user: { id: "user-1" } })),
}));

vi.mock("../../../components/customer/VehicleEditModal", () => ({
  __esModule: true,
  default: ({ open, onSave, onClose, submitting }) => {
    if (!open) {
      return null;
    }
    return (
      <div data-testid="vehicle-modal">
        <button
          data-testid="vehicle-modal-save"
          onClick={() =>
            onSave(
              {
                nickname: "Gia đình VF8",
                licensePlate: "30A-123.45",
                connectorTypes: ["CCS2"],
                make: "VinFast",
                model: "VF8",
                year: 2024,
                color: "Red",
              },
              false
            )
          }
        >
          submit
        </button>
        <button
          data-testid="vehicle-modal-close"
          onClick={onClose}
          disabled={submitting}
        >
          close
        </button>
      </div>
    );
  },
}));

const useVehicleStore = vehicleStoreMock;
const VehicleManagement = (await import("../VehicleManagement.jsx")).default;

const renderComponent = () =>
  render(
    <MemoryRouter>
      <VehicleManagement />
    </MemoryRouter>
  );

describe("VehicleManagement add flow", () => {
  beforeEach(() => {
    vehicleStoreMock.__reset();
    vi.clearAllMocks();
  });

  it("opens the add vehicle modal when clicking the add button", async () => {
    renderComponent();
    const addButton = screen.getByRole("button", {
      name: /thêm xe (mới|đầu tiên)/i,
    });
    await userEvent.click(addButton);
    await waitFor(() =>
      expect(screen.getByTestId("vehicle-modal")).toBeInTheDocument()
    );
  });

  it("keeps modal open until addVehicle promise resolves and then closes", async () => {
    const deferred = {};
    const promise = new Promise((resolve) => {
      deferred.resolve = resolve;
    });

    useVehicleStore.__setState({
      addVehicle: vi.fn(() => promise),
    });

    renderComponent();
    const addButton = screen.getByRole("button", {
      name: /thêm xe (mới|đầu tiên)/i,
    });
    await userEvent.click(addButton);
    await userEvent.click(screen.getByTestId("vehicle-modal-save"));

    expect(useVehicleStore.__getState().addVehicle).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("vehicle-modal")).toBeInTheDocument();

    await act(async () => {
      deferred.resolve({ id: "vehicle-1" });
    });

    await waitFor(() =>
      expect(screen.queryByTestId("vehicle-modal")).not.toBeInTheDocument()
    );
  });

  it("shows error alert and keeps modal open if addVehicle rejects", async () => {
    const error = new Error("Xe đã tồn tại");
    useVehicleStore.__setState({
      addVehicle: vi.fn(() => Promise.reject(error)),
      clearError: vi.fn(),
    });

    renderComponent();
    const addButton = screen.getByRole("button", {
      name: /thêm xe (mới|đầu tiên)/i,
    });
    await userEvent.click(addButton);
    await userEvent.click(screen.getByTestId("vehicle-modal-save"));

    await waitFor(() =>
      expect(screen.getByText(/xe đã tồn tại/i)).toBeInTheDocument()
    );
    expect(screen.getByTestId("vehicle-modal")).toBeInTheDocument();
  });

  it("disables closing the modal while submitting", async () => {
    const deferred = {};
    const promise = new Promise((resolve) => {
      deferred.resolve = resolve;
    });

    useVehicleStore.__setState({
      addVehicle: vi.fn(() => promise),
    });

    renderComponent();
    const addButton = screen.getByRole("button", {
      name: /thêm xe (mới|đầu tiên)/i,
    });
    await userEvent.click(addButton);
    await userEvent.click(screen.getByTestId("vehicle-modal-save"));

    expect(screen.getByTestId("vehicle-modal-close")).toBeDisabled();

    await act(async () => {
      deferred.resolve({ id: "vehicle-2" });
    });
  });
});
