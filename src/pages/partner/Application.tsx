import React, { useState } from "react";

import { useNavigate } from "react-router-dom"; 
import { useAuth } from "../../hooks/useAuth";
import { createInitialProfile } from "../../services/authService"; 

export function ApplicationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Organization State
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("");
  const [abn, setAbn] = useState("");
  const [address, setAddress] = useState("");
  
  // Representative State (Normalized)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [position, setPosition] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!user) return;
    
    setError(null);
    setLoading(true);

    try {
      
      await createInitialProfile(user, {
        email: user.email!,
        password: "", 
        orgName,
        orgType,
        abn,
        address,
        firstName,
        lastName,
        position,
        phoneNumber
      });
      
      // Trigger the "Traffic Controller" to move them to the Pending screen
      navigate("/pending-approval"); 
      
    } catch (err) {
      console.error("Profile creation failed:", err);
      setError("Failed to submit application. Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h2>Partner Application</h2>
        <p className="muted">Step 2: Tell us about your organization</p>
        
        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}

        <div className="form-fields">
          {/* --- Organization Details --- */}
          <label className="field">
            <span>Organization Name</span>
            <input value={orgName} onChange={e => setOrgName(e.target.value)} required />
          </label>

          <label className="field">
            <span>Organization Type</span>
            <select value={orgType} onChange={e => setOrgType(e.target.value)} required>
              <option value="" disabled>Select a type...</option>
              <option value="Non-Profit">Non-Profit / Charity</option>
              <option value="Education">Education</option>
              <option value="Government">Government</option>
              <option value="Corporate">Corporate</option>
              <option value="Small Business">Small Business</option>
            </select>
          </label>

          <label className="field">
            <span>ABN (Australian Business Number)</span>
            <input value={abn} onChange={e => setAbn(e.target.value)} placeholder="11 digits" required />
          </label>

          <label className="field">
            <span>Business Address</span>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, Suburb, State, Postcode" required />
          </label>

          <hr style={{ margin: "20px 0", borderTop: "1px solid #eee" }} />

          {/* --- Representative Details --- */}
          <div style={{ display: "flex", gap: "10px" }}>
            <label className="field" style={{ flex: 1 }}>
              <span>First Name</span>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} required />
            </label>
            <label className="field" style={{ flex: 1 }}>
              <span>Last Name</span>
              <input value={lastName} onChange={e => setLastName(e.target.value)} required />
            </label>
          </div>

          <label className="field">
            <span>Your Position / Title</span>
            <input value={position} onChange={e => setPosition(e.target.value)} placeholder="e.g., Event Manager" required />
          </label>

          <label className="field">
            <span>Direct Phone Number</span>
            <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required />
          </label>
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "20px" }}>
          {loading ? "Submitting..." : "Submit for Approval"}
        </button>
      </form>
    </div>
  );
}