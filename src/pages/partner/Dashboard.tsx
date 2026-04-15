import { useState } from "react";

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

const mockStats: StatCard[] = [
  {
    label: "Total Events",
    value: "12",
    hint: "All events created",
  },
  {
    label: "Published Events",
    value: "8",
    hint: "Currently live",
    accent: true,
  },
  {
    label: "Pending Review",
    value: "3",
    hint: "Awaiting approval",
  },
  {
    label: "Total Bookings",
    value: "186",
    hint: "Combined registrations",
  },
  {
    label: "Engagement Rate",
    value: "75%",
    hint: "Average event engagement",
  },
  {
    label: "Upcoming Events",
    value: "4",
    hint: "Scheduled next",
  },
];

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

const mockDecisionMetrics = [
  { label: "Top Event", value: "Skilled Migrant Networking Night" },
  { label: "Best Period", value: "Thursday evening" },
  { label: "Average Booking Growth", value: "+12%" },
  { label: "Lowest Engagement", value: "Sunday" },
];

export default function PartnerDashboard() {
  const [filter, setFilter] = useState<FilterKey>("month");

  const activeData = chartData[filter];
  const maxValue = Math.max(...activeData.map((item) => item.value));

  return (
    <div className="page dashboard-page">
      <section className="dashboard-topbar">
        <div className="dashboard-topbar-left">
          <div className="dashboard-topbar-title">Partner Dashboard</div>
        </div>

        <div className="dashboard-topbar-right">
          <button
            className="dashboard-icon-btn"
            type="button"
            aria-label="Notifications"
          >
            🔔
          </button>
          <div className="dashboard-userbox">
            <div className="dashboard-user-meta">
              <strong>Sandra Lee</strong>
              <span>Partner</span>
            </div>
            <div className="dashboard-user-avatar">◎</div>
          </div>
        </div>
      </section>

      <section className="dashboard-header">
        <h1>Partner Dashboard Overview</h1>
        <p className="muted dashboard-hero-copy">
          A quick summary of event performance, engagement trends, and key
          insights.
        </p>
      </section>

      <section className="dashboard-kpi-grid">
        {mockStats.map((stat) => (
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
              {mockDecisionMetrics.map((item) => (
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
              Skilled Migrant Networking Night
            </p>
            <p className="muted small">
              This event is currently your strongest performer based on
              bookings, visibility, and engagement.
            </p>

            <div className="dashboard-highlight-metrics">
              <div>
                <strong>42</strong>
                <span>Bookings</span>
              </div>
              <div>
                <strong>260</strong>
                <span>Views</span>
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
              <div className="dashboard-activity-item">
                <div className="dashboard-activity-dot" />
                <div>
                  <p className="dashboard-activity-text">
                    Your event “Career Growth Workshop” was submitted for
                    review.
                  </p>
                  <p className="muted small">2 hours ago</p>
                </div>
              </div>

              <div className="dashboard-activity-item">
                <div className="dashboard-activity-dot" />
                <div>
                  <p className="dashboard-activity-text">
                    “Skilled Migrant Networking Night” received 8 new bookings.
                  </p>
                  <p className="muted small">Today</p>
                </div>
              </div>

              <div className="dashboard-activity-item">
                <div className="dashboard-activity-dot" />
                <div>
                  <p className="dashboard-activity-text">
                    You updated details for “Community Leadership Roundtable”.
                  </p>
                  <p className="muted small">Yesterday</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
