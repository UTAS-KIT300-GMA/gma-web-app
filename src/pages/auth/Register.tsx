import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerPartner } from "../../services/authService";
import { validateEmail, validatePassword } from "../../utils/validation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

/**
 * @summary Renders the registration interface for Stage 1 of the partner onboarding process.
 */
export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsURL, setTermsURL] = useState("");

  const navigate = useNavigate();

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
   * @summary Processes account creation, validates passwords, and triggers email verification.
   * @param {React.SyntheticEvent} e - The form submission event.
   * @throws {Error} Throws if the registration service or email verification fails.
   */
  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError(null);

    if (!acceptedTerms) {
      return setError("You must accept the Terms & Conditions.");
    }

    const emailError = validateEmail(email);

    if (emailError) {
      return setError(emailError);
    }

    const passwordError = validatePassword(password);

    if (passwordError) {
      return setError(passwordError);
    }

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
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
        phoneNumber: "",
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
                placeholder="10–64 chars, upper/lowercase, number, symbol"
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
            <label
              className="field"
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                disabled={loading}
                style={{ width: "auto" }}
              />

              <span style={{ fontSize: "14px" }}>
                I agree to the{" "}
                <button
                  type="button"
                  className="link-button"
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
                  Terms & Conditions
                </button>

              </span>
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Creating Account..." : "Register Account"}
            </button>
          </div>

          <p className="small muted">
            Already have an account? <Link to="/login">Log in here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
