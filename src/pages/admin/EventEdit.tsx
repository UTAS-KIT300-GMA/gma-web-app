import { doc, getDoc, updateDoc, Timestamp, GeoPoint } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { EventPreviewModal } from "../../components/EventPreviewModal";
import { db } from "../../firebase";
import { Eye, MapPin, Tag } from "lucide-react";
import { INTEREST_TAG_OPTIONS } from "../../constants/interests";
import { notifyUsersEventEdited, getEventAttendeeIds } from "../../services/notificationService";
import {
  CATEGORIES,
  type Category,
  type EventRecord,
  type TicketAccessType,
} from "../../types/event-types";
import { EventLocationInput } from "../../components/EventLocationInput";
import { type EventLocation } from "../../services/geoService";

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
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AdminEventEditPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(["connect"]);
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [dateTime, setDateTime] = useState("");
  const [eventDuration, setEventDuration] = useState("");
  const [totalTickets, setTotalTickets] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageName, setImageName] = useState("");
  const [existingImage, setExistingImage] = useState("");
  const [interestTags, setInterestTags] = useState<string[]>([]);
  const [ticketAccess, setTicketAccess] = useState<TicketAccessType>("free_for_all");
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [originalSubmittedBy, setOriginalSubmittedBy] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!imageFile) { setImagePreviewUrl(""); return; }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);

    getDoc(doc(db, "events", eventId))
      .then((snap) => {
        if (!snap.exists()) { alert("Event not found."); navigate("/admin/events/manage"); return; }
        const data = snap.data() as EventRecord;

        setTitle(data.title || "");
        setDescription(data.description || "");
        setSelectedCategories(data.categories?.length ? data.categories : [data.category ?? "connect"]);
        setAddress(data.address || "");
        const loc = (data as any).location;
        if (loc) setCoordinates({ lat: loc.latitude, lng: loc.longitude });
        setDateTime(toDateTimeLocalString(data.dateTime));
        setEventDuration((data as any).eventDuration || "");
        setTotalTickets(data.totalTickets ? String(data.totalTickets) : "");
        setExistingImage(data.image || "");
        setImageName(data.image ? "Current image" : "");
        setInterestTags(data.interestTags || []);
        setTicketAccess(data.ticketAccess || "free_for_all");
        setOriginalSubmittedBy(data.submittedBy);
      })
      .catch(() => alert("Failed to load event."))
      .finally(() => setLoading(false));
  }, [eventId, navigate]);

  function toggleTag(key: string) {
    setInterestTags((prev) => prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]);
  }

  function toggleCategory(category: Category) {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    );
  }

  function handleImageChange(file?: File) {
    if (!file) return;
    if (file.size > 500 * 1024) { alert("Image must be 500KB or smaller."); return; }
    setImageFile(file);
    setImageName(file.name);
  }

  async function handleSave() {
    if (!eventId) return;

    const missing: string[] = [];
    if (!title.trim()) missing.push("Title");
    if (!description.trim()) missing.push("Description");
    if (!dateTime) missing.push("Start date & time");
    if (!eventDuration.trim()) missing.push("Event duration");
    if (!address.trim()) missing.push("Address");
    if (!imageFile && !existingImage) missing.push("Event image");
    if (selectedCategories.length === 0) missing.push("At least one category");
    if (interestTags.length === 0) missing.push("At least one interest tag");

    if (missing.length > 0) {
      alert(`Please complete the following before saving:\n\n• ${missing.join("\n• ")}`);
      return;
    }

    setSaving(true);
    try {
      const imageBase64 = imageFile ? await readFileAsBase64(imageFile) : existingImage;

      await updateDoc(doc(db, "events", eventId), {
        title,
        description,
        category: selectedCategories[0] ?? "connect",
        categories: selectedCategories,
        address,
        location: coordinates ? new GeoPoint(coordinates.lat, coordinates.lng) : null,
        dateTime: dateTime ? Timestamp.fromDate(new Date(dateTime)) : null,
        eventDuration,
        totalTickets: Number(totalTickets),
        image: imageBase64,
        type: ticketAccess === "free_for_all" ? "free" : "paid",
        ticketAccess,
        memberPrice: 0,
        nonMemberPrice: ticketAccess === "members_only" ? 1 : 0,
        ticketPrices: { member: 0, nonMember: ticketAccess === "members_only" ? 1 : 0 },
        interestTags,
        eventApprovalStatus: "approved",
        submittedBy: originalSubmittedBy,
        status: "available",
        updatedAt: Timestamp.now(),
      });

      const attendeeIds = await getEventAttendeeIds(eventId);
      if (attendeeIds.length > 0) {
        await notifyUsersEventEdited(attendeeIds, eventId, title.trim());
      }

      alert("✅ Event updated successfully!");
      navigate("/admin/events/manage");
    } catch (err) {
      console.error("Failed to save event:", err);
      alert("❌ Something went wrong while saving. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const activeImageSource = imagePreviewUrl || existingImage;

  if (loading) return <div className="page dashboard-page"><p>Loading event...</p></div>;

  return (
    <div className="page dashboard-page event-create-page">
      <section className="dashboard-header event-create-header">
        <h1>Edit Event</h1>
        <p className="muted dashboard-hero-copy">
          Changes are published immediately — no approval required.
        </p>
      </section>

      <div className="event-create-form">
        <section className="panel event-create-panel">
          <div className="event-section-head">
            <div>
              <h2>Event details</h2>
              <p className="muted small">Update the core information for this event.</p>
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
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`category-chip ${selectedCategories.includes(category) ? "selected" : ""}`}
                    onClick={() => toggleCategory(category)}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <label className="field span-2">
              <span>Address</span>
              <div className="input-with-inline-icon">
                <MapPin size={16} strokeWidth={2} />
                <div className="inline-icon-input-content" style={{ width: "100%" }}>
                  <EventLocationInput
                    initialAddress={address}
                    onAddressChange={(value) => { setAddress(value); setCoordinates(null); }}
                    onLocationSelect={(location: EventLocation) => {
                      setAddress(location.displayAddress);
                      setCoordinates({ lat: location.latitude, lng: location.longitude });
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
                  <p className="small">PNG, JPG (Max 500KB)</p>
                  {imageName && <p className="uploaded-file-name">Selected: {imageName}</p>}
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
              <span>Event duration</span>
              <select value={eventDuration} onChange={(e) => setEventDuration(e.target.value)}>
                <option value="">Select duration</option>
                <option value="30 minutes">30 minutes</option>
                <option value="1 hour">1 hour</option>
                <option value="2 hours">2 hours</option>
                <option value="3 hours">3 hours</option>
                <option value="Half day">Half day</option>
                <option value="Full day">Full day</option>
                <option value="Multiple days">Multiple days</option>
              </select>
            </label>

            <label className="field">
              <span>Total tickets</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={totalTickets}
                onChange={(e) => { if (/^\d*$/.test(e.target.value)) setTotalTickets(e.target.value); }}
                placeholder="Enter total tickets"
              />
            </label>
          </div>
        </section>

        <section className="panel event-create-panel">
          <div className="event-section-head">
            <div>
              <h2>Ticket access</h2>
              <p className="muted small">Choose how users can access bookings for this event.</p>
            </div>
          </div>

          <div className="ticket-access-grid">
            <button
              type="button"
              className={`ticket-access-card ${ticketAccess === "free_for_all" ? "active" : ""}`}
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
              className={`ticket-access-card ${ticketAccess === "members_only" ? "active" : ""}`}
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
              <p className="muted small">Select tags to help users discover the right event.</p>
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
            <span>Preview</span>
          </button>

          <button
            type="button"
            className="btn-secondary event-action-btn"
            onClick={() => navigate("/admin/events/manage")}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn-primary event-action-btn"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      <EventPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        event={{ title, description, address, image: activeImageSource, dateTime, ticketAccess }}
        actionLabel="Close"
      />
    </div>
  );
}
