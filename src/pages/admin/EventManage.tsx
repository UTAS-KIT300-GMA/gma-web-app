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
import { db } from "../../firebase";
import { useAuth } from "../../hooks/useAuth";
import type { EventRecord } from "../../types/event-types";
import { Search } from "lucide-react";

/**
 * Helper to format Firestore Timestamp to readable string. Returns "—" if invalid or missing.
 * 
 * @param ts 
 * @returns 
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
      })
  } catch {
    return "—";
  }
}

/**
 * Helper function to determine if the current user can manage (edit/delete) a given event. Admins can manage all events, partners can only manage their own events.
 *
 * @param ev
 * @param uid
 * @param isAdmin
 * @returns
 */
function canManageEvent(
  ev: EventRecord,
  uid: string | undefined,
  isAdmin: boolean,
) {
  if (isAdmin) return true;
  if (!uid) return false;
  return ev.submittedBy === uid;
}

/**
 * Admin page to view and manage events. Admins see all events, partners see only their own.
 *
 * @returns
 */
export function EventManagePage() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isAdmin) {
        const q = query(
          collection(db, "events"),
          where("eventApprovalStatus", "==", "approved"),
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

  // Derive unique categories from loaded events
  const categories = [
    "all",
    ...Array.from(new Set(events.map((e) => e.category).filter(Boolean))),
  ];

  // Filter events based on search and filters
  const filtered = events.filter((ev) => {
    const matchesSearch =
      search === "" ||
      ev.title?.toLowerCase().includes(search.toLowerCase()) ||
      ev.description?.toLowerCase().includes(search.toLowerCase()) ||
      ev.address?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || ev.eventApprovalStatus === filterStatus;

    const matchesCategory =
      filterCategory === "all" || ev.category === filterCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  async function onDelete(ev: EventRecord) {
    if (!canManageEvent(ev, user?.uid, isAdmin)) return;
    const ok = window.confirm(`Delete “${ev.title}”? This cannot be undone.`);
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

      {/* Search and filters */}
      <div className="event-manage-controls">
        <div className="event-manage-search">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            placeholder="Search by title, description or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="event-manage-filters">
          <select
            aria-label="Filter events by approval status"
            title="Filter events by approval status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            aria-label="Filter events by category"
            title="Filter events by category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "all" ? "All categories" : cat}
              </option>
            ))}
          </select>
        </div> 
      </div>

      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="centered">
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <p>No events to show.</p>
      ) : (
        <ul className="approval-list">
          {filtered.map((ev) => {
            const allowed = canManageEvent(ev, user?.uid, isAdmin);
            return (
              <li key={ev.eventId} className="approval-card event-manage-card">
                  <div className="approval-inner">
                    <div className="approval-img">
                      {ev.image ? (
                        <img
                          src={ev.image}
                          alt={ev.title}
                          onError={(e) =>
                            (e.currentTarget.style.display = "none")
                          }
                        />
                      ) : (
                        <div className="approval-img-placeholder" />
                      )}
                    </div>

                    <div className="approval-content event-manage-content">
                      <div className="approval-head">
                        <h3>{ev.title}</h3>
                        <span className="muted">{formatWhen(ev.dateTime)}</span>
                      </div>
                      <p className="approval-desc">{ev.description}</p>
                      <p className="muted small capitalize">
                        {ev.address} · {ev.category}
                        {ev.eventApprovalStatus
                          ? ` · ${ev.eventApprovalStatus}`
                          : ""}
                      </p>

                      {allowed && (
                        <div className="approval-actions event-manage-actions">
                          <Link
                            to={`/partner/events/register/${ev.eventId}`}
                            className="btn-secondary"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            className="btn-danger"
                            disabled={busyId === ev.eventId}
                            onClick={() => onDelete(ev)}
                          >
                            {busyId === ev.eventId ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      )}
                    </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
