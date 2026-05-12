import { BookOpen, FileText, Lock, Video } from "lucide-react";

type LearningPreviewData = {
 title?: string;
  description?: string;
  duration?: string;
  accessType?: "free" | "paid";
  cloudinaryPublicId?: string;
  thumbnailUrl?: string;
  fileId?: string;
};

type LearningPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  learning: LearningPreviewData | null;
  actionLabel?: string;
};

export function LearningPreviewModal({
  open,
  onClose,
  learning,
  actionLabel = "Close",
}: LearningPreviewModalProps) {
  if (!open || !learning) return null;

  const isSubscriberOnly = learning.accessType === "paid";

  return (
    <div className="preview-overlay" onClick={onClose}>
      <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mobile-preview-wrap">
          <div className="mobile-preview-phone">
            <div className="mobile-preview-notch" />

            <div className="mobile-preview-screen">
              <div className="android-preview-header">
                <span className="mobile-back-btn">‹</span>
                <h3>GMA Learning</h3>
                <div style={{ width: 20 }} />
              </div>

              <div className="mobile-preview-scroll">
                <div className="learning-phone-section-title">
                  Recommended Learning
                </div>

                <div className="learning-phone-card">
                  <div className="learning-phone-video">
                    {learning.thumbnailUrl ? (
                      <img
                        src={learning.thumbnailUrl}
                        alt="Learning thumbnail"
                        className="learning-phone-thumbnail"
                      />
                    ) : (
                      <>
                        <Video size={42} />
                        <span>
                          {learning.cloudinaryPublicId ||
                            "Cloudinary video preview"}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="learning-phone-content">
                    <div className="learning-phone-title-row">
                      <h4>{learning.title || "Learning title"}</h4>
                      <span className="mobile-bookmark-btn">🔖</span>
                    </div>

                    <div className="learning-phone-meta-row">
                      <span>{learning.duration || "0:00"}</span>

                      <span className="learning-phone-access-pill">
                        {isSubscriberOnly && <Lock size={11} />}
                        {isSubscriberOnly ? "Subscribers only" : "Free"}
                      </span>
                    </div>

                    <p>
                      {learning.description ||
                        "Learning description will appear here."}
                    </p>

                    {learning.fileId ? (
                      <div className="learning-phone-file">
                        <FileText size={16} />
                        <span>View Learning Material</span>
                      </div>
                    ) : (
                      <div className="learning-phone-file muted">
                        <BookOpen size={16} />
                        <span>No learning material attached</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="android-preview-bottom-bar">
                <button
                  type="button"
                  className="mobile-rsvp-btn android-rsvp-btn"
                  onClick={onClose}
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
