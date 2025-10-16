import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import skaevTheme from "./theme/index";
import useAuthStore from "./store/authStore";

// Layout Components
import AppLayout from "./components/layout/AppLayout/AppLayout";
import ErrorBoundary from "./components/ui/ErrorBoundary/ErrorBoundary";
import UnifiedDataSync from "./components/customer/UnifiedDataSync";

// Auth Pages
import LoginPage from "./pages/auth/Login";
import RegisterPage from "./pages/auth/Register";
import EmailVerification from "./pages/auth/EmailVerification";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Public Pages
import HomePage from "./pages/public/Home";
// Test and Demo Pages
import TestPage from "./pages/TestPage";
import ChargingFlow from "./pages/customer/ChargingFlow";
import DateTimePickerDemo from "./pages/DateTimePickerDemo";

// Customer Pages
import CustomerDashboard from "./pages/customer/Dashboard";
import FindStations from "./pages/customer/FindStations";
import BookingHistory from "./pages/customer/BookingHistory";
import PaymentMethods from "./pages/customer/PaymentMethods";
import PaymentHistory from "./pages/customer/PaymentHistory";
import CustomerProfile from "./pages/customer/CustomerProfile";
import PaymentPage from "./pages/customer/PaymentPage";
import AnalyticsPage from "./pages/customer/AnalyticsPage";
import CustomerAnalytics from "./pages/customer/Analytics";
import MonthlyCostReports from "./pages/customer/MonthlyCostReports";
import ChargingHabitsAnalysis from "./pages/customer/ChargingHabitsAnalysis";

// Staff Pages
import StaffDashboard from "./pages/staff/Dashboard";
import StaffStationManagement from "./pages/staff/StationManagement";
import StaffProfile from "./pages/staff/Profile";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import UserManagement from "./pages/admin/UserManagement";
import AdvancedAnalytics from "./pages/admin/AdvancedAnalytics";
import AdminStationManagement from "./pages/admin/StationManagement";

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    // Redirect to appropriate dashboard based on role
    switch (user?.role) {
      case "admin":
        return <Navigate to="/admin/dashboard" replace />;
      case "staff":
        return <Navigate to="/staff/dashboard" replace />;
      case "customer":
        return <Navigate to="/customer/profile" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return children;
};

function App() {
  return (
    <ErrorBoundary fallbackMessage="Đã xảy ra lỗi không mong muốn. Chúng tôi sẽ đưa bạn về trang chủ.">
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={skaevTheme}>
          <CssBaseline />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/test" element={<TestPage />} />
              <Route path="/datetime-demo" element={<DateTimePickerDemo />} />
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/verify-email"
                element={
                  <PublicRoute>
                    <EmailVerification />
                  </PublicRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PublicRoute>
                    <ForgotPassword />
                  </PublicRoute>
                }
              />

              {/* Customer Routes */}
              <Route
                path="/customer"
                element={
                  <ProtectedRoute allowedRoles={["customer"]}>
                    <UnifiedDataSync>
                      <AppLayout />
                    </UnifiedDataSync>
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="profile" replace />} />
                <Route path="profile" element={<CustomerProfile />} />
                <Route path="charging" element={<ChargingFlow />} />
                <Route path="payment" element={<PaymentPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="payment-history" element={<PaymentHistory />} />
                <Route
                  path="monthly-reports"
                  element={<MonthlyCostReports />}
                />
                <Route
                  path="charging-habits"
                  element={<ChargingHabitsAnalysis />}
                />
              </Route>

              {/* Staff Routes */}
              <Route
                path="/staff"
                element={
                  <ProtectedRoute allowedRoles={["staff"]}>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<StaffDashboard />} />
                <Route path="stations" element={<StaffStationManagement />} />
                <Route path="profile" element={<StaffProfile />} />
                <Route index element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="analytics" element={<AdvancedAnalytics />} />
                <Route path="stations" element={<AdminStationManagement />} />
                <Route path="users" element={<UserManagement />} />
                <Route index element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* Fallback Routes */}
              <Route
                path="/unauthorized"
                element={<div>Bạn không có quyền truy cập trang này</div>}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
