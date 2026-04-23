import { useAuth } from "../../hooks/useAuth";

/**
 * @summary The "Waiting Room" for new Partners.
 * Triggered when email is verified but status is still 'pending_approval'.
 */
export function PendingApprovalPage() {
  const { profile, signOutUser } = useAuth();

  return (
    <div className="login-page">
      {/* Visual background element */}
      <div className="login-vignette" aria-hidden="true" />
      
      <div className="login-inner centered-text">
        <div className="login-card">
          <div className="centered">

            <h1 className="title-spacing">Email Verified!</h1>
            
            <p className="login-sub">
              Thanks,{" "}
              <strong>
                {[profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "Partner"}
              </strong>
              . Your account for{" "}
              <strong>{profile?.orgName || "your organization"}</strong> is now being
              reviewed by our administration team.
            </p>

            <div className="alert ok left-text">
              <strong>Status: Waiting for Admin Approval</strong>
              <p className="small status-detail">
                GMA Admins usually review new partnerships within 48 hours. 
                You will receive an email once your portal access is granted.
              </p>
            </div>

            <div className="verify-actions">
              <button
                type="button"
                className="btn-secondary verify-btn"
                onClick={signOutUser}
              >
                Sign out & Check later
              </button>
            </div>

            <p className="verify-support">
              Need help? Contact{" "}
              <a href="mailto:contact@guessmyaccent.com.au">
                contact@guessmyaccent.com.au
              </a>
            </p>

            </div>
          </div>
        </div>  
      </div>
  );
}