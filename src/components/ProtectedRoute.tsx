import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth"; 
import type { UserRole } from "../types/user-types";

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: UserRole[]; 
}

/**
 * @summary Master Gatekeeper for Authentication and Authorization.
 * Specific stage-based redirects are handled in AppRoutes.
 */
export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // 1. System Integrity: Wait for Firebase/Firestore to finish loading
  if (loading) {
    return (
      <div className="centered" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
        <p>Verifying Security...</p>
      </div>
    );
  }

  // 2. Authentication Gate: If no user is logged in at all, kick to Login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Authorization Gate: Check if the user has the required Role (Admin/Partner)
  // This prevents a Partner from manually typing "/events/approval" in the URL
  if (roles && (!profile || !roles.includes(profile.role))) {
    console.warn(`Security: Role [${profile?.role || "none"}] attempted unauthorized access to a protected route.`);
    return <Navigate to="/app" replace />;
  }

  // 4. Success: If they are logged in and authorized, let them pass to the AppRoutes logic
  return <>{children}</>;
}