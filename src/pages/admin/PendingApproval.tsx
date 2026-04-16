import { useAuth } from "../hooks/useAuth";
import { collection,  deleteDoc,  doc,  getDocs,  query,  updateDoc,  where,  type Timestamp, } from "firebase/firestore";
import { db } from "../firebase";

/**
 * @summary The "Waiting Room" for new Partners.
 * Triggered when email is verified but status is still 'pending_approval'.
 */
export function PendingApprovalPage() {
  const { profile, signOutUser } = useAuth();

// pending approval page code.  first build array of pending users.
const getPendingPartnerApprovals = async () => {
    const q = query(
              collection(db, "users"),
              where("status", "==", "pending"),
            );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data());
    //    return querySnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));  incase above needs 
};

//Pending Users are then Approved or Rejected by admin.
const approvePartner = async (userId) => { //approval process
    await updateDoc(doc(db, "users", userId), {
        status: "approved",
    });
};

const rejectPartner = async (userId) => { //rejection process
  await updateDoc(doc(db,"users", userId),{
    status: "rejected",
  });
};

// End of admin Panel approve and reject logic




  return (
    <div className="login-page">
      {/* Visual background element */}
      <div className="login-vignette" aria-hidden="true" />
      
      <div className="login-inner centered-text">
        <div className="login-card">
          <div className="centered">
            {/* Spinning indicator to show the 'Review' process is active */}
            <div className="spinner"></div>
            
            <h1 className="title-spacing">Email Verified!</h1>
            
            <p className="login-sub">
              Thanks, <strong>{profile?.firstName && profile?.lastName || "Partner"}</strong>. 
              Your account for <strong>{profile?.orgName || "your organization"}</strong> is now being reviewed by our administration team.
            </p>

            <div className="alert ok left-text">
              <strong>Status: Waiting for Admin Approval</strong>
              <p className="small status-detail">
                GMA Admins usually review new partnerships within 48 hours. 
                You will receive an email once your portal access is granted.
              </p>
            </div>

            {/* Logout button allows users to leave the 'Waiting Room' safely */}
            <button 
              type="button"
              className="btn-ghost theme-primary-text" 
              onClick={signOutUser}
            >
              Sign out & Check later
            </button>
          </div>
        </div>
        
        <p className="small help-text">
          Need help? Contact support@gmaconnect.org.au
        </p>
      </div>
    </div>
  );
}
/*
*Partenr Approval Logic
* Partners will need to be approved by an admin before they are able to login.
* users that are still pending approval or have been rejected will not be unable to login to the system.
* prevent login if user is still pending approval.
* if user is still pending, they will log in, fail the check and be logged out with alert showing their approval is still pending.
*/
const approvalCheck = async (user) => {
  const snap = await getDocs(doc(db, "users", user.uid));
  if (snap.exists()) return;

  const data = snap.data();
  if (data.approvalStatus === "pending") {
    await signOutUser();  //double check signout code from should be same as mobile
    throw new Error("Account pending approval");
  }
  if (data.approvalStatus === "rejected") {
    await signOutUser(); //again check signout code from before
    throw new Error("Account rejected. Please try again or contact support.");
  }
  alert("Your account is now waiting for admin approval.");
}
//login step to check if user approval status is pending, if still pending sign out and show alert from above ^
await approvalCheck(user);
