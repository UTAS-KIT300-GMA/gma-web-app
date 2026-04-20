import { useEffect, useMemo, useState } from "react";
import { Pencil, Eye, Trash2 } from "lucide-react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../hooks/useAuth";
import { Link } from "react-router-dom";

type FirestoreEventRow = {
  id: string;
  title: string;
  dateTime?: Timestamp | null;
  category?: string;
  categories?: string[];
  ticketsSold?: number;
  totalTickets?: number;
  eventApprovalStatus?: "draft" | "pending" | "approved" | "rejected";
  submittedBy?: string;
};

function formatDate(ts?: Timestamp | null) {
  if (!ts?.toDate) return "—";
  try {
    return ts.toDate().toLocaleDateString();
  } catch {
    return "—";
  }
}

function mapStatus(status?: string) {
  switch (status) {
    case "draft":
      return "Draft";
    case "pending":
      return "Pending";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return "Unknown";
  }
}

export function EventManagePage() {
  const { user, profile } = useAuth();
  const [eventStatus, setEventStatus] = useState("All");
  const [dateRange, setDateRange] = useState("All Time");
  const [events, setEvents] = useState<FirestoreEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvents() {
      if (!user) {
        setEvents([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const partnerId = profile?.partnerId ?? user.uid;

        const q = query(
          collection(db, "events"),
          where("submittedBy", "==", partnerId),
        );

        const snap = await getDocs(q);

        const rows: FirestoreEventRow[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<FirestoreEventRow, "id">),
        }));

        rows.sort((a, b) => {
          const ta = a.dateTime?.toMillis?.() ?? 0;
          const tb = b.dateTime?.toMillis?.() ?? 0;
          return tb - ta;
        });

        setEvents(rows);
      } catch (error) {
        console.error("Failed to load partner events:", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [user, profile]);

  async function handleDelete(eventId: string, title: string) {
    const ok = window.confirm(`Delete "${title}"? This cannot be undone.`);
    if (!ok) return;

    setBusyId(eventId);
    try {
      await deleteDoc(doc(db, "events", eventId));
      setEvents((prev) => prev.filter((event) => event.id !== eventId));
    } catch (error) {
      console.error("Failed to delete event:", error);
      alert("❌ Failed to delete event");
    } finally {
      setBusyId(null);
    }
  }

  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    if (eventStatus !== "All") {
      filtered = filtered.filter(
        (event) => mapStatus(event.eventApprovalStatus) === eventStatus,
      );
    }

    const now = new Date();

    if (dateRange === "Last 7 Days") {
      const cutoff = new Date();
      cutoff.setDate(now.getDate() - 7);
      filtered = filtered.filter((event) => {
        const date = event.dateTime?.toDate?.();
        return date ? date >= cutoff : false;
      });
    }

    if (dateRange === "Last 30 Days") {
      const cutoff = new Date();
      cutoff.setDate(now.getDate() - 30);
      filtered = filtered.filter((event) => {
        const date = event.dateTime?.toDate?.();
        return date ? date >= cutoff : false;
      });
    }

    if (dateRange === "This Month") {
      filtered = filtered.filter((event) => {
        const date = event.dateTime?.toDate?.();
        return date
          ? date.getMonth() === now.getMonth() &&
              date.getFullYear() === now.getFullYear()
          : false;
      });
    }

    return filtered;
  }, [events, eventStatus, dateRange]);

  return (
    <div className="page dashboard-page partner-events-page">
      <section className="dashboard-header">
        <h1>Event Management</h1>
        <p className="muted dashboard-hero-copy">
          View and manage your submitted events.
        </p>
      </section>

      <section className="panel dashboard-panel">
        <div className="dashboard-section-head">
          <div>
            <h2>Filter Events</h2>
          </div>
        </div>

        <div className="form-grid partner-events-filter-grid">
          <label className="field">
            <span>Event Status</span>
            <select
              value={eventStatus}
              onChange={(e) => setEventStatus(e.target.value)}
            >
              <option>All</option>
              <option>Draft</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
          </label>

          <label className="field">
            <span>Date Range</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option>All Time</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Month</option>
            </select>
          </label>
        </div>
      </section>

      <section className="panel dashboard-panel">
        <div className="dashboard-section-head">
          <div>
            <h2>Event Table</h2>
          </div>
        </div>

        <div className="partner-events-table-wrap">
          {loading ? (
            <p>Loading events...</p>
          ) : filteredEvents.length === 0 ? (
            <p>No events found.</p>
          ) : (
            <table className="partner-events-table">
              <thead>
                <tr>
                  <th>Event Title</th>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Registrations</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredEvents.map((event) => {
                  const displayStatus = mapStatus(event.eventApprovalStatus);

                  return (
                    <tr key={event.id}>
                      <td>{event.title || "Untitled event"}</td>
                      <td>{formatDate(event.dateTime)}</td>
                      <td>
                        {event.category ||
                          event.categories?.[0] ||
                          "Uncategorised"}
                      </td>
                      <td>{event.ticketsSold ?? 0}</td>
                      <td>
                        <span
                          className={`partner-event-status partner-event-status-${displayStatus.toLowerCase()}`}
                        >
                          {displayStatus}
                        </span>
                      </td>
                      <td>
                        <div className="partner-events-actions">
                          <Link
                            to={`/partner/events/register/${event.id}`}
                            className="icon-action-btn"
                            aria-label="Edit event"
                            title="Edit"
                          >
                            <Pencil size={16} strokeWidth={2} />
                          </Link>

                          <button
                            type="button"
                            className="icon-action-btn"
                            aria-label="View event details"
                            title="View Details"
                            onClick={() =>
                              alert(`View details for "${event.title}"`)
                            }
                          >
                            <Eye size={16} strokeWidth={2} />
                          </button>

                          <button
                            type="button"
                            className="icon-action-btn danger"
                            aria-label="Delete event"
                            title="Delete"
                            disabled={busyId === event.id}
                            onClick={() =>
                              handleDelete(event.id, event.title || "Untitled")
                            }
                          >
                            <Trash2 size={16} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}