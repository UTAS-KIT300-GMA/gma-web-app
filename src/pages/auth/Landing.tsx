import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/shared/landing.css";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import banner from "../../assets/banner.jpg";

type ViewMode = "admin" | "partner";

/**
 * @summary Renders the public landing page allowing users to select their role and navigate to login or registration.
 */
export function LandingPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("partner");
  const navigate = useNavigate();

  /**
   * @summary Navigates to the login page with the selected view mode as a query parameter.
   * @param mode - The role view to pass to the login page (admin or partner).
   */
  function handleLoginClick(mode: "admin" | "partner") {
    navigate(`/login?view=${mode}`);
  }

  /**
   * @summary Navigates to the partner registration page.
   */
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

      {/* Content section with information about the benefits of joining */ }
      <div className="content">
        <h2>Why Join Us?</h2>
        <p>
          {viewMode === "admin"
            ? "As an administrator, you play a crucial role in managing our platform and ensuring a seamless experience for our users. Your efforts help us maintain the quality and integrity of Guess My Accent."
            : "As a partner, you can expand your reach and grow your business by joining our platform. We provide you with the tools and support you need to succeed. Together, we can make Tassie a wonderful place for everyone!"}
        </p>
      </div>

      {/* Footer section */ }
      <Footer />
    </div>
  );
}
