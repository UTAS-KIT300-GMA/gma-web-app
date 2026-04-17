import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Menu,
  House,
  Plus,
  CalendarDays,
  ChartColumn,
  Settings,
  ShieldCheck,
  CircleUserRound,
  LogOut,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { RoleGate } from "./RoleGate";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `sidebar-link ${isActive ? "active" : ""}`;

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
            <Menu size={22} strokeWidth={2.2} />
          </button>

          {sidebarExpanded && <div className="sidebar-brand">GMA Connect</div>}
        </div>

<nav className="sidebar-nav">
  <NavLink
    to={isAdmin ? "/app/admin/dashboard" : "/app/partner/dashboard"}
    className={linkClass}
    end
  >
    <span className="sidebar-link-icon">
      <House size={20} strokeWidth={2.2} />
    </span>
    {sidebarExpanded && <span>Dashboard</span>}
  </NavLink>

  {!isAdmin && (
    <NavLink to="/app/partner/events/register" className={linkClass}>
      <span className="sidebar-link-icon">
        <Plus size={20} strokeWidth={2.2} />
      </span>
      {sidebarExpanded && <span>Create Event</span>}
    </NavLink>
  )}

  {isAdmin && (
    <NavLink to="/app/admin/events/manage" className={linkClass}>
      <span className="sidebar-link-icon">
        <CalendarDays size={20} strokeWidth={2.2} />
      </span>
      {sidebarExpanded && <span>Manage Events</span>}
    </NavLink>
  )}

  {isAdmin && (
    <NavLink to="/app/admin/analytics" className={linkClass}>
      <span className="sidebar-link-icon">
        <ChartColumn size={20} strokeWidth={2.2} />
      </span>
      {sidebarExpanded && <span>Analytics</span>}
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
    <NavLink to="/app/admin/events/approval" className={linkClass}>
      <span className="sidebar-link-icon">
        <ShieldCheck size={20} strokeWidth={2.2} />
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