import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import api from "../services/api";
import "./Home.css";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [weeklyBudget, setWeeklyBudget] = useState(10000);
  const [weeklySpending, setWeeklySpending] = useState(0);
  const [weeklyIncome, setWeeklyIncome] = useState(0);
  const [dailySpending, setDailySpending] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryBudget, setNewCategoryBudget] = useState("");
  
  // Graph states
  const [chartType, setChartType] = useState('bar');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showGraph, setShowGraph] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  async function fetchHomeData() {
    try {
      console.log("🔍 Fetching home data...");
      
      const userData = await api.getCurrentUser();
      setUser(userData);
      console.log("✅ User data loaded:", userData);

      // Get expenses and income
      const expenses = await api.getExpenses();
      const income = await api.getIncome();
      
      console.log("📊 Expenses loaded:", expenses.length);
      console.log("💰 Income loaded:", income.length);
      
      // Calculate weekly spending and daily breakdown
      const { weeklyTotal: weeklyExpenses, dailyData } = getWeeklyData(expenses);
      setWeeklySpending(weeklyExpenses);
      setDailySpending(dailyData);
      console.log("📉 Weekly spending:", weeklyExpenses);

      // Calculate weekly income
      const weeklyIncomeTotal = getWeeklyIncome(income);
      setWeeklyIncome(weeklyIncomeTotal);
      console.log("📈 Weekly income:", weeklyIncomeTotal);

      // Get categories
      const categoryList = getCategoryList(expenses);
      setCategories(categoryList);

      // Load saved weekly budget
      const savedBudget = localStorage.getItem('orglife_weekly_budget');
      if (savedBudget) {
        setWeeklyBudget(parseFloat(savedBudget));
      }

    } catch (error) {
      console.error('Error:', error);
      if (error.message.includes('401')) {
        navigate('/auth');
      }
    } finally {
      setLoading(false);
    }
  }

  // Get weekly data (Monday to Sunday)
  function getWeeklyData(expenses) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dailyTotal = {};
    
    days.forEach(day => dailyTotal[day] = 0);

    let weeklyTotal = 0;

    expenses.forEach(e => {
      const expenseDate = new Date(e.expense_date || e.created_at);
      if (expenseDate >= startOfWeek && expenseDate <= now) {
        const dayIndex = expenseDate.getDay();
        const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1];
        dailyTotal[dayName] += parseFloat(e.amount);
        weeklyTotal += parseFloat(e.amount);
      }
    });

    const dailyData = days.map(day => ({
      day,
      amount: dailyTotal[day]
    }));

    return { weeklyTotal, dailyData };
  }

  // Get weekly income
  function getWeeklyIncome(income) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);

    let weeklyTotal = 0;

    income.forEach(i => {
      const incomeDate = new Date(i.created_at);
      if (incomeDate >= startOfWeek && incomeDate <= now) {
        weeklyTotal += parseFloat(i.amount);
      }
    });

    return weeklyTotal;
  }

  // Get unique categories from expenses
  function getCategoryList(expenses) {
    const categoryMap = {};
    
    expenses.forEach(e => {
      const categoryName = e.category || 'Uncategorized';
      if (!categoryMap[categoryName]) {
        categoryMap[categoryName] = {
          name: categoryName,
          total: 0,
          count: 0
        };
      }
      categoryMap[categoryName].total += parseFloat(e.amount);
      categoryMap[categoryName].count += 1;
    });

    return Object.values(categoryMap).sort((a, b) => b.total - a.total);
  }

  // Chart data
  const getChartData = () => {
    const labels = dailySpending.map(d => d.day);
    const values = dailySpending.map(d => d.amount);

    const colors = ['#1a2a3a', '#2a4a6a', '#4a6a8a', '#6a8aaa', '#8a9aaa', '#c4a882', '#d4c8bc'];

    return {
      labels,
      datasets: [
        {
          label: 'Daily Spending',
          data: values,
          backgroundColor: colors,
          borderColor: '#1a2a3a',
          borderWidth: 2,
          tension: 0.3,
          fill: true,
          pointBackgroundColor: '#1a2a3a',
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1a2a3a',
        titleColor: '#f5f0eb',
        bodyColor: '#f5f0eb',
        borderColor: '#c4a882',
        borderWidth: 2,
        padding: 12,
        cornerRadius: 0,
        callbacks: {
          label: function(context) {
            return `${user?.currency || 'KES'} ${context.raw.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#e8e0d8',
          drawBorder: false
        },
        ticks: {
          font: {
            family: 'Courier New',
            size: 11
          },
          color: '#4a5a6a',
          callback: function(value) {
            return `${user?.currency || 'KES'} ${value}`;
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: 'Courier New',
            size: 12
          },
          color: '#4a5a6a'
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            family: 'Courier New',
            size: 12
          },
          color: '#1a2a3a',
          padding: 16
        }
      },
      tooltip: {
        backgroundColor: '#1a2a3a',
        titleColor: '#f5f0eb',
        bodyColor: '#f5f0eb',
        borderColor: '#c4a882',
        borderWidth: 2,
        padding: 12,
        cornerRadius: 0,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.raw / total) * 100).toFixed(1);
            return `${user?.currency || 'KES'} ${context.raw.toFixed(2)} (${percentage}%)`;
          }
        }
      }
    }
  };

  // Calculate spending percentage
  const spendingPercentage = Math.min((weeklySpending / weeklyBudget) * 100, 100);
  const isOverBudget = weeklySpending > weeklyBudget;
  const remaining = weeklyBudget - weeklySpending;
  const netBalance = weeklyIncome - weeklySpending;

  // Handle budget update
  function handleBudgetUpdate(e) {
    const newBudget = parseFloat(e.target.value);
    setWeeklyBudget(newBudget);
    localStorage.setItem('orglife_weekly_budget', newBudget);
  }

  // Handle add category
  function handleAddCategory() {
    if (!newCategory.trim() || !newCategoryBudget) {
      alert("Please fill in both category name and budget");
      return;
    }

    const categoryData = {
      name: newCategory.trim(),
      budget: parseFloat(newCategoryBudget)
    };

    const savedCategories = JSON.parse(localStorage.getItem('orglife_categories') || '[]');
    savedCategories.push(categoryData);
    localStorage.setItem('orglife_categories', JSON.stringify(savedCategories));

    setCategories([...categories, { 
      name: categoryData.name, 
      total: 0, 
      count: 0,
      budget: categoryData.budget
    }]);

    setNewCategory("");
    setNewCategoryBudget("");
    setShowAddCategory(false);
  }

  if (loading) {
    return (
      <div className="home-loading">
        <div className="loader"></div>
        <p>Loading your home...</p>
      </div>
    );
  }

  return (
    <div className="home">
      {/* ===== TOP SECTION: Weekly Budget ===== */}
      <section className="weekly-section">
        <div className="weekly-header">
          <div>
            <h2 className="weekly-title">📅 This Week's Budget</h2>
            <p className="weekly-subtitle">
              {user?.full_name?.split(' ')[0] || 'User'}, here's your spending progress
            </p>
          </div>
          <div className="budget-input-group">
            <label>Weekly Budget</label>
            <input
              type="number"
              value={weeklyBudget}
              onChange={handleBudgetUpdate}
              className="budget-input"
            />
            <span className="budget-currency">{user?.currency || 'KES'}</span>
          </div>
        </div>

        {/* ===== INCOME SUMMARY ===== */}
        <div className="income-summary">
          <div className="income-item">
            <span className="income-label">💰 Weekly Income</span>
            <span className="income-value">{user?.currency || 'KES'} {weeklyIncome.toFixed(2)}</span>
          </div>
          <div className="income-item">
            <span className="income-label">📉 Weekly Spending</span>
            <span className="income-value expense-text">{user?.currency || 'KES'} {weeklySpending.toFixed(2)}</span>
          </div>
          <div className="income-item">
            <span className="income-label">📊 Net Balance</span>
            <span className={`income-value ${netBalance >= 0 ? 'positive' : 'negative'}`}>
              {user?.currency || 'KES'} {netBalance.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-info">
            <span className="progress-label">Spent</span>
            <span className="progress-amount">
              {user?.currency || 'KES'} {weeklySpending.toFixed(2)}
            </span>
            <span className="progress-divider">/</span>
            <span className="progress-total">
              {user?.currency || 'KES'} {weeklyBudget.toFixed(2)}
            </span>
            <span className={`progress-status ${isOverBudget ? 'over' : 'under'}`}>
              {isOverBudget ? '⚠️ Over Budget' : '✅ On Track'}
            </span>
          </div>

          <div className="progress-bar-container">
            <div 
              className={`progress-bar ${isOverBudget ? 'over' : 'under'}`}
              style={{ width: `${Math.min(spendingPercentage, 100)}%` }}
            />
          </div>

          <div className="progress-remaining">
            {isOverBudget ? (
              <span className="over-text">
                ⚠️ You've exceeded your budget by {user?.currency || 'KES'} {Math.abs(remaining).toFixed(2)}
              </span>
            ) : (
              <span className="under-text">
                ✅ You have {user?.currency || 'KES'} {remaining.toFixed(2)} remaining
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ===== GRAPH SECTION ===== */}
      <section className="graph-section">
        <div className="graph-header">
          <div className="graph-title-group">
            <h2 className="graph-title">📊 Spending Overview</h2>
            <button 
              className="toggle-graph-btn"
              onClick={() => setShowGraph(!showGraph)}
            >
              {showGraph ? 'Hide Graph' : 'Show Graph'}
            </button>
          </div>
          
          <div className="graph-controls">
            <div className="chart-type-selector">
              <button 
                className={`chart-btn ${chartType === 'bar' ? 'active' : ''}`}
                onClick={() => setChartType('bar')}
              >
                📊 Bar
              </button>
              <button 
                className={`chart-btn ${chartType === 'line' ? 'active' : ''}`}
                onClick={() => setChartType('line')}
              >
                📈 Line
              </button>
              <button 
                className={`chart-btn ${chartType === 'pie' ? 'active' : ''}`}
                onClick={() => setChartType('pie')}
              >
                🥧 Pie
              </button>
            </div>

            <div className="category-filter">
              <label>Filter:</label>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((cat, index) => (
                  <option key={index} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {showGraph && (
          <div className="graph-container">
            {dailySpending.every(d => d.amount === 0) ? (
              <div className="empty-graph">
                <p>📭 No spending data this week</p>
                <p className="empty-hint">Start tracking your expenses to see your spending patterns!</p>
              </div>
            ) : (
              <>
                <div className="chart-wrapper">
                  {chartType === 'bar' && (
                    <Bar data={getChartData()} options={chartOptions} />
                  )}
                  {chartType === 'line' && (
                    <Line data={getChartData()} options={chartOptions} />
                  )}
                  {chartType === 'pie' && (
                    <Pie data={getChartData()} options={pieOptions} />
                  )}
                </div>

                <div className="chart-stats">
                  <div className="stat-item">
                    <span className="stat-label">Total Spent:</span>
                    <span className="stat-value">
                      {user?.currency || 'KES'} {weeklySpending.toFixed(2)}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Daily Average:</span>
                    <span className="stat-value">
                      {user?.currency || 'KES'} {(weeklySpending / 7).toFixed(2)}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Budget Status:</span>
                    <span className={`stat-value ${isOverBudget ? 'over' : 'under'}`}>
                      {isOverBudget ? '⚠️ Over' : '✅ On Track'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* ===== BOTTOM SECTION: Categories ===== */}
      <section className="categories-section">
        <div className="categories-header">
          <h2 className="categories-title">📂 Your Categories</h2>
          <button 
            className="add-category-btn"
            onClick={() => setShowAddCategory(!showAddCategory)}
          >
            {showAddCategory ? '✕ Cancel' : '+ Add Category'}
          </button>
        </div>

        {showAddCategory && (
          <div className="add-category-form">
            <input
              type="text"
              placeholder="Category name (e.g., Food)"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="category-input"
            />
            <input
              type="number"
              placeholder="Weekly budget (e.g., 5000)"
              value={newCategoryBudget}
              onChange={(e) => setNewCategoryBudget(e.target.value)}
              className="category-input"
            />
            <button 
              className="save-category-btn"
              onClick={handleAddCategory}
            >
              Save Category
            </button>
          </div>
        )}

        <div className="categories-grid">
          {categories.length === 0 ? (
            <div className="empty-categories">
              <p>No categories yet.</p>
              <p className="empty-hint">Add your first category to start tracking!</p>
            </div>
          ) : (
            categories.map((category, index) => (
              <div key={index} className="category-card">
                <div className="category-icon">
                  {getCategoryIcon(category.name)}
                </div>
                <div className="category-info">
                  <h3 className="category-name">{category.name}</h3>
                  <p className="category-details">
                    {category.count} transaction{category.count !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="category-amount">
                  <span className="category-total">
                    {user?.currency || 'KES'} {category.total.toFixed(2)}
                  </span>
                  {category.budget && (
                    <span className="category-budget">
                      Budget: {user?.currency || 'KES'} {category.budget.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="category-progress">
                  <div 
                    className="category-progress-bar"
                    style={{ 
                      width: category.budget ? 
                        `${Math.min((category.total / category.budget) * 100, 100)}%` : 
                        '0%',
                      background: category.budget && category.total > category.budget ? 
                        '#c44a3a' : '#2a6a4a'
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

// Helper: Get icon for category
function getCategoryIcon(category) {
  const icons = {
    'Food': '🍔',
    'Transport': '🚗',
    'Rent': '🏠',
    'Utilities': '💡',
    'Entertainment': '🎮',
    'Shopping': '🛍️',
    'Health': '🏥',
    'Education': '📚',
    'Travel': '✈️',
    'Insurance': '🛡️',
    'Savings': '🏦',
    'Salary': '💰',
    'Freelance': '💻',
    'Business': '📈',
    'Other': '📦',
    'Uncategorized': '❓'
  };
  return icons[category] || '📦';
}