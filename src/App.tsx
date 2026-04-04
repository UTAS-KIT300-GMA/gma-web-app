import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import { RoleGate } from "./components/RoleGate";

// Pages
import { LoginPage } from "./pages/Login";
import { RegisterPage } from "./pages/Register";
import { DashboardPage } from "./pages/Dashboard";
import { AnalyticsPage } from "./pages/Analytics";
import { EventRegistrationPage } from "./pages/EventRegistration";
import { EventApprovalPage } from "./pages/EventApproval";
import { PendingApprovalPage } from "./pages/PendingApproval"; 
import { VerifyEmailPage } from "./pages/VerifyEmail";       
import { ApplicationPage } from "./pages/Application";
import { FinalSetupPage } from "./pages/FinalSetup";

function LoginRoute() {
  const { user, loading } = useAuth(); 
  if (loading) return <div className="centered"><div className="spinner" /></div>;

  // If they are logged in AT ALL, send them to the gatekeeper at root
  if (user) return <Navigate to="/" replace />;
  return <LoginPage />;
}

export default function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="centered"><div className="spinner" /></div>;

  return (
    <Routes>
      {/* 1. PUBLIC ROUTES */}
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* 2. THE MASTER GATEKEEPER (The Decision Maker) */}
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
        {/* Dashboard and Internal Portal Sub-Routes */}
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

      {/* 3. CATCH-ALL: Back to the Gatekeeper */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}