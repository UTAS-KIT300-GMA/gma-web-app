import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth"; 
import { colors } from "../theme";

/**
 * @summary Login page for the GMA Partner Portal.
 * Uses explicit SyntheticEvent and ChangeEvent types to satisfy React 19+ standards.
 */
export function LoginPage() {
  const { signIn, error, clearError, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /**
   * @summary Processes the login form submission.
   * @param {React.SyntheticEvent<HTMLFormElement>} e The base React event type for forms.
   */
  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    // Standard practice to prevent page refresh
    e.preventDefault();
    
    clearError();
    setSubmitting(true);
    
    try {
      await signIn(email, password);
    } catch (err) {
      console.error("Login component caught error:", err);
    } finally {
      setSubmitting(false);
    }
  }

  const busy = loading || submitting;

  return (
    <div className="login-page">
      <div className="login-inner">
        <form className="login-card" onSubmit={handleSubmit}>
          {error && <div className="alert error" style={{ color: colors.error }}>{error}</div>}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              // Using ChangeEvent as suggested by the compiler warning
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
              disabled={busy}
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              // Using ChangeEvent for the password input as well
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              disabled={busy}
            />
          </label>

          <button
            type="submit"
            className="btn-primary"
            disabled={busy}
            style={{ backgroundColor: colors.primary, color: colors.textOnPrimary }}
          >
            {busy ? "Signing in…" : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}