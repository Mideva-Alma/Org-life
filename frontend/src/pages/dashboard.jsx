import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Home from "./Home";
import Expenses from "./Expenses";
import Categories from "./Categories";
import Income from "./Income";
import DashboardTour from "../components/Dashboardtour";
import Profile from "./Profile";
import "./Dashboard.css";


export default function Dashboard() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState("home");
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tourComplete, setTourComplete] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // 👈 ADD THIS

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const userData = await api.getCurrentUser();
      setUser(userData);

      const expensesData = await api.getExpenses({ limit: 5 });
      setExpenses(expensesData);

      const incomeData = await api.getIncome({ limit: 5 });
      setIncome(incomeData);
    } catch (error) {
      console.error('Error:', error);
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    try {
      await api.logout();
      navigate("/");
    } catch (error) {
      // console.error('Error signing out:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('email');
      navigate("/auth");
    }
  }

  const totalIncome = income.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  const balance = totalIncome - totalExpenses;

  const handleTourComplete = () => {
    setTourComplete(true);
  };

  // 👇 ADD THESE FUNCTIONS
  function toggleSidebar() {
    setSidebarOpen(!sidebarOpen);
  }

  function handleNavClick(page) {
    setCurrentPage(page);
    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  }

  function renderPage() {
    switch(currentPage) {
      case 'home':
        return <Home />;
      case 'expenses':
        return <Expenses />;
      case 'income':
        return <Income />;
      case 'categories':
        return <Categories />;
      case 'profile':
        return <Profile />;
      default:
        return <Home />;
    }
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Loading your ledger...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Tour */}
      <DashboardTour onComplete={handleTourComplete} />

      {/* 👇 ADD MOBILE TOGGLE BUTTON */}
      <button className="mobile-toggle" onClick={toggleSidebar}>
        ☰
      </button>

      {/* 👇 ADD SIDEBAR OVERLAY */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar with open class */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <span className="brand-icon">⚓</span>
          <span className="brand-text">Org-Life</span>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => handleNavClick('home')}
          >
            <span className="nav-icon">🏠</span>
            Home
          </button>
          <button 
            className={`nav-item ${currentPage === 'expenses' ? 'active' : ''}`}
            onClick={() => handleNavClick('expenses')}
          >
            <span className="nav-icon">📉</span>
            Expenses
          </button>
          <button 
            className={`nav-item ${currentPage === 'income' ? 'active' : ''}`}
            onClick={() => handleNavClick('income')}
          >
            <span className="nav-icon">💰</span>
            Income
          </button>
          <button 
            className={`nav-item ${currentPage === 'categories' ? 'active' : ''}`}
            onClick={() => handleNavClick('categories')}
          >
            <span className="nav-icon">🏆</span>
            Rankings
          </button>
          <button 
            className={`nav-item ${currentPage === 'profile' ? 'active' : ''}`}
            onClick={() => handleNavClick('profile')}
          >
            <span className="nav-icon">👤</span>
            Profile
          </button>
        </nav>

        <div className="sidebar-footer" id="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="user-name">{user?.full_name || 'User'}</p>
              <p className="user-email">{user?.email}</p>
            </div>
          </div>
          <button className="signout-btn" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Stats only on home page */}
        {currentPage === 'home' && (
          <>
            {/* Stats */}
            <div className="stats-grid" id="stats-grid">
              <div className="stat-card balance" id="stat-balance">
                <div className="stat-header">
                  <span className="stat-icon">💰</span>
                  <span className="stat-label">Balance</span>
                </div>
                <p className={`stat-value ${balance >= 0 ? 'positive' : 'negative'}`}>
                  {user?.currency || 'KES'} {balance.toLocaleString()}
                </p>
              </div>

              <div className="stat-card income">
                <div className="stat-header">
                  <span className="stat-icon">📈</span>
                  <span className="stat-label">Income</span>
                </div>
                <p className="stat-value income-text">{user?.currency || 'KES'} {totalIncome.toLocaleString()}</p>
              </div>

              <div className="stat-card expense">
                <div className="stat-header">
                  <span className="stat-icon">📉</span>
                  <span className="stat-label">Expenses</span>
                </div>
                <p className="stat-value expense-text">{user?.currency || 'KES'} {totalExpenses.toLocaleString()}</p>
              </div>
            </div>

            {/* Recent Expenses */}
            <section className="recent-section" id="recent-section">
              <div className="section-header">
                <h2>Recent Expenses</h2>
              </div>
              <div className="ledger-list">
                {expenses.length === 0 ? (
                  <p className="empty-state">No expenses recorded yet.</p>
                ) : (
                  expenses.map((expense) => (
                    <div key={expense.id} className="ledger-item">
                      <div>
                        <p className="ledger-category">{expense.category || 'Uncategorized'}</p>
                        <p className="ledger-date">{expense.expense_date || new Date(expense.created_at).toLocaleDateString()}</p>
                      </div>
                      <p className="ledger-amount expense-text">
                        -{user?.currency || 'KES'} {parseFloat(expense.amount).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Recent Income */}
            <section className="recent-section">
              <div className="section-header">
                <h2>Recent Income</h2>
              </div>
              <div className="ledger-list">
                {income.length === 0 ? (
                  <p className="empty-state">No income recorded yet.</p>
                ) : (
                  income.map((item) => (
                    <div key={item.id} className="ledger-item">
                      <div>
                        <p className="ledger-category">{item.description || 'Income'}</p>
                        <p className="ledger-date">{new Date(item.created_at).toLocaleDateString()}</p>
                      </div>
                      <p className="ledger-amount income-text">
                        +{user?.currency || 'KES'} {parseFloat(item.amount).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}

        {/* Render the page content */}
        {renderPage()}
      </main>
    </div>
  );
}