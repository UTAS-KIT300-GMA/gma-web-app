import "../styles/header.css";
import logo from "../assets/gma-web-logo.png";

type ViewMode = "admin" | "partner";

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export function Header({ viewMode, setViewMode }: HeaderProps) {
  return (
    <header className="header">
      <img src={logo} className="logo" alt="logo" />
      <h2 className="page-title hidden">GMA Connect</h2>

      <div className="header-toggle">
        <div
          className={viewMode === "admin" ? "active" : ""}
          onClick={() => setViewMode("admin")}
        >
          Admin
        </div>

        <div
          className={viewMode === "partner" ? "active" : ""}
          onClick={() => setViewMode("partner")}
        >
          Partner
        </div>
      </div>
    </header>
  );
}
