import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  type Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import type { EventRecord } from "../types/event-types";

function formatWhen(ts: Timestamp | undefined) {
  if (!ts?.toDate) return "—";
  try {
    return ts.toDate().toLocaleString();
  } catch {
    return "—";
  }
}

function canManageEvent(ev: EventRecord, uid: string | undefined, isAdmin: boolean) {
  if (isAdmin) return true;
  if (!uid) return false;
  return ev.submittedBy === uid;
}

export function EventManagePage() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isAdmin) {
        const snap = await getDocs(collection(db, "events"));
        const rows: EventRecord[] = snap.docs.map((d) => ({
          eventId: d.id,
          ...(d.data() as Omit<EventRecord, "eventId">),
        }));
        rows.sort((a, b) => {
          const ta = a.dateTime?.toMillis?.() ?? 0;
          const tb = b.dateTime?.toMillis?.() ?? 0;
          return tb - ta;
        });
        setEvents(rows);
      } else if (user) {
        const q = query(
          collection(db, "events"),
          where("submittedBy", "==", user.uid),
        );
        const snap = await getDocs(q);
        const rows: EventRecord[] = snap.docs.map((d) => ({
          eventId: d.id,
          ...(d.data() as Omit<EventRecord, "eventId">),
        }));
        rows.sort((a, b) => {
          const ta = a.dateTime?.toMillis?.() ?? 0;
          const tb = b.dateTime?.toMillis?.() ?? 0;
          return tb - ta;
        });
        setEvents(rows);
      } else {
        setEvents([]);
      }
    } catch {
      setError("Could not load events.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user]);

  useEffect(() => {
    load();
  }, [load]);

  async function onDelete(ev: EventRecord) {
    if (!canManageEvent(ev, user?.uid, isAdmin)) return;
    const ok = window.confirm(
      `Delete “${ev.title}”? This cannot be undone.`,
    );
    if (!ok) return;
    setBusyId(ev.eventId);
    try {
      await deleteDoc(doc(db, "events", ev.eventId));
      await load();
    } catch {
      setError("Could not delete that event.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page">
      <h1>Manage events</h1>
      <p className="muted">
        {isAdmin
          ? "All events in Firestore. Edit or remove any event."
          : "Events you submitted. Edit details or delete a draft or listing."}
      </p>

      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="centered">
          <div className="spinner" />
        </div>
      ) : events.length === 0 ? (
        <p>No events to show.</p>
      ) : (
        <ul className="approval-list">
          {events.map((ev) => {
            const allowed = canManageEvent(ev, user?.uid, isAdmin);
            return (
              <li key={ev.eventId} className="approval-card">
                <div className="approval-head">
                  <h3>{ev.title}</h3>
                  <span className="muted">{formatWhen(ev.dateTime)}</span>
                </div>
                <p className="approval-desc">{ev.description}</p>
                <p className="muted small">
                  {ev.address} · {ev.category}
                  {ev.approvalStatus ? ` · ${ev.approvalStatus}` : ""}
                </p>
                {allowed && (
                  <div className="event-manage-actions">
                    <Link
                      to={`/events/register/${ev.eventId}`}
                      className="btn-primary btn-inline"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="btn-danger btn-inline"
                      disabled={busyId === ev.eventId}
                      onClick={() => onDelete(ev)}
                    >
                      {busyId === ev.eventId ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
