// src/pages/VerifyEmail.tsx
import { useAuth } from "../hooks/useAuth";
import { sendEmailVerification } from "firebase/auth";

export function VerifyEmailPage() {
  const { user, signOutUser } = useAuth();

  const handleResend = async () => {
    if (user) await sendEmailVerification(user);
    alert("Verification email sent!");
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Verify your email</h1>
        <p className="muted">We sent a link to {user?.email}. Please check your inbox.</p>
        <button className="btn-primary" onClick={handleResend}>Resend Email</button>
        <button className="btn-ghost" style={{color: 'black'}} onClick={signOutUser}>Back to Login</button>
      </div>
    </div>
  );
}