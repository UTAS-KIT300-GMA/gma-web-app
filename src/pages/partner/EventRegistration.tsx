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
import { useEffect, useState, type SyntheticEvent } from "react";
import { EventPreviewModal } from "../../components/EventPreviewModal";
import { db } from "../../firebase";
import { useAuth } from "../../hooks/useAuth";
import { Eye, MapPin, Tag } from "lucide-react";
import { INTEREST_TAG_OPTIONS } from "../../constants/interests";
import { notifyAdminsEventSubmitted } from "../../services/notificationService";
import {
  CATEGORIES,
  type Category,
  type EventRecord,
  type TicketAccessType,
} from "../../types/event-types";

import { EventLocationInput } from "../../components/EventLocationInput";
import { type EventLocation } from "../../services/geoService";

/**
 * @summary Reads a File object and resolves with its base64-encoded data URL string.
 * @param file - The image file to encode.
 */
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function toDateTimeLocalString(ts?: Timestamp | null): string {
  if (!ts?.toDate) return "";

  const date = ts.toDate();
  const pad = (value: number) => String(value).padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * @summary Renders the event creation form allowing partners to draft and submit events for admin review.
 */
export function EventRegistrationPage() {
  const { user, profile } = useAuth();
  const { eventId } = useParams<{ eventId?: string }>();
  const isEditing = !!eventId;
  const isAdmin = profile?.role === "admin";

  // --- State Managed via EventRecord fields ---
  const [draftId, setDraftId] = useState<string | null>(eventId ?? null);
  const [title, setTitle] = useState<EventRecord["title"]>("");
  const [description, setDescription] =
    useState<EventRecord["description"]>("");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([
    "connect",
  ]);
  const [address, setAddress] = useState<EventRecord["address"]>("");
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [dateTime, setDateTime] = useState<string>(""); // UI string for datetime-local
  const [totalTickets, setTotalTickets] =
    useState<EventRecord["totalTickets"]>(50);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageName, setImageName] = useState<string>("");
  const [existingImage, setExistingImage] = useState<EventRecord["image"]>("");
  const [interestTags, setInterestTags] = useState<string[]>([]);
  const [ticketAccess, setTicketAccess] =
    useState<TicketAccessType>("free_for_all");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [loadingExisting, setLoadingExisting] = useState(false);

  const [showPreview, setShowPreview] = useState(false);

  /**
   * @summary Toggles an interest tag in or out of the selected tags list.
   * @param key - The tag key to toggle.
   */
  function toggleTag(key: string) {
    setInterestTags((prev) =>
      prev.includes(key) ? prev.filter((tag) => tag !== key) : [...prev, key],
    );
  }

  /**
   * @summary Toggles an event category in or out of the selected categories list.
   * @param category - The category value to toggle.
   */
  function toggleCategory(category: Category) {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category],
    );
  }

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const activeImageSource = imagePreviewUrl || existingImage;

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

        const data = snap.data() as EventRecord;
        const currentOwner = data.submittedBy;
        const currentUserId = profile?.partnerId ?? user.uid;

        if (!isAdmin && currentOwner && currentOwner !== currentUserId) {
          alert("You do not have permission to edit this event.");
          return;
        }

        setDraftId(snap.id);
        setTitle(data.title || "");
        setDescription(data.description || "");
        setSelectedCategories(
          data.categories || [data.category] || ["connect"],
        );
        setAddress(data.address || "");

        // Handle GeoPoint if it exists on the record
        const loc = (data as any).location; // Firestore GeoPoint
        if (loc) {
          setCoordinates({ lat: loc.latitude, lng: loc.longitude });
        }

        setDateTime(toDateTimeLocalString(data.dateTime));
        setTotalTickets(data.totalTickets || 50);
        setExistingImage(data.image || "");
        setImageName(data.image ? "Current image" : "");
        setInterestTags(data.interestTags || []);
        setTicketAccess(data.ticketAccess || "free_for_all");
      } catch (err) {
        console.error("Failed to load event:", err);
      } finally {
        setLoadingExisting(false);
      }
    }
    loadExistingEvent();
  }, [eventId, user, profile, isAdmin]);

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

  async function buildEventData(
    status: EventRecord["eventApprovalStatus"],
  ): Promise<Partial<EventRecord>> {
    const partnerId = profile?.partnerId ?? user?.uid ?? "";
    const imageBase64 = imageFile
      ? await readFileAsBase64(imageFile)
      : existingImage;

    return {
      title,
      description,
      category: selectedCategories[0] ?? "connect",
      categories: selectedCategories,
      address,
      // Note: mapping 'coordinates' to the GeoPoint location field
      location: coordinates
        ? new GeoPoint(coordinates.lat, coordinates.lng)
        : null,
      dateTime: dateTime ? Timestamp.fromDate(new Date(dateTime)) : null,
      totalTickets,
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
      eventApprovalStatus: status,
      submittedBy: partnerId,
      status: "available",
      updatedAt: Timestamp.now(),
    } as Partial<EventRecord>;
  }

  /**
   * Handles both event submission and draft saving by building the event data
   * and either creating a new document or updating an existing one based on the presence of draftId.
   * Includes validation to ensure required fields are completed before submission.
   * On successful submission, resets the form and shows an alert. On failure, logs the error and shows an alert.
   *
   * @param e
   * @returns
   */
  async function handleSubmit(e: SyntheticEvent) {
    e.preventDefault();
    if (!user) return alert("You must be logged in to submit an event.");

    // Basic validation of required fields before submission inluding checking for empty strings
    // and ensuring at least one category and interest tag is selected
    const missing = [];
    if (!title.trim()) missing.push("Title");
    if (!description.trim()) missing.push("Description");
    if (!dateTime) missing.push("Start date & time");
    if (!address.trim()) missing.push("Address");
    if (!imageFile && !existingImage) missing.push("Event image");
    if (selectedCategories.length === 0) missing.push("At least one category");
    if (interestTags.length === 0) missing.push("At least one interest tag");

    if (missing.length > 0) {
      return alert(
        `Please complete the following before submitting:\n\n• ${missing.join("\n• ")}`,
      );
    }

    try {
      const eventData = await buildEventData("pending");
      const partnerLabel =
        profile?.orgName ||
        `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim() ||
        user.email ||
        "A partner";
      if (draftId) {
        await updateDoc(doc(db, "events", draftId), eventData);
        await notifyAdminsEventSubmitted(draftId, title.trim(), partnerLabel);
      } else {
        const newDoc = await addDoc(collection(db, "events"), {
          ...eventData,
          ticketsSold: 0,
          createdAt: Timestamp.now(),
        });
        await notifyAdminsEventSubmitted(newDoc.id, title.trim(), partnerLabel);
      }
      alert(
        "✅ Event submitted successfully! GMA admin will review your event before publishing.",
      );
      resetForm();
    } catch (err) {
      console.log(err);
      alert(
        "❌ Something went wrong while submitting your event. Please try again.",
      );
    }
  }

  /**
   * Handles saving the current event details as a draft. If a draft already exists (indicated by draftId),
   * it updates that document; otherwise, it creates a new document in the "events" collection with an
   * "eventApprovalStatus" of "draft". Validates that the user is logged in and that a title is provided
   * before allowing the draft to be saved. On successful save, shows an alert confirming the draft has been saved.
   * On failure, logs the error and shows an alert.
   *
   * @returns
   */
  async function handleSaveDraft() {
    if (!user) return alert("You must be logged in to save a draft.");
    if (!title.trim())
      return alert("Please enter a title before saving a draft.");

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
        alert(
          "✅ Draft saved! You can continue editing and submit when ready.",
        );
      }
      resetForm();
    } catch (err) {
      console.error("Event submission error:", err);
      alert("❌ Failed to submit event");
    }
  }

  /**
   * @summary Validates the selected image file size and stores it in component state.
   * @param file - The image file selected by the user, or undefined if none was chosen.
   */
  function handleImageChange(file?: File) {
    if (!file) return;

    if (file.size > 500 * 1024) {
      alert("Image must be 500KB or smaller.");
      return;
    }

    setImageFile(file);
    setImageName(file.name);
  }

  if (loadingExisting)
    return (
      <div className="page dashboard-page">
        <p>Loading event...</p>
      </div>
    );

  return (
    <div className="page dashboard-page event-create-page">
      <section className="dashboard-header event-create-header">
        <h1>{isEditing ? "Edit Event" : "Create Event"}</h1>
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
              <div className="input-with-inline-icon">
                <MapPin size={16} strokeWidth={2} />
                <div className="inline-icon-input-content">
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
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
              />
            </label>

            <label className="field">
              <span>Total tickets</span>
              <input
                type="number"
                min={1}
                value={totalTickets}
                onChange={(e) => setTotalTickets(Number(e.target.value))}
              />
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
                <button
                  key={key}
                  type="button"
                  className={`tag-chip ${interestTags.includes(key) ? "selected" : ""}`}
                  onClick={() => toggleTag(key)}
                >
                  <Tag size={14} strokeWidth={2} />
                  <span>{label}</span>
                </button>
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

      {/* Preview Modal Logic remains as is, now powered by the new states */}
      <EventPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        event={{
          title,
          description,
          address,
          image: activeImageSource,
          dateTime,
          ticketAccess,
        }}
        actionLabel="Close"
      />
    </div>
  );
}
