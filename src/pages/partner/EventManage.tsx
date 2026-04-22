import { useEffect, useMemo, useState } from "react";
import { Pencil, Eye, Trash2, Search, X } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import {
  deletePartnerEvent,
  getPartnerEvents,
  getRegistrationCount,
  type PartnerEventRow,
} from "../../services/partnerEventService";
import { useAuth } from "../../hooks/useAuth";
import { EventPreviewModal } from "../../components/EventPreviewModal";
import { Link } from "react-router-dom";

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

function mapCategoryLabels(event: PartnerEventRow) {
  const categories = [
    ...(event.category ? [event.category] : []),
    ...(event.categories ?? []),
  ];

  const cleaned = categories
    .map((category) => category?.trim())
    .filter(Boolean);

  const unique = [...new Set(cleaned)];

  return unique.length ? unique : ["Uncategorised"];
}

function mapCategoryClass(category: string) {
  const value = category.toLowerCase();

  if (value.includes("connect") || value.includes("network")) {
    return "partner-event-category connect";
  }

  if (
    value.includes("growth") ||
    value.includes("grow") ||
    value.includes("workshop") ||
    value.includes("career")
  ) {
    return "partner-event-category growth";
  }

  if (
    value.includes("thrive") ||
    value.includes("community") ||
    value.includes("leadership")
  ) {
    return "partner-event-category thrive";
  }

  return "partner-event-category default";
}

/**
 * @summary Renders the partner event management table with filter controls for status and date range.
 */
export function EventManagePage() {
  const { user, profile } = useAuth();

  const [eventStatus, setEventStatus] = useState("All statuses");
  const [dateRange, setDateRange] = useState("All time");
  const [searchTerm, setSearchTerm] = useState("");
  const [events, setEvents] = useState<PartnerEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [selectedEvent, setSelectedEvent] = useState<PartnerEventRow | null>(
    null,
  );
  const [showPreview, setShowPreview] = useState(false);

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

        const rows = await getPartnerEvents(partnerId);
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
      await deletePartnerEvent(eventId);
      setEvents((prev) => prev.filter((event) => event.id !== eventId));
    } catch (error) {
      console.error("Failed to delete event:", error);
      alert("❌ Failed to delete event");
    } finally {
      setBusyId(null);
    }
  }

  function clearFilters() {
    setEventStatus("All statuses");
    setDateRange("All time");
    setSearchTerm("");
  }

  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    if (eventStatus !== "All statuses") {
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
        const categories = mapCategoryLabels(event).join(" ").toLowerCase();
        const address = event.address?.toLowerCase() ?? "";

        return (
          title.includes(keyword) ||
          categories.includes(keyword) ||
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
        <div className="partner-events-toolbar">
          <div className="partner-events-toolbar-search">
            <Search size={18} strokeWidth={2} />
            <input
              type="text"
              placeholder="Search by title, description or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="partner-events-toolbar-selects">
            <select
              value={eventStatus}
              onChange={(e) => setEventStatus(e.target.value)}
              className="partner-events-toolbar-select"
            >
              <option>All statuses</option>
              <option>Draft</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="partner-events-toolbar-select"
            >
              <option>All time</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Month</option>
            </select>

            <button
              type="button"
              className="partner-events-toolbar-clear"
              onClick={clearFilters}
              aria-label="Clear filters"
              title="Clear filters"
            >
              <X size={16} strokeWidth={2} />
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
                  const categoryLabels = mapCategoryLabels(event);

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
                        <div className="partner-event-categories">
                          {/* First category */}
                          <span className={mapCategoryClass(categoryLabels[0])}>
                            {categoryLabels[0]}
                          </span>

                          {/* Remaining count */}
                          {categoryLabels.length > 1 && (
                            <span className="partner-event-category more">
                              +{categoryLabels.length - 1}
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span className="partner-events-registrations">
                          <strong>{getRegistrationCount(event)}</strong>
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
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowPreview(true);
                            }}
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
      <EventPreviewModal
        open={showPreview}
        onClose={() => {
          setShowPreview(false);
          setSelectedEvent(null);
        }}
        event={
          selectedEvent
            ? {
                title: selectedEvent.title,
                description: selectedEvent.description,
                address: selectedEvent.address,
                image: selectedEvent.image,
                dateTime: selectedEvent.dateTime,
              }
            : null
        }
        actionLabel="Close"
      />
    </div>
  );
}
