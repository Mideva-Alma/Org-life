// frontend/src/pages/auth.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiArrowLeft, FiUser, FiLock, FiMail, FiPhone, FiCheck, 
  FiAlertCircle, FiAnchor, FiLogIn, FiUserPlus
} from "react-icons/fi";
import { FaAnchor } from "react-icons/fa";
import api from "../services/api";
import VerificationModal from "../components/VerificationModal";
import ForgotPasswordModal from "../components/ForgotPasswordModal";
import "./Auth.css";

export default function Auth() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [currency, setCurrency] = useState("KES");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);
  
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loginMode, setLoginMode] = useState('user');

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setEmail("");
    setPassword("");
    setFullName("");
    setPhoneNumber("");
    setAcceptTerms(false);
    setError("");
    setValidationErrors([]);
    setShowVerificationModal(false);
    setLoginMode('user');
  };

  const switchLoginMode = (mode) => {
    setLoginMode(mode);
    setEmail("");
    setPassword("");
    setError("");
    setValidationErrors([]);
  };

  const validateSignUp = () => {
    const errors = [];
    if (!email) errors.push("Email is required");
    if (!password) errors.push("Password is required");
    if (!fullName) errors.push("Full name is required");
    if (!phoneNumber) errors.push("Phone number is required");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Please enter a valid email address");
    }
    if (password && password.length < 6) {
      errors.push("Password must be at least 6 characters");
    }
    if (phoneNumber) {
      const phoneRegex = /^07\d{8}$|^01\d{8}$|^254\d{9}$/;
      if (!phoneRegex.test(phoneNumber)) {
        errors.push("Phone number must be valid Kenyan format (e.g., 0712345678)");
      }
    }
    if (!acceptTerms) {
      errors.push("You must accept the Terms & Conditions");
    }
    return errors;
  };

  const validateSignIn = () => {
    const errors = [];
    if (!email) errors.push("Email is required");
    if (!password) errors.push("Password is required");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Please enter a valid email address");
    }
    return errors;
  };

  async function signUp() {
    const errors = validateSignUp();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    setError("");
    setValidationErrors([]);

    try {
      const response = await api.signUp({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim(),
        currency
      });

      localStorage.setItem('token', response.token);
      localStorage.setItem('role', response.budgeter.role);
      localStorage.setItem('email', response.budgeter.email);
      
      alert("✅ Account created successfully!");
      
      setPendingUser({
        email: response.budgeter.email,
        full_name: response.budgeter.full_name
      });
      setShowVerificationModal(true);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function signIn() {
    const errors = validateSignIn();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    setError("");
    setValidationErrors([]);

    try {
      const response = await api.signIn({
        email: email.trim(),
        password
      });

      localStorage.setItem('token', response.token);
      localStorage.setItem('role', response.budgeter.role);
      localStorage.setItem('email', response.budgeter.email);

      if (response.budgeter.role === 'admin' || email.trim() === 'admin@gmail.com') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error("🔍 SIGNIN ERROR:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleVerificationSkip = () => {
    setShowVerificationModal(false);
    const role = localStorage.getItem('role');
    navigate(role === 'admin' ? '/admin' : '/dashboard');
  };

  const handleVerificationComplete = () => {
    setShowVerificationModal(false);
    const role = localStorage.getItem('role');
    navigate(role === 'admin' ? '/admin' : '/dashboard');
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
  };

  const handleForgotPasswordClose = () => {
    setShowForgotPassword(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <button className="back-button" onClick={() => navigate("/")}>
          <FiArrowLeft /> Back
        </button>

        <h1 className="auth-title"><FaAnchor /> Org-Life</h1>
        
        {!isSignUp && (
          <div className="auth-tabs">
            <button 
              className={`auth-tab ${loginMode === 'user' ? 'active' : ''}`}
              onClick={() => switchLoginMode('user')}
            >
              <FiUser /> User
            </button>
            <button 
              className={`auth-tab ${loginMode === 'admin' ? 'active' : ''}`}
              onClick={() => switchLoginMode('admin')}
            >
              <FiLock /> Admin
            </button>
          </div>
        )}
        
        <p className="auth-subtitle">
          {isSignUp ? "Create your account" : loginMode === 'admin' ? "Admin Access" : "Welcome back"}
        </p>

        {error && (
          <div className="auth-error"><FiAlertCircle /> {error}</div>
        )}

        {validationErrors.length > 0 && (
          <div className="validation-errors">
            <p className="validation-title"><FiAlertCircle /> Please fix:</p>
            <ul className="validation-list">
              {validationErrors.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <input
          className="auth-input"
          placeholder={loginMode === 'admin' ? "Admin Email" : "Email"}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <input
          className="auth-input"
          placeholder="Password (min 6 chars)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        {isSignUp && (
          <>
            <input
              className="auth-input"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
            />

            <input
              className="auth-input"
              placeholder="Phone Number (0712345678)"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loading}
            />

            <div className="currency-select">
              <label>Currency:</label>
              <select 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)}
                disabled={loading}
              >
                <option value="KES">KES - Kenyan Shilling</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>

            <div className="terms-container">
              <label className="terms-label">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  disabled={loading}
                />
                <FiCheck /> I accept the Terms & Conditions
              </label>
            </div>
          </>
        )}

        <div className="auth-buttons">
          <button 
            className="btn-primary" 
            onClick={isSignUp ? signUp : signIn}
            disabled={loading}
          >
            {loading ? "Processing..." : (isSignUp ? <><FiUserPlus /> Sign Up</> : <><FiLogIn /> Sign In</>)}
          </button>
        </div>

        {!isSignUp && (
          <>
            <div className="auth-links">
              <button 
                className="link-button forgot-password" 
                onClick={handleForgotPassword}
              >
                <FiLock /> Forgot Password?
              </button>
            </div>
            <div className="auth-divider">
              <span>or</span>
            </div>
          </>
        )}

        <p className="auth-toggle" onClick={toggleMode}>
          {isSignUp 
            ? "Already have an account? Sign In" 
            : "Don't have an account? Sign Up"}
        </p>

        {!isSignUp && loginMode === 'admin' && (
          <p className="auth-hint">
            <small>Demo Admin: admin@orglife.com / admin123</small>
          </p>
        )}
      </div>

      {showVerificationModal && pendingUser && (
        <VerificationModal
          email={pendingUser.email}
          fullName={pendingUser.full_name}
          onSkip={handleVerificationSkip}
          onVerified={handleVerificationComplete}
        />
      )}

      {showForgotPassword && (
        <ForgotPasswordModal onClose={handleForgotPasswordClose} />
      )}
    </div>
  );
}