import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth"; 

/**
 * @summary Login page for the GMA Partner Portal.
 * Optimized for React 19 with inferred ChangeEvents and explicit FormEvents.
 */
export function LoginPage() {
  const { signIn, error, clearError, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /**
   * Handles the login form submission.
   * Using React.FormEvent is the standard for React 19 to prevent page refresh.
   */
  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    
    clearError();
    setSubmitting(true);
    
    try {
      await signIn(email, password);
    } catch (err) {
      // The auth hook usually handles the error state, 
      // but we log here for debugging during development.
      console.error("Login attempt failed:", err);
    } finally {
      setSubmitting(false);
    }
  }

  // A helper to disable UI elements while waiting for Firebase
  const busy = loading || submitting;

  return (
    <div className="login-page">
      <div className="login-inner">
        <form className="login-card" onSubmit={handleSubmit}>
          <h2>Partner Portal Login</h2>
          
          {/* Error display with conditional rendering */}
          {error && (
            <div className="alert error" role="alert">
              {error}
            </div>
          )}

          <div className="form-fields">
            <label className="field">
              <span>Email Address</span>
              <input
                type="email"
                value={email}
                // In React 19, 'e' is automatically inferred as ChangeEvent<HTMLInputElement>
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                disabled={busy}
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={busy}
              />
            </label>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={busy}
            >
              {busy ? "Signing in..." : "Log in"}
            </button>
          </div>
          
          <p className="small muted">
            Need an account? Please contact the GMA Admin team.
          </p>
        </form>
      </div>
    </div>
  );
}