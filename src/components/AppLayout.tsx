import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth"; 
import { RoleGate } from "./RoleGate"; // Use the component you just built!

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.85)",
  fontWeight: isActive ? 700 : 500,
  textDecoration: "none",
  padding: "10px 14px",
  borderRadius: 8,
  background: isActive ? "rgba(0,0,0,0.15)" : "transparent",
  display: "block",
  marginBottom: "4px"
});

export function AppLayout() {
  const { profile, signOutUser } = useAuth();
  const navigate = useNavigate();

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

          <NavLink to="/events/manage" style={linkStyle}>
            Manage events
          </NavLink>

          {/* Clean Security: RoleGate handles the logic and the logging */}
          <RoleGate roles={["admin"]}>
            <NavLink to="/events/approval" style={linkStyle}>
              Approve events
            </NavLink>
          </RoleGate>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            {profile?.firstName ?? profile?.email ?? "User"}{" "}
            <span className="role-pill">{profile?.role}</span>
          </div>
          
          <button
            type="button"
            className="btn-ghost"
            onClick={async () => {
              await signOutUser();
              navigate("/login", { replace: true });
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}