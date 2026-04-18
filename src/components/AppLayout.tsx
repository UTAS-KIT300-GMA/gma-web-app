import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { RoleGate } from "./RoleGate";

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

  const displayName = profile?.firstName ?? profile?.email ?? "Sandra Lee";
  const roleLabel = profile?.role ?? "partner";
  const isAdmin = profile?.role === "admin";

  return (
    <div
      className={`app-shell ${
        sidebarExpanded ? "sidebar-expanded" : "sidebar-collapsed"
      }`}
    >
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
            to={isAdmin ? "/admin/dashboard" : "/partner/dashboard"}
            className={linkClass}
            end
          >
            <span className="sidebar-link-icon">
              <House size={20} strokeWidth={2.2} />
            </span>
            {sidebarExpanded && <span>Dashboard</span>}
          </NavLink>

          {!isAdmin && (
            <NavLink to="/partner/events/register" className={linkClass}>
              <span className="sidebar-link-icon">
                <Plus size={20} strokeWidth={2.2} />
              </span>
              {sidebarExpanded && <span>Create Event</span>}
            </NavLink>
          )}

          {isAdmin && (
            <NavLink to="/admin/events/manage" className={linkClass}>
              <span className="sidebar-link-icon">
                <CalendarDays size={20} strokeWidth={2.2} />
              </span>
              {sidebarExpanded && <span>Manage Events</span>}
            </NavLink>
          )}

          {isAdmin && (
            <NavLink to="/admin/analytics" className={linkClass}>
              <span className="sidebar-link-icon">
                <ChartColumn size={20} strokeWidth={2.2} />
              </span>
              {sidebarExpanded && <span>Analytics</span>}
            </NavLink>
          )}

          {isAdmin && (
            <NavLink to="/admin/users" className={linkClass}>
              <span className="sidebar-link-icon">
                <Users size={20} strokeWidth={2.2} />
              </span>
              {sidebarExpanded && <span>Users</span>}
            </NavLink>
          )}

          {isAdmin && (
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

          <RoleGate roles={["admin"]}>
            <NavLink to="/admin/events/approval" className={linkClass}>
              <span className="sidebar-link-icon">
                <CircleCheckBig size={20} strokeWidth={2.2} />
              </span>
              {sidebarExpanded && <span>Approve Events</span>}
            </NavLink>
          </RoleGate>
        </nav>

        <div className="sidebar-footer">
          {sidebarExpanded ? (
            <div className="sidebar-user-card">
              <div className="sidebar-user-info">
                <strong>{displayName}</strong>
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

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
