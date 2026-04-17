import "../styles/shared/header.css";
import logo from "../assets/gma-web-logo.png";

type ViewMode = "admin" | "partner"; // Define the type for view modes to ensure type safety in the component props

/**
 * Header interface defining the expected props for the Header component, 
 * including the current view mode and a function to update it.
 */
interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

/**
 * Header component for the landing page, potentially used across the entire application. 
 * Provides navigation and branding for users.
 * @param viewMode - The current view mode (admin or partner) to determine which toggle is active.
 * @param setViewMode - Function to update the view mode when a toggle is clicked.
 * @returns 
 */
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
