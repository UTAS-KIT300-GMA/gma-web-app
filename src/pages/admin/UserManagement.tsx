import { Pencil, Trash2, Mail, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import "../../styles/admin/user-management.css";

const mockUsers = [
  { id: 1, name: "Emily Carter", email: "emily.carter@gmail.com", role: "Admin", status: "Active" },
  { id: 2, name: "Daniel Kodos", email: "daniel.kodos@gmail.com", role: "Partner", status: "Pending" },
  { id: 3, name: "Sophia Marhaba", email: "sophia.marhaba@gmail.com", role: "General User", status: "Active" },
  { id: 4, name: "Lina Biryani", email: "lina.biryani@gmail.com", role: "Partner", status: "Active" },
  { id: 5, name: "Omar Noodles", email: "omar.noodles@gmail.com", role: "General User", status: "Inactive" },
  { id: 6, name: "Maya Chutney", email: "maya.chutney@gmail.com", role: "Partner", status: "Pending" },
  { id: 7, name: "Rafi Ramen", email: "rafi.ramen@gmail.com", role: "General User", status: "Active" },
  { id: 8, name: "Nina Pickles", email: "nina.pickles@gmail.com", role: "Admin", status: "Active" },
  { id: 9, name: "Tariq Samosa", email: "tariq.samosa@gmail.com", role: "Partner", status: "Inactive" },
  { id: 10, name: "Asha Papadum", email: "asha.papadum@gmail.com", role: "General User", status: "Active" },
  { id: 11, name: "Kian Chilli", email: "kian.chilli@gmail.com", role: "Partner", status: "Pending" },
  { id: 12, name: "Zara Falooda", email: "zara.falooda@gmail.com", role: "General User", status: "Active" },
];

export default function UserManagementPage() {
  return (
    <section className="page-section user-management-page">
      
      {/* Header */}
      <div className="user-header">
        <div>
          <h1 className="user-title">Users Management</h1>
          <p className="user-subtitle">
            View, search, and manage user accounts.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="user-management-toolbar">
        <div className="user-management-toolbar-left">
          
          {/* ✅ FIXED BUTTON */}
          <Link to="/admin/users/add" className="user-add-btn">
            Add New User
          </Link>

        </div>

        <div className="user-management-toolbar-right">
          <input
            type="text"
            placeholder="Search users..."
            className="user-management-search"
          />
        </div>
      </div>

      {/* Content */}
      <div className="user-management-stack">

        {/* User List */}
        <div className="user-management-card">
          <div className="user-management-card-header">
            <h2>User List</h2>
            <p className="user-management-card-note">Showing 12 users</p>
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
                {mockUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <span
                        className={`user-management-badge ${
                          user.status === "Active"
                            ? "active"
                            : user.status === "Pending"
                            ? "pending"
                            : "inactive"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>

                    <td>
                      <div className="user-management-actions">
                        <button className="user-management-icon-btn">
                          <Pencil className="user-action-icon" />
                        </button>

                        <button className="user-management-icon-btn danger">
                          <Trash2 className="user-action-icon" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Details */}
        <div className="user-management-card">
          <h2>User Details</h2>

          <div className="user-management-profile-box">
            <div className="user-management-image-placeholder">
              Profile Image
            </div>

            <button className="user-management-btn secondary">
              <Upload size={16} />
              Upload Photo
            </button>
          </div>

          <form className="user-management-form">
            <div className="user-management-form-grid">

              <div className="user-management-field">
                <label>First Name</label>
                <input className="user-management-input" defaultValue="Emily" />
              </div>

              <div className="user-management-field">
                <label>Last Name</label>
                <input className="user-management-input" defaultValue="Carter" />
              </div>

              <div className="user-management-field">
                <label>Email</label>
                <input className="user-management-input" defaultValue="emily.carter@gmaconnect.com" />
              </div>

              <div className="user-management-field">
                <label>Date of Birth</label>
                <input type="date" className="user-management-input" defaultValue="1998-06-15" />
              </div>

              <div className="user-management-field">
                <label>Role</label>
                <select className="user-management-select" defaultValue="Admin">
                  <option>Admin</option>
                  <option>Partner</option>
                  <option>General User</option>
                </select>
              </div>

              <div className="user-management-field">
                <label>Status</label>
                <select className="user-management-select" defaultValue="Active">
                  <option>Active</option>
                  <option>Pending</option>
                  <option>Inactive</option>
                </select>
              </div>

              <div className="user-management-field">
                <label>Phone</label>
                <input className="user-management-input" defaultValue="+61 412 345 678" />
              </div>

            </div>

            <div className="user-management-field">
              <label>Notes</label>
              <textarea
                className="user-management-textarea"
                defaultValue="Responsible for overseeing platform content and approvals."
              />
            </div>

            <div className="user-management-form-actions">
              <button className="user-management-btn primary">
                Save Changes
              </button>

              <button className="user-management-btn secondary">
                Discard Changes
              </button>

              <button className="user-management-btn ghost">
                <Mail size={16} />
                Contact User
              </button>
            </div>
          </form>
        </div>

      </div>
    </section>
  );
}