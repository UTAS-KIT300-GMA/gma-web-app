import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { EventRegistrationPage } from "../partner/EventRegistration";
import {
  Eye,
  FileImage,
  FileVideo,
  LinkIcon,
  Tag,
  UploadCloud,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import {
  createLearningContent,
  getLearningContentById,
  updateLearningContent,
} from "../../services/learningService";
import {
  uploadImageToCloudinary,
  uploadVideoToCloudinary,
} from "../../services/cloudinaryService";
import { LearningPreviewModal } from "../../components/LearningPreviewModal";
import { INTEREST_TAG_OPTIONS } from "../../constants/interests";
import { CATEGORIES } from "../../types/event-types";
import type { LearningCategory } from "../../types/learning-types";
import "../../styles/admin/learning-publication.css";

export function LearningPublicationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { learningId } = useParams<{ learningId?: string }>();
  const isEditing = Boolean(learningId);
  const [contentType, setContentType] = useState<"event" | "learning">(
    isEditing ? "learning" : "event",
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [accessType, setAccessType] = useState<"free" | "paid">("free");
  const [fileId, setFileId] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<LearningCategory>("connect");
  const [interestTags, setInterestTags] = useState<string[]>([]);

  const [existingCloudinaryPublicId, setExistingCloudinaryPublicId] =
    useState("");
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState("");
  const [loadingExisting, setLoadingExisting] = useState(false);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  useEffect(() => {
    async function loadExistingLearningContent() {
      if (!learningId) return;

      setLoadingExisting(true);

      try {
        const existing = await getLearningContentById(learningId);

        if (!existing) {
          alert("Learning content not found.");
          navigate("/admin/events/manage?view=learning");
          return;
        }

        const data = existing as {
          title?: string;
          description?: string;
          duration?: string;
          accessType?: "free" | "paid";
          cloudinaryPublicId?: string;
          fileId?: string;
          thumbnailUrl?: string;
          category?: LearningCategory;
          interestTags?: string[];
        };

        setTitle(data.title || "");
        setDescription(data.description || "");
        setDuration(data.duration || "");
        setAccessType(data.accessType || "free");
        setFileId(data.fileId || "");
        setExistingCloudinaryPublicId(data.cloudinaryPublicId || "");
        setExistingThumbnailUrl(data.thumbnailUrl || "");
        setSelectedCategory(data.category || "connect");
        setInterestTags(data.interestTags || []);
      } catch (error) {
        console.error("Failed to load learning content:", error);
        alert("Failed to load learning content.");
      } finally {
        setLoadingExisting(false);
      }
    }

    loadExistingLearningContent();
  }, [learningId, navigate]);

  function toggleTag(key: string) {
    setInterestTags((prev) =>
      prev.includes(key) ? prev.filter((tag) => tag !== key) : [...prev, key],
    );
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setDuration("");
    setAccessType("free");
    setFileId("");
    setVideoFile(null);
    setThumbnailFile(null);
    setSelectedCategory("connect");
    setInterestTags([]);
    setExistingCloudinaryPublicId("");
    setExistingThumbnailUrl("");
  }

  async function publishLearningContent() {
    if (
      !title.trim() ||
      !description.trim() ||
      !duration.trim() ||
      interestTags.length === 0
    ) {
      alert(
        "Please complete all required fields and select at least one interest tag.",
      );
      return;
    }

    if (!videoFile && !existingCloudinaryPublicId) {
      alert("Please upload a video.");
      return;
    }

    if (!user) {
      alert("You must be logged in.");
      return;
    }

    try {
      setSaving(true);
      setUploadingVideo(true);

      const uploadedPublicId = videoFile
        ? await uploadVideoToCloudinary(videoFile)
        : existingCloudinaryPublicId;

      const uploadedThumbnailUrl = thumbnailFile
        ? await uploadImageToCloudinary(thumbnailFile)
        : existingThumbnailUrl;

      setUploadingVideo(false);

      const learningPayload = {
        title,
        description,
        duration,
        accessType,
        cloudinaryPublicId: uploadedPublicId,
        fileId,
        thumbnailUrl: uploadedThumbnailUrl,
        category: selectedCategory,
        categories: [selectedCategory],
        interestTags,
        status: "published" as const,
      };

      if (isEditing && learningId) {
        await updateLearningContent(learningId, learningPayload);
      } else {
        await createLearningContent({
          ...learningPayload,
          createdBy: user.uid,
        });
      }

      alert(
        isEditing
          ? "Learning content updated successfully."
          : "Learning content published successfully.",
      );

      resetForm();

      navigate("/admin/events/manage?view=learning");
    } catch (error) {
      console.error("Failed to publish learning content:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to publish learning content.",
      );
    } finally {
      setSaving(false);
      setUploadingVideo(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await publishLearningContent();
  }
  if (contentType === "event" && !isEditing) {
    return (
      <section className="page-section user-management-page">
        <div className="event-manage-tabs">
          <button
            type="button"
            className="event-manage-tab active"
            onClick={() => setContentType("event")}
          >
            Event
          </button>

          <button
            type="button"
            className="event-manage-tab"
            onClick={() => setContentType("learning")}
          >
            Learning Content
          </button>
        </div>

        <EventRegistrationPage />
      </section>
    );
  }

  if (loadingExisting) {
    return (
      <section className="page-section user-management-page">
        <p>Loading learning content...</p>
      </section>
    );
  }

  return (
    <section className="page-section user-management-page">
      <div className="user-header">
        <div>
          {!isEditing && (
            <div className="event-manage-tabs">
              <button
                type="button"
                className={`event-manage-tab ${contentType === "event" ? "active" : ""}`}
                onClick={() => setContentType("event")}
              >
                Event
              </button>

              <button
                type="button"
                className={`event-manage-tab ${contentType === "learning" ? "active" : ""}`}
                onClick={() => setContentType("learning")}
              >
                Learning Content
              </button>
            </div>
          )}
          <h1 className="user-title">
            {isEditing
              ? "Edit Learning Content"
              : "Learning Content Publication"}
          </h1>
          <p className="user-subtitle">
            {isEditing
              ? "Update existing learning content for general app users."
              : "Upload, preview, and publish learning content for general app users."}
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

        <form className="learning-publication-form" onSubmit={handleSubmit}>
          <div className="learning-upload-grid">
            <section className="learning-upload-panel">
              <div className="learning-upload-header">
                <div className="learning-upload-icon">
                  <FileVideo size={34} />
                </div>

                <div>
                  <h3>Upload Learning Video *</h3>
                  <p>
                    Select a video file to upload to Cloudinary. The uploaded
                    video will be linked to this learning module.
                  </p>
                </div>
              </div>

              <label className="learning-video-upload-dropzone">
                <input
                  type="file"
                  accept="video/*"
                  className="sr-only-input"
                  onChange={(event) =>
                    setVideoFile(event.target.files?.[0] || null)
                  }
                />

                <UploadCloud size={30} />
                <span>
                  {videoFile
                    ? videoFile.name
                    : existingCloudinaryPublicId
                      ? "Current video kept unless replaced"
                      : "Drag & drop your video here"}
                </span>
                <small>or click to browse</small>
                <em>MP4, MOV or WEBM recommended</em>
              </label>
            </section>

            <section className="learning-upload-panel">
              <div className="learning-upload-header">
                <div className="learning-upload-icon">
                  <FileImage size={34} />
                </div>

                <div>
                  <h3>Upload Thumbnail Image</h3>
                  <p>
                    Add an optional thumbnail image for the learning card. This
                    will be stored in Cloudinary.
                  </p>
                </div>
              </div>

              <label className="learning-video-upload-dropzone">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="sr-only-input"
                  onChange={(event) =>
                    setThumbnailFile(event.target.files?.[0] || null)
                  }
                />

                <UploadCloud size={30} />
                <span>
                  {thumbnailFile
                    ? thumbnailFile.name
                    : existingThumbnailUrl
                      ? "Current thumbnail kept unless replaced"
                      : "Drag & drop your image here"}
                </span>
                <small>or click to browse</small>
                <em>PNG, JPG or WEBP recommended</em>
              </label>
            </section>
          </div>

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
              <label>Pillar Category *</label>
              <select
                className="user-management-select"
                value={selectedCategory}
                onChange={(event) =>
                  setSelectedCategory(event.target.value as LearningCategory)
                }
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="user-management-field col-span">
              <label>Learning Material File URL</label>
              <div className="learning-url-input-wrap">
                <LinkIcon size={18} />
                <input
                  className="user-management-input"
                  placeholder="Optional PDF, document, or resource link"
                  value={fileId}
                  onChange={(event) => setFileId(event.target.value)}
                />
              </div>
            </div>

            <div className="user-management-field col-span">
              <label>Description *</label>
              <textarea
                className="user-management-input"
                placeholder="Describe what users will learn from this module."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={6}
              />
            </div>
          </div>

          <section className="learning-tags-panel">
            <div>
              <h3>Interest Tags *</h3>
              <p>Select tags to support personalised recommendations.</p>
            </div>

            <div className="tag-pick event-tag-pick scrollable-tag-pick">
              {INTEREST_TAG_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  className={`tag-chip ${
                    interestTags.includes(key) ? "selected" : ""
                  }`}
                  onClick={() => toggleTag(key)}
                >
                  <Tag size={14} strokeWidth={2} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="add-user-footer learning-publication-footer">
            <div className="user-management-form-actions learning-publication-actions">
              <button
                type="button"
                className="user-management-btn secondary"
                onClick={() => navigate("/admin/events/manage?view=learning")}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="user-management-btn secondary"
                onClick={() => setIsPreviewOpen(true)}
                disabled={saving}
              >
                <Eye size={16} />
                Show Preview
              </button>

              <button
                type="submit"
                className="user-management-btn primary"
                disabled={saving}
              >
                <UploadCloud size={16} />
                {uploadingVideo
                  ? "Uploading Content..."
                  : saving
                    ? isEditing
                      ? "Updating..."
                      : "Publishing..."
                    : isEditing
                      ? "Update Content"
                      : "Publish Content"}
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
          cloudinaryPublicId:
            videoFile?.name || existingCloudinaryPublicId || "",
          thumbnailUrl: thumbnailFile
            ? URL.createObjectURL(thumbnailFile)
            : existingThumbnailUrl,
          fileId,
        }}
      />
    </section>
  );
}
