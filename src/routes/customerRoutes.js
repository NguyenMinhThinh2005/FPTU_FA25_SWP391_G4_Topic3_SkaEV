import CustomerProfile from "../pages/customer/CustomerProfileIntegrated";
import VehicleManagement from "../pages/customer/VehicleManagement";
import ChargingFlow from "../pages/customer/ChargingFlow";
import PaymentPage from "../pages/customer/PaymentPage";
import PaymentHistory from "../pages/customer/PaymentHistory";
import MonthlyCostReports from "../pages/customer/MonthlyCostReports";
import ChargingHabitsAnalysis from "../pages/customer/ChargingHabitsAnalysis";

export const CUSTOMER_ROUTES = [
  { path: "profile", component: CustomerProfile },
  { path: "vehicle-management", component: VehicleManagement },
  { path: "charging", component: ChargingFlow },
  { path: "payment", component: PaymentPage },
  { path: "payment-history", component: PaymentHistory },
  { path: "monthly-reports", component: MonthlyCostReports },
  { path: "charging-habits", component: ChargingHabitsAnalysis },
];

export default CUSTOMER_ROUTES;
