import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "../../firebase";
import type { EventRecord } from "../../types/event-types";
import { notifyUsersEventCancelled, notifyPartnerEventCancelled, getEventInterestedUserIds } from "../../services/notificationService";
import { Tag } from "lucide-react";

type UpcomingEvent = EventRecord & { partnerName: string; daysAway: number };

function formatWhen(ts: Timestamp | undefined) {
  if (!ts?.toDate) return "—";
  try {
    return ts.toDate().toLocaleString("en-AU", {
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

function daysUntil(ts: Timestamp | undefined): number {
  if (!ts?.toDate) return Infinity;
  const ms = ts.toDate().getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

async function fetchPartnerName(uid?: string): Promise<string> {
  if (!uid) return "Unknown partner";
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return "Unknown partner";
    const d = snap.data();
    return d.orgName || `${d.firstName ?? ""} ${d.lastName ?? ""}`.trim() || "Unknown partner";
  } catch {
    return "Unknown partner";
  }
}


function DaysAwayBadge({ days }: { days: number }) {
  const label =
    days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days away`;
  return (
    <span className={`days-away-badge ${days <= 3 ? "urgent" : "soon"}`}>
      {label}
    </span>
  );
}

function EventSection({
  title,
  events,
  emptyMessage,
  busyId,
  onDelete,
}: {
  title: string;
  events: UpcomingEvent[];
  emptyMessage: string;
  busyId: string | null;
  onDelete: (ev: UpcomingEvent) => void;
}) {
  return (
    <section className="upcoming-section">
      <h2>{title}</h2>
      {events.length === 0 ? (
        <p className="muted">{emptyMessage}</p>
      ) : (
        <ul className="approval-list">
          {events.map((ev) => (
            <li key={ev.eventId} className="approval-card">
              <div className="approval-inner">
                <div className="approval-img">
                  {ev.image ? (
                    <img src={ev.image} alt={ev.title} />
                  ) : (
                    <div className="approval-img-placeholder" />
                  )}
                </div>

                <div className="approval-content">
                  <div className="approval-head">
                    <h3>{ev.title}</h3>
                    <DaysAwayBadge days={ev.daysAway} />
                  </div>
                  <p className="approval-desc">{ev.description}</p>
                  <span className="muted small">
                    Date & Time: {formatWhen(ev.dateTime)}
                  </span>
                  <p className="muted small capitalize">
                    Location: {ev.address} · Category: {ev.category} · Partner:{" "}
                    <strong>{ev.partnerName}</strong>
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
                  <div className="approval-actions event-manage-actions">
                    <Link
                      to={`/admin/events/edit/${ev.eventId}`}
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
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * @summary Embeddable view listing approved events coming up within 5 days,
 * split into a "within 3 days" section and a "4–5 days" section.
 */
export function UpcomingEventsView() {
  const [events3, setEvents3] = useState<UpcomingEvent[]>([]);
  const [events5, setEvents5] = useState<UpcomingEvent[]>([]);
  const [eventsAhead, setEventsAhead] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function onDelete(ev: UpcomingEvent) {
    if (!window.confirm(`Delete "${ev.title}"? This cannot be undone. All users that booked this event will be notified.`)) return;
    setBusyId(ev.eventId);
    try {
      const attendeeIds = await getEventInterestedUserIds(ev.eventId);
      if (attendeeIds.length > 0) {
        await notifyUsersEventCancelled(attendeeIds, ev.eventId, ev.title);
      }
      if (ev.submittedBy) {
        await notifyPartnerEventCancelled(ev.submittedBy, ev.eventId, ev.title);
      }
      await deleteDoc(doc(db, "events", ev.eventId));
      const remove = (prev: UpcomingEvent[]) => prev.filter((e) => e.eventId !== ev.eventId);
      setEvents3(remove);
      setEvents5(remove);
      setEventsAhead(remove);
    } finally {
      setBusyId(null);
    }
  }
 
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      // Fetch all approved events from Firestore that are happening today or in the future,
      // then enrich with partner name and days away, then split into the 3 sections: 0–3 days, 4–5 days, and 6+ days.
      try {
        const now = Timestamp.now();
        const q = query(
          collection(db, "events"),
          where("eventApprovalStatus", "==", "approved"),
          where("dateTime", ">=", now),
        );
        const snap = await getDocs(q);

        const raw: EventRecord[] = snap.docs.map((d) => ({
          eventId: d.id,
          ...(d.data() as Omit<EventRecord, "eventId">),
        }));

        const enriched: UpcomingEvent[] = await Promise.all(
          raw.map(async (ev) => ({
            ...ev,
            partnerName: await fetchPartnerName(ev.submittedBy),
            daysAway: daysUntil(ev.dateTime),
          })),
        );

        enriched.sort((a, b) => a.daysAway - b.daysAway);

        setEvents3(enriched.filter((e) => e.daysAway <= 3));
        setEvents5(enriched.filter((e) => e.daysAway > 3 && e.daysAway <= 5));
        setEventsAhead(enriched.filter((e) => e.daysAway > 5));
      } catch (err: any) {
        setError(err?.message ?? "Failed to load upcoming events.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="centered">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return <p className="upcoming-error">{error}</p>;
  }

  return (
    <>
      <EventSection
        title="Within 3 days"
        events={events3}
        emptyMessage="No events in the next 3 days."
        busyId={busyId}
        onDelete={onDelete}
      />
      <EventSection
        title="In 4–5 days"
        events={events5}
        emptyMessage="No events in the 4–5 day window."
        busyId={busyId}
        onDelete={onDelete}
      />
      <EventSection
        title="All upcoming events"
        events={eventsAhead}
        emptyMessage="No further upcoming events."
        busyId={busyId}
        onDelete={onDelete}
      />
    </>
  );
}
