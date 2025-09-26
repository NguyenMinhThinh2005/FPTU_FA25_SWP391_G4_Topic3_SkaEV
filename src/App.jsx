import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import skaevTheme from "./theme/index";
import useAuthStore from "./store/authStore";

// Layout Components
import AppLayout from "./components/layout/AppLayout/AppLayout";

// Auth Pages
import LoginPage from "./pages/auth/Login";
import RegisterPage from "./pages/auth/Register";

// Public Pages
import HomePage from "./pages/public/Home";
// Test and Demo Pages
import TestPage from "./pages/TestPage";
import QRScannerDemo from "./pages/QRScannerDemo";
import DateTimePickerDemo from "./pages/DateTimePickerDemo";

// Customer Pages
import FindStations from "./pages/customer/FindStations";
import BookingHistory from "./pages/customer/BookingHistory";
import PaymentMethods from "./pages/customer/PaymentMethods";
import CustomerProfile from "./pages/customer/CustomerProfile";

// Staff Pages
import StaffDashboard from "./pages/staff/Dashboard";
import StaffStationManagement from "./pages/staff/StationManagement";
import StaffProfile from "./pages/staff/Profile";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import UserManagement from "./pages/admin/UserManagement";
import AdvancedAnalytics from "./pages/admin/AdvancedAnalytics";
import AdminStationManagement from "./pages/admin/StationManagement";
import AdminSystemReports from "./pages/admin/SystemReports";
import AdminSettings from "./pages/admin/Settings";

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
        return <Navigate to="/customer/find-stations" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={skaevTheme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/qr-demo" element={<QRScannerDemo />} />
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

            {/* Customer Routes */}
            <Route
              path="/customer"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="find-stations" element={<FindStations />} />
              <Route path="history" element={<BookingHistory />} />
              <Route path="payment" element={<PaymentMethods />} />
              <Route path="profile" element={<CustomerProfile />} />
              <Route index element={<Navigate to="find-stations" replace />} />
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
              <Route path="reports" element={<AdminSystemReports />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* Fallback Routes */}
            <Route
              path="/unauthorized"
              element={<div>Unauthorized Access</div>}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
