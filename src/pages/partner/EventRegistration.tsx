import { useState } from "react";
import {
  Bell,
  CalendarDays,
  CircleUserRound,
  Eye,
  MapPin,
  Tag,
  Ticket,
} from "lucide-react";
import { INTEREST_TAG_OPTIONS } from "../../constants/interests";
import { CATEGORIES, type Category } from "../../types/event-types";

type TicketAccessType = "free_for_all" | "members_only";

const mockInitialForm = {
  title: "",
  description: "",
  categories: ["connect"] as Category[],
  address: "",
  dateTime: "",
  totalTickets: 50,
  imageName: "",
  interestTags: [] as string[],
  ticketAccess: "free_for_all" as TicketAccessType,
};

export function EventRegistrationPage() {
  const [title, setTitle] = useState(mockInitialForm.title);
  const [description, setDescription] = useState(mockInitialForm.description);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(
    mockInitialForm.categories
  );
  const [address, setAddress] = useState(mockInitialForm.address);
  const [dateTime, setDateTime] = useState(mockInitialForm.dateTime);
  const [totalTickets, setTotalTickets] = useState<number>(
    mockInitialForm.totalTickets
  );
  const [imageName, setImageName] = useState(mockInitialForm.imageName);
  const [interestTags, setInterestTags] = useState<string[]>(
    mockInitialForm.interestTags
  );
  const [ticketAccess, setTicketAccess] = useState<TicketAccessType>(
    mockInitialForm.ticketAccess
  );
  const [showPreview, setShowPreview] = useState(false);

  function toggleTag(key: string) {
    setInterestTags((prev) =>
      prev.includes(key) ? prev.filter((tag) => tag !== key) : [...prev, key]
    );
  }

  function toggleCategory(category: Category) {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category]
    );
  }

  function handleMockSubmit(e: React.FormEvent) {
    e.preventDefault();
  }

  function handleMockSaveDraft() {
    // UI only for this subtask
  }

  function handleImageChange(file?: File) {
    if (!file) return;
    setImageName(file.name);
  }

  return (
    <div className="page dashboard-page event-create-page">
      <section className="dashboard-topbar">
        <div className="dashboard-topbar-left">
          <div className="dashboard-topbar-title">Event Management</div>
        </div>

        <div className="dashboard-topbar-right">
          <button
            className="dashboard-icon-btn"
            type="button"
            aria-label="Notifications"
          >
            <Bell size={18} strokeWidth={2.2} />
          </button>

          <div className="dashboard-userbox">
            <div className="dashboard-user-meta">
              <strong>Sandra Lee</strong>
              <span>Partner</span>
            </div>
            <div className="dashboard-user-avatar">
              <CircleUserRound size={18} strokeWidth={2} />
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-header event-create-header">
        <h1>Create Event</h1>
        <p className="muted dashboard-hero-copy">
          Draft and submit your event details for review before publishing.
        </p>
      </section>

      <form className="event-create-form" onSubmit={handleMockSubmit}>
        <section className="panel event-create-panel">
          <div className="event-section-head">
            <div>
              <h2>Event details</h2>
              <p className="muted small">
                Enter the core information for your event submission.
              </p>
            </div>
          </div>

          <div className="form-grid event-form-grid">
            <label className="field span-2">
              <span>Title</span>
              <input
                type="text"
                placeholder="Enter event title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>

            <label className="field span-2">
              <span>Description</span>
              <textarea
                rows={5}
                placeholder="Describe your event, who it is for, and what attendees can expect."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            <div className="field span-2">
              <span>Categories</span>
              <div className="category-chip-group">
                {CATEGORIES.map((category) => {
                  const active = selectedCategories.includes(category);

                  return (
                    <button
                      key={category}
                      type="button"
                      className={`category-chip ${active ? "selected" : ""}`}
                      onClick={() => toggleCategory(category)}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="field span-2">
              <span>Address</span>
              <div className="input-with-icon">
                <MapPin size={16} strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Enter event address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </label>

            <div className="field span-2">
              <span>Event image</span>

              <label className="image-upload-zone legacy-upload-zone">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="sr-only-input"
                  onChange={(e) => handleImageChange(e.target.files?.[0])}
                />

                <div className="legacy-upload-placeholder">
                  <strong>Click to upload</strong>
                  <span> or drag and drop</span>

                  <p className="small">
                    PNG, JPG (Max 500KB for Firestore optimization)
                  </p>

                  {imageName && (
                    <p className="uploaded-file-name">Selected: {imageName}</p>
                  )}
                </div>
              </label>
            </div>

            <label className="field">
              <span>Starts at</span>
              <div className="input-with-icon">
                <CalendarDays size={16} strokeWidth={2} />
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                />
              </div>
            </label>

            <label className="field">
              <span>Total tickets</span>
              <div className="input-with-icon">
                <Ticket size={16} strokeWidth={2} />
                <input
                  type="number"
                  min={1}
                  value={totalTickets}
                  onChange={(e) => setTotalTickets(Number(e.target.value))}
                />
              </div>
            </label>
          </div>
        </section>

        <section className="panel event-create-panel">
          <div className="event-section-head">
            <div>
              <h2>Ticket access</h2>
              <p className="muted small">
                Choose how users can access bookings for this event.
              </p>
            </div>
          </div>

          <div className="ticket-access-grid">
            <button
              type="button"
              className={`ticket-access-card ${
                ticketAccess === "free_for_all" ? "active" : ""
              }`}
              onClick={() => setTicketAccess("free_for_all")}
            >
              <div className="ticket-access-top">
                <div className="ticket-access-radio" aria-hidden="true" />
                <div>
                  <h3>Free for all users</h3>
                  <p>Anyone can book this event at no cost.</p>
                </div>
              </div>

              <div className="ticket-access-badge">Open access</div>
            </button>

            <button
              type="button"
              className={`ticket-access-card ${
                ticketAccess === "members_only" ? "active" : ""
              }`}
              onClick={() => setTicketAccess("members_only")}
            >
              <div className="ticket-access-top">
                <div className="ticket-access-radio" aria-hidden="true" />
                <div>
                  <h3>Members only</h3>
                  <p>Non-members must become a member before booking.</p>
                </div>
              </div>

              <div className="ticket-access-badge">Restricted access</div>
            </button>
          </div>
        </section>

        <section className="panel event-create-panel">
          <div className="event-section-head">
            <div>
              <h2>Interest tags</h2>
              <p className="muted small">
                Select tags to help users discover the right event.
              </p>
            </div>
          </div>

          <div className="field">
            <div className="tag-pick event-tag-pick scrollable-tag-pick">
              {INTEREST_TAG_OPTIONS.map(({ key, label }) => (
                <label
                  key={key}
                  className={`tag-chip ${
                    interestTags.includes(key) ? "selected" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={interestTags.includes(key)}
                    onChange={() => toggleTag(key)}
                  />
                  <Tag size={14} strokeWidth={2} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        <div className="event-form-actions event-form-actions-inline">
          <button
            type="button"
            className="btn-outline event-action-btn event-preview-btn"
            onClick={() => setShowPreview(true)}
          >
            <Eye size={16} strokeWidth={2} />
            <span>Show preview</span>
          </button>

          <button
            type="button"
            className="btn-secondary event-action-btn"
            onClick={handleMockSaveDraft}
          >
            Save draft
          </button>

          <button type="submit" className="btn-primary event-action-btn">
            Submit event
          </button>
        </div>
      </form>

      {showPreview && (
        <div className="preview-overlay" onClick={() => setShowPreview(false)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="preview-close-btn"
              onClick={() => setShowPreview(false)}
              aria-label="Close preview"
            >
              ✕
            </button>

            <div className="mobile-preview-wrap">
              <div className="mobile-preview-phone">
                <div className="mobile-preview-notch" />

<div className="mobile-preview-screen">
  <div className="android-preview-header">
    <button
      type="button"
      className="mobile-back-btn"
      aria-label="Back"
    >
      ‹
    </button>
    <h3>Event Details</h3>
    <div className="mobile-header-spacer" />
  </div>

  <div className="mobile-preview-scroll">
    <div className="mobile-preview-image android-preview-image">
      {imageName ? <span>{imageName}</span> : <span>Event image</span>}
    </div>

    <div className="android-preview-content">
      <div className="android-preview-title-row">
        <h4>{title || "Your event title"}</h4>

        <button
          type="button"
          className="mobile-bookmark-btn"
          aria-label="Bookmark"
        >
          🔖
        </button>
      </div>

      <div className="android-preview-date">
        <span className="mobile-meta-icon">🗓</span>
        <span>{dateTime || "Apr 10, 2026 • 8:00 PM"}</span>
      </div>

      <p className="android-preview-description">
        {description || "No description provided."}
      </p>

      <div className="android-preview-access-row">
        <span className="mobile-meta-icon">🏷</span>
        <span>
          {ticketAccess === "free_for_all" ? "Free Event" : "Subscribers Only"}
        </span>
      </div>
    </div>
  </div>

  <div className="android-preview-bottom-bar">
    <button type="button" className="mobile-rsvp-btn android-rsvp-btn">
      RSVP / Book Now
    </button>
  </div>
</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}