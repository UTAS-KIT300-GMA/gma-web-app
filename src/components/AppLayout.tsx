import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.85)",
  fontWeight: isActive ? 700 : 500,
  textDecoration: "none",
  padding: "10px 14px",
  borderRadius: 8,
  background: isActive ? "rgba(0,0,0,0.15)" : "transparent",
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
