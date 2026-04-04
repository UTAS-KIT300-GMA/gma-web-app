import { useAuth } from "../hooks/useAuth";
import { sendEmailVerification } from "firebase/auth";
import { useState } from "react";

/**
 * @summary The 'Verification Gate'.
 * Users land here if they have a Firebase account but haven't clicked the link in their inbox.
 */
export function VerifyEmailPage() {
  const { user, signOutUser } = useAuth();
  const [sending, setSending] = useState(false);

  const handleResend = async () => {
    if (!user) return;
    setSending(true);
    try {
      await sendEmailVerification(user);
      alert("Verification email sent! Please check your spam folder if you don't see it.");
    } catch (err) {
      alert("Too many requests. Please wait a moment before trying again.");
    } finally {
      setSending(false);
    }
  };

  /**
   * Firebase 'emailVerified' property often needs a manual reload to update 
   * if the user clicks the link in a different tab.
   */
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="login-page">
      <div className="login-vignette" aria-hidden="true" />
      
      <div className="login-inner centered-text">
        <div className="login-card">
          <div className="centered">
            {/* Using an envelope icon or simple placeholder */}
            <div className="status-icon">📧</div>
            
            <h1 className="title-spacing">Verify your email</h1>
            
            <p className="login-sub">
              We sent a verification link to:<br />
              <strong>{user?.email}</strong>
            </p>

            <div className="alert info">
              <p className="small">
                Once you've clicked the link in your email, click <strong>"I've Verified"</strong> below to continue your setup.
              </p>
            </div>

            <div className="form-actions vertical">
              <button 
                className="btn-primary full-width" 
                onClick={handleRefresh}
              >
                I've Verified
              </button>

              <button 
                className="btn-outline full-width" 
                onClick={handleResend}
                disabled={sending}
              >
                {sending ? "Sending..." : "Resend Email"}
              </button>

              <button 
                className="btn-ghost theme-black-text" 
                onClick={signOutUser}
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}