import { useEffect, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../firebase";

export default function SettingsP() {
  const { user, profile } = useAuth();
  const [eventApprovalNotifications, setEventApprovalNotifications] = useState(true);
  const [eventReminder5Days, setEventReminder5Days] = useState(true);
  const [eventReminder3Days, setEventReminder3Days] = useState(true);

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    setEventApprovalNotifications( // Default true so notification is on and partner can turn off if needed
      profile?.notificationPreferences?.eventApprovalResults ?? true,
    );
    setEventReminder5Days(
      profile?.notificationPreferences?.eventReminder5Days ?? true,
    );
    setEventReminder3Days(
      profile?.notificationPreferences?.eventReminder3Days ?? true,
    );
  }, [profile]);

  async function handleToggle(type: 'approval' | '5days' | '3days') {
    if (!user) return;

    let nextValue: boolean;
    let key: string;

    if (type === 'approval') {
      nextValue = !eventApprovalNotifications;
      setEventApprovalNotifications(nextValue);
      key = 'eventApprovalResults';
    } else if (type === '5days') {
      nextValue = !eventReminder5Days;
      setEventReminder5Days(nextValue);
      key = 'eventReminder5Days';
    } else {
      nextValue = !eventReminder3Days;
      setEventReminder3Days(nextValue);
      key = 'eventReminder3Days';
    }

    setSaving(true);
    setStatusMessage(null);

    try {
      await updateDoc(doc(db, "users", user.uid), {
        notificationPreferences: {
          ...(profile?.notificationPreferences ?? {}),
          [key]: nextValue,
        },
      });
      setStatusMessage("Notification settings saved.");
    } catch (error) {
      console.error("Failed to save notification settings", error);
      setStatusMessage("Unable to save settings. Please try again.");
      // Revert the changes if needed
      if (type === 'approval') {
        setEventApprovalNotifications(profile?.notificationPreferences?.eventApprovalResults ?? true);
      } else if (type === '5days') {
        setEventReminder5Days(profile?.notificationPreferences?.eventReminder5Days ?? true);
      } else if (type === '3days'){
        setEventReminder3Days(profile?.notificationPreferences?.eventReminder3Days ?? true);
      }
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
              onChange={() => handleToggle('approval')}
            />
            <span className="switch-slider" />
          </label>
        </div>

        <div className="settings-row">
          <div>
            <h2>Event reminder (5 days before)</h2>
            <p>Receive a reminder when your event is coming up in 5 days.</p>
          </div>

          <label className="switch-field">
            <input
              type="checkbox"
              checked={eventReminder5Days}
              disabled={saving}
              onChange={() => handleToggle('5days')}
            />
            <span className="switch-slider" />
          </label>
        </div>

        <div className="settings-row">
          <div>
            <h2>Event reminder (3 days before)</h2>
            <p>Receive a reminder when your event is starting in 3 days.</p>
          </div>

          <label className="switch-field">
            <input
              type="checkbox"
              checked={eventReminder3Days}
              disabled={saving}
              onChange={() => handleToggle('3days')}
            />
            <span className="switch-slider" />
          </label>
        </div>

        {statusMessage && <p className="settings-status">{statusMessage}</p>}
      </section>
    </div>
  );
}

