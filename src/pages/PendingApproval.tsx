import { useAuth } from "../hooks/useAuth";
import { colors } from "../theme";

/**
 * @summary The "Waiting Room" for new Partners.
 * Triggered when email is verified but status is still 'pending_approval'.
 */
export function PendingApprovalPage() {
  const { profile, signOutUser } = useAuth();

  return (
    <div className="login-page">
      <div className="login-vignette" aria-hidden />
      
      <div className="login-inner" style={{ textAlign: "center" }}>
        <div className="login-card">
          <div className="centered">
            {/* Using your spinner class for a "Processing" feel */}
            <div className="spinner"></div>
            
            <h1 style={{ marginTop: "1rem" }}>Email Verified!</h1>
            
            <p className="login-sub">
              Thanks, <strong>{profile?.representativeName || "Partner"}</strong>. 
              Your account for <strong>{profile?.orgName}</strong> is now being reviewed by our administration team.
            </p>

            <div className="alert ok" style={{ textAlign: "left" }}>
              <strong>Status: Waiting for Admin Approval</strong>
              <p className="small" style={{ marginTop: "0.5rem" }}>
                GMA Admins usually review new partnerships within 24–48 hours. 
                You will receive an email once your portal access is granted.
              </p>
            </div>

            <button 
              className="btn-ghost" 
              style={{
                color: colors.primary, // Using your theme object
                borderColor: 'rgba(0,0,0,0.1)', 
                marginTop: "1rem"
              }}
              onClick={signOutUser}
            >
              Sign out & Check later
            </button>
          </div>
        </div>
        
        <p className="small" style={{ color: "white", marginTop: "1.5rem", opacity: 0.8 }}>
          Need help? Contact support@gmaconnect.org.au
        </p>
      </div>
    </div>
  );
}