import { NavLink, Outlet, useNavigate } from "react-router-dom";
// FIX: Use the custom hook for consistency and cleaner code
import { useAuth } from "../hooks/useAuth"; 

/**
 * @summary Dynamic styling for Sidebar links based on active route state.
 */
const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.85)",
  fontWeight: isActive ? 700 : 500,
  textDecoration: "none",
  padding: "10px 14px",
  borderRadius: 8,
  background: isActive ? "rgba(0,0,0,0.15)" : "transparent",
  display: "block", // Ensures the padding applies to the full width
  marginBottom: "4px"
});

/**
 * @summary The core shell of the GMA Portal.
 * Provides navigation and a persistent layout for all authenticated pages.
 */
export function AppLayout() {
  const { profile, signOutUser } = useAuth();
  const navigate = useNavigate();
  
  // Logic Gate: Only show Admin links if the role matches
  const isAdmin = profile?.role === "admin";

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">GMA Portal</div>
        
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" style={linkStyle} end>
            Dashboard
          </NavLink>
          
          <NavLink to="/analytics" style={linkStyle}>
            Analytics
          </NavLink>
          
          <NavLink to="/events/register" style={linkStyle}>
            Register event
          </NavLink>

          {/* Conditional Rendering: Role-Based UI Control */}
          {isAdmin && (
            <NavLink to="/events/approval" style={linkStyle}>
              Approve events
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            {/* Fallback chain: Personal Name -> Email -> Generic 'User' */}
            {profile?.firstName ?? profile?.email ?? "User"}{" "}
            <span className="role-pill">{profile?.role}</span>
          </div>
          
          <button
            type="button"
            className="btn-ghost"
            onClick={async () => {
              await signOutUser();
              // 'replace: true' clears the history so users can't click 'back' to go to the dashboard
              navigate("/login", { replace: true });
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="app-main">
        {/* Outlet renders the specific sub-page (Dashboard, Analytics, etc.) */}
        <Outlet />
      </main>
    </div>
  );
}