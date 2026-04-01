import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import { RoleGate } from "./components/RoleGate";
import { LoginPage } from "./pages/Login";
import { DashboardPage } from "./pages/Dashboard";
import { AnalyticsPage } from "./pages/Analytics";
import { EventRegistrationPage } from "./pages/EventRegistration";
import { EventApprovalPage } from "./pages/EventApproval";

function LoginRoute() {
  const { user, profile, loading } = useAuth();
  if (loading) {
    return (
      <div className="centered" style={{ minHeight: "100vh" }}>
        <div className="spinner" />
      </div>
    );
  }
  if (user && profile) {
    return <Navigate to="/dashboard" replace />;
  }
  return <LoginPage />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="events/register" element={<EventRegistrationPage />} />
        <Route
          path="events/approval"
          element={
            <RoleGate roles={["admin"]}>
              <EventApprovalPage />
            </RoleGate>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
