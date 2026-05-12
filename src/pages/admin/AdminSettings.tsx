import { useEffect, useRef, useState } from "react";
import {
  Settings,
  Save,
  RotateCcw,
  CheckCircle2,
  Upload,
  CircleUserRound,
  Database,
  Bell,
} from "lucide-react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../hooks/useAuth";
import "../../styles/admin/user-management.css";
import "../../styles/admin/settings.css";

type AdminSettingsForm = {
  platformName: string;
  adminName: string;
  adminEmail: string;
  adminPhotoURL: string;
  maintenanceNoticeEnabled: boolean;
  maintenanceNotice: string;
  adminNotes: string;
};

const defaultSettings: AdminSettingsForm = {
  platformName: "GMA Connect",
  adminName: "",
  adminEmail: "",
  adminPhotoURL: "",
  maintenanceNoticeEnabled: false,
  maintenanceNotice:
    "GMA Connect is currently undergoing scheduled maintenance. Some services may be temporarily unavailable.",
  adminNotes: "",
};

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(" ").filter(Boolean);

  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

function SettingToggle({
  title,
  description,
  enabled,
  onToggle,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="admin-toggle-row">
      <div className="admin-toggle-inner">
        <div>
          <div className="admin-toggle-title">{title}</div>
          <div className="admin-toggle-desc">{description}</div>
        </div>

        <button
          type="button"
          onClick={onToggle}
          aria-label={title}
          className={`admin-toggle-btn ${
            enabled ? "is-enabled" : "is-disabled"
          }`}
        >
          <span
            className={`admin-toggle-knob ${
              enabled ? "is-enabled" : "is-disabled"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { user, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loggedInName =
    `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() ||
    user?.displayName ||
    "Admin User";

  const loggedInEmail =
    user?.email || profile?.email || "admin@gmaconnect.com";

  const [settings, setSettings] = useState<AdminSettingsForm>({
    ...defaultSettings,
    adminName: loggedInName,
    adminEmail: loggedInEmail,
  });

  const [previewImage, setPreviewImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [databaseStatus, setDatabaseStatus] = useState("Checking");
  const [lastUpdated, setLastUpdated] = useState("");

  const profileImage = previewImage || settings.adminPhotoURL;
  const nameParts = splitName(settings.adminName);

  useEffect(() => {
    async function loadSettings() {
      try {
        const settingsRef = doc(db, "adminSettings", "platform");
        const settingsSnap = await getDoc(settingsRef);

        setDatabaseStatus("Connected");

        if (settingsSnap.exists()) {
          const savedData = settingsSnap.data() as Partial<AdminSettingsForm> & {
            updatedAt?: { toDate?: () => Date };
          };

          if (savedData.updatedAt?.toDate) {
            setLastUpdated(savedData.updatedAt.toDate().toLocaleString());
          }

          setSettings({
            ...defaultSettings,
            ...savedData,
            adminName: savedData.adminName || loggedInName,
            adminEmail: savedData.adminEmail || loggedInEmail,
          });
        } else {
          setSettings({
            ...defaultSettings,
            adminName: loggedInName,
            adminEmail: loggedInEmail,
          });
        }
      } catch (error) {
        console.error("Failed to load admin settings:", error);
        setDatabaseStatus("Disconnected");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [loggedInName, loggedInEmail]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;

    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNameChange = (field: "firstName" | "lastName", value: string) => {
    const currentName = splitName(settings.adminName);
    const firstName = field === "firstName" ? value : currentName.firstName;
    const lastName = field === "lastName" ? value : currentName.lastName;

    setSettings((prev) => ({
      ...prev,
      adminName: `${firstName} ${lastName}`.trim(),
    }));
  };

  const handleMaintenanceToggle = () => {
    setSettings((prev) => ({
      ...prev,
      maintenanceNoticeEnabled: !prev.maintenanceNoticeEnabled,
    }));
  };

  const handlePhotoSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    const base64Image = await readFileAsBase64(file);

    setPreviewImage(previewUrl);

    setSettings((prev) => ({
      ...prev,
      adminPhotoURL: base64Image,
    }));

    event.target.value = "";
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await setDoc(
        doc(db, "adminSettings", "platform"),
        {
          ...settings,
          updatedAt: serverTimestamp(),
          updatedBy: loggedInEmail,
        },
        { merge: true },
      );

      setDatabaseStatus("Connected");
      setLastUpdated(new Date().toLocaleString());
      setSaved(true);

      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save admin settings:", error);
      setDatabaseStatus("Disconnected");
      alert("Settings could not be saved. Please check Firestore permissions.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPreviewImage("");

    setSettings({
      ...defaultSettings,
      adminName: loggedInName,
      adminEmail: loggedInEmail,
    });
  };

  if (loading) {
    return (
      <div className="page dashboard-page admin">
        <section className="dashboard-header">
          <h1>Admin Settings</h1>
          <p className="muted dashboard-hero-copy">Loading settings...</p>
        </section>
      </div>
    );
  }

  return (
    <div className="page dashboard-page admin">
      <section className="dashboard-header">
        <h1>Admin Settings</h1>

        <p className="muted dashboard-hero-copy">
          Manage platform configuration.
        </p>
      </section>

      {settings.maintenanceNoticeEnabled && (
        <div className="admin-maintenance-banner">
          <Bell size={18} />
          <span>{settings.maintenanceNotice}</span>
        </div>
      )}

      <section className="dashboard-kpi-grid admin-settings-kpi-grid">
        <article className="stat-card dashboard-stat-card accent">
          <span className="dashboard-stat-title">System Status</span>
          <div className="stat-value">
            {databaseStatus === "Connected" ? "Online" : "Issue"}
          </div>
          <div className="stat-label">Based on connection</div>
        </article>

        <article className="stat-card dashboard-stat-card">
          <span className="dashboard-stat-title">Database</span>
          <div className="stat-value">{databaseStatus}</div>
          <div className="stat-label">Settings status</div>
        </article>

        <article className="stat-card dashboard-stat-card">
          <span className="dashboard-stat-title">Event Approval</span>
          <div className="stat-value">Required</div>
          <div className="stat-label">Current publishing rule</div>
        </article>

        <article className="stat-card dashboard-stat-card">
          <span className="dashboard-stat-title">Admin Account</span>
          <div className="stat-value">Active</div>
          <div className="stat-label">{loggedInEmail}</div>
        </article>
      </section>

      {saved && (
        <div className="admin-settings-success">
          <CheckCircle2 size={20} />
          Settings updated successfully.
        </div>
      )}

      <section className="admin-settings-grid">
        <div className="admin-settings-stack">
          <section className="panel dashboard-panel">
            <div className="dashboard-section-head">
              <div>
                <h2>Admin Profile</h2>
                <p className="muted small">
                  Profile and platform identity details.
                </p>
              </div>

              <Settings size={22} color="#7b295d" />
            </div>

            <div className="admin-profile-grid">
              <div className="admin-photo-card">
                <div className="admin-photo-circle">
                  {profileImage ? (
                    <img
                      key={profileImage}
                      src={profileImage}
                      alt="Admin profile"
                      className="admin-profile-img"
                    />
                  ) : (
                    <CircleUserRound size={56} color="#7b295d" />
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handlePhotoSelect}
                />

                <button
                  type="button"
                  className="user-management-btn secondary admin-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={16} />
                  Upload Photo
                </button>

                <p className="muted small admin-photo-note">
                  Saved with the admin settings record.
                </p>
              </div>

              <div className="user-management-form-grid">
                <div className="user-management-field">
                  <label>Platform Name</label>
                  <input
                    className="user-management-input"
                    name="platformName"
                    value={settings.platformName}
                    onChange={handleInputChange}
                  />
                  <small className="muted">
                    Stored as the platform display name.
                  </small>
                </div>

                <div className="user-management-field">
                  <label>First Name</label>
                  <input
                    className="user-management-input"
                    value={nameParts.firstName}
                    onChange={(event) =>
                      handleNameChange("firstName", event.target.value)
                    }
                  />
                  <small className="muted">Administrator first name.</small>
                </div>

                <div className="user-management-field">
                  <label>Last Name</label>
                  <input
                    className="user-management-input"
                    value={nameParts.lastName}
                    onChange={(event) =>
                      handleNameChange("lastName", event.target.value)
                    }
                  />
                  <small className="muted">Administrator last name.</small>
                </div>

                <div className="user-management-field">
                  <label>Admin Contact Email</label>
                  <input
                    className="user-management-input"
                    type="email"
                    name="adminEmail"
                    value={settings.adminEmail}
                    onChange={handleInputChange}
                  />
                  <small className="muted">
                    Stored as the platform admin contact email.
                  </small>
                </div>
              </div>
            </div>
          </section>

          <section className="panel dashboard-panel">
            <div className="dashboard-section-head">
              <div>
                <h2>Admin Notes</h2>

                <p className="muted small">
                  Internal notes and reminders for platform administration.
                </p>
              </div>

              <Settings size={22} color="#7b295d" />
            </div>

            <div className="user-management-field">
              <label>Internal Notes</label>

              <textarea
                className="user-management-input admin-settings-textarea"
                name="adminNotes"
                value={settings.adminNotes}
                onChange={handleInputChange}
                placeholder="Example: Review pending partner applications before Friday."
              />

              <small className="muted">Saved for admin reference.</small>
            </div>
          </section>
        </div>

        <div className="admin-settings-stack">
          <section className="panel dashboard-panel">
            <div className="dashboard-section-head">
              <div>
                <h2>Display Preferences</h2>
                <p className="muted small">Message display preferences.</p>
              </div>

              <Database size={22} color="#7b295d" />
            </div>

            <div className="user-management-form-grid">
              <SettingToggle
                title="Notice"
                description="Shows or hides the notice preview above."
                enabled={settings.maintenanceNoticeEnabled}
                onToggle={handleMaintenanceToggle}
              />

              <div className="user-management-field">
                <label>Message</label>
                <textarea
                  className="user-management-input admin-settings-textarea"
                  name="maintenanceNotice"
                  value={settings.maintenanceNotice}
                  onChange={handleInputChange}
                />
                <small className="muted">
                  This message appears when Notice is enabled.
                </small>
              </div>
            </div>
          </section>

          <section className="panel dashboard-panel dashboard-highlight-panel">
            <h2 className="dashboard-highlight-title">Save Settings</h2>

            <p className="muted small">
              Save your latest admin configuration.
            </p>

            <div className="dashboard-summary-grid">
              <div className="dashboard-summary-card">
                <span>Last Updated</span>
                <strong>{lastUpdated || "Not Available"}</strong>
              </div>

              <div className="dashboard-summary-card">
                <span>Updated By</span>
                <strong>{loggedInEmail}</strong>
              </div>
            </div>

            <div className="admin-actions-grid">
              <button
                type="button"
                className="user-management-btn primary"
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                className="user-management-btn secondary"
                onClick={handleReset}
                disabled={saving}
              >
                <RotateCcw size={16} />
                Reset Defaults
              </button>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}