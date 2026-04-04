import React, { useState, type FormEvent } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth"
import { INTEREST_TAG_OPTIONS } from "../constants/interests";
import { CATEGORIES, type Category } from "../types/event-types";

export function EventRegistrationPage() {
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

  const isAdmin = profile?.role === "admin";

  function toggleTag(key: string) {
    setInterestTags((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  async function onSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!user) return;
    setMessage(null);
    setSaving(true);
    try {
      const start = new Date(dateTime);
      if (Number.isNaN(start.getTime())) {
        setMessage({ type: "err", text: "Choose a valid date and time." });
        setSaving(false);
        return;
      }

      const type: "free" | "paid" =
        memberPrice === 0 && nonMemberPrice === 0 ? "free" : "paid";

      const approvalStatus = isAdmin && publishNow ? "approved" : "pending";

      await addDoc(collection(db, "events"), {
        title: title.trim(),
        description: description.trim(),
        category,
        address: address.trim(),
        image: image.trim(),
        type,
        dateTime: Timestamp.fromDate(start),
        totalTickets,
        memberPrice,
        nonMemberPrice,
        ticketPrices: { member: memberPrice, nonMember: nonMemberPrice },
        attendees: [],
        interestTags,
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
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Could not save event.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <h1>Register event</h1>
      <p className="muted">
        Creates a document in <code>events</code> with the same shape as the mobile
        app. Partners submit as <strong>pending</strong> until an admin approves.
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
        <label className="field">
          <span>Image URL</span>
          <input
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            required
            disabled={saving}
          />
        </label>
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
            {saving ? "Saving…" : "Submit event"}
          </button>
        </div>
      </form>
    </div>
  );
}
