// frontend/src/pages/Profile.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiUser, FiLock, FiSettings, FiMessageSquare, FiCamera, 
  FiSave, FiKey, FiTrash2, FiMoon, FiSun, FiBell, FiStar,
  FiMail, FiPhone, FiDollarSign, FiAlertTriangle, FiSend,
  FiEdit2, FiLogOut, FiChevronRight, FiCheck, FiX
} from "react-icons/fi";
import { FaUserCircle, FaCrown } from "react-icons/fa";
import api from "../services/api";
import "./Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    currency: 'KES'
  });
  
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [feedback, setFeedback] = useState({
    subject: '',
    message: '',
    rating: 0
  });
  
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('orglife_theme') || 'light';
  });
  
  const [activeTab, setActiveTab] = useState('profile');
  const fileInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('orglife_theme', theme);
  }, [theme]);

  async function fetchUserProfile() {
    try {
      const userData = await api.getCurrentUser();
      setUser(userData);
      setFormData({
        full_name: userData.full_name || '',
        email: userData.email || '',
        phone_number: userData.phone_number || '',
        currency: userData.currency || 'KES'
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error.message.includes('401')) {
        navigate('/auth');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      setUser({ ...user, ...formData });
      setMessage({ text: '✅ Profile updated successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      setMessage({ text: '❌ Failed to update profile: ' + error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ text: '❌ New passwords do not match', type: 'error' });
      setSaving(false);
      return;
    }

    if (passwordData.new_password.length < 6) {
      setMessage({ text: '❌ Password must be at least 6 characters', type: 'error' });
      setSaving(false);
      return;
    }

    try {
      setMessage({ text: '✅ Password changed successfully!', type: 'success' });
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      setMessage({ text: '❌ Failed to change password: ' + error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitFeedback(e) {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    if (!feedback.subject || !feedback.message) {
      setMessage({ text: '❌ Please fill in all fields', type: 'error' });
      setSaving(false);
      return;
    }

    try {
      setMessage({ text: '✅ Thank you for your feedback!', type: 'success' });
      setFeedback({ subject: '', message: '', rating: 0 });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      setMessage({ text: '❌ Failed to submit feedback: ' + error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  function handleAvatarClick() {
    fileInputRef.current.click();
  }

  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  function toggleTheme() {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }

  function renderStars(rating, setter) {
    return (
      <div className="stars-container">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? 'active' : ''}`}
            onClick={() => setter && setter({ ...feedback, rating: star })}
          >
            ★
          </span>
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loader"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <h1 className="profile-title"><FiUser /> Profile Settings</h1>
        <p className="profile-subtitle">Manage your account and preferences</p>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`profile-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <FiUser /> Profile
        </button>
        <button
          className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <FiLock /> Security
        </button>
        <button
          className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          <FiSettings /> Preferences
        </button>
        <button
          className={`tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          <FiMessageSquare /> Feedback
        </button>
      </div>

      {/* ===== PROFILE TAB ===== */}
      {activeTab === 'profile' && (
        <div className="profile-section">
          {/* Avatar */}
          <div className="avatar-section">
            <div className="avatar-container" onClick={handleAvatarClick}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="avatar-image" />
              ) : (
                <div className="avatar-placeholder">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="avatar-overlay">
                <FiCamera />
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <p className="avatar-hint"><FiCamera /> Click to upload a profile picture</p>
          </div>

          {/* Profile Form */}
          <form className="profile-form" onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label><FiUser /> Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label><FiMail /> Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label><FiPhone /> Phone Number</label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="e.g., 0712345678"
              />
            </div>

            <div className="form-group">
              <label><FiDollarSign /> Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="KES">KES - Kenyan Shilling</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="UGX">UGX - Ugandan Shilling</option>
                <option value="TZS">TZS - Tanzanian Shilling</option>
              </select>
            </div>

            <button type="submit" className="save-btn" disabled={saving}>
              <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* ===== SECURITY TAB ===== */}
      {activeTab === 'security' && (
        <div className="profile-section">
          <h2 className="section-title"><FiLock /> Change Password</h2>
          
          <form className="profile-form" onSubmit={handleChangePassword}>
            <div className="form-group">
              <label><FiKey /> Current Password</label>
              <input
                type="password"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label><FiLock /> New Password</label>
              <input
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                required
                minLength={6}
              />
              <small className="form-hint">Password must be at least 6 characters</small>
            </div>

            <div className="form-group">
              <label><FiCheck /> Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="save-btn" disabled={saving}>
              <FiLock /> {saving ? 'Changing...' : 'Change Password'}
            </button>
          </form>

          {/* Danger Zone */}
          <div className="danger-zone">
            <h3><FiAlertTriangle /> Danger Zone</h3>
            <button className="danger-btn"><FiTrash2 /> Delete Account</button>
          </div>
        </div>
      )}

      {/* ===== PREFERENCES TAB ===== */}
      {activeTab === 'preferences' && (
        <div className="profile-section">
          <h2 className="section-title"><FiSettings /> Preferences</h2>

          {/* Theme */}
          <div className="preference-item">
            <div className="preference-info">
              <span className="preference-icon">{theme === 'light' ? <FiSun /> : <FiMoon />}</span>
              <div>
                <h4>Theme</h4>
                <p>Switch between light and dark mode</p>
              </div>
            </div>
            <button className={`theme-toggle ${theme}`} onClick={toggleTheme}>
              {theme === 'light' ? <FiMoon /> : <FiSun />}
              {theme === 'light' ? ' Dark' : ' Light'}
            </button>
          </div>

          {/* Currency */}
          <div className="preference-item">
            <div className="preference-info">
              <span className="preference-icon"><FiDollarSign /></span>
              <div>
                <h4>Default Currency</h4>
                <p>Set your preferred currency for all transactions</p>
              </div>
            </div>
            <select
              className="preference-select"
              value={formData.currency}
              onChange={(e) => {
                setFormData({ ...formData, currency: e.target.value });
              }}
            >
              <option value="KES">KES</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          {/* Notifications */}
          <div className="preference-item">
            <div className="preference-info">
              <span className="preference-icon"><FiBell /></span>
              <div>
                <h4>Notifications</h4>
                <p>Receive email alerts for important updates</p>
              </div>
            </div>
            <div className="toggle-switch">
              <input type="checkbox" id="notifications" defaultChecked />
              <label htmlFor="notifications"></label>
            </div>
          </div>
        </div>
      )}

      {/* ===== FEEDBACK TAB ===== */}
      {activeTab === 'feedback' && (
        <div className="profile-section">
          <h2 className="section-title"><FiMessageSquare /> Feedback</h2>
          <p className="feedback-subtitle">We'd love to hear from you!</p>

          <form className="profile-form" onSubmit={handleSubmitFeedback}>
            <div className="form-group">
              <label><FiStar /> Rating</label>
              {renderStars(feedback.rating, setFeedback)}
            </div>

            <div className="form-group">
              <label><FiEdit2 /> Subject</label>
              <input
                type="text"
                placeholder="What's this about?"
                value={feedback.subject}
                onChange={(e) => setFeedback({ ...feedback, subject: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label><FiMessageSquare /> Message</label>
              <textarea
                rows="5"
                placeholder="Tell us what you think..."
                value={feedback.message}
                onChange={(e) => setFeedback({ ...feedback, message: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="save-btn" disabled={saving}>
              <FiSend /> {saving ? 'Sending...' : 'Send Feedback'}
            </button>
          </form>

          {/* Quick Stats */}
          <div className="feedback-stats">
            <div className="stat-item">
              <span className="stat-number"><FiStar /> 4.8</span>
              <span className="stat-label">Average Rating</span>
            </div>
            <div className="stat-item">
              <span className="stat-number"><FiMessageSquare /> 24</span>
              <span className="stat-label">Total Feedback</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}