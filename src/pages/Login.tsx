import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth"; 
import { Link } from "react-router-dom";

/**
 * @summary Renders the login interface for the GMA Partner Portal.
 */
export function LoginPage() {
  const { signIn, error, clearError, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /**
   * @summary Processes the login form submission by authenticating user credentials.
   * @param  e - The form submission event.
   * @throws {Error} Throws if the sign-in process fails.
   */
  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    
    clearError();
    setSubmitting(true);
    
    try {
      await signIn(email, password);
    } catch (err) {
      console.error("Login attempt failed:", err);
    } finally {
      setSubmitting(false);
    }
  }

  const busy = loading || submitting;

  return (
    <div className="login-page">
      <div className="login-inner">
        <form className="login-card" onSubmit={handleSubmit}>
          <h2>Partner Portal Login</h2>
          
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
            New Partner? <Link to="/register">Create an Account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}