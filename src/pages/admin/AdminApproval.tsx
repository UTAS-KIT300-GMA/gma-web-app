import { useEffect, useState } from "react";

import {
  getPendingPartnerApprovals,
  approvePartner,
  rejectPartner,
} from "../../services/adminApprovalService";
import type { UserProfile } from "../../types/user-types";
import { notifyPartnerApprovalDecision } from "../../services/notificationService";

/**
 * @summary Renders the admin page for reviewing, approving, or rejecting pending partner applications.
 */
export function AdminApprovalPage() {
  const [partners, setPartners] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      await notifyPartnerApprovalDecision(id, true);
      setPartners((prev) => prev.filter((p) => p.id !== id));
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
      await notifyPartnerApprovalDecision(id, false);
      setPartners((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert("Error rejecting partner");
    }
  };

  if (loading)
    return (
      <div style={{ padding: "20px" }}>
        Searching for pending applications...
      </div>
    );
  if (error)
    return <div style={{ color: "red", padding: "20px" }}>Error: {error}</div>;

  return (
    <section className="page-section user-management-page">
      <div className="user-header">
        <div>
          <h1 className="user-title">Partner Approvals</h1>
          <p className="user-subtitle">
            Review and approve new partner applications.
          </p>
        </div>
      </div>

      <div className="user-management-card">
        <div className="user-management-card-header">
          <h2>Pending Partners</h2>
          <p className="user-management-card-note">{partners.length} pending</p>
        </div>

        {partners.length === 0 ? (
          <p style={{ padding: "20px", color: "#666" }}>
            No users currently waiting for approval.
          </p>
        ) : (
          <div className="user-management-table-wrap">
            <table className="user-management-table">
              <thead>
                <tr>
                  <th>Organisation</th>
                  <th>Representative</th>
                  <th>ABN</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {partners.map((p) => (
                  <tr key={p.id}>
                    <td>{p.orgName || "Unnamed"}</td>

                    <td>
                      {p.firstName} {p.lastName}
                      <br />
                      <span style={{ fontSize: "12px", color: "#777" }}>
                        {p.email}
                      </span>
                    </td>

                    <td>{p.abn || "-"}</td>

                    <td>
                      <span className="user-management-badge pending">
                        Pending
                      </span>
                    </td>

                    <td>
                      <div className="user-management-actions">
                        <button
                          className="user-management-btn primary"
                          onClick={() => handleApprove(p.id)}
                        >
                          Approve
                        </button>

                        <button
                          className="user-management-btn secondary danger"
                          onClick={() => handleReject(p.id)}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
  return (
    <section className="page-section user-management-page">
      <div className="user-header">
        <div>
          <h1 className="user-title">Partner Approvals</h1>
          <p className="user-subtitle">
            Review and approve new partner applications.
          </p>
        </div>
      </div>

      <div className="user-management-card">
        <div className="user-management-card-header">
          <h2>Pending Partners</h2>
          <p className="user-management-card-note">{partners.length} pending</p>
        </div>

        {partners.length === 0 ? (
          <p style={{ padding: "20px", color: "#666" }}>
            No users currently waiting for approval.
          </p>
        ) : (
          <div className="user-management-table-wrap">
            <table className="user-management-table">
              <thead>
                <tr>
                  <th>Organisation</th>
                  <th>Representative</th>
                  <th>ABN</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {partners.map((p) => (
                  <tr key={p.id}>
                    <td>{p.orgName || "Unnamed"}</td>

                    <td>
                      {p.firstName} {p.lastName}
                      <br />
                      <span style={{ fontSize: "12px", color: "#777" }}>
                        {p.email}
                      </span>
                    </td>

                    <td>{p.abn || "-"}</td>

                    <td>
                      <span className="user-management-badge pending">
                        Pending
                      </span>
                    </td>

                    <td>
                      <div className="user-management-actions">
                        <button
                          className="user-management-btn primary"
                          onClick={() => handleApprove(p.id)}
                        >
                          Approve
                        </button>

                        <button
                          className="user-management-btn secondary danger"
                          onClick={() => handleReject(p.id)}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
