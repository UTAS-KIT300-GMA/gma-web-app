import type { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../types/user-types";

interface RoleGateProps {
  roles: UserRole[];
  children: ReactNode;
}

/**
 * @summary Component-level security for granular UI visibility.
 * Use this to wrap specific buttons, tabs, or sections.
 * It returns null if unauthorized, keeping the user on the current page.
 */
export function RoleGate({ roles, children }: RoleGateProps) {
  const { profile, loading } = useAuth();

  // 1. System Integrity: Prevent "Security Flicker" while loading
  if (loading) return null;

  // 2. Existence Check: Hide content if the profile hasn't been created yet
  if (!profile) return null;

  // 3. Authorization: Is the user's role in the allowed list?
  if (!roles.includes(profile.role)) {
    // Log the attempt for the system audit trail
    console.warn(`RoleGate: Unauthorized role [${profile.role}] attempted access to a restricted UI element.`);
    return null;
  }

  // 4. Authorized: Render the restricted content
  return <>{children}</>;
}