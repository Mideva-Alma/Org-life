import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";

export default function AdminLayout({ children, title, subtitle }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/admin", label: "Overview", icon: "📊" },
    { path: "/admin/users", label: "Users", icon: "👥" },
    { path: "/admin/transactions", label: "Transactions", icon: "💰" },
  ];

  const adminEmail = localStorage.getItem('email') || '';

  async function handleSignOut() {
    await api.logout();
    navigate("/");
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">⚓</span>
          <span className="brand-text">Org-Life Admin</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">A</div>
            <div>
              <p className="user-name">Administrator</p>
              <p className="user-email">{adminEmail}</p>
            </div>
          </div>
          <button className="signout-btn" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">{title}</h1>
            <p className="dashboard-subtitle">{subtitle}</p>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}