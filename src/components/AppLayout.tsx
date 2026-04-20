import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  House,
  Plus,
  CalendarDays,
  ChartColumn,
  Settings,
  CircleCheckBig,
  CircleUserRound,
  LogOut,
  Handshake,
  Users,
  Bell,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

/// Helper function to apply active class to NavLink
const linkClass = ({ isActive }: { isActive: boolean }) =>
  `sidebar-link ${isActive ? "active" : ""}`;

/**
 * AppLayout component that defines the main layout of the application with a sidebar and main content area.
 * The sidebar contains navigation links that are conditionally rendered based on the user's role.
 * The main content area renders the child routes using <Outlet />.
 */
export function AppLayout() {
  const { profile, signOutUser } = useAuth();
  const navigate = useNavigate();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  // Mapping of pathname to page title
  const location = useLocation();

  const pageTitle = () => {
    if (location.pathname.includes("dashboard")) return "Dashboard";
    if (location.pathname.includes("events/manage")) return "Manage Events";
    if (location.pathname.includes("events/approval")) return "Approve Events";
    if (location.pathname.includes("analytics")) return "Analytics";
    if (location.pathname.includes("users")) return "Users";
    if (location.pathname.includes("partners")) return "Manage Partners";
    if (location.pathname.includes("events/register")) return "Create Event";
    return "Dashboard";
  };

  const displayName = profile?.firstName ?? profile?.email ?? "Sandra Lee";
  const roleLabel = profile?.role ?? "partner";
  const isAdmin = profile?.role === "admin";

  // Add state for active role to support with admin "view as partner" toggle in the future
  const [viewAsPartner, setViewAsPartner] = useState(false);
  const effectiveIsAdmin = isAdmin && !viewAsPartner;

  return (
    <div
      className={`app-shell ${
        sidebarExpanded ? "sidebar-expanded" : "sidebar-collapsed"
      }`}
    >
      {/* Sidebar navigation */}
      <aside
        className={`app-sidebar ${sidebarExpanded ? "expanded" : "collapsed"}`}
      >
        <div className="sidebar-top">
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarExpanded((prev) => !prev)}
            aria-label={
              sidebarExpanded ? "Collapse navigation" : "Expand navigation"
            }
          >
            <Menu width={22} height={22} strokeWidth={2.2} />
          </button>

          {sidebarExpanded && <div className="sidebar-brand">GMA Connect</div>}
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to={effectiveIsAdmin ? "/admin/dashboard" : "/partner/dashboard"}
            className={linkClass}
            end
          >
            <span className="sidebar-link-icon">
              <House size={20} strokeWidth={2.2} />
            </span>
            {sidebarExpanded && <span>Dashboard</span>}
          </NavLink>

          {!effectiveIsAdmin && (
            <NavLink to="/partner/events/register" className={linkClass}>
              <span className="sidebar-link-icon">
                <Plus size={20} strokeWidth={2.2} />
              </span>
              {sidebarExpanded && <span>Create Event</span>}
            </NavLink>
          )}

            {!effectiveIsAdmin && (
            <NavLink to="/partner/events/manage" className={linkClass}>
              <span className="sidebar-link-icon">
                <CalendarDays size={20} strokeWidth={2.2} />
              </span>
              {sidebarExpanded && <span>My Events</span>}
            </NavLink>
          )}

          {effectiveIsAdmin && (
            <NavLink to="/admin/events/manage" className={linkClass}>
              <span className="sidebar-link-icon">
                <CalendarDays size={20} strokeWidth={2.2} />
              </span>
              {sidebarExpanded && <span>Manage Events</span>}
            </NavLink>
          )}

          {effectiveIsAdmin && (
            <NavLink to="/admin/events/approval" className={linkClass}>
              <span className="sidebar-link-icon">
                <CircleCheckBig size={20} strokeWidth={2.2} />
              </span>
              {sidebarExpanded && <span>Approve Events</span>}
            </NavLink>
          )}

          {effectiveIsAdmin && (
            <NavLink to="/admin/analytics" className={linkClass}>
              <span className="sidebar-link-icon">
                <ChartColumn size={20} strokeWidth={2.2} />
              </span>
              {sidebarExpanded && <span>Analytics</span>}
            </NavLink>
          )}

          {effectiveIsAdmin && (
            <NavLink to="/admin/users" className={linkClass}>
              <span className="sidebar-link-icon">
                <Users size={20} strokeWidth={2.2} />
              </span>
              {sidebarExpanded && <span>Users</span>}
            </NavLink>
          )}

          {effectiveIsAdmin && (
            <NavLink to="/admin/partners/approve" className={linkClass}>
              <span className="sidebar-link-icon">
                <Handshake size={20} strokeWidth={2.2} />
              </span>
              {sidebarExpanded && <span>Manage Partners</span>}
            </NavLink>
          )}

          <a
            className="sidebar-link sidebar-link-muted"
            href="#settings"
            onClick={(e) => e.preventDefault()}
          >
            <span className="sidebar-link-icon">
              <Settings size={20} strokeWidth={2.2} />
            </span>
            {sidebarExpanded && <span>Settings</span>}
          </a>
        </nav>

        <div className="sidebar-footer">
          {sidebarExpanded ? (
            <div className="sidebar-user-card">
              <div className="sidebar-user-info">
                <div className="user-name">{displayName}</div>
                <span className="role-pill">{roleLabel}</span>
              </div>

              <button
                type="button"
                className="btn-ghost sidebar-signout"
                onClick={async () => {
                  await signOutUser();
                  navigate("/login", { replace: true });
                }}
              >
                <LogOut size={16} strokeWidth={2.2} />
                <span>Sign out</span>
              </button>
            </div>
          ) : (
            <div className="sidebar-footer-collapsed">
              <div className="sidebar-mini-user">
                <CircleUserRound size={20} strokeWidth={2.2} />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content area with topbar */}
      <main className="app-main">
        <header className="app-topbar">
          <div className="app-topbar-left">
            <div className="dashboard-title">
              {effectiveIsAdmin ? "Admin" : "Partner"} {pageTitle()}
            </div>
          </div>

          <div className="app-topbar-right">
            {/* Admin "View as Partner" toggle button, here only needs isAdmin for the switch view button to work */}
            {isAdmin && (
              <button
                className="btn-primary switch-view-btn"
                type="button"
                onClick={() => {
                  setViewAsPartner((prev) => !prev);
                  navigate(
                    viewAsPartner ? "/admin/dashboard" : "/partner/dashboard",
                  );
                }}
              >
                {viewAsPartner ? "Admin View" : "Partner View"}
              </button>
            )}

            <button
              className="dashboard-icon-btn"
              type="button"
              aria-label="Notifications"
            >
              <Bell size={24} strokeWidth={1.7} />
            </button>

            {/* User's role and name added here */}
            <div className="dashboard-userbox">
              <div className="dashboard-user-meta">
                <strong>{displayName}</strong>
                <span>{roleLabel}</span>
              </div>
              <div className="dashboard-user-avatar">
                <CircleUserRound size={32} strokeWidth={1} />
              </div>
            </div>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
