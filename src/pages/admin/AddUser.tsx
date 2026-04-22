import { ImagePlus, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import "../../styles/admin/user-management.css";

/**
 * @summary Renders the admin form for creating a new user account on the platform.
 */
export default function AddUserPage() {
  return (
    <section className="page-section user-management-page">
      <div className="user-header">
        <div>
          <h1 className="user-title">Add New User</h1>
          <p className="user-subtitle">
            Create a new account profile for the platform.
          </p>
        </div>

        <Link to="/admin/users" className="user-management-btn ghost">
          <ArrowLeft size={16} />
          Back to Users
        </Link>
      </div>

      <div className="user-management-card add-user-card">
        <div className="add-user-layout">
          <div className="add-user-left">
            <h2 className="add-user-section-title">User Details</h2>

            <form className="user-management-form">
              <div className="user-management-form-grid">
                <div className="user-management-field">
                  <label>First Name *</label>
                  <input
                    type="text"
                    className="user-management-input"
                    placeholder="Enter first name"
                  />
                </div>

                <div className="user-management-field">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    className="user-management-input"
                    placeholder="Enter last name"
                  />
                </div>

                <div className="user-management-field">
                  <label>Email *</label>
                  <input
                    type="email"
                    className="user-management-input"
                    placeholder="email@address.com"
                  />
                </div>

                <div className="user-management-field">
                  <label>Role *</label>
                  <select className="user-management-select" defaultValue="">
                    <option value="" disabled>
                      Select role
                    </option>
                    <option>Admin</option>
                    <option>Partner</option>
                    <option>General User</option>
                  </select>
                </div>

                <div className="user-management-field">
                  <label>Date of Birth *</label>
                  <input type="date" className="user-management-input" />
                </div>

                <div className="user-management-field">
                  <label>Password *</label>
                  <input
                    type="password"
                    className="user-management-input"
                    placeholder="Enter password"
                  />
                </div>

                <div className="user-management-field add-user-field-full">
                  <label>Confirm Password *</label>
                  <input
                    type="password"
                    className="user-management-input"
                    placeholder="Confirm password"
                  />
                </div>
              </div>

              <div className="add-user-image-inline">
                <div className="add-user-image-placeholder small">
                  <ImagePlus size={40} strokeWidth={2} />
                  <span>Upload profile image</span>
                </div>

                <button
                  type="button"
                  className="user-management-btn secondary"
                >
                  Select Image
                </button>
              </div>

              <label className="add-user-checkbox">
                <input type="checkbox" defaultChecked />
                <span>Send email confirmation</span>
              </label>

              <div className="user-management-form-actions">
                <button type="button" className="user-management-btn primary">
                  Add User
                </button>

                <Link
                  to="/admin/users"
                  className="user-management-btn secondary"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>

          <div className="add-user-right" />
        </div>
      </div>
    </section>
  );
}