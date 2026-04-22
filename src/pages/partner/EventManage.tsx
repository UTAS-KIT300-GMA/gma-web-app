import { useEffect, useMemo, useState } from "react";
import { Pencil, Eye, Trash2, Search, X } from "lucide-react";
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
  description?: string;
  address?: string;
  image?: string;
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
    return ts.toDate().toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatTime(ts?: Timestamp | null) {
  if (!ts?.toDate) return "Time not set";

  try {
    return ts.toDate().toLocaleTimeString("en-AU", {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "Time not set";
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

function mapCategoryLabel(event: FirestoreEventRow) {
  return event.category || event.categories?.[0] || "Uncategorised";
}

function mapCategoryClass(category: string) {
  const value = category.toLowerCase();

  if (value.includes("connect") || value.includes("network")) {
    return "partner-event-category networking";
  }

  if (
    value.includes("grow") ||
    value.includes("workshop") ||
    value.includes("career")
  ) {
    return "partner-event-category workshop";
  }

  if (
    value.includes("thrive") ||
    value.includes("community") ||
    value.includes("leadership")
  ) {
    return "partner-event-category community";
  }

  if (value.includes("business") || value.includes("finance")) {
    return "partner-event-category business";
  }

  return "partner-event-category default";
}

export function EventManagePage() {
  const { user, profile } = useAuth();

  const [eventStatus, setEventStatus] = useState("All");
  const [dateRange, setDateRange] = useState("All Time");
  const [searchTerm, setSearchTerm] = useState("");
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

  function clearFilters() {
    setEventStatus("All");
    setDateRange("All Time");
    setSearchTerm("");
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

    if (searchTerm.trim()) {
      const keyword = searchTerm.trim().toLowerCase();

      filtered = filtered.filter((event) => {
        const title = event.title?.toLowerCase() ?? "";
        const category = mapCategoryLabel(event).toLowerCase();
        const address = event.address?.toLowerCase() ?? "";

        return (
          title.includes(keyword) ||
          category.includes(keyword) ||
          address.includes(keyword)
        );
      });
    }

    return filtered;
  }, [events, eventStatus, dateRange, searchTerm]);

  return (
    <div className="page dashboard-page partner-events-page">
      <section className="dashboard-header partner-events-header">
        <div>
          <h1>Event Management</h1>
          <p className="muted dashboard-hero-copy">
            View, track and manage all your submitted events in one place.
          </p>
        </div>
      </section>

      <section className="panel dashboard-panel partner-events-filter-panel">
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

          <label className="field">
            <span>Search</span>
            <div className="partner-events-search">
              <Search size={16} strokeWidth={2} />
              <input
                type="text"
                placeholder="Search by title or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </label>

          <div className="partner-events-filter-actions">
            <button
              type="button"
              className="btn-outline partner-events-clear-btn"
              onClick={clearFilters}
            >
              <X size={16} strokeWidth={2} />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>
      </section>

      <section className="panel dashboard-panel partner-events-table-panel">
        <div className="dashboard-section-head partner-events-table-head">
          <div className="partner-events-heading-group">
            <h2>My Events</h2>
            <span className="partner-events-count-badge">
              {filteredEvents.length}
            </span>
          </div>
        </div>

        <div className="partner-events-table-wrap">
          {loading ? (
            <p className="partner-events-state">Loading events...</p>
          ) : filteredEvents.length === 0 ? (
            <p className="partner-events-state">No events found.</p>
          ) : (
            <table className="partner-events-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Date &amp; Time</th>
                  <th>Category</th>
                  <th>Registrations</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredEvents.map((event) => {
                  const displayStatus = mapStatus(event.eventApprovalStatus);
                  const categoryLabel = mapCategoryLabel(event);

                  return (
                    <tr key={event.id}>
                      <td>
                        <div className="partner-event-cell">
                          <div className="partner-event-thumb">
                            {event.image ? (
                              <img
                                src={event.image}
                                alt={event.title || "Event image"}
                              />
                            ) : (
                              <div className="partner-event-thumb-fallback">
                                {(event.title || "E").charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          <div className="partner-event-info">
                            <strong className="partner-event-title">
                              {event.title || "Untitled event"}
                            </strong>
                            <span className="partner-event-location">
                              {event.address || "No location"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="partner-event-date">
                          <strong>{formatDate(event.dateTime)}</strong>
                          <span>{formatTime(event.dateTime)}</span>
                        </div>
                      </td>

                      <td>
                        <span className={mapCategoryClass(categoryLabel)}>
                          {categoryLabel}
                        </span>
                      </td>

                      <td>
                        <span className="partner-events-registrations">
                          <strong>{event.ticketsSold ?? 0}</strong>
                          <span>/ {event.totalTickets ?? 0}</span>
                        </span>
                      </td>

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