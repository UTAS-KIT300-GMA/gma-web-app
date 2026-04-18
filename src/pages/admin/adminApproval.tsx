import { useAuth } from "../../hooks/useAuth";
import { useState, useEffect } from "react";
import { collection, deleteDoc, doc, getDocs, query, updateDoc, where, } from "firebase/firestore";
import { db } from "../../firebase";

/**
 * @summary The "Waiting Room" for new Partners.
 * Triggered when email is verified but status is still 'pending_approval'.
 */
export function AdminApprovalPage() {
  const { profile, signOutUser } = useAuth();
  const [pendingPartners, setPendingPartners] = useState<user[]>([]);
  type user = {
    id: string;
    firstName: string;
    approvalStatus: string;
    role: string;
    status: string;
  }
  

  //identify admins from pending partners.
  const isAdmin = profile?.role === "admin";

  // pending approval page code.  first build array of pending users.
  useEffect(() => {
    const getPendingPartnerApprovals = async () => {
      const q = query(
        collection(db, "users"),
        where("status", "==", "pending_approval"),
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as user[];
    };

    const fetchUsers = async () => {
      try {
        const users = await getPendingPartnerApprovals();
        setPendingPartners(users);
      } catch (error) {
        console.error("Error fetching pending partners:", error);
      }
    };
    fetchUsers();
  }, []);
  
  //Pending Users are then Approved or Rejected by admin when admin clicks approval button.
  const approvePartner = async (userId: string) => { //approval process
    try{  
        await updateDoc(doc(db, "users", userId), {
          approvalStatus: "approved",
      });
    }
    catch (err) {
      console.error("Approve user Error:", err);
    }
  };
  
  const rejectPartner = async (userId: string) => { //rejection process
    try{  
        await updateDoc(doc(db, "users", userId), {
          approvalStatus: "rejected",
      });
    }
    catch (err) {
      console.error("Reject user Error:", err);
    }
  };
  

  // End of admin Panel approve and reject logic

  if (!isAdmin) {
  return <p>Access denied</p>;
}

return (
  <div style={{ padding: "20px" }}>
    <h2>Admin Dashboard</h2>

    <button onClick={signOutUser} style={{ marginBottom: "20px" }}>
      Sign Out
    </button>

    <h3>Pending Approvals</h3>

    {pendingPartners.length === 0 ? (
      <p>No pending users</p>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {pendingPartners.map((user) => (
          <div
            key={user.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* User Info */}
            <div>
              <p><strong>{user.firstName}</strong></p>
              <p>Role: {user.role}</p>
              <p>Status: {user.approvalStatus}</p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => approvePartner(user.id)}
                style={{
                  backgroundColor: "green",
                  color: "white",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Approve
              </button>

              <button
                onClick={() => rejectPartner(user.id)}
                style={{
                  backgroundColor: "red",
                  color: "white",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
};

/*
*Partenr Approval Logic
* Partners will need to be approved by an admin before they are able to login.
* users that are still pending approval or have been rejected will not be unable to login to the system.
* prevent login if user is still pending approval.
* if user is still pending, they will log in, fail the check and be logged out with alert showing their approval is still pending.

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
*/