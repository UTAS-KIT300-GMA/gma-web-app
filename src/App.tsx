import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import { RoleGate } from "./components/RoleGate";

// Auth pages
import { LoginPage } from "./pages/auth/Login";
import { RegisterPage } from "./pages/auth/Register";
import { VerifyEmailPage } from "./pages/auth/VerifyEmail";

// Partner pages
import PartnerDashboardPage from "./pages/partner/Dashboard";
import { EventRegistrationPage } from "./pages/partner/EventRegistration";
import { ApplicationPage } from "./pages/partner/Application";
import { FinalSetupPage } from "./pages/partner/FinalSetup";

// Admin pages
import { AnalyticsPage } from "./pages/admin/Analytics";
import { EventApprovalPage } from "./pages/admin/EventApproval";
import { EventManagePage } from "./pages/admin/EventManage";
import { PendingApprovalPage } from "./pages/admin/PendingApproval";
import AdminDashboardPage from "./pages/admin/Dashboard";

function LoginRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="centered">
        <div className="spinner" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;
  return <LoginPage />;
}

export default function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="centered">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            {!user?.emailVerified ? (
              <VerifyEmailPage />
            ) : !profile ? (
              <ApplicationPage />
            ) : profile.status === "pending_approval" ? (
              <PendingApprovalPage />
            ) : !profile.onboardingComplete ? (
              <FinalSetupPage />
            ) : (
              <AppLayout />
            )}
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            profile?.role === "admin" ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/partner/dashboard" replace />
            )
          }
        />

        <Route
          path="partner/dashboard"
          element={
            <RoleGate roles={["partner"]}>
              <PartnerDashboardPage />
            </RoleGate>
          }
        />

        <Route
          path="partner/events/register"
          element={
            <RoleGate roles={["partner"]}>
              <EventRegistrationPage />
            </RoleGate>
          }
        />

        <Route
          path="partner/events/register/:eventId"
          element={
            <RoleGate roles={["partner"]}>
              <EventRegistrationPage />
            </RoleGate>
          }
        />

        <Route
          path="admin/dashboard"
          element={
            <RoleGate roles={["admin"]}>
              <AdminDashboardPage />
            </RoleGate>
          }
        />

        <Route
          path="admin/analytics"
          element={
            <RoleGate roles={["admin"]}>
              <AnalyticsPage />
            </RoleGate>
          }
        />

        <Route
          path="admin/events/manage"
          element={
            <RoleGate roles={["admin"]}>
              <EventManagePage />
            </RoleGate>
          }
        />

        <Route
          path="admin/events/approval"
          element={
            <RoleGate roles={["admin"]}>
              <EventApprovalPage />
            </RoleGate>
          }
        />
      </Route>
      <Route
        path="admin/partners/manage"
        element={
          <RoleGate roles={["admin"]}>
            <PendingApprovalPage />
          </RoleGate>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
