import { useState } from "react";
import { Pencil, Eye, Trash2 } from "lucide-react";

type EventRow = {
  id: string;
  title: string;
  date: string;
  category: string;
  registrations: number;
  status: "Published" | "Approved" | "Pending";
};

const mockEvents: EventRow[] = [
  {
    id: "1",
    title: "Community Outreach Program",
    date: "2024-07-15",
    category: "Connect",
    registrations: 120,
    status: "Published",
  },
  {
    id: "2",
    title: "Startup Pitch Competition",
    date: "2024-08-01",
    category: "Grow",
    registrations: 85,
    status: "Approved",
  },
  {
    id: "3",
    title: "Wellness Workshop Series",
    date: "2024-09-10",
    category: "Thrive",
    registrations: 50,
    status: "Pending",
  },
];

export function EventManagePage() {
  const [eventStatus, setEventStatus] = useState("All");
  const [dateRange, setDateRange] = useState("All Time");

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
              <option>Published</option>
              <option>Approved</option>
              <option>Pending</option>
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
              {mockEvents.map((event) => (
                <tr key={event.id}>
                  <td>{event.title}</td>
                  <td>{event.date}</td>
                  <td>{event.category}</td>
                  <td>{event.registrations}</td>
                  <td>
                    <span
                      className={`partner-event-status partner-event-status-${event.status.toLowerCase()}`}
                    >
                      {event.status}
                    </span>
                  </td>
                  <td>
                      <div className="partner-events-actions">
                        <button
                            type="button"
                            className="icon-action-btn"
                            aria-label="Edit event"
                            title="Edit"
                        >
                            <Pencil size={16} strokeWidth={2} />
                          </button>

                          <button
                              type="button"
                              className="icon-action-btn"
                              aria-label="View event details"
                              title="View Details"
                          >
                              <Eye size={16} strokeWidth={2} />
                            </button>

                            <button
                                type="button"
                                className="icon-action-btn danger"
                                aria-label="Delete event"
                                title="Delete"
                            >
                                <Trash2 size={16} strokeWidth={2} />
                              </button>
                          </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}