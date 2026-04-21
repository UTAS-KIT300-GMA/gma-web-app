import {
  addDoc,
  collection,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  GeoPoint,
} from "firebase/firestore";
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { db } from "../../firebase";
import { useAuth } from "../../hooks/useAuth";
import { useState } from "react";
import {
  CalendarDays, 
  Eye,
  MapPin,
  Tag,
  Ticket,
} from "lucide-react";
import { INTEREST_TAG_OPTIONS } from "../../constants/interests";
import { CATEGORIES, type Category } from "../../types/event-types";

import { EventLocationInput } from "../../components/EventLocationInput";
import { type EventLocation } from "../../services/geoService";

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

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function toDateTimeLocalString(value: unknown): string {
  if (!value || typeof value !== "object" || !("toDate" in value)) return "";

  try {
    const date = (value as Timestamp).toDate();
    const offsetMs = date.getTimezoneOffset() * 60 * 1000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

export function EventRegistrationPage() {
  const { eventId } = useParams();
  const isEditing = !!eventId;

  const { user, profile } = useAuth();
  const { eventId } = useParams<{ eventId?: string }>();

  const [draftId, setDraftId] = useState<string | null>(eventId ?? null);
  const [title, setTitle] = useState(mockInitialForm.title);
  const [description, setDescription] = useState(mockInitialForm.description);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(
    mockInitialForm.categories,
  );
  const [address, setAddress] = useState(mockInitialForm.address);

  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [dateTime, setDateTime] = useState(mockInitialForm.dateTime);
  const [totalTickets, setTotalTickets] = useState<number>(
    mockInitialForm.totalTickets,
  );
  const [imageName, setImageName] = useState(mockInitialForm.imageName);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState<string>("");
  const [interestTags, setInterestTags] = useState<string[]>(
    mockInitialForm.interestTags,
  );
  const [ticketAccess, setTicketAccess] = useState<TicketAccessType>(
    mockInitialForm.ticketAccess,
  );
  const [showPreview, setShowPreview] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);

  useEffect(() => {
    async function loadExistingEvent() {
      if (!eventId || !user) return;

      setLoadingExisting(true);

      try {
        const snap = await getDoc(doc(db, "events", eventId));

        if (!snap.exists()) {
          alert("Event not found.");
          return;
        }

        const data = snap.data();

        const currentOwner = data.submittedBy;
        const currentUserId = profile?.partnerId ?? user.uid;

        if (currentOwner && currentOwner !== currentUserId) {
          alert("You do not have permission to edit this event.");
          return;
        }

        setDraftId(snap.id);
        setTitle(data.title ?? "");
        setDescription(data.description ?? "");

        if (Array.isArray(data.categories) && data.categories.length > 0) {
          setSelectedCategories(data.categories as Category[]);
        } else if (data.category) {
          setSelectedCategories([data.category as Category]);
        } else {
          setSelectedCategories(["connect"]);
        }

        setAddress(data.address ?? "");

        if (data.location) {
          setCoordinates({
            lat: data.location.latitude,
            lng: data.location.longitude,
          });
        } else {
          setCoordinates(null);
        }

        setDateTime(toDateTimeLocalString(data.dateTime));
        setTotalTickets(data.totalTickets ?? 50);
        setExistingImage(data.image ?? "");
        setImageName(data.image ? "Current image" : "");
        setImageFile(null);
        setInterestTags(
          Array.isArray(data.interestTags) ? data.interestTags : [],
        );
        setTicketAccess(
          data.ticketAccess === "members_only"
            ? "members_only"
            : "free_for_all",
        );
      } catch (err) {
        console.error("Failed to load event:", err);
        alert("❌ Failed to load event");
      } finally {
        setLoadingExisting(false);
      }
    }

    loadExistingEvent();
  }, [eventId, user, profile]);

  function resetForm() {
    setDraftId(null);
    setTitle("");
    setDescription("");
    setSelectedCategories(["connect"]);
    setAddress("");
    setCoordinates(null);
    setDateTime("");
    setTotalTickets(50);
    setImageName("");
    setImageFile(null);
    setExistingImage("");
    setInterestTags([]);
    setTicketAccess("free_for_all");
    setShowPreview(false);
  }

  function toggleTag(key: string) {
    setInterestTags((prev) =>
      prev.includes(key) ? prev.filter((tag) => tag !== key) : [...prev, key],
    );
  }

  function toggleCategory(category: Category) {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category],
    );
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();

    if (!user) {
      alert("You must be logged in");
      return;
    }

    if (!title || !description || !dateTime || !address) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const partnerId = profile?.partnerId ?? user.uid;
      const imageBase64 = imageFile ? await readFileAsBase64(imageFile) : "";
      const eventData = {
        title,
        description,
        category: selectedCategories[0] ?? "connect",
        categories: selectedCategories,

        address,

        location: coordinates
          ? new GeoPoint(coordinates.lat, coordinates.lng)
          : null,

        dateTime: Timestamp.fromDate(new Date(dateTime)),

        totalTickets,
        ticketsSold: 0,

        image: imageBase64,

        type: ticketAccess === "free_for_all" ? "free" : "paid",
        ticketAccess,

        memberPrice: 0,
        nonMemberPrice: ticketAccess === "members_only" ? 1 : 0,

        ticketPrices: {
          member: 0,
          nonMember: ticketAccess === "members_only" ? 1 : 0,
        },

        interestTags,

        approvalStatus: "pending",

        submittedBy: partnerId,

        status: "available",

        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, "events"), eventData);

      alert("✅ Event submitted successfully!");

      // Reset form
      setTitle("");
      setDescription("");
      setSelectedCategories(["connect"]);
      setAddress("");
      setCoordinates(null);
      setDateTime("");
      setTotalTickets(50);
      setImageName("");
      setImageFile(null);
      setInterestTags([]);
      setTicketAccess("free_for_all");
      setShowPreview(false);
    } catch (err) {
      console.error("Event submission error:", err);
      alert("❌ Failed to submit event");
    }
  }

  async function handleSaveDraft() {
    if (!user) {
      alert("You must be logged in");
      return;
    }

    if (!title.trim()) {
      alert("Please enter at least an event title before saving a draft.");
      return;
    }

    try {
      const eventData = await buildEventData("draft");

      if (draftId) {
        await updateDoc(doc(db, "events", draftId), eventData);
        alert("✅ Draft updated successfully!");
      } else {
        const newDoc = await addDoc(collection(db, "events"), {
          ...eventData,
          ticketsSold: 0,
          createdAt: Timestamp.now(),
        });

        setDraftId(newDoc.id);
        alert("✅ Draft saved successfully!");
      }
    } catch (err) {
      console.error("Draft save error:", err);
      alert("❌ Failed to save draft");
    }
  }

  function handleImageChange(file?: File) {
    if (!file) return;
    if (file.size > 500 * 1024) {
      alert("Image must be 500KB or smaller.");
      return;
    }
    setImageFile(file);
    setImageName(file.name);
  }

  if (loadingExisting) {
    return (
      <div className="page dashboard-page event-create-page">
        <p>Loading event...</p>
      </div>
    );
  }

  return (
    <div className="page dashboard-page event-create-page">
      <section className="dashboard-header event-create-header">
        <h1>Create Event</h1>
        <p className="muted dashboard-hero-copy">
          {isEditing
            ? "Update the event details below."
            : "Draft and submit your event details for review before publishing."}
        </p>
      </section>

      <form className="event-create-form" onSubmit={handleSubmit}>
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
                <EventLocationInput
                  initialAddress={address}
                  onLocationSelect={(location: EventLocation) => {
                    setAddress(location.displayAddress);
                    setCoordinates({
                      lat: location.latitude,
                      lng: location.longitude,
                    });
                  }}
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
            onClick={handleSaveDraft}
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
                      {imageName ? (
                        <span>{imageName}</span>
                      ) : (
                        <span>Event image</span>
                      )}
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
                          {ticketAccess === "free_for_all"
                            ? "Free Event"
                            : "Subscribers Only"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="android-preview-bottom-bar">
                    <button
                      type="button"
                      className="mobile-rsvp-btn android-rsvp-btn"
                    >
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
