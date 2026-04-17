import { useAuth } from "../../hooks/useAuth";
import { sendEmailVerification } from "firebase/auth";
import { useState, useEffect } from "react";
import { auth } from "../../firebase";

/**
 * @summary Renders the Stage 1 verification interface and handles automatic polling for email status changes.
 */
export function VerifyEmailPage() {
  const { user, signOutUser } = useAuth();
  const [sending, setSending] = useState(false);

  /**
   * @summary Monitors the user's email verification status by polling the Firebase Auth service every 3 seconds.
   */
  useEffect(() => {
    const interval = setInterval(async () => {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          console.log("Verified! Reacting automatically...");
          clearInterval(interval);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  /**
   * @summary Re-sends a verification email to the current user's registered address.
   * @throws {Error} Throws if the authentication service rate-limits requests or network connectivity is lost.
   */
  const handleResend = async () => {
    if (!user) return;
    setSending(true);
    try {
      await user.reload();
      if (user.emailVerified) return; 

      await sendEmailVerification(user, {
        url: 'http://localhost:5173/', 
        handleCodeInApp: true,
      });
      alert("Verification email sent!");
    } catch (err: any) {
      if (err.code === 'auth/too-many-requests') {
        alert("Slow down! Please wait a minute before trying again.");
      } else {
        alert("Failed to send email. Check your connection.");
      }
      throw err;
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-vignette" aria-hidden="true" />
      <div className="login-inner centered-text">
        <div className="login-card">
          <div className="centered">
            <div className="status-icon">📧</div>
            <h1 className="title-spacing">Verify your email</h1>
            <p className="login-sub">
              We sent a verification link to:<br />
              <strong>{user?.email}</strong>
            </p>

            <div className="alert info">
              <p className="small">
                Waiting for verification... Once you click the link in your email, 
                <strong> this page will update automatically.</strong>
              </p>
            </div>

            <button 
              className="btn-outline full-width" 
              onClick={handleResend} 
              disabled={sending}
            >
              {sending ? "Sending..." : "Resend Email"}
            </button>

            <button 
              className="btn-ghost theme-black-text" 
              onClick={async () => {
                await signOutUser();
              }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}