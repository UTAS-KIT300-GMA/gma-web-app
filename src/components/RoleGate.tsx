import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth"; // Updated to use the hooks folder
import type { UserRole } from "../types/user-types";

interface RoleGateProps {
  roles: UserRole[];
  children: ReactNode;
}

/**
 * @summary Restricts UI elements or routes based on the user's specific role.
 * Redirects unauthorized users back to the safe Dashboard area.
 * @param {RoleGateProps} props - The list of authorized roles and the restricted content.
 * @returns The children if authorized, otherwise a redirect.
 */
export function RoleGate({ roles, children }: RoleGateProps) {
  const { profile, loading } = useAuth();

  // 1. Wait for the profile to load before making a security decision
  if (loading) return null;

  // 2. Authorization Check: Compare user's role against the allowed list
  if (!profile || !roles.includes(profile.role)) {
    console.warn(`RoleGate: Unauthorized access attempt by ${profile?.role || "unknown"}`);
    return <Navigate to="/dashboard" replace />;
  }

  // 3. Success: Render restricted content
  return <>{children}</>;
}