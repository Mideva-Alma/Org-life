// frontend/src/components/VerificationModal.jsx
import { useState } from "react";
import "./VerificationModal.css";

export default function VerificationModal({ email, fullName, onSkip, onVerified }) {
  const [sending, setSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleContactAdmin = async () => {
    setSending(true);
    
    try {
      // Option 1: Open email client
      const subject = encodeURIComponent("Account Verification Request");
      const body = encodeURIComponent(
        `Hello Admin,\n\nI would like to request verification for my Org-Life account.\n\n` +
        `Name: ${fullName}\n` +
        `Email: ${email}\n\n` +
        `Please verify my account so I can access all features.\n\n` +
        `Thank you!`
      );
      
      window.location.href = `mailto:admin@orglife.com?subject=${subject}&body=${body}`;
      
      // Option 2: If you have an API endpoint for verification requests
      // await api.requestVerification({ email });
      
      setEmailSent(true);
      
      // After a delay, let user know they can close
      setTimeout(() => {
        setSending(false);
      }, 3000);
      
    } catch (error) {
      console.error("Error sending verification request:", error);
      setSending(false);
      alert("Failed to send verification request. Please try again or contact support directly.");
    }
  };

  const handleSkip = () => {
    if (window.confirm(
      "You can skip verification for now and continue using the app. " +
      "Some features may be limited until you verify your account.\n\n" +
      "You can verify later from your profile settings.\n\n" +
      "Do you want to skip verification?"
    )) {
      onSkip();
    }
  };

  return (
    <div className="verification-overlay">
      <div className="verification-modal">
        <div className="verification-header">
          <span className="verification-icon">🔐</span>
          <h2>Verify Your Account</h2>
        </div>

        <div className="verification-content">
          <p className="verification-greeting">
            Welcome, <strong>{fullName || email}</strong>!
          </p>
          
          <p className="verification-message">
            Your account has been created successfully. To access all features and ensure 
            the security of your financial data, we recommend verifying your email address.
          </p>

          <div className="verification-info">
            <div className="info-item">
              <span className="info-icon">✅</span>
              <span>You can <strong>skip</strong> verification and continue using the app</span>
            </div>
            <div className="info-item">
              <span className="info-icon">🔒</span>
              <span>Your data is safe and private</span>
            </div>
            <div className="info-item">
              <span className="info-icon">📧</span>
              <span>Contact admin anytime to get verified</span>
            </div>
          </div>

          {emailSent ? (
            <div className="email-sent-message">
              <span className="success-icon">✅</span>
              <p>Verification request sent! The admin will review and verify your account.</p>
              <p className="email-note">You can now close this dialog and continue using the app.</p>
              <button className="btn-close" onClick={onSkip}>
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="verification-actions">
                <button 
                  className="btn-contact-admin"
                  onClick={handleContactAdmin}
                  disabled={sending}
                >
                  {sending ? (
                    <span>Sending...</span>
                  ) : (
                    <>
                      <span>📧</span> Contact Admin for Verification
                    </>
                  )}
                </button>

                <button 
                  className="btn-skip"
                  onClick={handleSkip}
                  disabled={sending}
                >
                  Skip for now
                </button>
              </div>

              <p className="verification-note">
                <small>
                  You can also request verification later from your Profile settings.
                  <br />
                  <strong>Admin Email:</strong> admin@orglife.com
                </small>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}