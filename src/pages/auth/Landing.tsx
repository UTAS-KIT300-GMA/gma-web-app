import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/shared/landing.css";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import banner from "../../assets/banner.jpg";

type ViewMode = "admin" | "partner";

/**
 * LandingPage component serves as the entry point for users visiting the site. 
 * It allows users to select their role (admin or partner) and provides appropriate login and registration options based on the selected role.
 * 
 * @params 
 */
export function LandingPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("partner"); // Default to partner view
  const navigate = useNavigate();

  // Handle login button click based on the current view mode
  function handleLoginClick(mode: "admin" | "partner") {
    navigate(`/login?role=${mode}`);
  }

  // Handle register button click for partners
  function handleRegisterClick() {
    navigate("/register");
  }

  return (
    <div className="landing-page">
      {/* Header controls view mode */}
      <Header viewMode={viewMode} setViewMode={setViewMode} />

      {/* Banner section with welcome message and action buttons */ }
      <div className="banner-wrapper">
        <div className="banner-text">
          <h1>Welcome to Our Platform</h1>
          <p>
            {viewMode === "admin"
              ? "Our wonderful administrators help us manage and grow Guess My Accent."
              : "Join us as a partner and grow your business with Guess My Accent."}
          </p>

          {/* Action buttons for login and registration based on view mode */ }
          <div className="bannerBtn">
            <button className="primary-btn" onClick={() => handleLoginClick(viewMode)}>
              {viewMode === "admin" ? "Admin Login" : "Partner Login"}
            </button>

            {viewMode === "partner" && (
              <button className="secondary-btn" onClick={handleRegisterClick}>
                Become a Partner
              </button>
            )}
          </div>
        </div>
        <div className="banner-img-wrapper">
          <img src={banner} className="banner-image" alt="banner" />
        </div>
      </div>
      <Footer />
    </div>
  );
}
