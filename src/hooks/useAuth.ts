/**
 * AUTH HOOK
 * Provides a safe and typed way to access the AuthContext.
 */
import { useContext } from "react";
import { AuthContext, type AuthState } from "../context/AuthContext";

/**
 * @summary Custom hook to access the AuthContext state and methods.
 * @returns The current authentication state and helper functions.
 * @throws {Error} Throws if used outside of an AuthProvider.
 */
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);

  // System Integrity: Guard against using the hook outside the Provider
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return ctx;
}