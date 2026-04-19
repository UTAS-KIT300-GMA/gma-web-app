import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth"; 
import { Link, useSearchParams } from "react-router-dom";
import logo from "../../assets/gma-web-logo.png";
import "../../styles/admin/login.css";



/**
 * @summary Renders the login interface for the GMA Partner Portal.
 */
export function LoginPage() {
  const { signIn, error, clearError, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view") || "partner"; // Default to partner if no role specified

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");



  /**
   * @summary Processes the login form submission by authenticating user credentials.
   * @param  e - The form submission event.
   * @throws {Error} Throws if the sign-in process fails.
   */
  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();

     if (!email.trim() || !password.trim()) {
    setFormError("Please enter both email and password.");
    return;
  }
    setFormError("");
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
    <div className={`login-page ${view === "admin" ? "admin-view" : "partner-view"}`}>
      <div className="login-inner">
        <form className="login-card" onSubmit={handleSubmit} noValidate>
           <div className="login-brand">
             <img src={logo} alt="GMA Logo" className="login-logo" />
          
          <h2>{view === "admin" ? "Admin" : "Partner"} Portal Login</h2>
               <p className="login-subtitle">
      {view === "admin"
        ? "Sign in to manage platform activity"
        : "Sign in to access your partner portal"}
    </p>
  </div>
          {error && (
            <div className="alert error" role="alert">
              {error}
            </div>
          )}

          {formError && (
            <div className="form-error">
              {formError}
            </div>
         )}

          <div className="form-fields">
            <label className="field">
              <span>Email Address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => {setEmail(e.target.value);
                  if (formError) 
                    setFormError("");
                  }
                }
                placeholder="name@example.com"
                required
                disabled={busy}
                className={!email.trim() && formError ? "input-error" : ""}
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => {setPassword(e.target.value);
                  if (formError)
                    setFormError("");
                  }
                }

                placeholder="••••••••"
                required
                disabled={busy}
                className={!password.trim() && formError ? "input-error" : ""}
              />
            </label>
          </div>

          
          <div className="login-row">  
            <button type="submit" className="btn-primary login-btn" disabled={busy}>
              {busy ? "Signing in..." : "Log in"}
            </button>
            <span className="forgot-password">Forgot password?</span>
          </div>

          {view === "partner" && (
            <p className="small muted">
              New Partner?{" "}
              <Link to="/register?view=partner">Create an Account</Link>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}