import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import { RoleGate } from "./components/RoleGate";

// Auth pages
import { LoginPage } from "./pages/auth/Login";
import { RegisterPage } from "./pages/auth/Register";
import { VerifyEmailPage } from "./pages/auth/VerifyEmail";
import { LandingPage } from "./pages/auth/Landing";

// Partner pages
import PartnerDashboardPage from "./pages/partner/Dashboard";
import { EventRegistrationPage } from "./pages/partner/EventRegistration";
import { ApplicationPage } from "./pages/partner/Application";
import { FinalSetupPage } from "./pages/partner/FinalSetup";
import { EventManagePage as PartnerEventManagePage } from "./pages/partner/EventManage";

// Admin pages
import { AnalyticsPage } from "./pages/admin/Analytics";
import { EventApprovalPage } from "./pages/admin/EventApproval";
import { AdminApprovalPage } from "./pages/admin/AdminApproval";
import { EventManagePage as AdminEventManagePage } from "./pages/admin/EventManage";
import { PendingApprovalPage } from "./pages/admin/PendingApproval";
import AdminDashboardPage from "./pages/admin/Dashboard";
import UserManagementPage from "./pages/admin/UserManagement";
import AddUserPage from "./pages/admin/AddUser";

function LoginRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="centered">
        <div className="spinner" />
      </div>
    );
  }

  // If logged in → send to correct dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

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
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/AdminApproval" element={<AdminApprovalPage />} />

      {/* Protected routes - only accessible if logged in, cases to handle:
      - If partner needs email verification
      - If partner hasn't completed application
      - If partner is pending approval
      - If partner hasn't completed onboarding
       */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            {!user?.emailVerified && profile?.role !== "admin" ? (
              <VerifyEmailPage />
            ) : !profile ? (
              <ApplicationPage />
            ) : profile.role === "partner" &&
              profile.partnerApprovalStatus === "pending_approval" ? (
              <PendingApprovalPage />
            ) : !profile.onboardingComplete && profile?.role !== "admin" ? (
              <FinalSetupPage />
            ) : (
              <AppLayout />
            )}
          </ProtectedRoute>
        }
      >
        {/* Default route - redirect to correct dashboard based on role */}
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

        {/* Partner routes */}
        <Route
          path="partner/dashboard"
          element={
            <RoleGate roles={["partner", "admin"]}>
              <PartnerDashboardPage />
            </RoleGate>
          }
        />

        <Route
            path="partner/events/manage"
            element={
                <RoleGate roles={["partner"]}>
                    <PartnerEventManagePage />
                </RoleGate>
          }
        />

        <Route
          path="partner/events/register"
          element={
            <RoleGate roles={["partner", "admin"]}>
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
                <AdminEventManagePage />
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

        <Route
          path="admin/users"
          element={
            <RoleGate roles={["admin"]}>
              <UserManagementPage />
            </RoleGate>
          }
        />
        
        <Route
          path="admin/users/add"
          element={
            <RoleGate roles={["admin"]}>
              <AddUserPage />
            </RoleGate>
          }
        />

        <Route
          path="admin/partners/manage"
          element={
            <RoleGate roles={["admin"]}>
              <PendingApprovalPage />
            </RoleGate>
          }
        />

        <Route
          path="admin/partners/approve"
          element={
            <RoleGate roles={["admin"]}>
              <AdminApprovalPage />
            </RoleGate>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
