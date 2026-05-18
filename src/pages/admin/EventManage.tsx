import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  type Timestamp,
} from "firebase/firestore";
import { Pencil, Search, Trash2 } from "lucide-react";
import { db } from "../../firebase";
import { useAuth } from "../../hooks/useAuth";
import type { EventRecord } from "../../types/event-types";
import {
  getEventInterestedUserIds,
  notifyPartnerEventCancelled,
  notifyUsersEventCancelled,
} from "../../services/notificationService";
import {
  getEventAttendees,
  getRegistrationCount,
} from "../../services/partnerEventService";
import { UpcomingEventsView } from "./EventListNoti";

type ContentTab = "events" | "learning" | "upcoming";

type AdminEventRow = EventRecord & {
  organisationName?: string;
};

type AdminEventSortKey =
  | "event"
  | "dateTime"
  | "category"
  | "registrations"
  | "organisation";

type SortDirection = "asc" | "desc";

type SubmitterInfo = {
  organisationName: string;
  role?: string;
};

type LearningVideoRecord = {
  id: string;
  title?: string;
  description?: string;
  duration?: string;
  accessType?: "free" | "paid";
  cloudinaryPublicId?: string;
  fileId?: string;
  thumbnailUrl?: string;
  category?: string;
  categories?: string[];
  interestTags?: string[];
  status?: "draft" | "published";
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

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

function canManageEvent(
  ev: EventRecord,
  uid: string | undefined,
  isAdmin: boolean,
) {
  if (isAdmin) return true;
  if (!uid) return false;
  return ev.submittedBy === uid;
}

function getCategoryLabels(event: AdminEventRow) {
  const categories = [
    ...(event.category ? [event.category] : []),
    ...(event.categories ?? []),
  ];

  const cleaned = categories
    .map((category) => String(category).trim())
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

export function EventManagePage() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [searchParams, setSearchParams] = useSearchParams();

  const initialView = searchParams.get("view");

  const [activeTab, setActiveTab] = useState<ContentTab>(
    initialView === "upcoming" && isAdmin ? "upcoming" : "events",
  );

  const [events, setEvents] = useState<AdminEventRow[]>([]);
  const [registrationCounts, setRegistrationCounts] = useState<
    Record<string, number>
  >({});
  const [learningVideos, setLearningVideos] = useState<LearningVideoRecord[]>(
    [],
  );

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const [sortKey, setSortKey] = useState<AdminEventSortKey>("dateTime");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const loadEvents = useCallback(async () => {
    if (isAdmin) {
      const q = query(
        collection(db, "events"),
        where("eventApprovalStatus", "==", "approved"),
      );

      const snap = await getDocs(q);

      const baseRows: AdminEventRow[] = snap.docs.map((d) => ({
        eventId: d.id,
        ...(d.data() as Omit<AdminEventRow, "eventId">),
      }));

      const submitterIds = Array.from(
        new Set(
          baseRows
            .map((event) => event.submittedBy)
            .filter((id): id is string => Boolean(id)),
        ),
      );

      const submitterMap = new Map<string, SubmitterInfo>();

      await Promise.all(
        submitterIds.map(async (submitterId) => {
          try {
            const userSnap = await getDoc(doc(db, "users", submitterId));

            if (!userSnap.exists()) {
              submitterMap.set(submitterId, {
                organisationName: "Unknown organisation",
              });
              return;
            }

            const userData = userSnap.data();

            const organisationName =
              userData.orgName ||
              userData.organisationName ||
              userData.organizationName ||
              userData.companyName ||
              `${userData.firstName ?? ""} ${userData.lastName ?? ""}`.trim() ||
              userData.email ||
              "Unknown organisation";

            submitterMap.set(submitterId, {
              organisationName,
              role: userData.role,
            });
          } catch {
            submitterMap.set(submitterId, {
              organisationName: "Unknown organisation",
            });
          }
        }),
      );

      const rows = baseRows.map((event) => {
        const submitter = event.submittedBy
          ? submitterMap.get(event.submittedBy)
          : null;

        const isAdminSubmitted =
          submitter?.role === "admin" || !event.submittedBy;

        return {
          ...event,
          organisationName: isAdminSubmitted
            ? "Guess My Accent"
            : submitter?.organisationName || "Unknown organisation",
        };
      });

      rows.sort((a, b) => {
        const ta = a.dateTime?.toMillis?.() ?? 0;
        const tb = b.dateTime?.toMillis?.() ?? 0;
        return tb - ta;
      });

      const counts: Record<string, number> = {};

      await Promise.all(
        rows.map(async (event) => {
          try {
            const attendees = await getEventAttendees(event.eventId);
            counts[event.eventId] = attendees.reduce(
              (sum, attendee) => sum + attendee.ticketsOrdered,
              0,
            );
          } catch {
            counts[event.eventId] = getRegistrationCount({
              ...event,
              id: event.eventId,
            });
          }
        }),
      );

      setRegistrationCounts(counts);
      setEvents(rows);
      return;
    }

    if (user) {
      const q = query(
        collection(db, "events"),
        where("submittedBy", "==", user.uid),
      );

      const snap = await getDocs(q);

      const rows: AdminEventRow[] = snap.docs.map((d) => ({
        eventId: d.id,
        ...(d.data() as Omit<AdminEventRow, "eventId">),
      }));

      rows.sort((a, b) => {
        const ta = a.dateTime?.toMillis?.() ?? 0;
        const tb = b.dateTime?.toMillis?.() ?? 0;
        return tb - ta;
      });

      setEvents(rows);
      return;
    }

    setEvents([]);
  }, [isAdmin, user]);

  const loadLearningVideos = useCallback(async () => {
    if (!isAdmin) {
      setLearningVideos([]);
      return;
    }

    const snap = await getDocs(collection(db, "learningVideos"));

    const rows: LearningVideoRecord[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<LearningVideoRecord, "id">),
    }));

    rows.sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() ?? 0;
      const tb = b.createdAt?.toMillis?.() ?? 0;
      return tb - ta;
    });

    setLearningVideos(rows);
  }, [isAdmin]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([loadEvents(), loadLearningVideos()]);
    } catch (err) {
      console.error("Could not load content:", err);
      setError("Could not load content.");
      setEvents([]);
      setLearningVideos([]);
    } finally {
      setLoading(false);
    }
  }, [loadEvents, loadLearningVideos]);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => {
    const source =
      activeTab === "events"
        ? events.map((event) => event.category).filter(Boolean)
        : activeTab === "learning"
          ? learningVideos.map((item) => item.category).filter(Boolean)
          : [];

    return ["all", ...Array.from(new Set(source))];
  }, [activeTab, events, learningVideos]);

  function handleEventSort(key: AdminEventSortKey) {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection("asc");
  }

  function getSortLabel(key: AdminEventSortKey) {
    if (sortKey !== key) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  }

  const filteredEvents = [...events]
    .filter((ev) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        !keyword ||
        ev.title?.toLowerCase().includes(keyword) ||
        ev.description?.toLowerCase().includes(keyword) ||
        ev.address?.toLowerCase().includes(keyword) ||
        ev.organisationName?.toLowerCase().includes(keyword);

      const matchesCategory =
        filterCategory === "all" || ev.category === filterCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let aValue: string | number = "";
      let bValue: string | number = "";

      if (sortKey === "event") {
        aValue = a.title?.toLowerCase() || "";
        bValue = b.title?.toLowerCase() || "";
      }

      if (sortKey === "dateTime") {
        aValue = a.dateTime?.toMillis?.() ?? 0;
        bValue = b.dateTime?.toMillis?.() ?? 0;
      }

      if (sortKey === "category") {
        aValue = getCategoryLabels(a)[0].toLowerCase();
        bValue = getCategoryLabels(b)[0].toLowerCase();
      }

      if (sortKey === "registrations") {
        aValue = registrationCounts[a.eventId] ?? 0;
        bValue = registrationCounts[b.eventId] ?? 0;
      }

      if (sortKey === "organisation") {
        aValue = a.organisationName?.toLowerCase() || "";
        bValue = b.organisationName?.toLowerCase() || "";
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  const filteredLearningVideos = learningVideos.filter((item) => {
    const keyword = search.toLowerCase();

    const matchesSearch =
      !keyword ||
      item.title?.toLowerCase().includes(keyword) ||
      item.description?.toLowerCase().includes(keyword) ||
      item.cloudinaryPublicId?.toLowerCase().includes(keyword);

    const matchesCategory =
      filterCategory === "all" || item.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  async function onDeleteEvent(ev: EventRecord) {
    if (!canManageEvent(ev, user?.uid, isAdmin)) return;

    const ok = window.confirm(
      `Delete "${ev.title}"? This cannot be undone. All users booked or bookmarked this event will be notified of the cancellation.`,
    );

    if (!ok) return;

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
      await load();
    } catch {
      setError("Could not delete that event.");
    } finally {
      setBusyId(null);
    }
  }

  async function onDeleteLearning(item: LearningVideoRecord) {
    const ok = window.confirm(
      `Delete "${item.title || "this learning content"}"? This cannot be undone.`,
    );

    if (!ok) return;

    setBusyId(item.id);

    try {
      await deleteDoc(doc(db, "learningVideos", item.id));
      await load();
    } catch {
      setError("Could not delete that learning content.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page">
      <h1>{isAdmin ? "Content Management" : "Manage events"}</h1>
      <p className="muted">
        {isAdmin
          ? "Manage approved events and published learning content for the platform."
          : "Events you submitted. Edit details or delete a draft or listing."}
      </p>

      {isAdmin && (
        <div className="event-manage-tabs">
          <button
            type="button"
            className={`event-manage-tab ${activeTab === "events" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("events");
              setSearchParams({});
              setFilterCategory("all");
            }}
          >
            Events
          </button>

          <button
            type="button"
            className={`event-manage-tab ${activeTab === "learning" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("learning");
              setSearchParams({});
              setFilterCategory("all");
            }}
          >
            Learning Content
          </button>

          <button
            type="button"
            className={`event-manage-tab ${activeTab === "upcoming" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("upcoming");
              setSearchParams({ view: "upcoming" });
              setFilterCategory("all");
            }}
          >
            Upcoming Events
          </button>
        </div>
      )}

      {activeTab !== "upcoming" && (
        <div className="event-manage-controls">
          <div className="event-manage-search">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              placeholder={
                activeTab === "events"
                  ? "Search by title, description, location or organisation..."
                  : "Search learning title, description or Cloudinary ID..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="event-manage-filters">
            <select
              aria-label="Filter by category"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={String(cat)} value={String(cat)}>
                  {cat === "all"
                    ? "All categories"
                    : String(cat).charAt(0).toUpperCase() +
                      String(cat).slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="centered">
          <div className="spinner" />
        </div>
      ) : activeTab === "upcoming" ? (
        <UpcomingEventsView />
      ) : activeTab === "events" ? (
        filteredEvents.length === 0 ? (
          <p>No events to show.</p>
        ) : (
          <div className="partner-events-table-wrap">
            <table className="partner-events-table">
              <thead>
                <tr>
                  <th>
                    <button
                      type="button"
                      className="partner-events-sort-btn"
                      onClick={() => handleEventSort("event")}
                    >
                      Event {getSortLabel("event")}
                    </button>
                  </th>

                  <th>
                    <button
                      type="button"
                      className="partner-events-sort-btn"
                      onClick={() => handleEventSort("dateTime")}
                    >
                      Date &amp; Time {getSortLabel("dateTime")}
                    </button>
                  </th>

                  <th>
                    <button
                      type="button"
                      className="partner-events-sort-btn"
                      onClick={() => handleEventSort("category")}
                    >
                      Category {getSortLabel("category")}
                    </button>
                  </th>

                  <th>
                    <button
                      type="button"
                      className="partner-events-sort-btn"
                      onClick={() => handleEventSort("registrations")}
                    >
                      Registrations {getSortLabel("registrations")}
                    </button>
                  </th>

                  <th>
                    <button
                      type="button"
                      className="partner-events-sort-btn"
                      onClick={() => handleEventSort("organisation")}
                    >
                      Organisation {getSortLabel("organisation")}
                    </button>
                  </th>

                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredEvents.map((ev) => {
                  const allowed = canManageEvent(ev, user?.uid, isAdmin);
                  const categoryLabels = getCategoryLabels(ev);
                  const formattedDate = formatWhen(ev.dateTime);
                  const [datePart, ...timeParts] = formattedDate.split(",");

                  return (
                    <tr key={ev.eventId}>
                      <td>
                        <div className="partner-event-cell">
                          <div className="partner-event-thumb">
                            {ev.image ? (
                              <img
                                src={ev.image}
                                alt={ev.title || "Event image"}
                                onError={(e) =>
                                  (e.currentTarget.style.display = "none")
                                }
                              />
                            ) : (
                              <div className="partner-event-thumb-fallback">
                                {(ev.title || "E").charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          <div className="partner-event-info">
                            <strong className="partner-event-title">
                              {ev.title || "Untitled event"}
                            </strong>
                            <span className="partner-event-location">
                              {ev.address || "No location"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="partner-event-date">
                          <strong>{datePart}</strong>
                          <span>
                            {timeParts.join(",").trim() || "Time not set"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="partner-event-categories">
                          <span className={mapCategoryClass(categoryLabels[0])}>
                            {categoryLabels[0]}
                          </span>

                          {categoryLabels.length > 1 && (
                            <span className="partner-event-category more">
                              +{categoryLabels.length - 1}
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span className="partner-events-registrations">
                          <strong>{registrationCounts[ev.eventId] ?? 0}</strong>
                          <span>/ {ev.totalTickets ?? 0}</span>
                        </span>
                      </td>

                      <td>
                        <strong className="partner-event-title">
                          {ev.organisationName || "Unknown organisation"}
                        </strong>
                      </td>

                      <td>
                        {allowed && (
                          <div className="partner-events-actions">
                            <Link
                              to={`/admin/events/manage/${ev.eventId}`}
                              className="icon-action-btn"
                              aria-label="Edit event"
                              title="Edit"
                            >
                              <Pencil size={16} strokeWidth={2} />
                            </Link>

                            <button
                              type="button"
                              className="icon-action-btn danger"
                              disabled={busyId === ev.eventId}
                              onClick={() => onDeleteEvent(ev)}
                              aria-label="Delete event"
                              title="Delete"
                            >
                              <Trash2 size={16} strokeWidth={2} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : filteredLearningVideos.length === 0 ? (
        <p>No learning content to show.</p>
      ) : (
        <ul className="approval-list">
          {filteredLearningVideos.map((item) => (
            <li key={item.id} className="approval-card event-manage-card">
              <div className="approval-inner">
                <div className="approval-img">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title || "Learning content"}
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : (
                    <div className="approval-img-placeholder">
                      Learning Video
                    </div>
                  )}
                </div>

                <div className="approval-content event-manage-content">
                  <div className="approval-head">
                    <h3>{item.title || "Untitled learning content"}</h3>
                    <span className="muted">{item.duration || "—"}</span>
                  </div>

                  <p className="approval-desc">{item.description}</p>

                  <p className="muted small capitalize">
                    Learning · {item.category || "No category"} ·{" "}
                    {item.accessType === "paid" ? "Subscribers only" : "Free"}
                  </p>

                  {item.interestTags && item.interestTags.length > 0 && (
                    <p className="muted small">
                      Tags: {item.interestTags.join(", ")}
                    </p>
                  )}

                  <div className="approval-actions event-manage-actions">
                    <Link
                      to={`/admin/learning/publication/${item.id}`}
                      className="btn-secondary"
                    >
                      Edit
                    </Link>

                    <button
                      type="button"
                      className="btn-danger"
                      disabled={busyId === item.id}
                      onClick={() => onDeleteLearning(item)}
                    >
                      {busyId === item.id ? "Deleting..." : "Delete"}
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