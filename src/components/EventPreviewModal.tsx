import type { Timestamp } from "firebase/firestore";

type EventPreviewData = {
  title?: string;
  description?: string;
  address?: string;
  image?: string;
  dateTime?: string | Timestamp | null;
  ticketAccess?: string;
};

type EventPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  event: EventPreviewData | null;
  actionLabel?: string;
  onActionClick?: () => void;
};

function formatPreviewDate(value?: string | Timestamp | null) {
  if (!value) return "Date and time not set";

  if (typeof value === "string") return value;

  try {
    return value.toDate().toLocaleString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "Date and time not set";
  }
}

function formatTicketAccess(value?: string) {
  if (!value) return "Not specified";
  return value.replace(/_/g, " ");
}

export function EventPreviewModal({
  open,
  onClose,
  event,
  actionLabel = "Close",
  onActionClick,
}: EventPreviewModalProps) {
  if (!open || !event) return null;

  const handleAction = () => {
    if (onActionClick) {
      onActionClick();
      return;
    }
    onClose();
  };

  return (
    <div className="preview-overlay" onClick={onClose}>
      <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mobile-preview-wrap">
          <div className="mobile-preview-phone">
            <div className="mobile-preview-notch" />

            <div className="mobile-preview-screen">
              <div className="android-preview-header">
                <span className="mobile-back-btn">‹</span>
                <h3>Event Details</h3>
                <div style={{ width: 20 }} />
              </div>

              <div className="mobile-preview-scroll">
                <div className="mobile-preview-image android-preview-image">
                  {event.image ? (
                    <img
                      src={event.image}
                      alt={event.title || "Event"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <span>No image</span>
                  )}
                </div>

                <div className="android-preview-content">
                  <div className="android-preview-title-row">
                    <h4>{event.title || "Untitled Event"}</h4>
                    <span className="mobile-bookmark-btn">🔖</span>
                  </div>

                  <div className="android-preview-date">
                    <span className="mobile-meta-icon">🗓</span>
                    <span>{formatPreviewDate(event.dateTime)}</span>
                  </div>

                  <p className="android-preview-description">
                    {event.description || "No description provided yet."}
                  </p>

                  <div className="android-preview-access-row">
                    <span className="mobile-meta-icon">📍</span>
                    <span>{event.address || "No location provided"}</span>
                  </div>

                  <div className="android-preview-access-row">
                    <span className="mobile-meta-icon">🏷</span>
                    <span style={{ textTransform: "capitalize" }}>
                      {formatTicketAccess(event.ticketAccess)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="android-preview-bottom-bar">
                <button
                  type="button"
                  className="mobile-rsvp-btn android-rsvp-btn"
                  onClick={handleAction}
                >
                  {actionLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
