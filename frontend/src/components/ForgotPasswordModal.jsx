// frontend/src/components/ForgotPasswordModal.jsx
import { useState } from "react";
import api from "../services/api";
import "./ForgotPasswordModal.css";

export default function ForgotPasswordModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await api.requestPasswordReset(email);
      setMessage("✅ Password reset email sent! Check your inbox.");
      setEmail("");
      
      // Close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      setError(err.message || "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-overlay">
      <div className="forgot-password-modal">
        <button className="close-button" onClick={onClose}>✕</button>
        
        <div className="modal-header">
          <span className="modal-icon">🔑</span>
          <h2>Forgot Password?</h2>
        </div>

        <div className="modal-content">
          <p className="modal-description">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {error && (
            <div className="error-message">⚠️ {error}</div>
          )}

          {message && (
            <div className="success-message">✅ {message}</div>
          )}

          <form onSubmit={handleSubmit}>
            <input
              className="email-input"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-submit" 
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </div>
          </form>

          <p className="modal-note">
            <small>You'll receive an email with instructions to reset your password.</small>
          </p>
        </div>
      </div>
    </div>
  );
}