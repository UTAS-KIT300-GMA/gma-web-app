import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import { RoleGate } from "./components/RoleGate";

// Pages
import { LoginPage } from "./pages/Login";
import { DashboardPage } from "./pages/Dashboard";
import { AnalyticsPage } from "./pages/Analytics";
import { EventRegistrationPage } from "./pages/EventRegistration";
import { EventApprovalPage } from "./pages/EventApproval";
import { PendingApprovalPage } from "./pages/PendingApproval"; // Import new page
import { VerifyEmailPage } from "./pages/VerifyEmail";       // Import new page

/**
 * @summary Traffic Controller for Login.
 * If user is approved, go to dashboard.
 * If user is pending, go to pending page.
 */
function LoginRoute() {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="centered"><div className="spinner" /></div>;

  if (user && profile) {
    // Logic: If they are already logged in, send them to the internal gatekeeper
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginPage />;
}

/**
 * @summary Main Route Controller.
 * Redirects users to Verify or Pending screens based on their account state.
 */
function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="centered"><div className="spinner" /></div>;

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/pending-approval" element={<PendingApprovalPage />} />

      {/* Protected Portal Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            {/* IN-ROUTE GATEKEEPER: Forces users to correct state before showing Layout */}
            {!user?.emailVerified ? (
              <Navigate to="/verify-email" replace />
            ) : profile?.status === "pending_approval" ? (
              <Navigate to="/pending-approval" replace />
            ) : (
              <AppLayout />
            )}
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