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
import { notifyPartnerEventDecision } from "../../services/notificationService";

/**
 * @summary Converts a Firestore Timestamp to a locale-formatted date/time string.
 * @param ts - The Timestamp to format, or undefined if unavailable.
 */
function formatWhen(ts: Timestamp | undefined) {
  if (!ts?.toDate) return "—";
  try {
    const date = ts.toDate();
    return date
      .toLocaleString("en-AU", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        day: "numeric",
        month: "short",
        year: "numeric",
      });
  } catch {
    return "—";
  }
}

/**
 * @summary Fetches the display name and organisation for a given user UID from Firestore.
 * @param uid - The Firebase Auth UID to look up.
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
 * @summary Renders the admin page listing pending events and providing approve/reject actions.
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

  /**
   * @summary Queries Firestore for events with pending approval status and updates component state.
   */
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

  /**
   * @summary Sets the given event's approval status to approved and refreshes the list.
   * @param ev - The Firestore document ID of the event to approve.
   */
  async function approve(ev: string) {
    setBusyId(ev);
    try {
      const targetEvent = pending.find((item) => item.eventId === ev);
      await updateDoc(doc(db, "events", ev), {
        eventApprovalStatus: "approved",
        rejectionReason: deleteField(),
      });
      if (targetEvent?.submittedBy) {
        await notifyPartnerEventDecision(
          targetEvent.submittedBy,
          ev,
          targetEvent.title,
          true,
        );
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  /**
   * @summary Sets the given event's approval status to rejected with an optional reason.
   * @param ev - The event record to reject.
   */
  async function reject(ev: EventRecord) {
    const reason =
      (rejectReason[ev.eventId] ?? "").trim() || "Rejected by admin";
    setBusyId(ev.eventId);
    try {
      await updateDoc(doc(db, "events", ev.eventId), {
        eventApprovalStatus: "rejected",
        rejectionReason: reason,
      });
      if (ev.submittedBy) {
        await notifyPartnerEventDecision(
          ev.submittedBy,
          ev.eventId,
          ev.title,
          false,
          reason,
        );
      }
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
                  <p className="muted small capitalize">
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
