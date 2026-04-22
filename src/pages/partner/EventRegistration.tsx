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
import { db } from "../../firebase";
import { useAuth } from "../../hooks/useAuth";
import { CalendarDays, Eye, MapPin, Tag, Ticket } from "lucide-react";
import { INTEREST_TAG_OPTIONS } from "../../constants/interests";
import { CATEGORIES, type Category, type EventRecord, type TicketAccessType } from "../../types/event-types";

import { EventLocationInput } from "../../components/EventLocationInput";
import { type EventLocation } from "../../services/geoService";
import {readFileAsBase64, toDateTimeLocalString} from "../../utils/helpers.ts";


export function EventRegistrationPage() {
  const { user, profile } = useAuth();
  const { eventId } = useParams<{ eventId?: string }>();
  const isEditing = !!eventId;
  const isAdmin = profile?.role === "admin";

  // --- State Managed via EventRecord fields ---
  const [draftId, setDraftId] = useState<string | null>(eventId ?? null);
  const [title, setTitle] = useState<EventRecord["title"]>("");
  const [description, setDescription] = useState<EventRecord["description"]>("");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(["connect"]);
  const [address, setAddress] = useState<EventRecord["address"]>("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [dateTime, setDateTime] = useState<string>(""); // UI string for datetime-local
  const [totalTickets, setTotalTickets] = useState<EventRecord["totalTickets"]>(50);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageName, setImageName] = useState<string>("");
  const [existingImage, setExistingImage] = useState<EventRecord["image"]>("");
  const [interestTags, setInterestTags] = useState<string[]>([]);
  const [ticketAccess, setTicketAccess] = useState<TicketAccessType>("free_for_all");

  const [showPreview, setShowPreview] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");

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
        setSelectedCategories(data.categories || [data.category] || ["connect"]);
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

  async function buildEventData(status: EventRecord["eventApprovalStatus"]): Promise<Partial<EventRecord>> {
    const partnerId = profile?.partnerId ?? user?.uid ?? "";
    const imageBase64 = imageFile ? await readFileAsBase64(imageFile) : existingImage;

    return {
      title,
      description,
      category: selectedCategories[0] ?? "connect",
      categories: selectedCategories,
      address,
      // Note: mapping 'coordinates' to the GeoPoint location field
      location: coordinates ? new GeoPoint(coordinates.lat, coordinates.lng) : null,
      dateTime: dateTime ? Timestamp.fromDate(new Date(dateTime)) : undefined,
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

  async function handleSubmit(e: SyntheticEvent) {
    e.preventDefault();
    if (!user) return alert("You must be logged in");
    if (!title || !description || !dateTime || !address) return alert("Please fill in all required fields");

    try {
      const eventData = await buildEventData("pending");
      if (draftId) {
        await updateDoc(doc(db, "events", draftId), eventData);
      } else {
        await addDoc(collection(db, "events"), {
          ...eventData,
          ticketsSold: 0,
          createdAt: Timestamp.now(),
        });
      }
      alert("✅ Event submitted successfully!");
      resetForm();
    } catch (err) {
      console.log(err);
      alert("❌ Failed to submit event");
    }
  }

  async function handleSaveDraft() {
    if (!user || !title.trim()) return alert("Enter a title to save a draft.");
    try {
      const eventData = await buildEventData("draft");
      if (draftId) {
        await updateDoc(doc(db, "events", draftId), eventData);
        alert("✅ Draft updated!");
      } else {
        const newDoc = await addDoc(collection(db, "events"), {
          ...eventData,
          ticketsSold: 0,
          createdAt: Timestamp.now(),
        });
        setDraftId(newDoc.id);
        alert("✅ Draft saved!");
      }
    } catch (err) {
      console.log(err);
      alert("❌ Failed to save draft");
    }
  }

  // --- UI Logic Helpers ---
  const toggleTag = (key: string) =>
      setInterestTags(prev => prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]);

  const toggleCategory = (cat: Category) =>
      setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);

  const handleImageChange = (file?: File) => {
    if (file && file.size <= 500 * 1024) {
      setImageFile(file);
      setImageName(file.name);
    } else if (file) {
      alert("Image must be 500KB or smaller.");
    }
  };

  if (loadingExisting) return <div className="page dashboard-page"><p>Loading event...</p></div>;

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

        {/* Preview Modal Logic remains as is, now powered by the new states */}
        {showPreview && (
            <div className="preview-overlay" onClick={() => setShowPreview(false)}>
              <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    className="preview-close-btn"
                    onClick={() => setShowPreview(false)}
                >
                  ✕
                </button>

                <div className="mobile-preview-wrap">
                  <div className="mobile-preview-phone">
                    <div className="mobile-preview-notch" />

                    <div className="mobile-preview-screen">
                      {/* Header */}
                      <div className="android-preview-header">
                        <span className="mobile-back-btn">‹</span>
                        <h3>Event Details</h3>
                        <div style={{ width: 20 }} />
                      </div>

                      <div className="mobile-preview-scroll">
                        {/* Image Section */}
                        <div className="mobile-preview-image android-preview-image">
                          {activeImageSource ? (
                              <img
                                  src={activeImageSource}
                                  alt="Event"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                          ) : (
                              <span>No image selected</span>
                          )}
                        </div>

                        {/* Content Section */}
                        <div className="android-preview-content">
                          <div className="android-preview-title-row">
                            <h4>{title || "Untitled Event"}</h4>
                            <span className="mobile-bookmark-btn">🔖</span>
                          </div>

                          <div className="android-preview-date">
                            <span className="mobile-meta-icon">🗓</span>
                            <span>{dateTime || "Date and time not set"}</span>
                          </div>

                          <p className="android-preview-description">
                            {description || "No description provided yet."}
                          </p>

                          <div className="android-preview-access-row">
                            <span className="mobile-meta-icon">🏷</span>
                            <span style={{ textTransform: 'capitalize' }}>
                          {ticketAccess.replace(/_/g, ' ')}
                        </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Action Bar */}
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
