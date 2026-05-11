import { useState, type FormEvent } from "react";
import { Eye, Save, UploadCloud, Video } from "lucide-react";
import "../../styles/admin/learning-publication.css";
import { LearningPreviewModal } from "../../components/LearningPreviewModal";

export function LearningPublicationPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [accessType, setAccessType] = useState<"free" | "paid">("free");
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState("");
  const [fileId, setFileId] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    alert("UI ready. Backend connection will be added in the next commit.");
  }

  return (
    <section className="page-section user-management-page">
      <div className="user-header">
        <div>
          <h1 className="user-title">Learning Content Publication</h1>
          <p className="user-subtitle">
            Upload, preview, and publish learning content for general app users.
          </p>
        </div>
      </div>

      <div className="user-management-card add-user-card">
        <div className="add-user-card-header">
          <div>
            <h2>Content Details</h2>
            <p>Create a learning module that will appear in the mobile app.</p>
          </div>
        </div>

        <form className="add-user-form" onSubmit={handleSubmit}>
          <aside className="add-user-image-panel">
            <h3>Content Preview</h3>
            <p>Preview how this learning content may appear to users.</p>

            <div className="learning-preview-box">
              <div className="learning-preview-video">
                <Video size={42} />
                <span>{cloudinaryPublicId || "Cloudinary video preview"}</span>
              </div>

              <div className="learning-preview-content">
                <strong>{title || "Learning title"}</strong>
                <p>{description || "Learning description will appear here."}</p>

                <span className="learning-preview-pill">
                  {accessType === "paid" ? "Subscribers only" : "Free"}
                </span>

                {duration && <small>{duration}</small>}
              </div>
            </div>

            <button
              type="button"
              className="user-management-btn secondary"
              onClick={() => setIsPreviewOpen(true)}
            >
              <Eye size={16} />
              Preview
            </button>
          </aside>

          <div className="add-user-fields">
            <div className="user-management-form-grid">
              <div className="user-management-field">
                <label>Title *</label>
                <input
                  className="user-management-input"
                  placeholder="e.g. Module 1: Getting Started with GMA Connect"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>

              <div className="user-management-field">
                <label>Duration *</label>
                <input
                  className="user-management-input"
                  placeholder="e.g. 0:15"
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                />
              </div>

              <div className="user-management-field">
                <label>Access Type *</label>
                <select
                  className="user-management-select"
                  value={accessType}
                  onChange={(event) =>
                    setAccessType(event.target.value as "free" | "paid")
                  }
                >
                  <option value="free">Free</option>
                  <option value="paid">Subscribers only</option>
                </select>
              </div>

              <div className="user-management-field">
                <label>Cloudinary Public ID *</label>
                <input
                  className="user-management-input"
                  placeholder="e.g. learning/module-1-intro"
                  value={cloudinaryPublicId}
                  onChange={(event) =>
                    setCloudinaryPublicId(event.target.value)
                  }
                />
              </div>

              <div className="user-management-field">
                <label>Learning Material File URL</label>
                <input
                  className="user-management-input"
                  placeholder="Optional PDF, document, or resource link"
                  value={fileId}
                  onChange={(event) => setFileId(event.target.value)}
                />
              </div>

              <div className="user-management-field col-span">
                <label>Description *</label>
                <textarea
                  className="user-management-input"
                  placeholder="Describe what users will learn from this module."
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={5}
                />
              </div>
            </div>
          </div>

          <div className="add-user-footer">
            <div className="user-management-form-actions">
              <button type="button" className="user-management-btn secondary">
                <Save size={16} />
                Save Draft
              </button>

              <button type="submit" className="user-management-btn primary">
                <UploadCloud size={16} />
                Publish Content
              </button>
            </div>
          </div>
        </form>
      </div>

      <LearningPreviewModal
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        learning={{
          title,
          description,
          duration,
          accessType,
          cloudinaryPublicId,
          fileId,
        }}
      />
    </section>
  );
}
