import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getPendingPartnerApprovals,
  approvePartner,
  rejectPartner
} from "../../services/adminApprovalService";
import type { UserProfile } from "../../types/user-types";

/**
 * @summary Renders the admin page for reviewing, approving, or rejecting pending partner applications.
 */
export function AdminApprovalPage() {
  const [partners, setPartners] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    /**
     * @summary Fetches all pending partner profiles from Firestore and populates local state.
     */
    async function loadData() {
      try {
        setLoading(true);
        const data = await getPendingPartnerApprovals();
        setPartners(data);
      } catch (err: any) {
        setError(err.message || "Failed to load partners.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  /**
   * @summary Calls the approval service for the given partner and removes them from the pending list.
   * @param id - The Firestore document ID of the partner to approve.
   */
  const handleApprove = async (id: string) => {
    try {
      await approvePartner(id);
      setPartners(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert("Error approving partner");
    }
  };

  /**
   * @summary Calls the rejection service for the given partner and removes them from the pending list.
   * @param id - The Firestore document ID of the partner to reject.
   */
  const handleReject = async (id: string) => {
    try {
      await rejectPartner(id);
      setPartners(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert("Error rejecting partner");
    }
  };

  if (loading) return <div style={{ padding: "20px" }}>Searching for pending applications...</div>;
  if (error) return <div style={{ color: "red", padding: "20px" }}>Error: {error}</div>;

  /**
   * @summary Navigates back to the previous page in the browser history.
   */
  const goBack = () => {
    navigate(-1);
  };
  


  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ borderBottom: "2px solid #eee", paddingBottom: "10px" }}>
        Admin: Partner Approvals
      </h1>

      <button onClick={goBack} style={{ marginBottom: "20px" }}>
      Go Back
    </button>

      {partners.length === 0 ? (
        <p style={{ marginTop: "20px", color: "#666" }}>
          No users currently waiting for approval.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "15px", marginTop: "20px" }}>
          {partners.map((p) => (
            <div
              key={p.id}
              style={{
                border: "1px solid #ddd",
                padding: "20px",
                borderRadius: "8px",
                backgroundColor: "#f9f9f9"
              }}
            >
              <div style={{ marginBottom: "15px" }}>
                <h3 style={{ margin: "0 0 5px 0" }}>{p.orgName || "Unnamed Org"}</h3>
                <p style={{ margin: "0", fontSize: "14px", color: "#555" }}>
                  <strong>Representative:</strong> {p.firstName} {p.lastName} ({p.email})
                </p>
                <p style={{ margin: "0", fontSize: "14px", color: "#555" }}>
                  <strong>ABN:</strong> {p.abn} | <strong>UID:</strong> {p.id}
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => handleApprove(p.id)}
                  style={{
                    backgroundColor: "#2ecc71", color: "white", border: "none",
                    padding: "8px 16px", borderRadius: "4px", cursor: "pointer"
                  }}
                >
                  Approve Partner
                </button>
                <button
                  onClick={() => handleReject(p.id)}
                  style={{
                    backgroundColor: "#e74c3c", color: "white", border: "none",
                    padding: "8px 16px", borderRadius: "4px", cursor: "pointer"
                  }}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}