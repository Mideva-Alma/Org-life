import { useNavigate } from "react-router-dom";
import "./Landing.css";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* HEADER */}
      <header className="header">
        <div className="header-container">
          <div className="logo">
            <span className="logo-icon">⚓</span>
            <span className="logo-text">Org-Life</span>
          </div>
          <nav className="nav">
            <a href="#features">Features</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>
          <button 
            className="header-cta"
            onClick={() => navigate("/auth")}
          >
            Sign In
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <span className="hero-badge">✦ EST. 2026</span>
            <h1 className="hero-title">
              Track your <br />
              <span className="hero-highlight">finances</span> the old-<br />
              fashioned way
            </h1>
            <p className="hero-description">
              Simple, honest budget tracking for people who value 
              clarity over complexity. No bells. No whistles. Just 
              the numbers that matter.
            </p>
            <div className="hero-buttons">
              <button 
                className="btn-primary"
                onClick={() => navigate("/auth")}
              >
                Get Started
              </button>
              <button className="btn-secondary">
                Learn More →
              </button>
            </div>
          </div>
          <div className="hero-image">
            <div className="vintage-card">
              <div className="card-header">
                <span className="card-dot"></span>
                <span className="card-dot"></span>
                <span className="card-dot"></span>
              </div>
              <div className="card-body">
                <div className="ledger-line">
                  <span>Income</span>
                  <span>$4,250.00</span>
                </div>
                <div className="ledger-line">
                  <span>Expenses</span>
                  <span>$2,180.00</span>
                </div>
                <div className="ledger-line total">
                  <span>Balance</span>
                  <span>$2,070.00</span>
                </div>
                <div className="ledger-divider"></div>
                <div className="ledger-line">
                  <span>📅 June 2026</span>
                  <span>✓ Balanced</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features" id="features">
        <div className="features-container">
          <h2 className="section-title">What we offer</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Ledger Tracking</h3>
              <p>Old-school double-entry accounting. Track every penny coming in and going out.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h3>Your Data, Yours</h3>
              <p>No selling your information. No ads. Just honest, private financial tracking.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Works Everywhere</h3>
              <p>Simple, responsive design that works on your phone, tablet, or desktop.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" id="about">
        <div className="cta-container">
          <div className="cta-box">
            <h2 className="cta-title">
              Start tracking today.
              <br />
              <span className="cta-highlight">No credit card required.</span>
            </h2>
            <p className="cta-description">
              Join the community of people who value simplicity and clarity in their finances.
            </p>
            <button 
              className="btn-primary btn-large"
              onClick={() => navigate("/auth")}
            >
              Create Free Account
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-brand">
              <span className="logo-icon">⚓</span>
              <span className="logo-text">Org-Life</span>
              <p className="footer-tagline">Simple budget tracking since 2026</p>
            </div>
            <div className="footer-links">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Support</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 Org-Life. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}