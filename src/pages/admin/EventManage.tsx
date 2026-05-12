import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Search } from "lucide-react";
import { db } from "../../firebase";
import { useAuth } from "../../hooks/useAuth";
import type { EventRecord } from "../../types/event-types";

type ContentTab = "events" | "learning";

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

export function EventManagePage() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [activeTab, setActiveTab] = useState<ContentTab>("events");
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [learningVideos, setLearningVideos] = useState<LearningVideoRecord[]>(
    [],
  );

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const loadEvents = useCallback(async () => {
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
      return;
    }

    if (user) {
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
        : learningVideos.map((item) => item.category).filter(Boolean);

    return ["all", ...Array.from(new Set(source))];
  }, [activeTab, events, learningVideos]);

  const filteredEvents = events.filter((ev) => {
    const keyword = search.toLowerCase();

    const matchesSearch =
      !keyword ||
      ev.title?.toLowerCase().includes(keyword) ||
      ev.description?.toLowerCase().includes(keyword) ||
      ev.address?.toLowerCase().includes(keyword);

    const matchesStatus =
      filterStatus === "all" || ev.eventApprovalStatus === filterStatus;

    const matchesCategory =
      filterCategory === "all" || ev.category === filterCategory;

    return matchesSearch && matchesStatus && matchesCategory;
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

    const ok = window.confirm(`Delete "${ev.title}"? This cannot be undone.`);
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
              setFilterStatus("all");
              setFilterCategory("all");
            }}
          >
            Learning Content
          </button>
        </div>
      )}

      <div className="event-manage-controls">
        <div className="event-manage-search">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            placeholder={
              activeTab === "events"
                ? "Search by title, description or location..."
                : "Search learning title, description or Cloudinary ID..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="event-manage-filters">
          {activeTab === "events" && (
            <select
              aria-label="Filter events by status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          )}

          <select
            aria-label="Filter by category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={String(cat)} value={String(cat)}>
                {cat === "all"
                  ? "All categories"
                  : String(cat).charAt(0).toUpperCase() + String(cat).slice(1)}
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
      ) : activeTab === "events" ? (
        filteredEvents.length === 0 ? (
          <p>No events to show.</p>
        ) : (
          <ul className="approval-list">
            {filteredEvents.map((ev) => {
              const allowed = canManageEvent(ev, user?.uid, isAdmin);

              return (
                <li
                  key={ev.eventId}
                  className="approval-card event-manage-card"
                >
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
                            to={`/admin/events/manage/${ev.eventId}`}
                            className="btn-secondary"
                          >
                            Edit
                          </Link>

                          <button
                            type="button"
                            className="btn-danger"
                            disabled={busyId === ev.eventId}
                            onClick={() => onDeleteEvent(ev)}
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
                      {busyId === item.id ? "Deleting…" : "Delete"}
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
