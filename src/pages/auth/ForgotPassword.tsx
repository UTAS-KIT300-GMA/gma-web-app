import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import logo from "../../assets/gma-web-logo.png";
import "../../styles/admin/login.css";

/**
 * @summary Forgot Password page for sending Firebase reset email.
 */
export function ForgotPasswordPage() {
  const { resetPassword, error, clearError } = useAuth();

  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    clearError();
    setSuccess("");

    if (!email.trim()) return;

    setSubmitting(true);

    try {
      await resetPassword(email);

      setSuccess(
        "Password reset email sent successfully. Please check your inbox and spam/junk folder."
      );

      setEmail("");
    } catch (err) {
      console.error("Reset password failed:", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-inner">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-brand">
            <img src={logo} alt="GMA Logo" className="login-logo" />

            <h2>Forgot Password</h2>

            <p className="login-subtitle">
              Enter your email to receive a password reset link
            </p>
          </div>

          {error && (
            <div className="alert error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="alert success" role="alert">
              {success}
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
                disabled={submitting}
              />
            </label>
          </div>

          <div className="login-actions-centered">
            <button
              type="submit"
              className="btn-primary login-btn"
              disabled={submitting}
            >
              {submitting ? "Sending..." : "Send Reset Link"}
            </button>

            <Link to="/login" className="link-button">
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}