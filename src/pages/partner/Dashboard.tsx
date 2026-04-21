import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import type { EventRecord } from "../../types/event-types";

type FilterKey = "week" | "month" | "year";

type StatCard = {
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
};

type ChartPoint = {
  label: string;
  value: number;
};

type ActivityItem = {
  id: string;
  text: string;
  time: string;
};

const chartData: Record<FilterKey, ChartPoint[]> = {
  week: [
    { label: "Mon", value: 18 },
    { label: "Tue", value: 26 },
    { label: "Wed", value: 20 },
    { label: "Thu", value: 32 },
    { label: "Fri", value: 28 },
    { label: "Sat", value: 22 },
    { label: "Sun", value: 16 },
  ],
  month: [
    { label: "W1", value: 65 },
    { label: "W2", value: 82 },
    { label: "W3", value: 74 },
    { label: "W4", value: 96 },
  ],
  year: [
    { label: "Jan", value: 110 },
    { label: "Feb", value: 125 },
    { label: "Mar", value: 132 },
    { label: "Apr", value: 148 },
    { label: "May", value: 138 },
    { label: "Jun", value: 154 },
    { label: "Jul", value: 162 },
    { label: "Aug", value: 149 },
    { label: "Sep", value: 170 },
    { label: "Oct", value: 181 },
    { label: "Nov", value: 176 },
    { label: "Dec", value: 188 },
  ],
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString();
}

function getEventBookings(event: EventRecord): number {
  if (typeof event.ticketsSold === "number") return event.ticketsSold;
  if (Array.isArray(event.attendees)) return event.attendees.length;
  return 0;
}

