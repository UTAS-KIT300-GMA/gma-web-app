import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Link, useSearchParams } from "react-router-dom";
import logo from "../../assets/gma-web-logo.png";
import "../../styles/admin/login.css";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";



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
  const [termsURL, setTermsURL] = useState("");


  useEffect(() => {
    async function loadTermsPolicy() {
      try {
        const settingsRef = doc(db, "adminSettings", "platform");
        const settingsSnap = await getDoc(settingsRef);

        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          setTermsURL(data.termsPolicyFileURL || "");
        }
      } catch (error) {
        console.error("Failed to load Terms & Policies:", error);
      }
    }

    loadTermsPolicy();
  }, []);



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
                onChange={(e) => {
                  setEmail(e.target.value);
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
                onChange={(e) => {
                  setPassword(e.target.value);
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


          <div className="login-actions-centered">

            <button type="submit" className="btn-primary login-btn" disabled={busy}>
              {busy ? "Signing in..." : "Log in"}
            </button>

            <Link to="/forgot-password" className="forgot-password-link">
              Forgot password?
            </Link>

            <button
              type="button"
              className="forgot-password-link"
              onClick={() => {
                if (!termsURL) {
                  alert("No Terms and Policies document has been uploaded yet.");
                  return;
                }

                const link = document.createElement("a");
                link.href = termsURL;
                link.download = "GMA-Terms-and-Policies.pdf";
                link.click();
              }}
            >
              Terms & Policies
            </button>
          </div>

          {view === "partner" && (
            <p className="small muted">
              New Partner?{" "}
              <Link className="link-button" to="/register?view=partner">Create an Account</Link>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}