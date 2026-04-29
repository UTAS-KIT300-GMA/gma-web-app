import { useEffect, useMemo, useRef, useState } from "react";
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
  Trash2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";

type AppNotification = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt?: Timestamp;
  data?: Record<string, string>;
};

/**
 * @summary Returns the correct CSS class string for a NavLink based on its active state.
 * @param isActive - Whether the NavLink currently matches the active route.
 */
const linkClass = ({ isActive }: { isActive: boolean }) =>
  `sidebar-link ${isActive ? "active" : ""}`;

/**
 * @summary Renders the main application shell with a collapsible sidebar and role-aware navigation.
 */
export function AppLayout() {
  const { user, profile, signOutUser } = useAuth();
  const navigate = useNavigate();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const notificationPanelRef = useRef<HTMLDivElement | null>(null);

  const location = useLocation();

  /**
   * @summary Derives the current page title from the active route pathname.
   */
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
  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  useEffect(() => {
    if (!user) return;

    setNotificationLoading(true);
    const notifQuery = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(20),
    );

    const unsubscribe = onSnapshot(
      notifQuery,
      (snap) => {
        const rows: AppNotification[] = snap.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<AppNotification, "id">),
        }));
        setNotifications(rows);
        setNotificationLoading(false);
      },
      () => setNotificationLoading(false),
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!showNotifications) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target || !notificationPanelRef.current) return;
      if (!notificationPanelRef.current.contains(target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showNotifications]);

  async function markAllNotificationsRead() {
    if (!user) return;
    const unread = notifications.filter((item) => !item.read);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach((item) => {
      batch.update(doc(db, "users", user.uid, "notifications", item.id), {
        read: true,
        readAt: serverTimestamp(),
      });
    });
    await batch.commit();
  }

  async function openNotification(item: AppNotification) {
    if (!user) return;

    if (!item.read) {
      await updateDoc(doc(db, "users", user.uid, "notifications", item.id), {
        read: true,
        readAt: serverTimestamp(),
      });
    }

    const eventId = item.data?.eventId;
    if (eventId && effectiveIsAdmin) {
      navigate("/admin/events/approval");
      setShowNotifications(false);
      return;
    }

    if (eventId && !effectiveIsAdmin) {
      navigate("/partner/events/manage");
      setShowNotifications(false);
      return;
    }

    if (effectiveIsAdmin) {
      navigate("/admin/dashboard");
    } else {
      navigate("/partner/dashboard");
    }
    setShowNotifications(false);
  }

  async function deleteNotification(notificationId: string) {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "notifications", notificationId));
  }

  async function clearAllNotifications() {
    if (!user || notifications.length === 0) return;
    const batch = writeBatch(db);
    notifications.forEach((item) => {
      batch.delete(doc(db, "users", user.uid, "notifications", item.id));
    });
    await batch.commit();
  }

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

            <div className="notification-wrap" ref={notificationPanelRef}>
              <button
                className="dashboard-icon-btn"
                type="button"
                aria-label="Notifications"
                onClick={() => setShowNotifications((prev) => !prev)}
              >
                <Bell size={24} strokeWidth={1.7} />
                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="notification-panel">
                  <div className="notification-panel-head">
                    <strong>Notifications</strong>
                    <div className="notification-head-actions">
                      <button
                        type="button"
                        className="notification-mark-all"
                        onClick={markAllNotificationsRead}
                      >
                        Mark all as read
                      </button>
                      <button
                        type="button"
                        className="notification-clear-all"
                        onClick={clearAllNotifications}
                      >
                        Clear all
                      </button>
                    </div>
                  </div>

                  {notificationLoading ? (
                    <div className="notification-empty">Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div className="notification-empty">No notifications yet.</div>
                  ) : (
                    <ul className="notification-list">
                      {notifications.map((item) => (
                        <li key={item.id}>
                          <div className={`notification-item ${item.read ? "" : "unread"}`}>
                            <button
                              type="button"
                              className="notification-item-content"
                              onClick={() => openNotification(item)}
                            >
                              <div className="notification-item-title">{item.title}</div>
                              <div className="notification-item-body">{item.body}</div>
                            </button>
                            <button
                              type="button"
                              className="notification-delete-btn"
                              aria-label="Delete notification"
                              onClick={(event) => {
                                event.stopPropagation();
                                deleteNotification(item.id);
                              }}
                            >
                              <Trash2 size={14} strokeWidth={2} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

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
