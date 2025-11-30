import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
import CUSTOMER_ROUTES, { PAYMENT_ROUTES } from "./routes/customerRoutes";

// Staff Pages
import StaffDashboard from "./pages/staff/Dashboard";
import ChargingSessions from "./pages/staff/ChargingSessions";
import Monitoring from "./pages/staff/Monitoring";
import StaffProfile from "./pages/staff/Profile";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import UserManagement from "./pages/admin/UserManagement";
import UserDetail from "./pages/admin/UserDetail";
import SupportRequestsManagement from "./pages/admin/SupportRequestsManagement";
import AdvancedAnalytics from "./pages/admin/AdvancedAnalytics";
import ReportsAnalytics from "./pages/admin/ReportsAnalytics";
import AdminStationManagement from "./pages/admin/StationManagement";
import IncidentManagement from "./pages/admin/IncidentManagement";
import StationDetailAnalytics from "./pages/admin/StationDetailAnalytics";

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
        return <Navigate to="/admin/stations" replace />; // Admin goes to Station Management
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
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
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

              {/* VNPay Return Routes - Public (no auth required) */}
              {PAYMENT_ROUTES.map(({ path, component }) => (
                <Route
                  key={path}
                  path={path}
                  element={React.createElement(component)}
                />
              ))}

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
                {CUSTOMER_ROUTES.map(({ path, component }) => (
                  <Route
                    key={path}
                    path={path}
                    element={React.createElement(component)}
                  />
                ))}
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
                <Route
                  path="charging-sessions"
                  element={<ChargingSessions />}
                />
                <Route path="monitoring" element={<Monitoring />} />
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
                <Route path="reports" element={<ReportsAnalytics />} />
                <Route path="stations" element={<AdminStationManagement />} />
                <Route path="stations/:stationId/analytics" element={<StationDetailAnalytics />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="users/:userId" element={<UserDetail />} />
                <Route path="support-requests" element={<SupportRequestsManagement />} />
                <Route path="incidents" element={<IncidentManagement />} />
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
