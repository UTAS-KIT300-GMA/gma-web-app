import { useEffect, useState } from "react";
import { collection, getDocs, collectionGroup } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import type { EventRecord } from "../types/event-types";

export function DashboardPage() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({
    events: 0,
    pending: 0,
    users: 0,
    bookings: 0 as number | null,
    mine: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const eventsSnap = await getDocs(collection(db(), "events"));
        const events: EventRecord[] = eventsSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<EventRecord, "id">),
        }));

        const pending = events.filter((e) => e.approvalStatus === "pending").length;
        const mine = user
          ? events.filter((e) => e.submittedBy === user.uid).length
          : 0;

        let usersCount = 0;
        try {
          const usersSnap = await getDocs(collection(db(), "users"));
          usersCount = usersSnap.size;
        } catch {
          usersCount = 0;
        }

        let bookingsCount: number | null = null;
        try {
          const bookSnap = await getDocs(collectionGroup(db(), "bookings"));
          bookingsCount = bookSnap.size;
        } catch {
          bookingsCount = null;
        }

        if (!cancelled) {
          setStats({
            events: events.length,
            pending,
            users: usersCount,
            bookings: bookingsCount,
            mine,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const isAdmin = profile?.role === "admin";

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <p className="muted">
        Welcome{profile?.firstName ? `, ${profile.firstName}` : ""}. Data comes from
        the same Firestore as the mobile app.
      </p>

      {loading ? (
        <div className="centered">
          <div className="spinner" />
        </div>
      ) : (
        <div className="card-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.events}</div>
            <div className="stat-label">Events in Firestore</div>
          </div>
          {isAdmin && (
            <div className="stat-card accent">
              <div className="stat-value">{stats.pending}</div>
              <div className="stat-label">Pending approval</div>
            </div>
          )}
          {isAdmin && (
            <div className="stat-card">
              <div className="stat-value">{stats.users}</div>
              <div className="stat-label">User profiles</div>
            </div>
          )}
          {isAdmin && (
            <div className="stat-card">
              <div className="stat-value">
                {stats.bookings === null ? "—" : stats.bookings}
              </div>
              <div className="stat-label">Bookings (all users)</div>
            </div>
          )}
          {!isAdmin && (
            <div className="stat-card accent">
              <div className="stat-value">{stats.mine}</div>
              <div className="stat-label">Events you submitted</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
