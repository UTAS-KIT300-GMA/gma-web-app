import { useEffect, useMemo, useState, useRef } from "react";
import { Pencil, Trash2, Mail, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import "../../styles/admin/user-management.css";
import type {
  UserProfile,
  UserRole,
  AccountStatus,
} from "../../types/user-types";
import {
  deleteUserProfile,
  getUsers,
  updateUserProfile,
} from "../../services/userManagementService";

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getDisplayName(user: UserProfile) {
  return (
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    user.orgName ||
    "Unnamed user"
  );
}

function formatRole(role: UserRole) {
  if (role === "admin") return "Admin";
  if (role === "partner") return "Partner";
  return "General User";
}

function formatStatus(status?: AccountStatus) {
  if (status === "approved") return "Active";
  if (status === "pending_approval") return "Pending";
  if (status === "rejected") return "Inactive";
  return "Inactive";
}

function getBadgeClass(status?: AccountStatus) {
  if (status === "approved") return "active";
  if (status === "pending_approval") return "pending";
  return "inactive";
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "general" as UserRole,
    partnerApprovalStatus: "approved" as AccountStatus,
    phoneNumber: "",
  });

  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        const data = await getUsers();
        setUsers(data);
        setSelectedUser(data[0] || null);
      } catch (error: any) {
        console.error("Failed to update user:", error);
        alert(error.message || "Failed to update user.");
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  useEffect(() => {
    if (!selectedUser) return;

    setForm({
      firstName: selectedUser.firstName || "",
      lastName: selectedUser.lastName || "",
      email: selectedUser.email || "",
      role: selectedUser.role || "general",
      partnerApprovalStatus: selectedUser.partnerApprovalStatus || "approved",
      phoneNumber: selectedUser.phoneNumber || "",
    });
    setPreviewImage(selectedUser.photoURL || null);
  }, [selectedUser]);

  const filteredUsers = useMemo(() => {
    const keyword = searchText.toLowerCase().trim();

    if (!keyword) return users;

    return users.filter((user) => {
      const searchableText = [
        getDisplayName(user),
        user.email,
        user.role,
        user.partnerApprovalStatus,
        user.orgName,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [users, searchText]);

  const handleSave = async () => {
    if (!selectedUser) return;

    try {
      let photoURL = selectedUser.photoURL || "";

      if (selectedPhotoFile) {
        photoURL = await readFileAsBase64(selectedPhotoFile);
      }

      const updatedData = {
        ...form,
        photoURL,
      };

      await updateUserProfile(selectedUser.id, updatedData);

      setUsers((prev) =>
        prev.map((user) =>
          user.id === selectedUser.id ? { ...user, ...updatedData } : user,
        ),
      );

      setSelectedUser((prev) => (prev ? { ...prev, ...updatedData } : prev));
      setPreviewImage(photoURL || null);
      setSelectedPhotoFile(null);

      alert("User updated successfully.");
    } catch (error) {
      console.error("Failed to update user:", error);
      alert("Failed to update user.");
    }
  };

  const handleDelete = async (user: UserProfile) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${getDisplayName(user)}?`,
    );

    if (!confirmed) return;

    try {
      await deleteUserProfile(user.id);

      setUsers((prev) => prev.filter((item) => item.id !== user.id));

      if (selectedUser?.id === user.id) {
        setSelectedUser(null);
        setIsEditOpen(false);
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Failed to delete user.");
    }
  };

  const resetFormToSelectedUser = () => {
    if (!selectedUser) return;

    setForm({
      firstName: selectedUser.firstName || "",
      lastName: selectedUser.lastName || "",
      email: selectedUser.email || "",
      role: selectedUser.role || "general",
      partnerApprovalStatus: selectedUser.partnerApprovalStatus || "approved",
      phoneNumber: selectedUser.phoneNumber || "",
    });

    setPreviewImage(selectedUser.photoURL || null);
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.size > 500 * 1024) {
      alert("Profile image must be 500KB or smaller.");
      return;
    }

    setSelectedPhotoFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  return (
    <section className="page-section user-management-page">
      <div className="user-header">
        <div>
          <h1 className="user-title">Users Management</h1>
          <p className="user-subtitle">
            View, search, and manage user accounts.
          </p>
        </div>
      </div>

      <div className="user-management-toolbar">
        <div className="user-management-toolbar-left">
          <Link to="/admin/users/add" className="user-add-btn">
            Add New User
          </Link>
        </div>

        <div className="user-management-toolbar-right">
          <input
            type="text"
            placeholder="Search users..."
            className="user-management-search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </div>
      </div>

      <div className="user-management-stack">
        <div className="user-management-card">
          <div className="user-management-card-header">
            <h2>User List</h2>
            <p className="user-management-card-note">
              {loading
                ? "Loading users..."
                : `Showing ${filteredUsers.length} users`}
            </p>
          </div>

          <div className="user-management-table-wrap">
            <table className="user-management-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{getDisplayName(user)}</td>
                    <td>{user.email}</td>
                    <td>{formatRole(user.role)}</td>
                    <td>
                      <span
                        className={`user-management-badge ${getBadgeClass(
                          user.partnerApprovalStatus,
                        )}`}
                      >
                        {formatStatus(user.partnerApprovalStatus)}
                      </span>
                    </td>

                    <td>
                      <div className="user-management-actions">
                        <button
                          type="button"
                          className="user-management-icon-btn"
                          onClick={() => {
                            setSelectedUser(user);
                            setPreviewImage(user.photoURL || null);
                            setSelectedPhotoFile(null);
                            setIsEditOpen(true);
                          }}
                        >
                          <Pencil className="user-action-icon" />
                        </button>

                        <button
                          type="button"
                          className="user-management-icon-btn danger"
                          onClick={() => handleDelete(user)}
                        >
                          <Trash2 className="user-action-icon" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5}>No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {isEditOpen && selectedUser && (
        <div className="user-edit-overlay" onClick={() => setIsEditOpen(false)}>
          <aside
            className="user-edit-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="user-edit-drawer-header">
              <h2>User Details</h2>
              <button
                type="button"
                className="user-edit-close-btn"
                onClick={() => {
                  setIsEditOpen(false);
                  setSelectedPhotoFile(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="user-management-profile-box">
              <div className="user-management-image-placeholder">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Profile"
                    className="user-management-profile-img"
                  />
                ) : (
                  "Profile Image"
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handlePhotoSelect}
              />

              <button
                type="button"
                className="user-management-btn secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={16} />
                Upload Photo
              </button>
            </div>

            <form className="user-management-form">
              <div className="user-management-form-grid">
                <div className="user-management-field">
                  <label>First Name</label>
                  <input
                    className="user-management-input"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                  />
                </div>

                <div className="user-management-field">
                  <label>Last Name</label>
                  <input
                    className="user-management-input"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
                    }
                  />
                </div>

                <div className="user-management-field">
                  <label>Email</label>
                  <input
                    className="user-management-input"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>

                <div className="user-management-field">
                  <label>Role</label>
                  <select
                    className="user-management-select"
                    value={form.role}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value as UserRole })
                    }
                  >
                    <option value="admin">Admin</option>
                    <option value="partner">Partner</option>
                    <option value="general">General User</option>
                  </select>
                </div>

                <div className="user-management-field">
                  <label>Status</label>
                  <select
                    className="user-management-select"
                    value={form.partnerApprovalStatus}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        partnerApprovalStatus: e.target.value as AccountStatus,
                      })
                    }
                  >
                    <option value="approved">Active</option>
                    <option value="pending_approval">Pending</option>
                    <option value="rejected">Inactive</option>
                  </select>
                </div>

                <div className="user-management-field">
                  <label>Phone</label>
                  <input
                    className="user-management-input"
                    value={form.phoneNumber}
                    onChange={(e) =>
                      setForm({ ...form, phoneNumber: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="user-management-form-actions">
                <button
                  type="button"
                  className="user-management-btn primary"
                  onClick={handleSave}
                >
                  Save Changes
                </button>

                <button
                  type="button"
                  className="user-management-btn secondary"
                  onClick={resetFormToSelectedUser}
                >
                  Discard Changes
                </button>

                <a
                  className="user-management-btn ghost"
                  href={`mailto:${selectedUser.email}`}
                >
                  <Mail size={16} />
                  Contact User
                </a>
              </div>
            </form>
          </aside>
        </div>
      )}
    </section>
  );
}
