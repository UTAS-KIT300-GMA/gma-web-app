import { useEffect, useState } from "react";
import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import type { EventRecord } from "../../types/event-types";
import { Tag } from "lucide-react";

/**
 * Helper to format Firestore Timestamp to readable string. Returns "—" if invalid or missing.
 *
 * @param ts
 * @returns
 */
function formatWhen(ts: Timestamp | undefined) {
  if (!ts?.toDate) return "—";
  try {
    return ts.toDate().toLocaleString();
  } catch {
    return "—";
  }
}

/**
 * Helper to get user name and organization from uid. Returns email or uid as fallback if user not found or error occurs.
 *
 * @param uid
 * @returns
 */
async function fetchUserInfo(
  uid: string,
): Promise<{ name: string; org: string }> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    console.log("fetchUserInfo:", uid, "exists:", snap.exists(), snap.data()); // 👈 add this

    if (snap.exists()) {
      const data = snap.data();
      const name = data.firstName
        ? `${data.firstName} ${data.lastName ?? ""}`.trim()
        : (data.email ?? uid);
      const org = data.orgName ?? "";
      return { name, org };
    }
    return { name: uid, org: "" };
  } catch {
    return { name: uid, org: "" };
  }
}

/**
 * Admin page to approve or reject pending events.
 * Lists events with `eventApprovalStatus == "pending"`.
 * Admin can approve (sets status to "approved") or reject (sets status to "rejected" with optional reason).
 */
export function EventApprovalPage() {
  const [pending, setPending] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<
    Record<string, { name: string; org: string }>
  >({});

  const load = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "events"),
        where("eventApprovalStatus", "==", "pending"),
      );
      const snap = await getDocs(q);
      console.log(
        "Fetched events:",
        snap.size,
        snap.docs.map((d) => d.data()),
      ); // 👈 add this

      const rows: EventRecord[] = snap.docs.map((d) => ({
        eventId: d.id,
        ...(d.data() as Omit<EventRecord, "eventId">),
      }));
      setPending(rows);
    } catch (err) {
      console.error("Load error:", err); // 👈 add this
      setPending([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Fetch display names for all submittedBy user IDs
  useEffect(() => {
    if (pending.length === 0) return;

    const fetchAll = async () => {
      for (const ev of pending) {
        if (ev.submittedBy && !userInfo[ev.submittedBy]) {
          const info = await fetchUserInfo(ev.submittedBy);
          setUserInfo((prev) => ({ ...prev, [ev.submittedBy!]: info }));
        }
      }
    };

    fetchAll();
  }, [pending]);

  async function approve(ev: string) {
    setBusyId(ev);
    try {
      await updateDoc(doc(db, "events", ev), {
        eventApprovalStatus: "approved",
        rejectionReason: deleteField(),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function reject(ev: EventRecord) {
    const reason =
      (rejectReason[ev.eventId] ?? "").trim() || "Rejected by admin";
    setBusyId(ev.eventId);
    try {
      await updateDoc(doc(db, "events", ev.eventId), {
        eventApprovalStatus: "rejected",
        rejectionReason: reason,
      });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page">
      <h1>Approve events</h1>
      <p className="muted">
        Lists <code>events</code> with{" "}
        <code>eventApprovalStatus == &quot;pending&quot;</code>.
      </p>

      {loading ? (
        <div className="centered">
          <div className="spinner" />
        </div>
      ) : pending.length === 0 ? (
        <p>No pending events.</p>
      ) : (
        <ul className="approval-list">
          {pending.map((ev) => (
            <li key={ev.eventId} className="approval-card">
              <div className="approval-inner">
                {/* Left — image */}
                <div className="approval-img">
                  {ev.image ? (
                    <img src={ev.image} alt={ev.title} />
                  ) : (
                    <div className="approval-img-placeholder" />
                  )}
                </div>

                {/* Right — details + actions */}
                <div className="approval-content">
                  <div className="approval-head">
                    <h3>{ev.title}</h3>
                  </div>
                  <p className="approval-desc">{ev.description}</p>
                  <span className="muted small">
                    Date & Time: {formatWhen(ev.dateTime)}
                  </span>
                  <p className="muted small">
                    Location: {ev.address} · Category: {ev.category} · by{" "}
                    {ev.submittedBy
                      ? userInfo[ev.submittedBy]?.name &&
                        userInfo[ev.submittedBy].name !== ev.submittedBy
                        ? `${userInfo[ev.submittedBy].name}${userInfo[ev.submittedBy]?.org ? ` (${userInfo[ev.submittedBy].org})` : ""}`
                        : "Unknown user"
                      : "Unknown user"}
                  </p>
                  {ev.interestTags && ev.interestTags.length > 0 && (
                    <p className="tags-inline">
                      {ev.interestTags.map((t) => (
                        <span key={t} className="mini-tag">
                          <Tag size={12} /> {t}
                        </span>
                      ))}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="approval-actions">
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={busyId === ev.eventId}
                      onClick={() => approve(ev.eventId)}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="btn-danger"
                      disabled={busyId === ev.eventId}
                      onClick={() => setRejectingId(ev.eventId)}
                    >
                      Reject
                    </button>
                  </div>

                  {/* Rejection input shown only when reject clicked */}
                  <div
                    className={`rejection-input ${rejectingId === ev.eventId ? "visible" : ""}`}
                  >
                    <textarea
                      placeholder="Rejection note (optional)"
                      value={rejectReason[ev.eventId] ?? ""}
                      onChange={(e) =>
                        setRejectReason((r) => ({
                          ...r,
                          [ev.eventId]: e.target.value,
                        }))
                      }
                      rows={3}
                    />
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => {
                        reject(ev);
                        setRejectingId(null);
                      }}
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => setRejectingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
