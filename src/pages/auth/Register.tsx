import React from "react";
import { Link } from "react-router-dom";

export function RegisterPage() {
  const mockData = {
    email: "name@example.com",
    password: "password123",
    confirmPassword: "password123",
  };

  return (
    <div className="login-page">
      <div className="login-inner">
        <form className="login-card">
          <h2>Partner Registration</h2>
          <p className="muted">Step 1: Create your secure account</p>

          <div className="form-fields">
            <label className="field">
              <span>Email Address</span>
              <input
                  type="email"
                  defaultValue={mockData.email}
                  placeholder="name@example.com"
                  
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                defaultValue={mockData.password}
                placeholder="Min. 6 characters"
                
              />
            </label>

            <label className="field">
              <span>Confirm Password</span>
              <input
                type="password"
                defaultValue={mockData.confirmPassword}
                placeholder="Repeat password"
                
              />
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-primary">
              Register Account
            </button>
          </div>

          <p className="auth-footer">
              Already have an account?{" "}
              <Link to="/login">Log in here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}