import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";

export function LoginPage() {
  const { signIn, error, clearError, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname?: string } })?.from?.pathname ??
    "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    clearError();
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch {
      /* surfaced in context */
    } finally {
      setSubmitting(false);
    }
  }

  const busy = loading || submitting;

  return (
    <div className="login-page">
      <div className="login-vignette" aria-hidden />
      <div className="login-inner">
        <div className="login-logo-wrap">
          <img
            src="/gma-in-app-white-logo.png"
            alt="GMA"
            width={200}
            height={120}
            className="login-logo"
          />
        </div>

        <form className="login-card" onSubmit={handleSubmit}>
          <p className="login-sub">
            Admin &amp; Partner portal
          </p>
          {error && <div className="alert error">{error}</div>}
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={busy}
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={busy}
            />
          </label>
          <button
            type="submit"
            className="btn-primary"
            disabled={busy}
            style={{ background: colors.primary, color: colors.textOnPrimary }}
          >
            {busy ? "Signing in…" : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}