export default function PartnerDashboard() {
  const { user, profile } = useAuth();
  const [filter, setFilter] = useState<FilterKey>("month");

  const partnerID = profile?.partnerId;

  const [totalEvents, setTotalEvents] = useState(0);
  const [publishedEvents, setPublishedEvents] = useState(0);
  const [pendingReview, setPendingReview] = useState(0);
  const [totalBookings, setTotalBookings] = useState<number | null>(null);
  const [partnerEvents, setPartnerEvents] = useState<EventRecord[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState(0);

  useEffect(() => {
    if (!user || !partnerID) return;

    let cancelled = false;

    (async () => {
      try {
        const eventsQuery = query(
          collection(db, "events"),
          where("submittedBy", "==", partnerID),
        );

        const eventSnap = await getDocs(eventsQuery);

        if (cancelled) return;

        const events: EventRecord[] = eventSnap.docs.map((docSnap) => ({
          ...(docSnap.data() as Omit<EventRecord, "eventId">),
          eventId: docSnap.id,
        }));

        if (!cancelled) setPartnerEvents(events);

        if (!cancelled) setTotalEvents(events.length);

        const published = events.filter(
          (event) => event.eventApprovalStatus === "approved",
        ).length;

        const pending = events.filter(
          (event) => event.eventApprovalStatus === "pending",
        ).length;

        if (!cancelled) {
          setPublishedEvents(published);
          setPendingReview(pending);
        }

        const now = new Date();
        const upcoming = events.filter((event) => {
          try {
            const eventDate = event.dateTime?.toDate
              ? event.dateTime.toDate()
              : new Date(event.dateTime as unknown as string);

            return eventDate > now;
          } catch {
            return false;
          }
        }).length;

        if (!cancelled) setUpcomingEvents(upcoming);

        const bookingsCount = events.reduce((sum, event) => {
          if (typeof event.ticketsSold === "number")
            return sum + event.ticketsSold;
          if (Array.isArray(event.attendees))
            return sum + event.attendees.length;
          return sum;
        }, 0);

        if (!cancelled) setTotalBookings(bookingsCount);
      } catch (err) {
        console.error("Dashboard analytics error:", err);
        if (!cancelled) {
          setTotalEvents(0);
          setPublishedEvents(0);
          setPendingReview(0);
          setUpcomingEvents(0);
          setTotalBookings(null);
          setPartnerEvents([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, partnerID]);

  const stats: StatCard[] = [
    {
      label: "Total Events",
      value: totalEvents.toString(),
      hint: "All events created",
    },
    {
      label: "Published Events",
      value: publishedEvents.toString(),
      hint: "Currently live",
      accent: true,
    },
    {
      label: "Pending Review",
      value: pendingReview.toString(),
      hint: "Awaiting approval",
    },
    {
      label: "Total Bookings",
      value: totalBookings === null ? "-" : totalBookings.toString(),
      hint: "Combined registrations",
    },
    {
      label: "Avg. Bookings/Event",
      value:
        totalEvents > 0 && totalBookings !== null
          ? (totalBookings / totalEvents).toFixed(1)
          : "0",
      hint: "Average bookings per event",
    },
    {
      label: "Upcoming Events",
      value: upcomingEvents.toString(),
      hint: "Scheduled next",
    },
  ];

  const approvedEvents = partnerEvents.filter(
    (event) => event.eventApprovalStatus === "approved",
  );
  const topPerformingEvent =
    approvedEvents.length > 0
      ? [...approvedEvents].sort((a, b) => {
          const aBookings =
            typeof a.ticketsSold === "number"
              ? a.ticketsSold
              : Array.isArray(a.attendees)
                ? a.attendees.length
                : 0;

          const bBookings =
            typeof b.ticketsSold === "number"
              ? b.ticketsSold
              : Array.isArray(b.attendees)
                ? b.attendees.length
                : 0;

          return bBookings - aBookings;
        })[0]
      : null;

  const topEventBookings = topPerformingEvent
    ? typeof topPerformingEvent.ticketsSold === "number"
      ? topPerformingEvent.ticketsSold
      : Array.isArray(topPerformingEvent.attendees)
        ? topPerformingEvent.attendees.length
        : 0
    : 0;
  const recentActivities: ActivityItem[] = [...partnerEvents]
    .sort((a, b) => {
      const aTime =
        a.updatedAt?.toDate?.()?.getTime?.() ??
        a.createdAt?.toDate?.()?.getTime?.() ??
        0;

      const bTime =
        b.updatedAt?.toDate?.()?.getTime?.() ??
        b.createdAt?.toDate?.()?.getTime?.() ??
        0;

      return bTime - aTime;
    })
    .slice(0, 3)
    .map((event) => {
      const activityDate =
        event.updatedAt?.toDate?.() ??
        event.createdAt?.toDate?.() ??
        new Date();

      let text = `You updated "${event.title}".`;

      if (event.eventApprovalStatus === "pending") {
        text = `Your event "${event.title}" was submitted for review.`;
      } else if (event.eventApprovalStatus === "approved") {
        text = `Your event "${event.title}" has been approved.`;
      } else if (event.eventApprovalStatus === "rejected") {
        text = `Your event "${event.title}" was not approved.`;
      } else if (event.eventApprovalStatus === "draft") {
        text = `You saved "${event.title}" as a draft.`;
      }

      return {
        id: event.eventId,
        text,
        time: formatRelativeTime(activityDate),
      };
    });

  const weekdayStats = [
  { label: "Monday", value: 0 },
  { label: "Tuesday", value: 0 },
  { label: "Wednesday", value: 0 },
  { label: "Thursday", value: 0 },
  { label: "Friday", value: 0 },
  { label: "Saturday", value: 0 },
  { label: "Sunday", value: 0 },
];

partnerEvents.forEach((event) => {
  const eventDate = event.dateTime?.toDate?.();
  if (!eventDate) return;

  const bookings = getEventBookings(event);
  const jsDay = eventDate.getDay();
  const mondayFirstIndex = jsDay === 0 ? 6 : jsDay - 1;

  weekdayStats[mondayFirstIndex].value += bookings;
});

const bestPeriod =
  weekdayStats.length > 0
    ? [...weekdayStats].sort((a, b) => b.value - a.value)[0]
    : null;

const lowestEngagement =
  weekdayStats.length > 0
    ? [...weekdayStats].sort((a, b) => a.value - b.value)[0]
    : null;

const now = new Date();
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();

const previousMonthDate = new Date(currentYear, currentMonth - 1, 1);
const previousMonth = previousMonthDate.getMonth();
const previousMonthYear = previousMonthDate.getFullYear();

let currentMonthBookings = 0;
let previousMonthBookings = 0;

partnerEvents.forEach((event) => {
  const eventDate = event.dateTime?.toDate?.();
  if (!eventDate) return;

  const bookings = getEventBookings(event);
  const eventMonth = eventDate.getMonth();
  const eventYear = eventDate.getFullYear();

  if (eventMonth === currentMonth && eventYear === currentYear) {
    currentMonthBookings += bookings;
  }

  if (eventMonth === previousMonth && eventYear === previousMonthYear) {
    previousMonthBookings += bookings;
  }
});

const averageBookingGrowth =
  previousMonthBookings > 0
    ? `${Math.round(
        ((currentMonthBookings - previousMonthBookings) / previousMonthBookings) * 100
      )}%`
    : currentMonthBookings > 0
      ? "+100%"
      : "0%";

const decisionMetrics = [
  {
    label: "Top Event",
    value: topPerformingEvent?.title || "No event data yet",
  },
  {
    label: "Best Period",
    value: bestPeriod?.label || "-",
  },
  {
    label: "Average Booking Growth",
    value: averageBookingGrowth,
  },
  {
    label: "Lowest Engagement",
    value: lowestEngagement?.label || "-",
  },
];
  const activeData = chartData[filter];
  const maxValue = Math.max(...activeData.map((item) => item.value));

  return (
    <div className="page dashboard-page">
      <section className="dashboard-header">
        <h1>Partner Dashboard Overview</h1>
        <p className="muted dashboard-hero-copy">
          A quick summary of event performance, engagement trends, and key
          insights.
        </p>
      </section>

      <section className="dashboard-kpi-grid">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className={`stat-card dashboard-stat-card ${stat.accent ? "accent" : ""}`}
          >
            <span className="dashboard-stat-title">{stat.label}</span>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.hint}</div>
          </article>
        ))}
      </section>

      <section className="dashboard-main-grid">
        <div className="dashboard-left-column">
          <section className="panel dashboard-panel">
            <div className="dashboard-section-head">
              <div>
                <h2>Engagement overview</h2>
                <p className="muted small">
                  Visualise weekly, monthly, and yearly engagement trends
                </p>
              </div>

              <div className="dashboard-filter-group">
                <button
                  type="button"
                  className={`dashboard-filter-btn ${filter === "week" ? "active" : ""}`}
                  onClick={() => setFilter("week")}
                >
                  Week
                </button>
                <button
                  type="button"
                  className={`dashboard-filter-btn ${filter === "month" ? "active" : ""}`}
                  onClick={() => setFilter("month")}
                >
                  Month
                </button>
                <button
                  type="button"
                  className={`dashboard-filter-btn ${filter === "year" ? "active" : ""}`}
                  onClick={() => setFilter("year")}
                >
                  Year
                </button>
              </div>
            </div>

            <div className="dashboard-chart">
              {activeData.map((item) => (
                <div key={item.label} className="dashboard-chart-col">
                  <div className="dashboard-chart-value">{item.value}</div>
                  <div className="dashboard-chart-bar-wrap">
                    <div
                      className="dashboard-chart-bar"
                      style={{ height: `${(item.value / maxValue) * 180}px` }}
                    />
                  </div>
                  <div className="dashboard-chart-label">{item.label}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel dashboard-panel">
            <div className="dashboard-section-head">
              <div>
                <h2>Decision support summary</h2>
                <p className="muted small">
                  Relevant information to support partner decision making
                </p>
              </div>
            </div>

            <div className="dashboard-summary-grid">
              {decisionMetrics.map((item) => (
                <div key={item.label} className="dashboard-summary-card">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="dashboard-right-column">
          <section className="panel dashboard-panel dashboard-highlight-panel">
            <div className="dashboard-highlight-label">Featured insight</div>
            <h2 className="dashboard-highlight-title">Top performing event</h2>
            <p className="dashboard-highlight-event">
              {topPerformingEvent?.title || "No event data yet"}
            </p>
            <p className="muted small">
              {topPerformingEvent
                ? "This event is currently your strongest performer based on bookings."
                : "Create and publish events to see performance insights here."}
            </p>

            <div className="dashboard-highlight-metrics">
              <div>
                <strong>{topEventBookings}</strong>
                <span>Bookings</span>
              </div>
              <div>
                <strong>
                  {topPerformingEvent?.eventApprovalStatus || "-"}
                </strong>
                <span>Status</span>
              </div>
            </div>
          </section>

          <section className="panel dashboard-panel">
            <div className="dashboard-section-head">
              <div>
                <h2>Recent activity</h2>
                <p className="muted small">Latest updates on your dashboard</p>
              </div>
            </div>

            <div className="dashboard-activity-list">
              {recentActivities.length > 0 ? (
                recentActivities.map((item) => (
                  <div key={item.id} className="dashboard-activity-item">
                    <div className="dashboard-activity-dot" />
                    <div>
                      <p className="dashboard-activity-text">{item.text}</p>
                      <p className="muted small">{item.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="dashboard-activity-item">
                  <div className="dashboard-activity-dot" />
                  <div>
                    <p className="dashboard-activity-text">
                      No recent activity yet.
                    </p>
                    <p className="muted small">
                      Your latest event updates will appear here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
