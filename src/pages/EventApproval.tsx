import { useEffect, useState } from "react";
import {
  collection,
  deleteField,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { EventRecord } from "../types/event-types";

function formatWhen(ts: Timestamp | undefined) {
  if (!ts?.toDate) return "—";
  try {
    return ts.toDate().toLocaleString();
  } catch {
    return "—";
  }
}

export function EventApprovalPage() {
  const [pending, setPending] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "events"),
        where("approvalStatus", "==", "pending"),
      );
      const snap = await getDocs(q);
      const rows: EventRecord[] = snap.docs.map((d) => ({
        eventId: d.id,
        ...(d.data() as Omit<EventRecord, "eventId">),
      }));
      setPending(rows);
    } catch {
      setPending([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  async function approve(ev: string) {
    setBusyId(ev);
    try {
      await updateDoc(doc(db, "events", ev), {
        approvalStatus: "approved",
        rejectionReason: deleteField(),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function reject(ev: EventRecord) {
    const reason = (rejectReason[ev.eventId] ?? "").trim() || "Rejected by admin";
    setBusyId(ev.eventId);
    try {
      await updateDoc(doc(db, "events", ev.eventId), {
        approvalStatus: "rejected",
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
        Lists <code>events</code> with <code>approvalStatus == &quot;pending&quot;</code>.
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
              <div className="approval-head">
                <h3>{ev.title}</h3>
                <span className="muted">{formatWhen(ev.dateTime)}</span>
              </div>
              <p className="approval-desc">{ev.description}</p>
              <p className="muted small">
                {ev.address} · {ev.category} · by {ev.submittedBy ?? "—"}
              </p>
              {ev.interestTags && ev.interestTags.length > 0 && (
                <p className="tags-inline">
                  {ev.interestTags.map((t) => (
                    <span key={t} className="mini-tag">
                      {t}
                    </span>
                  ))}
                </p>
              )}
              <div className="approval-actions">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busyId === ev.eventId}
                  onClick={() => approve(ev.eventId)}
                >
                  Approve
                </button>
                <input
                  type="text"
                  placeholder="Rejection note (optional)"
                  value={rejectReason[ev.eventId] ?? ""}
                  onChange={(e) =>
                    setRejectReason((r) => ({ ...r, [ev.eventId]: e.target.value }))
                  }
                  disabled={busyId === ev.eventId}
                />
                <button
                  type="button"
                  className="btn-danger"
                  disabled={busyId === ev.eventId}
                  onClick={() => reject(ev)}
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
