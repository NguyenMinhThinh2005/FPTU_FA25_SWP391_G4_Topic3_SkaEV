const CustomerProfileStub = () => null;
const VehicleManagementStub = () => null;
const ChargingFlowStub = () => null;
const PaymentPageStub = () => null;
const PaymentHistoryStub = () => null;
const MonthlyCostReportsStub = () => null;
const ChargingHabitsStub = () => null;

vi.mock("../pages/customer/CustomerProfileIntegrated", () => ({
  __esModule: true,
  default: CustomerProfileStub,
}));

vi.mock("../pages/customer/VehicleManagement", () => ({
  __esModule: true,
  default: VehicleManagementStub,
}));

vi.mock("../pages/customer/ChargingFlow", () => ({
  __esModule: true,
  default: ChargingFlowStub,
}));

vi.mock("../pages/customer/PaymentPage", () => ({
  __esModule: true,
  default: PaymentPageStub,
}));

vi.mock("../pages/customer/PaymentHistory", () => ({
  __esModule: true,
  default: PaymentHistoryStub,
}));

vi.mock("../pages/customer/MonthlyCostReports", () => ({
  __esModule: true,
  default: MonthlyCostReportsStub,
}));

vi.mock("../pages/customer/ChargingHabitsAnalysis", () => ({
  __esModule: true,
  default: ChargingHabitsStub,
}));

describe("Customer route configuration", () => {
  it("includes vehicle-management path targeting VehicleManagement component", async () => {
    const { default: routes } = await import("../routes/customerRoutes");
    const vehicleRoute = routes.find(
      (route) => route.path === "vehicle-management"
    );

    expect(vehicleRoute).toBeDefined();
    expect(vehicleRoute?.component).toBe(VehicleManagementStub);
  });
});
