import { useEffect, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../firebase";

export default function SettingsP() {
  const { user, profile } = useAuth();
  const [eventApprovalNotifications, setEventApprovalNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    setEventApprovalNotifications( // Default true so notification is on and partner can turn off if needed
      profile?.notificationPreferences?.eventApprovalResults ?? true,
    );
  }, [profile]);

  async function handleToggle() {
    if (!user) return;

    const nextValue = !eventApprovalNotifications;
    setEventApprovalNotifications(nextValue);
    setSaving(true);
    setStatusMessage(null);

    try {
      await updateDoc(doc(db, "users", user.uid), {
        notificationPreferences: {
          ...(profile?.notificationPreferences ?? {}),
          eventApprovalResults: nextValue,
        },
      });
      setStatusMessage("Notification settings saved.");
    } catch (error) {
      console.error("Failed to save notification settings", error);
      setStatusMessage("Unable to save settings. Please try again.");
      setEventApprovalNotifications(
        profile?.notificationPreferences?.eventApprovalResults ?? true,
      );
    } finally {
      setSaving(false);
    }
  }

  return (  //basic layout and styling for testing.  Update once proven it works
    <div className="settings-page">
      <div className="page-header">
        <h1>Notification Settings</h1>
        <p>Select your settings:.</p>
      </div>

      <section className="settings-card">
        <div className="settings-row">
          <div>
            <h2>Event approval notifications</h2>
            <p>Receive notifications whenever an event is approved or rejected by the review team.</p>
          </div>

          <label className="switch-field">
            <input
              type="checkbox"
              checked={eventApprovalNotifications}
              disabled={saving}
              onChange={handleToggle}
            />
            <span className="switch-slider" />
          </label>
        </div>

        {statusMessage && <p className="settings-status">{statusMessage}</p>}
      </section>
    </div>
  );
}

