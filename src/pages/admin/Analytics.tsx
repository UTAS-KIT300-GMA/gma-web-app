import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, collectionGroup, query } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../hooks/useAuth";
import type { EventRecord, Category } from "../../types/event-types";

type CatCount = Record<string, number>;

export function AnalyticsPage() {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [bookings, setBookings] = useState<number | null>(null);
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const evSnap = await getDocs(collection(db, "events"));
        const rows: EventRecord[] = evSnap.docs.map((d) => ({
          ...(d.data() as Omit<EventRecord, "eventId">),
          eventId: d.id,
        }));
        const visible =
          profile?.role === "admin"
            ? rows
            : rows.filter((e) => e.submittedBy === user?.uid);
        if (!cancelled) setEvents(visible);

        const tags: Record<string, number> = {};
        try {
          const usersSnap = await getDocs(collection(db, "users"));
          usersSnap.forEach((docSnap) => {
            const t = docSnap.data().selectedTags as string[] | undefined;
            if (!Array.isArray(t)) return;
            for (const tag of t) {
              tags[tag] = (tags[tag] ?? 0) + 1;
            }
          });
        } catch {
          /* permission */
        }
        if (!cancelled) setTagCounts(tags);

        let bc: number | null = null;
        try {
          if (profile?.role === "admin") {
            const bg = await getDocs(collectionGroup(db, "bookings"));
            bc = bg.size;
          } else if (user) {
            const mine = await getDocs(
              query(collection(db, "users", user.uid, "bookings")),
            );
            bc = mine.size;
          }
        } catch {
          bc = null;
        }
        if (!cancelled) setBookings(bc);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, profile?.role]);

  const byCategory = useMemo(() => {
    const m: CatCount = { connect: 0, growth: 0, thrive: 0, other: 0 };
    for (const e of events) {
    const c = e.category;
    
    if (c === "connect" || c === "growth" || c === "thrive") {
      m[c] += 1;
    } else {
      m.other += 1;
    }
  }
  return m;
}, [events]);

  const approvedForDisplay = useMemo(
    () =>
      events.filter(
        (e) => e.approvalStatus === "approved" || e.approvalStatus,
      ),
    [events],
  );

  const topTags = useMemo(() => {
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  }, [tagCounts]);

  return (
    <div className="page">
      <h1>Analytics</h1>
      <p className="muted">
        Aggregates from <code>events</code>, <code>users</code> interest tags, and{" "}
        <code>users/&#123;uid&#125;/bookings</code>.
      </p>

      {loading ? (
        <div className="centered">
          <div className="spinner" />
        </div>
      ) : (
        <>
          <div className="card-grid">
            <div className="stat-card">
              <div className="stat-value">{approvedForDisplay.length}</div>
              <div className="stat-label">Events (approved / legacy)</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {bookings === null ? "—" : bookings}
              </div>
              <div className="stat-label">
                {profile?.role === "admin"
                  ? "Bookings (collection group)"
                  : "Your bookings"}
              </div>
            </div>
          </div>

          <section className="panel">
            <h2>Events by category</h2>
            <div className="bar-list">
              {(
                ["connect", "growth", "thrive"] as Category[]
              ).map((c) => (
                <div key={c} className="bar-row">
                  <span className="bar-label">{c}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${Math.min(
                          100,
                          (byCategory[c] /
                            Math.max(1, approvedForDisplay.length)) *
                            100,
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="bar-num">{byCategory[c]}</span>
                </div>
              ))}
            </div>
          </section>

          {profile?.role === "admin" && topTags.length > 0 && (
            <section className="panel">
              <h2>Top interest tags (from user profiles)</h2>
              <ul className="tag-analytics">
                {topTags.map(([tag, n]) => (
                  <li key={tag}>
                    <span>{tag}</span>
                    <strong>{n}</strong>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
