import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerPartner } from "../services/authService"; 

/**
 * @summary Renders the registration interface for Stage 1 of the partner onboarding process.
 */
export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  /**
   * @summary Processes account creation, validates passwords, and triggers email verification.
   * @param {React.SyntheticEvent} e - The form submission event.
   * @throws {Error} Throws if the registration service or email verification fails.
   */
  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    setLoading(true);

    try {
      await registerPartner({
        email,
        password, 
        orgName: "", 
        orgType: "",
        abn: "", 
        address: "",
        firstName: "", 
        lastName: "", 
        position: "", 
        phoneNumber: ""
      });
      
      navigate("/verify-email");
    } catch (err: any) {
      console.error("Registration failed:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else {
        setError("An error occurred during registration. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-inner">
        <form className="login-card" onSubmit={handleSubmit}>
          <h2>Partner Registration</h2>
          <p className="muted">Step 1: Create your secure account</p>

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
                disabled={loading}
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                disabled={loading}
              />
            </label>

            <label className="field">
              <span>Confirm Password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                required
                disabled={loading}
              />
            </label>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Register Account"}
            </button>
          </div>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Log in here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}