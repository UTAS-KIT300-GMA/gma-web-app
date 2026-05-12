import { useEffect, useState, type ReactNode } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { AlarmClock, Bell, CalendarClock, Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../firebase";
import "../../styles/partner/settings.css";

export default function SettingsP() {
  const { user, profile } = useAuth();
  const [eventApprovalNotifications, setEventApprovalNotifications] = useState(true);
  const [eventReminder5Days, setEventReminder5Days] = useState(true);
  const [eventReminder3Days, setEventReminder3Days] = useState(true);

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusKind, setStatusKind] = useState<"ok" | "err" | null>(null);

  useEffect(() => {
    setEventApprovalNotifications(
      profile?.notificationPreferences?.eventApprovalResults ?? true,
    );
    setEventReminder5Days(
      profile?.notificationPreferences?.eventReminder5Days ?? true,
    );
    setEventReminder3Days(
      profile?.notificationPreferences?.eventReminder3Days ?? true,
    );
  }, [profile]);

  async function handleToggle(type: "approval" | "5days" | "3days") {
    if (!user) return;

    let nextValue: boolean;
    let key: string;

    if (type === "approval") {
      nextValue = !eventApprovalNotifications;
      setEventApprovalNotifications(nextValue);
      key = "eventApprovalResults";
    } else if (type === "5days") {
      nextValue = !eventReminder5Days;
      setEventReminder5Days(nextValue);
      key = "eventReminder5Days";
    } else {
      nextValue = !eventReminder3Days;
      setEventReminder3Days(nextValue);
      key = "eventReminder3Days";
    }

    setSaving(true);
    setStatusMessage(null);
    setStatusKind(null);

    try {
      await updateDoc(doc(db, "users", user.uid), {
        notificationPreferences: {
          ...(profile?.notificationPreferences ?? {}),
          [key]: nextValue,
        },
      });
      setStatusMessage("Your preferences were saved.");
      setStatusKind("ok");
    } catch (error) {
      console.error("Failed to save notification settings", error);
      setStatusMessage("Could not save settings. Please try again.");
      setStatusKind("err");
      if (type === "approval") {
        setEventApprovalNotifications(
          profile?.notificationPreferences?.eventApprovalResults ?? true,
        );
      } else if (type === "5days") {
        setEventReminder5Days(
          profile?.notificationPreferences?.eventReminder5Days ?? true,
        );
      } else {
        setEventReminder3Days(
          profile?.notificationPreferences?.eventReminder3Days ?? true,
        );
      }
    } finally {
      setSaving(false);
    }
  }

  const rows: {
    toggle: "approval" | "5days" | "3days";
    icon: ReactNode;
    title: string;
    body: string;
  }[] = [
    {
      toggle: "approval",
      icon: <Bell size={22} strokeWidth={2} aria-hidden />,
      title: "Event approval notifications",
      body: "Get notified when the review team approves or rejects an event you submitted.",
    },
    {
      toggle: "5days",
      icon: <CalendarClock size={22} strokeWidth={2} aria-hidden />,
      title: "Reminder: 5 days before",
      body: "Receive a heads-up when an approved event is one week away.",
    },
    {
      toggle: "3days",
      icon: <AlarmClock size={22} strokeWidth={2} aria-hidden />,
      title: "Reminder: 3 days before",
      body: "A second reminder as the event date approaches.",
    },
  ];

  return (
    <div className="partner-settings-page">
      <header className="partner-settings-hero">
        <h1>Notification settings</h1>
        <p>
          Choose how GMA Connect reaches you about your events. You can change these
          any time; updates apply to future notifications only.
        </p>
      </header>

      <div className="partner-settings-panel" role="region" aria-label="Notification preferences">
        {rows.map((row) => {
          const checked =
            row.toggle === "approval"
              ? eventApprovalNotifications
              : row.toggle === "5days"
                ? eventReminder5Days
                : eventReminder3Days;
          return (
            <div key={row.toggle} className="partner-settings-row">
              <div className="partner-settings-row-head">
                <span className="partner-settings-row-icon">{row.icon}</span>
                <div className="partner-settings-row-text">
                  <h2>{row.title}</h2>
                  <p>{row.body}</p>
                </div>
              </div>
              <label className="partner-settings-switch">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={saving}
                  onChange={() => void handleToggle(row.toggle)}
                  aria-label={row.title}
                />
                <span className="partner-settings-switch-track" />
                <span className="partner-settings-switch-thumb" />
              </label>
            </div>
          );
        })}

        <div className="partner-settings-footer">
          {saving && (
            <div className="partner-settings-saving">
              <Loader2 size={16} strokeWidth={2.2} aria-hidden />
              <span>Saving…</span>
            </div>
          )}
          {statusMessage && !saving && (
            <p
              className={`partner-settings-status partner-settings-status--${statusKind === "ok" ? "ok" : "err"}`}
              role="status"
            >
              {statusMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
