import { useState, type FormEvent } from "react";
import { ArrowLeft, ImagePlus, Info } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/admin/user-management.css";
import { createUserProfile } from "../../services/addUserService";
import type { UserRole } from "../../types/user-types";

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AddUserPage() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [imageName, setImageName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleImageChange(file?: File) {
    if (!file) return;

    if (file.size > 500 * 1024) {
      alert("Profile image must be 500KB or smaller.");
      return;
    }

    const imageBase64 = await readFileAsBase64(file);
    setPhotoURL(imageBase64);
    setImageName(file.name);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !role) {
      alert("Please complete all required fields.");
      return;
    }

    if (!dateOfBirth) {
      alert("Please enter date of birth.");
      return;
    }

    if (password.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setSaving(true);

      await createUserProfile({
        firstName,
        lastName,
        email,
        role,
        dateOfBirth,
        phoneNumber,
        password,
        photoURL,
      });

      alert("User created successfully.");
      navigate("/admin/users");
    } catch (error: any) {
      console.error("Failed to create user:", error);
      alert(error.message || "Failed to create user.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page-section user-management-page">
      <div className="user-header">
        <div>
          <h1 className="user-title">Add New User</h1>
          <p className="user-subtitle">
            Create a new account profile for the platform.
          </p>
        </div>
      </div>

      <Link to="/admin/users" className="user-back-btn">
        <ArrowLeft size={16} />
        Back to Users
      </Link>

      <div className="user-management-card add-user-card">
        <div className="add-user-card-header">
          <div>
            <h2>User Details</h2>
            <p>Fill in the information below to create a new user account.</p>
          </div>
        </div>

        <form className="add-user-form" onSubmit={handleSubmit}>
          <aside className="add-user-image-panel">
            <h3>Profile Image</h3>
            <p>Upload a profile picture for the user.</p>

            <label className="add-user-image-circle">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="sr-only-input"
                onChange={(e) => handleImageChange(e.target.files?.[0])}
              />

              {photoURL ? (
                <img
                  src={photoURL}
                  alt="Profile preview"
                  className="user-management-profile-img"
                />
              ) : (
                <>
                  <ImagePlus size={42} strokeWidth={1.8} />
                  <span>Upload Image</span>
                </>
              )}
            </label>

            <label className="user-management-btn secondary">
              Choose Image
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="sr-only-input"
                onChange={(e) => handleImageChange(e.target.files?.[0])}
              />
            </label>

            {imageName && (
              <p className="add-user-image-note">Selected: {imageName}</p>
            )}

            <p className="add-user-image-note">
              JPG, PNG or WEBP. Max size 500KB.
            </p>
          </aside>

          <div className="add-user-fields">
            <div className="user-management-form-grid">
              <div className="user-management-field">
                <label>First Name *</label>
                <input
                  type="text"
                  className="user-management-input"
                  placeholder="Enter first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div className="user-management-field">
                <label>Last Name *</label>
                <input
                  type="text"
                  className="user-management-input"
                  placeholder="Enter last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div className="user-management-field">
                <label>Email Address *</label>
                <input
                  type="email"
                  className="user-management-input"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="user-management-field">
                <label>Role *</label>
                <select
                  className="user-management-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                >
                  <option value="" disabled>
                    Select role
                  </option>
                  <option value="admin">Admin</option>
                  <option value="partner">Partner</option>
                  <option value="general">General User</option>
                </select>
              </div>

              <div className="user-management-field">
                <label>Date of Birth *</label>
                <input
                  type="date"
                  className="user-management-input"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>

              <div className="user-management-field">
                <label>Phone Number</label>
                <input
                  type="tel"
                  className="user-management-input"
                  placeholder="Enter phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              <div className="user-management-field">
                <label>Password *</label>
                <input
                  type="password"
                  className="user-management-input"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="user-management-field">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  className="user-management-input"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="add-user-help-note">
              <Info size={16} />
              <span>
                Password should be at least 8 characters and include letters and
                numbers.
              </span>
            </div>
          </div>

          <div className="add-user-footer">
            <label className="add-user-checkbox">
              <input type="checkbox" defaultChecked />
              <span>Send email confirmation to the user</span>
            </label>

            <div className="user-management-form-actions">
              <Link to="/admin/users" className="user-management-btn secondary">
                Cancel
              </Link>

              <button
                type="submit"
                className="user-management-btn primary"
                disabled={saving}
              >
                {saving ? "Adding..." : "Add User"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}