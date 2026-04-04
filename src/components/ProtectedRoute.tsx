import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth"; 
import type { UserRole } from "../types/user-types";

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: UserRole[]; 
}

/**
 * @summary Secures routes by verifying Auth, Email Verification, and Admin Approval.
 */
export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // 1. System Integrity: Wait for Firebase/Firestore
  if (loading) {
    return (
      <div className="centered" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
        <p>Verifying Security...</p>
      </div>
    );
  }

  // 2. Authentication Gate: No login = Back to Login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Email Verification Gate
  if (!user.emailVerified && location.pathname !== "/verify-email") {
    return <Navigate to="/verify-email" replace />;
  }

  // 4. Admin Approval Gate
  // Only redirect if they aren't already on the pending page
  if (profile?.status === "pending_approval" && location.pathname !== "/pending-approval") {
    return <Navigate to="/pending-approval" replace />;
  }

  // 5. Authorization Gate: Role Check
  if (roles && profile && !roles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}