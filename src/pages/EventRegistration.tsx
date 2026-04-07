import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
  GeoPoint
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { INTEREST_TAG_OPTIONS } from "../constants/interests";
import {
  CATEGORIES,
  type Category,
  type EventRecord,
} from "../types/event-types";

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventRegistrationPage() {
  const { eventId } = useParams<{ eventId?: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("connect");
  const [address, setAddress] = useState("");
  const [image, setImage] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [totalTickets, setTotalTickets] = useState(50);
  const [memberPrice, setMemberPrice] = useState(0);
  const [nonMemberPrice, setNonMemberPrice] = useState(0);
  const [interestTags, setInterestTags] = useState<string[]>([]);
  const [publishNow, setPublishNow] = useState(profile?.role === "admin");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "error">(
    eventId ? "loading" : "idle",
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const prevEventIdRef = useRef<string | undefined>(undefined);

  const isAdmin = profile?.role === "admin";
  const isEdit = Boolean(eventId);

  const isValidCategory = (value: unknown): value is (typeof CATEGORIES)[number] => {
    return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
  };

  async function getCoordinates(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
      return null;
    } catch (error) {
      console.error("Geocoding failed:", error);
      return null;
    }
  }

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (file: File) => {
    const MAX_SIZE = 500 * 1024; // 500KB limit

    if (file.size > MAX_SIZE) {
      setMessage({ type: "err", text: "Image is too large. Please select a file under 500KB." });
      return;
    }

    try {
      const base64 = await convertToBase64(file);
      setImage(base64); // This updates your existing 'image' state
      setMessage(null);
    } catch (err) {
      setMessage({ type: "err", text: "Failed to process image." });
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFileChange(file);
    }
  };

  useEffect(() => {
    if (!eventId) {
      setLoadState("idle");
      setLoadError(null);
      if (prevEventIdRef.current !== undefined) {
        setTitle("");
        setDescription("");
        setCategory("connect");
        setAddress("");
        setImage("");
        setDateTime("");
        setTotalTickets(50);
        setMemberPrice(0);
        setNonMemberPrice(0);
        setInterestTags([]);
        setPublishNow(profile?.role === "admin");
      }
      prevEventIdRef.current = undefined;
      return;
    }

    if (!user) return;

    prevEventIdRef.current = eventId;

    let cancelled = false;

    (async () => {
      setLoadState("loading");
      setLoadError(null);
      try {
        const ref = doc(db, "events", eventId);
        const snap = await getDoc(ref);
        if (cancelled) return;
        if (!snap.exists()) {
          setLoadError("Event not found.");
          setLoadState("error");
          return;
        }
        const data = snap.data() as Omit<EventRecord, "eventId">;
        const canEdit =
          isAdmin || data.submittedBy === user.uid;
        if (!canEdit) {
          setLoadError("You do not have permission to edit this event.");
          setLoadState("error");
          return;
        }

        setTitle(data.title ?? "");
        setDescription(data.description ?? "");
        setCategory(isValidCategory(data.category) ? data.category : "connect");
        setAddress(data.address ?? "");
        setImage(data.image ?? "");
        if (data.dateTime?.toDate) {
          setDateTime(toDatetimeLocalValue(data.dateTime.toDate()));
        }
        setTotalTickets(data.totalTickets ?? 50);
        setMemberPrice(data.memberPrice ?? 0);
        setNonMemberPrice(data.nonMemberPrice ?? 0);
        setInterestTags(data.interestTags ?? []);
        setPublishNow(data.approvalStatus === "approved");
        setLoadState("idle");
      } catch {
        if (!cancelled) {
          setLoadError("Could not load this event.");
          setLoadState("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eventId, user, isAdmin]);

  function toggleTag(key: string) {
    setInterestTags((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  async function onSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!user) return;
    if (isEdit && loadState === "loading") return;
    setMessage(null);
    setSaving(true);
    try {
      // Convert address to coordinates
      const coords = await getCoordinates(address);
      if (!coords) {
        throw new Error("Could not verify the address. Please try a more specific address.");
      }

      const start = new Date(dateTime);
      if (Number.isNaN(start.getTime())) {
        setMessage({ type: "err", text: "Choose a valid date and time." });
        setSaving(false);
        return;
      }

      const type: "free" | "paid" =
        memberPrice === 0 && nonMemberPrice === 0 ? "free" : "paid";

      const baseFields = {
        title: title.trim(),
        description: description.trim(),
        category,
        address: address.trim(),
        location: new GeoPoint(coords?.lat ?? 0, coords?.lng ?? 0),
        image: image.trim(),
        type,
        dateTime: Timestamp.fromDate(start),
        totalTickets,
        memberPrice,
        nonMemberPrice,
        ticketPrices: { member: memberPrice, nonMember: nonMemberPrice },
        interestTags,
      };

      if (isEdit && eventId) {
        const patch: Record<string, unknown> = { ...baseFields };
        if (isAdmin) {
          patch.approvalStatus = publishNow ? "approved" : "pending";
        }
        await updateDoc(doc(db, "events", eventId), patch);
        navigate("/events/manage");
      } else {
        const approvalStatus = isAdmin && publishNow ? "approved" : "pending";
        await addDoc(collection(db, "events"), {
          ...baseFields,
          attendees: [],
          submittedBy: user.uid,
          approvalStatus,
          createdAt: serverTimestamp(),
        });
        setMessage({
          type: "ok",
          text:
            approvalStatus === "approved"
              ? "Event published."
              : "Submitted for admin approval.",
        });
        setTitle("");
        setDescription("");
        setAddress("");
        setImage("");
        setDateTime("");
        setInterestTags([]);
      }
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Could not save event.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (isEdit && loadState === "loading") {
    return (
      <div className="page">
        <div className="centered">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (isEdit && loadState === "error") {
    return (
      <div className="page">
        <h1>Edit event</h1>
        <div className="alert error" role="alert">
          {loadError ?? "Something went wrong."}
        </div>
        <p>
          <Link to="/events/manage">Back to manage events</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>{isEdit ? "Edit event" : "Register event"}</h1>
      <p className="muted">
        {isEdit ? (
          <>
            Update this event in <code>events</code>.{" "}
            <Link to="/events/manage">Back to manage events</Link>
          </>
        ) : (
          <>
            Creates a document in <code>events</code> with the same shape as the
            mobile app. Partners submit as <strong>pending</strong> until an admin
            approves.
          </>
        )}
      </p>

      {message && (
        <div className={message.type === "ok" ? "alert ok" : "alert error"}>
          {message.text}
        </div>
      )}

      <form className="form-grid" onSubmit={onSubmit}>
        <label className="field">
          <span>Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={saving}
          />
        </label>
        <label className="field span-2">
          <span>Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            disabled={saving}
          />
        </label>
        <label className="field">
          <span>Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            disabled={saving}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Address</span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            disabled={saving}
          />
        </label>
        <div className="field span-2">
          <span>Event Image</span>
          <div
              className={`image-upload-zone ${image ? 'has-image' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
          >
            {image ? (
                <div className="preview-container">
                  <img src={image} alt="Preview" className="form-image-preview" />
                  <button
                      type="button"
                      className="btn-remove-image"
                      onClick={() => setImage("")}
                  >
                    Remove & Upload New
                  </button>
                </div>
            ) : (
                <label className="upload-placeholder">
                  <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                      style={{ display: 'none' }}
                  />
                  <div className="upload-text">
                    <strong>Click to upload</strong> or drag and drop
                    <p className="small">PNG, JPG (Max 500KB for Firestore optimization)</p>
                  </div>
                </label>
            )}
          </div>
        </div>
        <label className="field">
          <span>Starts at</span>
          <input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            required
            disabled={saving}
          />
        </label>
        <label className="field">
          <span>Total tickets</span>
          <input
            type="number"
            min={1}
            value={totalTickets}
            onChange={(e) => setTotalTickets(Number(e.target.value))}
            required
            disabled={saving}
          />
        </label>
        <label className="field">
          <span>Member price (AUD)</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={memberPrice}
            onChange={(e) => setMemberPrice(Number(e.target.value))}
            disabled={saving}
          />
        </label>
        <label className="field">
          <span>Non-member price (AUD)</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={nonMemberPrice}
            onChange={(e) => setNonMemberPrice(Number(e.target.value))}
            disabled={saving}
          />
        </label>

        {isAdmin && (
          <label className="field span-2 checkbox-row">
            <input
              type="checkbox"
              checked={publishNow}
              onChange={(e) => setPublishNow(e.target.checked)}
              disabled={saving}
            />
            <span>Publish immediately (skip approval queue)</span>
          </label>
        )}

        <div className="field span-2">
          <span>Interest tags</span>
          <div className="tag-pick">
            {INTEREST_TAG_OPTIONS.map(({ key, label }) => (
              <label key={key} className="tag-chip">
                <input
                  type="checkbox"
                  checked={interestTags.includes(key)}
                  onChange={() => toggleTag(key)}
                  disabled={saving}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="form-actions span-2">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Submit event"}
          </button>
        </div>
      </form>
    </div>
  );
}
