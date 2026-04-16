import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/landing.css";
import { Header } from "../components/Header";
import banner from "../assets/banner.jpg";

type ViewMode = "admin" | "partner";

export function LandingPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("admin");
  const navigate = useNavigate();

  function handleLoginClick() {
    navigate(`/login?role=${viewMode}`);
  }

  function handleRegisterClick() {
    navigate("/register?role=partner");
  }

  return (
    <div className="landing-page">
      {/* Header controls view mode */}
      <Header viewMode={viewMode} setViewMode={setViewMode} />

      <div className="banner-wrapper">
        <div className="banner-text">
          <h1>Welcome to Our Platform</h1>
          <p>
            {viewMode === "admin"
              ? "Our wonderful administrators help us manage and grow Guess My Accent."
              : "Join us as a partner and grow your business with Guess My Accent."}
          </p>

          <div className="bannerBtn">
            <button className="primary-btn" onClick={handleLoginClick}>
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
    </div>
  );
}
