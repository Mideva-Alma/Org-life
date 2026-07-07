// frontend/src/pages/auth.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./auth.css";

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

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setEmail("");
    setPassword("");
    setFullName("");
    setPhoneNumber("");
    setAcceptTerms(false);
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
    // ...unchanged validation...
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
      alert("✅ Account created successfully!");
      navigate("/dashboard"); // new budgeters are plain users
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function signIn() {
    try {
      const response = await api.signIn({
        email: email.trim(),
        password
      });

      localStorage.setItem('token', response.token);
      localStorage.setItem('role', response.budgeter.role);
      localStorage.setItem('email', response.budgeter.email);
      navigate(response.budgeter.role === 'admin' ? '/admin' : '/dashboard');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <button className="back-button" onClick={() => navigate("/")}>
          ← Back
        </button>

        <h1 className="auth-title">⚓ Org-Life</h1>
        <p className="auth-subtitle">
          {isSignUp ? "Create your account" : "Welcome back"}
        </p>

        {error && (
          <div className="auth-error">⚠️ {error}</div>
        )}

        {validationErrors.length > 0 && (
          <div className="validation-errors">
            <p className="validation-title">⚠️ Please fix:</p>
            <ul className="validation-list">
              {validationErrors.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <input
          className="auth-input"
          placeholder="Email"
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
                I accept the Terms & Conditions
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
            {loading ? "Processing..." : (isSignUp ? "Sign Up" : "Sign In")}
          </button>
        </div>

        <p className="auth-toggle" onClick={toggleMode}>
          {isSignUp 
            ? "Already have an account? Sign In" 
            : "Don't have an account? Sign Up"}
        </p>
      </div>
    </div>
  );
}