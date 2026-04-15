import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { completePartnerOnboarding } from "../../services/authService";

const SOCIAL_PLATFORMS = {
  website: "Official Website",
  linkedin: "LinkedIn",
  twitter: "X (Twitter)",
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  snapchat: "Snapchat",
};

/**
 * @summary Renders a dynamic activation stage allowing partners to selectively add social media links.
 */
export function FinalSetupPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [photoURL, setPhotoURL] = useState("");
  const [missionStatement, setMissionStatement] = useState("");

  const [socials, setSocials] = useState({
    website: "",
    facebook: "",
    instagram: "",
    youtube: "",
    tiktok: "",
    snapchat: "",
    linkedin: "",
    twitter: "",
  });

  const [activeFields, setActiveFields] = useState<string[]>(["website"]);

  /**
   * @summary Handles the submission of selected branding and social data.
   * @param {React.SyntheticEvent} e - The form submission event.
   * @throws {Error} Throws if the onboarding service fails to update Firestore.
   */
  async function handleComplete(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const filteredSocials = Object.fromEntries(
        Object.entries(socials).filter(([_, value]) => value.trim() !== ""),
      );

      await completePartnerOnboarding(user.uid, {
        photoURL,
        missionStatement,
        socials: filteredSocials,
        onboardingComplete: true,
      });
    } catch (err) {
      console.error("Onboarding failed:", err);
    } finally {
      setLoading(false);
    }
  }

  /**
   * @summary Adds a social media key to the active visibility list.
   * @param {string} key - The social media platform key.
   */
  const addField = (key: string) => {
    if (key && !activeFields.includes(key)) {
      setActiveFields([...activeFields, key]);
    }
  };

  /**
   * @summary Removes a social field from the UI and clears its value in the state.
   * @param {string} key - The platform key to remove.
   */
  const removeField = (key: string) => {
    setActiveFields(activeFields.filter((f) => f !== key));
    setSocials((prev) => ({ ...prev, [key]: "" }));
  };

  /**
   * @summary Updates a specific social media value in the state object.
   * @param {string} key - The social media platform key.
   * @param {string} value - The URL or handle entered by the user.
   */
  const handleSocialChange = (key: string, value: string) => {
    setSocials((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="login-page">
      <form
        className="login-card"
        style={{ maxWidth: "500px" }}
        onSubmit={handleComplete}
      >
        <h2>Finalize Your Profile</h2>
        <p className="muted">Personalize how migrants see your organization.</p>

        <div className="form-fields">
          <label className="field">
            <span>Profile Photo URL</span>
            <input
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              placeholder="https://..."
            />
          </label>

          <label className="field">
            <span>Mission Statement</span>
            <textarea
              value={missionStatement}
              onChange={(e) => setMissionStatement(e.target.value)}
              placeholder="Briefly describe your goals..."
              rows={3}
            />
          </label>

          <hr />

          <div
            className="social-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <p className="small-title">Social Links</p>
            <select
              className="social-select"
              onChange={(e) => addField(e.target.value)}
              value=""
              style={{ padding: "4px", borderRadius: "4px" }}
            >
              <option value="" disabled>
                + Add Social Media
              </option>
              {Object.entries(SOCIAL_PLATFORMS).map(([key, label]) => (
                <option
                  key={key}
                  value={key}
                  disabled={activeFields.includes(key)}
                >
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="dynamic-fields">
            {activeFields.map((field) => (
              <div
                key={field}
                className="field-row"
                style={{ position: "relative", marginBottom: "1rem" }}
              >
                <label className="field fade-in">
                  <span>
                    {SOCIAL_PLATFORMS[field as keyof typeof SOCIAL_PLATFORMS]}
                  </span>
                  <input
                    placeholder={`https://...`}
                    value={(socials as any)[field]}
                    onChange={(e) => handleSocialChange(field, e.target.value)}
                  />
                </label>

                {field !== "website" && (
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={() => removeField(field)}
                    style={{
                      position: "absolute",
                      right: "-30px",
                      top: "35px",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      color: "red",
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Saving..." : "Finish Setup"}
        </button>
      </form>
    </div>
  );
}
